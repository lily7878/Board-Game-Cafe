# Pornire locală — Board Game Café

Pașii pentru a rula proiectul pe calculatorul de dezvoltare (Windows, PowerShell).

## Cerințe

| Componentă | Versiune | Verificare |
|---|---|---|
| Java (Temurin JDK) | 25 | `java -version` |
| PostgreSQL | 18, serviciul `postgresql-x64-18` pornit | `Get-Service postgresql-x64-18` |
| Node.js / npm | 24 / 11 | `node -v`, `npm -v` |

Baza de date `board_game_cafe` și utilizatorul `bgc_app` trebuie să existe deja (vezi [ghidul de setup local](Board_Game_Cafe_Ghid_Setup_Mediu_Local_v1_0.md)).

## Porturi

| Aplicație | Adresă |
|---|---|
| Backend (core-service) | http://localhost:8082 |
| Customer UI | http://localhost:5173 |
| Management UI | http://localhost:5174 |

Ambele interfețe trimit cererile `/api` și `/ws` către backend prin proxy-ul Vite, deci backend-ul trebuie să ruleze înaintea lor.

---

## Configurare o singură dată

### 1. Permite rularea scripturilor PowerShell

Fără asta, `npm` și scripturile din `scripts/` sunt blocate („running scripts is disabled on this system”).

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Se confirmă cu `Y`. Setarea este doar pentru contul curent.

### 2. Instalează dependențele frontend

```powershell
cd "C:\Personal\Facultate\An_4\Sem1\SCD\Proiect\frontend\management-ui"
npm install
cd ..\customer-ui
npm install
```

---

## Pornire zilnică

### Terminal 1 — Backend

```powershell
cd "C:\Personal\Facultate\An_4\Sem1\SCD\Proiect"
.\scripts\start-backend.ps1
```

Ce face scriptul [start-backend.ps1](../scripts/start-backend.ps1):

- **La prima rulare** generează cheile `BGC_SESSION_CREDENTIAL_KEY`, `BGC_STAFF_JWT_KEY` și `BGC_BOOTSTRAP_TOKEN` și cere parola PostgreSQL a utilizatorului `bgc_app`. Parola este verificată imediat; dacă e greșită, este cerută din nou.
- Cheile și parola sunt salvate **criptat** în `%USERPROFILE%\.bgc-local\` (în afara proiectului, nu ajung în Git; doar contul Windows curent le poate decripta).
- **La rulările următoare** refolosește aceleași valori și pornește direct backend-ul (`mvnw.cmd spring-boot:run`).

Backend-ul este gata când apare `Started CoreServiceApplication`. Verificare: http://localhost:8082/actuator/health → `"status":"UP"`.

Terminalul trebuie lăsat deschis; oprire cu `Ctrl+C`.

### Terminal 2 — Management UI

```powershell
cd "C:\Personal\Facultate\An_4\Sem1\SCD\Proiect\frontend\management-ui"
npm run dev
```

Se deschide http://localhost:5174 și te autentifici cu contul de manager sau staff.

### Terminal 3 — Customer UI (opțional)

```powershell
cd "C:\Personal\Facultate\An_4\Sem1\SCD\Proiect\frontend\customer-ui"
npm run dev
```

Se deschide http://localhost:5173.

---

## Primul cont de manager (o singură dată)

Pe o bază de date nouă nu există niciun cont. Cu backend-ul pornit, într-un alt terminal:

```powershell
cd "C:\Personal\Facultate\An_4\Sem1\SCD\Proiect"
.\scripts\create-manager.ps1
```

Scriptul [create-manager.ps1](../scripts/create-manager.ps1) cere numele, emailul și parola (minimum 12 caractere). După ce există un cont, backend-ul refuză crearea altuia prin această metodă; conturile următoare se adaugă din Management UI (Administrare → Personal).

---

## Probleme frecvente

| Simptom | Cauză | Soluție |
|---|---|---|
| `npm.ps1 cannot be loaded because running scripts is disabled` | Politica de execuție PowerShell blochează scripturile | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` sau, temporar, `npm.cmd run dev` |
| `npm run dev` dă eroare că nu găsește `package.json` | Comanda e rulată din rădăcina proiectului | Rulează din `frontend\management-ui` sau `frontend\customer-ui` |
| Scriptul cere mereu parola bazei de date | Parola `bgc_app` este greșită | Vezi secțiunea de mai jos |
| `Port 5174 is already in use` | Interfața rulează deja în alt terminal | Folosește terminalul existent sau închide-l |
| Login-ul dă eroare de conexiune | Backend-ul nu rulează | Pornește Terminal 1 și verifică `/actuator/health` |
| `create-manager.ps1` spune „token de bootstrap greșit” | Backend-ul a fost pornit fără scriptul `start-backend.ps1` | Oprește backend-ul și pornește-l cu scriptul |

### Resetarea parolei `bgc_app`

Dacă parola nu mai este cunoscută, se setează una nouă cu administratorul `postgres` (parola aleasă la instalarea PostgreSQL):

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "ALTER USER bgc_app WITH PASSWORD 'ParolaNoua';"
```

Apoi backend-ul se pornește cu noua parolă:

```powershell
.\scripts\start-backend.ps1 -ResetDbPassword
```

### Atenție la chei

Nu șterge folderul `%USERPROFILE%\.bgc-local\`. Dacă cheile se schimbă:

- QR-ul și PIN-ul meselor deja deschise nu mai pot fi reafișate (`BGC_SESSION_CREDENTIAL_KEY`);
- utilizatorii logați trebuie să se autentifice din nou (`BGC_STAFF_JWT_KEY`).
