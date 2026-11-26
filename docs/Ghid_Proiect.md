# Board Game Café — ghidul proiectului

Proiect universitar SCD: o aplicație distribuită pentru o cafenea cu jocuri de societate. Clienții intră la masă fără cont, cu QR + PIN + nume. Ei comandă din meniu, cer jocuri, primesc recomandări AI, pun întrebări despre reguli și plătesc împreună nota. Personalul procesează comenzile și împrumuturile, iar managerul administrează cafeneaua și închide zilele simulate (End of Day) cu rapoarte.

Datele de autentificare pentru mediul local sunt în `docs/Date_Login.md`. Fișierul nu se publică în Git.

---

## 1. Arhitectură

```
Customer UI  (React, :5173) ─┐                                   ┌─► AI Service (Python/FastAPI, :8081, intern)
                             ├─► Core Service (Spring Boot, :8082)┤        │
Management UI (React, :5174) ┘   REST + WebSocket (STOMP /ws)     │        └─► Ollama (:11435) — gemma2:9b + bge-m3
                                         │                        │
                                         └─► PostgreSQL 18 (:5432, baza board_game_cafe)
```

- **Core Service** este sursa de adevăr pentru stări, autorizare, inventar, prețuri, plăți și rapoarte. Interfețele vorbesc doar cu el.
- **AI Service** este apelat numai de Core, cu antetul `X-Internal-Token`. Nu are acces la baza de date de business. Ține propriul index al manualelor PDF (SQLite în `%USERPROFILE%\.bgc-local\ai-data`).
- **WebSocket-ul** transmite doar semnale după commit („s-a schimbat X”). Interfețele reîncarcă datele prin REST.

| Componentă | Tehnologie |
|---|---|
| Core Service | Java 25, Spring Boot 4.0.8, Spring Security (JWT), Spring Data JPA / Hibernate, Flyway, WebSocket (STOMP), OpenPDF |
| AI Service | Python 3, FastAPI, pypdf, Ollama (API compatibil OpenAI) |
| Interfețe | React 19 + Vite 8, CSS Modules + design tokens, React Hooks/Context, `lucide-react` |
| Bază de date | PostgreSQL 18; schema e creată numai de migrațiile Flyway (`ddl-auto=validate`) |

## 2. Structura repository-ului

```
backend/core-service/     Spring Boot: api/ (controllere + DTO), service/, domain/, repository/, config/, live/ (WebSocket)
                          src/main/resources/db/migration/  migrațiile V1–V10
backend/ai-service/       FastAPI: app/ (servicii), tests/, scripts/ (generatorul manualelor demo)
frontend/customer-ui/     aplicația clienților (mobil)
frontend/management-ui/   aplicația staff + manager (desktop/tabletă)
scripts/                  pornire/oprire, chei, primul manager, date demo
docs/                     documentația (vezi §14), manualele PDF demo, handoff-ul de design
```

## 3. Instalare (o singură dată)

### 3.1 Programe

| Program | Versiune | Verificare |
|---|---|---|
| Java (Eclipse Temurin JDK) | 25 | `java -version` |
| PostgreSQL | 18, serviciul `postgresql-x64-18` pornit | `Get-Service postgresql-x64-18` |
| Node.js / npm | 24 / 11 | `node -v`, `npm -v` |
| Python | 3 (testat cu 3.15; doar pentru AI) | `python --version` |
| Ollama (doar pentru AI) | — | `winget install Ollama.Ollama`, apoi `ollama pull gemma2:9b` și `ollama pull bge-m3` |

Maven nu trebuie instalat: se folosește `mvnw.cmd`, din `backend/core-service`.

### 3.2 Permite scripturile PowerShell

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### 3.3 Baza de date

Cu administratorul `postgres` (parola aleasă la instalarea PostgreSQL):

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "CREATE ROLE bgc_app LOGIN PASSWORD 'alege-o-parola';"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE board_game_cafe OWNER bgc_app;"
```

Tabelele le creează backend-ul la prima pornire, prin Flyway.

### 3.4 Dependențele interfețelor

`start-all.ps1` rulează automat `npm install` dacă lipsește `node_modules`. Manual:

```powershell
cd frontend\management-ui; npm install
cd ..\customer-ui; npm install
```

Mediul Python al serviciului AI (`backend\ai-service\.venv`) e creat automat de `start-ai.ps1` la prima rulare.

## 4. Pornire și oprire

Din rădăcina proiectului:

```powershell
.\scripts\start-all.ps1        # backend, AI, management-ui, customer-ui — câte o fereastră „BGC …”
.\scripts\stop-all.ps1         # le oprește pe toate
```

Opțiuni pentru `start-all.ps1`:
- `-NoAi`, `-NoCustomerUi`, `-NoManagementUi` pornesc doar o parte din servicii;
- `-AiModel qwen2.5:7b` folosește un model mai rapid, dar cu româna mai slabă.

Serviciile care rulează deja sunt sărite. Interfețele pornesc după ce backend-ul răspunde `UP`.

| Serviciu | Adresă | Script individual |
|---|---|---|
| Backend | http://localhost:8082 (`/actuator/health`) | `scripts\start-backend.ps1` |
| Serviciul AI | http://127.0.0.1:8081 (`/health`) | `scripts\start-ai.ps1 [-Model ...]` |
| Management UI | http://localhost:5174 | `npm run dev` în `frontend\management-ui` |
| Customer UI | http://localhost:5173 | `npm run dev` în `frontend\customer-ui` |

Ce face `start-backend.ps1`:
- **La prima rulare**, generează cheile aplicației și cere parola `bgc_app`. O verifică imediat cu `psql`.
- **Le salvează criptat** (DPAPI, doar contul tău Windows le poate citi) în `%USERPROFILE%\.bgc-local\`, în afara repository-ului.
- **La rulările următoare**, pornește direct, fără întrebări.

`start-ai.ps1` pornește o instanță Ollama proprie proiectului pe `127.0.0.1:11435`, cu `OLLAMA_FLASH_ATTENTION=0` (pe Vulkan + AMD RX 6800S, flash attention dă răspunsuri goale). Ollama din tray (11434) nu este folosit și nici oprit.

**Fără AI:** dacă serviciul AI nu rulează, recomandările trec pe lista deterministă (etichetată ca atare), iar asistentul de reguli răspunde „indisponibil”. Restul aplicației funcționează normal.

## 5. Secrete și chei

| Cheie | Rol | Dacă se schimbă |
|---|---|---|
| `DB_PASSWORD` | parola `bgc_app` | backend-ul nu mai pornește până nu dai parola corectă |
| `BGC_STAFF_JWT_KEY` | semnează JWT-ul staff (valabil 60 min) | toți utilizatorii trebuie să se autentifice din nou |
| `BGC_SESSION_CREDENTIAL_KEY` | criptează QR/PIN pentru reafișare | QR-ul și PIN-ul meselor deja deschise nu mai pot fi reafișate |
| `BGC_BOOTSTRAP_TOKEN` | permite crearea primului manager | — |
| `BGC_AI_INTERNAL_TOKEN` | secretul comun Core ↔ AI | Core și AI trebuie repornite împreună |

**Nu șterge** `%USERPROFILE%\.bgc-local\`. Acolo sunt cheile, parola bazei, PDF-urile manualelor (`rule-pdfs`) și indexul AI (`ai-data`).

Parola `bgc_app` uitată: `ALTER USER bgc_app WITH PASSWORD '...'` cu `postgres`, apoi `.\scripts\start-backend.ps1 -ResetDbPassword`.

## 6. Conturi și date demo

- **Primul manager pe o bază goală:** cu backend-ul pornit, rulează `.\scripts\create-manager.ps1`. Funcționează o singură dată; conturile următoare se creează din Management UI (Administrare → Personal).
- **Date demo:** rulează `.\scripts\seed-dev-data.ps1`. Se poate rula de oricâte ori, fără să dubleze nimic. Încarcă:
  - `seed-dev-data.sql`: mese, categorii, jocuri (cu durată ca interval), exemplare, meniu cu iconuri și etichete, conturile demo;
  - `seed-dev-history.sql`: 14 zile simulate finalizate, cu sesiuni, comenzi, cereri de jocuri, plăți și rapoarte; se aplică o singură dată;
  - `upload-demo-manuals.ps1`: manualele PDF demo din `docs/demo-manuals` (30 de jocuri), dacă backend-ul și AI-ul rulează. Altfel rulează-l separat, după `start-all.ps1`.
- **Regenerarea manualelor demo:** din `backend\ai-service` rulează `.venv\Scripts\python.exe -m scripts.make_demo_manuals`. Scrie PDF-urile și `manifest.json`.

## 7. Fluxurile principale

1. **Deschiderea mesei (staff).** În Management, Mese → Deschide masa. Tariful curent per persoană se fixează în sesiune, iar sesiunea aparține zilei simulate deschise. Tab-ul QR/PIN arată codul QR (link `http://<host>:5173/join/<token>`) și un PIN de 4 cifre. Pentru alt host, setează `VITE_CUSTOMER_APP_URL`.
2. **Intrarea clientului.** Scanează QR-ul, introduce PIN-ul și un nume. După 5 PIN-uri greșite, intrarea la masă se blochează 15 minute. Tokenul de participant stă în `sessionStorage`.
3. **Comenzi.** Clientul comandă din meniu, cu coșul în `localStorage`.
   - Staff-ul decide **pentru fiecare poziție** (acceptă sau respinge, atomic). Dacă respinge tot, comanda devine CANCELLED.
   - Apoi comanda trece prin ACCEPTED → PREPARING → READY → DELIVERED.
   - Clientul își poate modifica sau anula comanda doar cât e PLACED.
4. **Jocuri.**
   - Clientul cere un **titlu**. Staff-ul rezervă atomic un exemplar liber, îl livrează (cu limita de jocuri livrate pe masă) și îl primește înapoi.
   - Disponibilitatea se calculează din exemplare și din cererile active.
   - Recomandările AI și asistentul de reguli se găsesc în catalog și în pagina jocului.
5. **Nota și checkout.**
   - Nota se calculează pe server: pozițiile acceptate din comenzile livrate, plus persoane × tariful fixat.
   - La checkout, sesiunea devine CHECKOUT_PENDING. Numărul de persoane se blochează definitiv pentru clienți, iar comenzile și cererile noi sunt oprite.
   - Staff-ul poate redeschide sesiunea și corecta numărul de persoane.
6. **Plata simulată.**
   - Se face integral, cu o cheie de idempotency (UUID per încercare). Aceeași cheie retrimisă întoarce rezultatul salvat.
   - Plata e permisă doar fără comenzi în lucru sau jocuri nereturnate.
   - Plata reușită închide sesiunea în aceeași tranzacție și invalidează QR/PIN-ul și tokenurile.
7. **End of Day (manager).**
   - E permis doar când toate sesiunile sunt CLOSED.
   - Salvează raportul definitiv al zilei (venituri, produse, jocuri) și deschide automat ziua următoare.
   - Rapoartele se pot compara între zile și exporta în PDF.

**Reguli de date:** jocurile, produsele, categoriile, mesele și conturile **nu se șterg, se dezactivează**, ca istoricul (comenzi, cereri, rapoarte) să rămână corect. O masă cu sesiune deschisă nu poate fi dezactivată.

## 8. API REST (Core, `http://localhost:8082`)

**Autentificare:**
- Staff: `Authorization: Bearer <JWT>`, primit de la `POST /api/admin/auth/login`.
- Participant: `X-Participant-Token: <token>`, primit de la `POST /api/participant/sessions/join`.

**Erori:** `ProblemDetail` (`status`, `detail`) — 400 validare, 401 neautentificat, 403 rol insuficient, 404, 409 conflict de stare, 429 prea multe încercări.

### 8.1 Public
| Metodă | Endpoint | Rol |
|---|---|---|
| POST | `/api/setup/manager` | primul manager (antet `X-Bootstrap-Token`, o singură dată) |
| POST | `/api/admin/auth/login` | login staff → JWT 60 min |
| POST | `/api/participant/sessions/join-info` | numărul mesei pentru un token QR activ (404 altfel) |
| POST | `/api/participant/sessions/join` | intrare la masă: `joinToken`, `pin`, `displayName` |
| GET | `/api/participant/cafe-info` | numele cafenelei și programul |
| GET | `/api/participant/games/search`, `/api/participant/games/{id}`, `/api/participant/game-categories` | catalogul de jocuri (filtre: `players`, `maxDurationMinutes`, `difficulty`, `categoryId`, `availableOnly`…) |

### 8.2 Participant (`X-Participant-Token`)
| Metodă | Endpoint | Rol |
|---|---|---|
| GET | `/api/participant/sessions/current` | dashboard: masa, colegii, comenzi active, jocuri, limita de jocuri |
| POST | `/api/participant/sessions/current/leave` | ieșire de pe telefon |
| GET | `/api/participant/menu` | meniul comandabil, pe categorii în ordinea managerului |
| POST / GET | `/api/participant/orders` | plasare (1–30 poziții) / comenzile proprii |
| PUT | `/api/participant/orders/{id}` | modificare (doar PLACED) |
| POST | `/api/participant/orders/{id}/cancel` | anulare (doar PLACED) |
| POST / GET | `/api/participant/game-requests` | cerere de joc / cererile proprii |
| POST | `/api/participant/game-requests/{id}/cancel` | anularea propriei cereri |
| GET | `/api/participant/sessions/current/bill` | nota comună, cu obstacolele de plată |
| PUT | `/api/participant/sessions/current/fees` | numărul de persoane (înainte de primul checkout) |
| POST | `/api/participant/sessions/current/checkout` | închide nota (CHECKOUT_PENDING) |
| POST | `/api/participant/sessions/current/pay` | plata simulată: `idempotencyKey`, `expectedTotal` opțional; 201 nouă / 200 reluare |
| POST | `/api/participant/recommendations` | recomandări: `players`, `mood`, `maxDurationMinutes` → `source` `AI`/`FALLBACK` |
| GET | `/api/participant/games/{id}/rules/status` | există manual gata? |
| POST | `/api/participant/games/{id}/rules/ask` | întrebare despre reguli (≤ 300 caractere, istoric ≤ 4, maximum 10 pe minut) |

### 8.3 Staff și manager (JWT, STAFF sau MANAGER)
| Metodă | Endpoint | Rol |
|---|---|---|
| GET | `/api/admin/auth/me`, `/api/admin/me` | identitatea curentă |
| PATCH | `/api/admin/me/password` | schimbarea propriei parole |
| GET | `/api/admin/tables`, `/api/admin/tables/{id}` | mese |
| GET | `/api/admin/tables/overview` | grila de mese (sesiune, conectați, comenzi, jocuri) |
| POST | `/api/admin/tables/{id}/sessions` | deschide masa → token QR + PIN |
| GET | `/api/admin/tables/{id}/sessions/current/access` | reafișare QR/PIN (doar ACTIVE) |
| GET | `/api/admin/sessions/{id}` | detaliile sesiunii (drawer) |
| GET | `/api/admin/sessions/{id}/orders`, `/game-requests`, `/bill`, `/payments` | comenzile, cererile, nota și plățile unei sesiuni |
| PUT | `/api/admin/sessions/{id}/fees` | corecția numărului de persoane (doar ACTIVE) |
| POST | `/api/admin/sessions/{id}/reopen` | redeschide din CHECKOUT_PENDING |
| GET | `/api/admin/orders` (`?status=&businessDayId=`), `/api/admin/orders/{id}` | comenzi |
| POST | `/api/admin/orders/{id}/process` | decizii pe toate pozițiile, atomic |
| PATCH | `/api/admin/orders/{id}/status` | pasul următor: PREPARING → READY → DELIVERED |
| GET | `/api/admin/game-requests` (`?status=&businessDayId=`), `/api/admin/game-requests/{id}` | cereri de jocuri |
| POST | `/api/admin/game-requests/{id}/reserve`, `/deliver`, `/return`, `/reject`, `/cancel` | fluxul cererii |
| GET | `/api/admin/settings`, `/api/admin/opening-hours`, `/api/admin/business-days/current` | citire setări, program, ziua curentă |

### 8.4 Doar manager
| Metodă | Endpoint | Rol |
|---|---|---|
| POST / GET | `/api/admin/staff` | conturi staff |
| PATCH | `/api/admin/staff/{id}/status` | activare / dezactivare cont (nu ultimul manager) |
| POST / PATCH | `/api/admin/tables`, `/api/admin/tables/{id}`, `/{id}/status` | configurarea meselor |
| CRUD | `/api/admin/games`, `/{id}`, `/{id}/status` | jocuri (durată ca interval, `totalCopies` / `availableCopies`) |
| CRUD | `/api/admin/game-categories`, `/{id}`, `/{id}/status` | categorii de jocuri |
| POST | `/api/admin/games/{id}/copies` | un exemplar, cu cod scris de mână |
| POST | `/api/admin/games/{id}/copies/batch` | 1–20 exemplare cu coduri generate `PREFIX-NN` |
| GET | `/api/admin/games/{id}/copies`, `/copies/summary`, `/api/admin/game-copies` (`?q=&condition=`), `/api/admin/game-copies/{id}` | inventar, cu locul fiecărui exemplar |
| PATCH | `/api/admin/game-copies/{id}/status` | starea fizică (USABLE / UNDER_MAINTENANCE / UNAVAILABLE) |
| GET / POST / DELETE | `/api/admin/games/{id}/rules` | manualul PDF al jocului (max 20 MB; PROCESSING → READY / FAILED) |
| CRUD | `/api/admin/menu-categories`, `/{id}`, `/{id}/status`; PUT `/api/admin/menu-categories/order` | categorii de meniu și ordinea lor |
| CRUD | `/api/admin/menu-items`, `/{id}`, `/{id}/status`, `/{id}/availability` | produse (preț > 0, icon Lucide, ≤ 5 etichete) |
| PUT | `/api/admin/settings`, `/api/admin/opening-hours/{1..7}` | tarif, limită de jocuri, program |
| GET | `/api/admin/business-days`, `/api/admin/business-days/current/preview` | istoricul zilelor, cifrele zilei curente |
| POST | `/api/admin/business-days/{id}/finalize` | End of Day (201 / 200 dacă era deja finalizată / 409 cu sesiuni deschise) |
| GET | `/api/admin/reports`, `/api/admin/reports/{dayId}`, `/api/admin/reports/{dayId}/pdf` | rapoartele finale și PDF-ul lor |
| GET | `/api/admin/analytics/days/compare?fromDay=&toDay=` | comparația zilelor (maximum 60), top produse și jocuri |

## 9. Actualizări live (WebSocket)

- **Conexiunea:** STOMP pe `/ws` (Vite face proxy). La `CONNECT` se trimite `Authorization: Bearer <JWT>` (staff) sau `X-Participant-Token` (participant).
- **Canale:**
  - `/topic/staff`: doar pentru staff;
  - `/topic/sessions/{id}`: staff-ul și participanții acelei sesiuni;
  - `/topic/catalog`: oricine e autentificat.
- **Mesajele** (`type`, `sessionId`, `tableId`, `entityId`, `status`, `at`) pleacă numai după commit și nu conțin tokenuri, PIN-uri sau sume. Exemple: `order.placed`, `game.reserved`, `session.checkout-pending`, `session.closed`, `menu.changed`, `games.availability-changed`, `business-day.finalized`.
- **Clienții nu trimit mesaje prin WebSocket.** Modificările se fac doar prin REST, iar după reconectare se reîncarcă tot.

## 10. Serviciul AI

- **Recomandări:**
  - Core alege jocurile eligibile: active, cu exemplar liber, potrivite ca jucători și durată.
  - AI-ul doar le reordonează și le explică. Core respinge orice joc din afara listei.
  - Fără răspuns valid în 45 s, se întoarce lista deterministă (`FALLBACK`).
- **Asistentul de reguli:**
  - Managerul încarcă PDF-ul. AI-ul extrage textul pe pagini, îl fragmentează și îl indexează cu `bge-m3`.
  - Răspunsurile vin numai din manual și citează pagina. Dacă manualul nu acoperă întrebarea, răspunsul o spune explicit. Timeout-ul e de 70 s.
- **Modele:** `gemma2:9b` pentru text (română naturală, 10–30 s pe răspuns) și `bge-m3` pentru embeddings. Alt furnizor compatibil OpenAI se poate seta prin `LLM_BASE_URL`, `LLM_API_KEY` și `LLM_MODEL`, fără cod nou.
- **Rute interne AI** (cu `X-Internal-Token`): `POST/GET/DELETE /internal/documents/{id}`, `POST /internal/rules/answer`, `POST /internal/recommendations`, `GET /health`.

## 11. Baza de date (Flyway)

| Migrare | Conținut |
|---|---|
| V1 | `cafe_tables` |
| V2 | `games`, `game_categories`, `game_category_links` (N:M), `game_copies` |
| V3 | `table_sessions`, `session_participants`, `game_requests` (index unic: o copie are cel mult o cerere activă) |
| V4 | `staff_users`, `bootstrap_guard`, QR/PIN criptate pentru reafișare |
| V5 | `cafe_settings`, `opening_hours`, `business_days` (o singură zi OPEN); tariful copiat în sesiune |
| V6 | `menu_categories`, `menu_items`, `food_orders`, `order_items` (nume și preț copiate la comandă) |
| V7 | `session_fees`, `payments` (o singură plată SUCCEEDED pe sesiune; cheie de idempotency unică) |
| V8 | `daily_reports`, `daily_product_stats`, `daily_game_stats` (raportul definitiv al zilei) |
| V9 | ordinea categoriilor din meniu, icon și etichete pe produs, durata maximă a jocului |
| V10 | `game_rule_documents` (manualele PDF; un document activ pe joc) |

**Concurență:**
- Operațiile care schimbă o sesiune blochează rândul ei și îi recitesc starea (`SessionLocker`). Asta acoperă comenzile, cererile de joc, persoanele, checkout-ul, redeschiderea și plata.
- Deschiderea mesei și End of Day blochează rândul zilei.
- Adăugarea de exemplare în lot blochează rândul jocului.
- Indexurile unice parțiale sunt ultima barieră: o sesiune deschisă pe masă, o zi deschisă, o plată reușită pe sesiune, o rezervare activă pe exemplar.

## 12. Testare

| Ce | Comandă | Note |
|---|---|---|
| Teste Core | `.\mvnw.cmd test`, din `backend\core-service` | `CoreServiceApplicationTests` (pornește aplicația pe PostgreSQL) rulează doar dacă `DB_PASSWORD` e setat; restul sunt teste unitare |
| Teste AI | `.venv\Scripts\python.exe -m pytest`, din `backend\ai-service` | manuale PDF mici, cu răspunsuri cunoscute |
| Interfețe | `npm run build` și `npm run lint`, în fiecare aplicație | |

**Verificat manual pe PostgreSQL** (scenariile de concurență pentru prezentare):
- două rezervări simultane ale aceluiași exemplar → 200 + 409;
- doi participanți plătesc simultan → o singură plată reușită;
- aceeași cheie de plată trimisă de două ori simultan → 201 + 200, cu același id;
- comandă în paralel cu checkout-ul și deschiderea unei mese în paralel cu End of Day → rezultat coerent în ambele ordini;
- două End of Day simultane → un singur raport;
- două loturi de exemplare simultane → coduri fără duplicate.

## 13. Probleme frecvente

| Simptom | Soluție |
|---|---|
| `running scripts is disabled on this system` | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (sau `npm.cmd run dev`) |
| `npm run dev` nu găsește `package.json` | rulează din `frontend\management-ui` sau `frontend\customer-ui` |
| Scriptul cere mereu parola bazei | parola `bgc_app` e greșită; vezi §5 |
| Login: eroare de conexiune | backend-ul nu rulează; verifică http://localhost:8082/actuator/health |
| `create-manager.ps1`: „token de bootstrap greșit” | backend-ul nu a fost pornit cu `start-backend.ps1`; repornește-l |
| `create-manager.ps1`: „primul manager există deja” | normal; conturile noi se creează din Administrare → Personal |
| `Port 5174 is already in use` | interfața rulează deja; `stop-all.ps1` sau folosește fereastra existentă |
| Recomandările apar fără explicații AI / reguli „indisponibile” | serviciul AI sau Ollama nu rulează, sau lipsește modelul (`ollama pull gemma2:9b`, `ollama pull bge-m3`) |
| Telefonul nu deschide QR-ul | Vite ascultă implicit doar pe `localhost`. Pornește ambele interfețe cu `npm run dev -- --host` și deschide Management UI cu IP-ul din rețea (ex. `http://192.168.1.20:5174`); QR-ul folosește același host, pe portul 5173 |

## 14. Documente de referință

| Fișier | Ce conține |
|---|---|
| `docs/doc.pdf` | Document Master v1.0: cerințe, model de date, reguli, tranzacții, ADR-uri, plan de lucru |
| `docs/Board_Game_Cafe_Frontend_Specification_v1_0.docx` | specificația frontend: rute, fluxuri, stări UI, contracte |
| `docs/Board_Game_Cafe_Atlas_Vizual_FE_v1_0.docx` | planșele vizuale inițiale (înlocuite de handoff) |
| `docs/design_handoff_board_game_cafe/` | machetele finale HTML, `tokens.css` și README-ul cu specificațiile vizuale, pe ecrane (1a…7f) |
| `docs/demo-manuals/` | manualele PDF demo și `manifest.json` |
| `docs/Date_Login.md` | conturile de test locale (nu e în Git) |
