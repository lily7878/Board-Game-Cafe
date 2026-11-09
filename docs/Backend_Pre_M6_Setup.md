# Backend înainte de M6: acces și verificare

## Secretele necesare

Backendul citește parola PostgreSQL din `DB_PASSWORD`. Pentru deschiderea unei sesiuni, `BGC_SESSION_CREDENTIAL_KEY` trebuie să conțină o cheie AES de 32 de octeți, codificată Base64. Păstrați aceeași cheie între reporniri: schimbarea ei face imposibilă reafișarea QR/PIN pentru sesiunile existente.

La crearea primului manager este necesar și `BGC_BOOTSTRAP_TOKEN`, un secret de cel puțin 32 de caractere. După ce există un cont staff, endpointul de bootstrap nu mai creează conturi. Autentificarea staff folosește `BGC_STAFF_JWT_KEY`, o altă cheie Base64 de 32 de octeți; păstrați-o între reporniri pentru ca tokenurile emise să rămână valide până la expirare.

Exemplu PowerShell pentru un mediu local nou (păstrați cheia sesiunii într-un loc sigur, în afara repository-ului):

```powershell
$dbSecret = Read-Host 'Parola PostgreSQL' -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new('', $dbSecret).Password
$random = [Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32
$random.GetBytes($bytes)
$env:BGC_SESSION_CREDENTIAL_KEY = [Convert]::ToBase64String($bytes)
$random.GetBytes($bytes)
$env:BGC_BOOTSTRAP_TOKEN = [Convert]::ToBase64String($bytes)
$random.GetBytes($bytes)
$env:BGC_STAFF_JWT_KEY = [Convert]::ToBase64String($bytes)
$random.Dispose()
```

Porniți backendul din același terminal. Apelați o singură dată `POST /api/setup/manager`, cu antetul `X-Bootstrap-Token` și corpul JSON `fullName`, `email`, `password` (minimum 12 caractere și maximum 72 octeți UTF-8). Parola introdusă la bootstrap este parola inițială aleasă de manager; poate fi schimbată cu `PATCH /api/admin/me/password`.

## Accesul la API

- Managerul și staff-ul folosesc `POST /api/admin/auth/login` cu email și parolă. Răspunsul conține un JWT Bearer valabil 60 de minute, fără refresh automat. `GET /api/admin/auth/me` întoarce identitatea și rolul. Conform specificației FE, Management UI păstrează JWT în `localStorage` și îl șterge la logout; backendul verifică expirarea și `StaffUser.active` la fiecare cerere. Folosiți HTTPS în afara mediului local.
- Numai MANAGER poate administra jocurile, categoriile, exemplarele, mesele și conturile staff. STAFF sau MANAGER poate deschide o sesiune și procesa cereri de joc.
- `POST /api/admin/tables/{id}/sessions` întoarce tokenul QR și PIN-ul. `GET /api/admin/tables/{id}/sessions/current/access` le reafișează numai pentru o sesiune `ACTIVE`.
- Clientul intră prin `POST /api/participant/sessions/join` și primește un `accessToken` individual. Catalogul, cererile de joc și `GET /api/participant/sessions/current` folosesc antetul `X-Participant-Token`. Tokenul poate fi păstrat în `sessionStorage` pentru refresh; nu se trimite ca ID de participant ales de client.

## Verificarea pe PostgreSQL

Migrațiile `V1–V4` au fost aplicate într-o schemă temporară. Au fost verificate: bootstrap o singură dată, rolurile 401/403, preview-ul QR/PIN, limita încercărilor PIN, cererea `REQUESTED → RESERVED → DELIVERED → RETURNED`, disponibilitatea din catalog și două rezervări simultane pentru aceeași copie (`200` și `409`). O a doua schemă temporară a verificat loginul JWT, durata de 3600 de secunde, respingerea HTTP Basic, accesul pe roluri, protecția catalogului clientului și invalidarea JWT după dezactivarea contului. Ambele scheme temporare au fost eliminate după probe.

Migrațiile de pe baza principală se vor aplica la următoarea pornire normală a backendului cu Flyway activ. Verificați backupul și datele existente înainte de această pornire.
