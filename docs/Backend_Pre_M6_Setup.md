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

## Setări, program și ziua de business (V5)

Migrația `V5` creează automat, fără INSERT manual: rândul unic `cafe_settings` (nume „Board Game Café”, tarif 10.00 per persoană, limită 3 jocuri livrate per masă), programul informativ pentru zilele 1–7 (10:00–22:00) și `BusinessDay #1` cu status `OPEN`. Sesiunile existente sunt atașate Zilei 1 și primesc tariful implicit ca snapshot.

- `GET /api/admin/settings` și `GET /api/admin/opening-hours` sunt disponibile pentru STAFF și MANAGER (Staff vede tariful curent înainte de deschiderea mesei). `PUT /api/admin/settings` și `PUT /api/admin/opening-hours/{1..7}` sunt numai pentru MANAGER.
- O zi închisă se trimite ca `{"closed": true}`, fără ore; o zi deschisă cere `openTime < closeTime` (intervalele peste miezul nopții sunt în afara scope-ului).
- `GET /api/admin/business-days/current` întoarce ziua simulată deschisă.
- `POST /api/admin/tables/{id}/sessions` copiază tariful curent în `access_fee_unit_price` și leagă sesiunea de ziua `OPEN`, blocând rândul zilei; End of Day va folosi aceeași blocare. Răspunsul include `businessDayId` și `accessFeeUnitPrice`. Modificarea ulterioară a tarifului nu afectează sesiunile deja deschise.
- Limita de jocuri livrate se citește acum din `cafe_settings`, nu din `application.properties`.

## Meniu și comenzi (V6)

Migrația `V6` creează `menu_categories`, `menu_items`, `food_orders` și `order_items`. Nu se șterge nimic fizic: categoriile și produsele se dezactivează.

**Administrare meniu (numai MANAGER)**
- `POST/GET /api/admin/menu-categories`, `GET/PATCH /api/admin/menu-categories/{id}`, `PATCH .../{id}/status` (`{"active": false}`). Numele categoriei este unic, fără diferență între litere mari și mici.
- `POST/GET /api/admin/menu-items` (filtru opțional `?categoryId=`), `GET/PATCH /api/admin/menu-items/{id}`, `PATCH .../{id}/status` (dezactivare logică) și `PATCH .../{id}/availability` (`{"available": false}` pentru stoc epuizat temporar).
- Un produs se poate comanda numai dacă este activ, disponibil și categoria lui este activă (`orderable` în răspuns).

**Participant (antet `X-Participant-Token`)**
- `GET /api/participant/menu`: doar produsele comandabile, grupate pe categorii.
- `POST /api/participant/orders` cu `{"items":[{"menuItemId":1,"quantity":2}]}`: 1–30 poziții, cantitate 1–99; produsele repetate se cumulează. Sesiunea trebuie să fie `ACTIVE` (blocată pe durata cererii, pentru serializarea cu viitorul checkout). Numele și prețul se copiază în poziție; schimbările ulterioare de preț nu afectează comanda. Nu există cheie de idempotency: UI-ul dezactivează butonul cât timp cererea este în curs.
- `GET /api/participant/orders`: numai comenzile proprii.
- `PUT /api/participant/orders/{id}` (aceleași poziții ca la plasare) și `POST .../{id}/cancel` funcționează doar cât comanda este `PLACED`. Comanda altui participant întoarce 404. Anularea este permisă și în `CHECKOUT_PENDING`; editarea nu.

**Staff (STAFF sau MANAGER)**
- `GET /api/admin/orders` întoarce implicit comenzile în lucru (`PLACED`, `ACCEPTED`, `PREPARING`, `READY`), cele mai vechi primele; filtru `?status=CANCELLED&status=DELIVERED`. Mai există `GET /api/admin/orders/{id}` și `GET /api/admin/sessions/{id}/orders`.
- `POST /api/admin/orders/{id}/process` cu `{"decisions":[{"orderItemId":3,"accepted":true},{"orderItemId":4,"accepted":false,"rejectionReason":"S-a terminat"}]}`: câte o decizie pentru **fiecare** poziție, aplicate atomic (T7). Dacă măcar o poziție este acceptată, comanda devine `ACCEPTED`; dacă toate sunt respinse, devine `CANCELLED` cu `ALL_ITEMS_REJECTED` și total 0. Un set incomplet sau duplicat întoarce 400 și nu modifică nimic.
- `PATCH /api/admin/orders/{id}/status` cu `{"status":"PREPARING"}` mută comanda exact un pas: `ACCEPTED → PREPARING → READY → DELIVERED`; orice alt salt întoarce 409.
- `total` din răspuns este preliminar (pozițiile respinse și comenzile anulate valorează 0). Nota finală va lua în calcul doar pozițiile `ACCEPTED` din comenzile `DELIVERED`.

## Nota comună, checkout și plata simulată (V7)

Migrația `V7` creează `session_fees` (numărul de persoane, 0..1 rând per sesiune) și `payments`. Un index unic parțial permite o singură plată `SUCCEEDED` per sesiune, iar `idempotency_key` este unic.

**Nota** (`GET /api/participant/sessions/current/bill`; pentru staff `GET /api/admin/sessions/{id}/bill`) este calculată numai pe server:
- `menuTotal` = pozițiile `ACCEPTED` din comenzile `DELIVERED`; `feesTotal` = persoane × tariful copiat la deschiderea sesiunii; `total` = suma lor;
- `participants` conține detaliul pe participant; `pendingOrdersValue` este informativ (comenzi încă nelivrate);
- `obstacles` arată ce blochează plata: comenzi în lucru, cereri de joc nereturnate (`REQUESTED/RESERVED/DELIVERED`), persoane nedeclarate;
- `canEditPersons` și `paymentAllowed` sunt calculate pentru UI.

**Pași**
1. `PUT /api/participant/sessions/current/fees` cu `{"persons": 3}`: orice participant, numai în `ACTIVE` și înainte de primul checkout.
2. `POST /api/participant/sessions/current/checkout` (T3): cere cel puțin o persoană declarată; sesiunea devine `CHECKOUT_PENDING`, iar `feesLocked` rămâne permanent `true`. Nu se mai acceptă comenzi noi sau cereri de joc noi; comenzile `PLACED` pot fi încă anulate, iar staff-ul poate procesa comenzile și returna jocurile. Preview-ul QR/PIN este ascuns.
3. `POST /api/admin/sessions/{id}/reopen` (T5, staff): înapoi la `ACTIVE`; persoanele rămân blocate pentru participanți. Staff-ul le poate corecta cu `PUT /api/admin/sessions/{id}/fees` numai în `ACTIVE`, apoi un participant reia checkout-ul.
4. `POST /api/participant/sessions/current/pay` (T4) cu `{"idempotencyKey": "<UUID nou>", "expectedTotal": 37.00}`. Sub blocarea sesiunii se recalculează totalul, se verifică obstacolele, se salvează plata `SUCCEEDED` și sesiunea devine `CLOSED` în aceeași tranzacție. Secretele QR/PIN recuperabile se șterg, iar tokenurile participanților nu mai sunt acceptate.
   - `expectedTotal` este opțional: dacă diferă de totalul curent, plata este refuzată cu 409 (protecție contra plății unui total vechi).
   - Răspunsul este 201 pentru o încercare nouă și 200 când aceeași cheie este retrimisă: se întoarce rezultatul salvat, chiar și după `CLOSED`, numai participantului care a inițiat plata. UI-ul generează o cheie nouă pentru fiecare încercare și o refolosește doar la retrimiterea aceleiași încercări (de exemplu după timeout).
   - `"simulateFailure": true` creează o plată `FAILED` pentru demonstrație; sesiunea rămâne în `CHECKOUT_PENDING`, iar plata se poate reîncerca cu o cheie nouă.
5. `GET /api/admin/sessions/{id}/payments` (staff): toate încercările unei sesiuni, inclusiv după `CLOSED`, pentru verificarea unui rezultat incert.

Toate operațiile care schimbă starea sesiunii (persoane, checkout, redeschidere, plată, comenzi noi, cereri de joc) blochează rândul sesiunii și îi recitesc starea curentă (`SessionLocker`), astfel încât o cerere care a așteptat primește o eroare clară sau rezultatul salvat, nu un conflict intern de versiune.

## Verificarea pe PostgreSQL

Migrațiile `V1–V4` au fost aplicate într-o schemă temporară. Au fost verificate: bootstrap o singură dată, rolurile 401/403, preview-ul QR/PIN, limita încercărilor PIN, cererea `REQUESTED → RESERVED → DELIVERED → RETURNED`, disponibilitatea din catalog și două rezervări simultane pentru aceeași copie (`200` și `409`). O a doua schemă temporară a verificat loginul JWT, durata de 3600 de secunde, respingerea HTTP Basic, accesul pe roluri, protecția catalogului clientului și invalidarea JWT după dezactivarea contului. Ambele scheme temporare au fost eliminate după probe.

`V5` a fost verificată pe un cluster PostgreSQL 18 temporar: aplicare peste o bază aflată la `V4` cu sesiuni existente, validarea Hibernate (`contextLoads`), rolurile 200/401/403 pe setări, validările 400 pentru tarif și program, snapshot-ul tarifului la deschiderea sesiunii și păstrarea lui după schimbarea tarifului general.

`V6` a fost verificată pe o bază nouă: drepturile pe roluri, meniul participantului (fără produse indisponibile sau din categorii inactive), validările 400/404/409, editarea și anularea doar în `PLACED`, procesarea parțială și respingerea totală, pașii de preparare, snapshot-ul prețului și cinci runde de editare (participant) în paralel cu procesarea (staff) pe aceeași comandă, fără stări amestecate. `FoodOrderTest` acoperă regulile de stare fără bază de date.

`V7` a fost verificată pe o bază nouă: fluxul complet notă → checkout → obstacole → redeschidere → corecție staff → checkout → plată eșuată → plată reușită, `expectedTotal` învechit, reluarea unei chei, invalidarea QR/PIN și a tokenurilor după `CLOSED`. Teste de concurență: doi participanți plătesc simultan cu chei diferite (o singură plată `SUCCEEDED`), aceeași cheie trimisă de două ori simultan (201 + 200 cu același id, o singură plată) și comandă plasată în paralel cu checkout-ul (în ambele ordini, rezultat coerent). `BillCalculatorTest` și `TableSessionTest` acoperă calculul notei și tranzițiile sesiunii.

Testul `CoreServiceApplicationTests` pornește aplicația completă și rulează numai dacă `DB_PASSWORD` este setat (împreună cu `BGC_STAFF_JWT_KEY` și `BGC_SESSION_CREDENTIAL_KEY`); URL-ul bazei poate fi schimbat cu `SPRING_DATASOURCE_URL`, de exemplu către o bază de test.

Migrațiile de pe baza principală se vor aplica la următoarea pornire normală a backendului cu Flyway activ. Verificați backupul și datele existente înainte de această pornire.
