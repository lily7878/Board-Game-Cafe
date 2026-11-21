# Board Game Café — Plan pentru partea de AI

Plan de implementare pentru cele trei funcții AI din specificație: **asistentul de reguli** (4e/4f), **recomandările explicate** (4g/4h/4i) și **încărcarea manualelor PDF** (7c/2n). Documentul nu conține cod. Contractele marcate *propus* nu sunt încă implementate și se pot schimba la implementare.

## 1. Reguli fixate de specificație

- Frontend-ul vorbește **numai cu Core**. Serviciul AI e intern, apelat doar de Core (*„AI Service este integrat prin Core”*).
- **Core filtrează eligibilitatea, AI-ul doar reordonează și explică.** AI-ul nu poate recomanda un joc pe care Core nu l-a propus.
- Asistentul răspunde **doar din manualul jocului**, cu sursa citată („Manual, pagina 3”). Dacă documentul nu e `READY`, UI-ul spune explicit că regulile nu sunt disponibile, fără reguli inventate.
- Dacă AI-ul pentru recomandări nu răspunde, apar **rezultate deterministe, etichetate ca atare**, plus „Încearcă din nou cu AI”.
- Serviciul AI rulează pe `localhost:8081` (convenția din Ghidul de setup). Cheile pentru modelul extern stau **numai** în serviciul AI.

## 2. Arhitectură

```
Customer UI (5173) ─┐                         ┌──────────── AI Service (8081, intern) ────────────┐
                    ├─► Core Service (8082) ──►│ ingest PDF · căutare în manual · răspuns · ordonare│
Management UI (5174)┘   auth, eligibilitate,   │        │                         │                  │
                        stare documente,       │   index vectorial          model LLM extern       │
                        fallback, limite       └────────────────────────────────────────────────────┘
```

**De ce trece totul prin Core:** autorizarea, starea sesiunii, catalogul și disponibilitatea sunt deja acolo. AI-ul nu primește tokenuri și nu vede baza de date de business, iar UI-ul nu știe ce model se folosește.

## 3. Fluxuri

### 3.1 Încărcarea manualului PDF (Manager · 7c, 2n)
1. Managerul încarcă PDF-ul în pagina jocului. Core îl validează: doar PDF, maximum 20 MB, un document activ per joc. Îl salvează și îl marchează **`PROCESSING`**.
2. Core trimite documentul la AI. Serviciul AI extrage textul **pe pagini**, îl împarte în fragmente care își păstrează numărul de pagină și le indexează.
3. AI-ul raportează rezultatul, iar Core trece documentul în **`READY`** sau **`FAILED`**, cu motiv. Core emite evenimentul live `games.rules-changed`, iar UI-ul se reîncarcă.
4. **Înlocuire:** noul document intră în `PROCESSING`, iar cel vechi rămâne activ până când cel nou devine `READY`. Clienții nu rămân fără reguli în timpul procesării.

Stări afișate în management (din README): **Gata** (`READY`) · **În procesare** (`PROCESSING`) · **Încarcă** (fără document) · **Eșuat** (`FAILED`, cu motiv și „Încarcă din nou”).

### 3.2 Asistentul de reguli (Client · 4e, 4f)
1. Pagina jocului întreabă Core dacă regulile sunt disponibile. Dacă nu sunt `READY`, apare ecranul 4f, cel de acum.
2. Clientul pune o întrebare. Core verifică participantul (sesiune `ACTIVE`), jocul activ, documentul `READY` și limita de întrebări, apoi trimite la AI **doar** întrebarea, documentul și ultimele 4 replici, fără nume sau date despre masă.
3. AI-ul caută fragmentele relevante din manual și cere modelului un răspuns **numai din acele fragmente**. Răspunsul conține textul, paginile citate și un indicator `found`.
4. Dacă manualul nu acoperă întrebarea, răspunsul este explicit: „Manualul nu spune asta; întrebați personalul.” Nu se acceptă răspuns fără cel puțin o citare.

### 3.3 Recomandări (Client · 4g, 4h, 4i)
1. Clientul răspunde la cele 3 întrebări: câți sunt, ce atmosferă vor, cât timp au.
2. **Core** construiește lista eligibilă: jocuri active, cu exemplar liber, care se potrivesc ca număr de jucători și durată. Aceasta e și lista fallback, ordonată alfabetic.
3. Core trimite la AI răspunsurile și candidații (id, titlu, categorii, jucători, durată, dificultate, descriere scurtă). AI-ul întoarce **ordinea și câte o explicație** pentru maximum 5 jocuri.
4. Core **validează** răspunsul AI. Elimină orice id care nu e în lista candidaților și orice duplicat; dacă nu rămâne nimic valid, folosește fallback-ul.
5. Răspunsul către UI spune sursa: `AI` (carduri cu explicație, 4h) sau `FALLBACK` (4i, etichetat). Timeout-ul Core→AI e de **8 s**; după el se folosește fallback-ul.

## 4. Contracte Frontend → Core (*propus*)

| Endpoint | Cine | Ce face |
|---|---|---|
| `POST /api/admin/games/{id}/rules` (multipart `file`) | MANAGER | Încarcă sau înlocuiește manualul; răspuns: documentul, cu `status: PROCESSING` |
| `GET /api/admin/games/{id}/rules` | MANAGER | Starea documentului: `fileName`, `sizeBytes`, `pageCount`, `status`, `failureReason`, `uploadedAt`, `uploadedBy` |
| `DELETE /api/admin/games/{id}/rules` | MANAGER | Dezactivează manualul (logic, fără ștergere fizică imediată) |
| `GET /api/participant/games/{id}/rules/status` | participant | `{ available: boolean }` — UI-ul alege între 4e și 4f |
| `POST /api/participant/games/{id}/rules/ask` | participant | Corp: `question` (≤ 300 caractere), `history` (≤ 4 replici). Răspuns: `answer`, `found`, `citations[{ page }]` |
| `POST /api/participant/recommendations` | participant | Corp: `players`, `mood` (`FUN`, `RELAXED`, `TEAM`, `SERIOUS`), `maxDurationMinutes` (opțional). Răspuns: `source` (`AI`/`FALLBACK`), `items[{ game, explanation }]` |

- În catalog și în detaliile unui joc apare un câmp nou, `rulesAvailable: boolean`. Cu el, cardurile își pot afișa badge-ul fără o cerere în plus.
- **Erori:**
  - `409`: documentul nu e `READY` sau sesiunea nu e `ACTIVE`;
  - `413`: fișierul e prea mare;
  - `415`: fișierul nu e PDF;
  - `429`: prea multe întrebări (limita propusă: 10 pe minut per participant), cu `Retry-After`;
  - `503`: asistentul de reguli nu e disponibil. Recomandările nu întorc niciodată `503`, pentru că trec automat pe `FALLBACK`.

## 5. Contracte Core → AI Service (interne, *propus*)

| Endpoint AI | Ce face |
|---|---|
| `POST /internal/documents` | Primește PDF-ul și `documentId`; procesează asincron |
| `GET /internal/documents/{documentId}` | Starea procesării: `PROCESSING`, `READY` sau `FAILED`, cu `pageCount` și `failureReason` |
| `DELETE /internal/documents/{documentId}` | Șterge indexul unui document înlocuit |
| `POST /internal/rules/answer` | `documentId`, `question`, `history` → `answer`, `found`, `citations[{ page, excerpt }]` |
| `POST /internal/recommendations` | `answers`, `candidates[]` → `items[{ gameId, explanation }]` |
| `GET /health` | Folosit de Core pentru starea serviciului |

- **Autentificare internă:** antetul `X-Internal-Token`, cu un secret comun din variabila de mediu `BGC_AI_INTERNAL_TOKEN`, generat ca celelalte chei în `scripts/start-backend.ps1`. Serviciul AI ascultă doar pe `localhost`.
- **Starea procesării:** Core o află prin **interogare periodică** (la 5 s, cât timp există documente în `PROCESSING`). E mai simplu decât un callback și nu deschide o rută nouă spre Core.

## 6. Date

**Core: migrarea `V10__game_rule_documents.sql`**, tabelul `game_rule_documents`:

| Coloană | Rol |
|---|---|
| `id`, `game_id` (FK) | identificare |
| `file_name`, `size_bytes`, `content_type`, `sha256` | metadate; `sha256` evită reprocesarea aceluiași fișier |
| `storage_path` | unde e salvat fișierul (folder local configurabil, `bgc.rules.storage-dir`) |
| `status` (`PROCESSING`, `READY`, `FAILED`), `failure_reason`, `page_count` | starea procesării |
| `active` | un singur document activ per joc (index unic parțial pe `game_id` unde `active`) |
| `uploaded_by` (FK staff), `uploaded_at`, `processed_at` | audit |

Întrebările și răspunsurile **nu se salvează** în v1. Se loghează doar contoare (număr de întrebări, `found`, durata), fără textul întrebării.

**Serviciul AI:** fragmentele manualelor, cu pagina și vectorul lor, stau în **schema separată `ai`** din aceeași instanță PostgreSQL, cu extensia `pgvector` și un utilizator propriu. Core nu are acces la schema `ai`, iar AI-ul nu are acces la tabelele Core.

## 7. Structura backend

### 7.1 Core Service: ce se adaugă
Se urmează împărțirea existentă (`api` / `service` / `domain` / `repository` / `config`):

```
core/
  api/ai/                RulesAdminController, RulesParticipantController, RecommendationController, dto/
  service/ai/            RuleDocumentService (upload, stare, înlocuire), RulesAssistantService (ask, limite),
                         RecommendationService (eligibilitate + fallback + validarea răspunsului AI),
                         RuleDocumentPoller (interogarea periodică a stării)
  domain/game/           RuleDocument, RuleDocumentStatus
  repository/            RuleDocumentRepository
  integration/ai/        AiServiceClient (HTTP, timeouts, X-Internal-Token), DTO-uri interne
  config/                AiProperties (bgc.ai.base-url, bgc.ai.timeout-*, bgc.rules.storage-dir, limite)
```
- În `ApiSecurityConfig` se adaugă reguli noi: încărcarea doar pentru MANAGER; `rules/*` și `recommendations` pentru participant, prin `X-Participant-Token`.
- Noul eveniment live este `games.rules-changed`, pe topicul catalogului.
- Limita de întrebări folosește același mecanism ca limita existentă pentru încercările de PIN.

### 7.2 AI Service (nou): `backend/ai-service`
**Recomandare: Python + FastAPI.** Bibliotecile pentru extragerea textului din PDF pe pagini, împărțirea în fragmente, embeddings și pgvector sunt cele mai mature în Python. Serviciul e mic, separat și comunică doar prin HTTP, deci limbajul diferit nu complică Core. Alternativa e Spring Boot cu Spring AI, dacă echipa preferă un singur limbaj.

```
ai-service/
  app/
    main.py                  pornire, /health, verificarea X-Internal-Token
    routers/                 documents, rules, recommendations
    services/
      pdf_extract            text pe pagini
      chunking               fragmente cu pagina sursă
      embeddings             vectori pentru fragmente și întrebări
      retrieval              căutare în pgvector, filtrată pe documentId
      llm                    apelul la model, cu prompturi fixe
      recommend              ordonare + explicații, limitat la candidați
    prompts/                 prompturile, versionate
    store/                   acces la schema ai
  tests/                     manuale PDF mici + întrebări cu răspuns cunoscut
  .env.example               fără valori reale
```

## 8. Frontend: unde intră AI-ul

### 8.1 Management UI
- **Pagina jocului (2n), cardul „Reguli PDF”:** în locul notei „În curând” vine starea reală (Gata / În procesare / Eșuat), plus butoanele „Încarcă” și „Înlocuiește”. Fișiere: `features/admin-games/GameDetailPage.jsx`.
- **Pagina „Adaugă/Editează joc” (7c):** zona de upload cu drag & drop și **bară de progres**. Progresul cere o cerere cu evenimente de upload, nu `fetch`, deci `apiRequest` primește o variantă de upload. Fișiere: `GameFormPage.jsx`, `shared/api/http.js`.
- **Cardurile de joc (1g):** badge „Reguli PDF gata / în procesare / Încarcă”, în locul „Reguli pe scurt” de acum. Fișier: `GamesTab.jsx`.
- **Live:** `games.rules-changed` reîncarcă jocurile, deci starea se schimbă singură din „În procesare” în „Gata”.

### 8.2 Customer UI
- **Asistentul de reguli (4e), ecran nou** `/games/{id}/reguli`:
  - conversația, cu bule client/asistent și sursa sub fiecare răspuns („Manual, pagina 3”);
  - 2–3 sugestii rapide și indicatorul „scrie…”;
  - câmpul de întrebare fixat jos;
  - conversația se păstrează doar în memoria paginii.
- **Detaliile jocului (4d):** butonul „Întreabă despre reguli” apare doar dacă `rulesAvailable`; altfel rămâne nota 4f de acum.
- **Recomandări (4h):**
  - cererea merge la endpoint-ul nou din Core, în locul filtrării făcute acum în browser;
  - cu `source: AI` apar carduri cu explicația AI și un rezumat al răspunsurilor, cu „Modifică”;
  - cu `source: FALLBACK` rămâne ecranul 4i de acum, cu „Încearcă din nou cu AI”.
- **Fișiere:** `features/games/GameDetailPage.jsx`, `RecommendationsPage.jsx`, `GamesSection.jsx` (ruta nouă) și un `RulesChatPage.jsx` nou.
- **Stări de tratat:**
  - `429`: „Prea multe întrebări, încercați peste X s”;
  - `503`: „Asistentul nu răspunde acum”, cu conversația păstrată;
  - `409`: documentul a devenit indisponibil, deci revenire la 4f.

## 9. Siguranță și limite
- **Modelul nu vede date personale:** nici nume, nici tokenuri, nici sume. Doar întrebarea, fragmentele din manual și datele publice ale jocurilor.
- **Conținutul PDF e tratat ca date, nu ca instrucțiuni.** Prompturile spun explicit că textul din manual nu poate schimba regulile asistentului. Core respinge orice răspuns fără citări sau cu id-uri de joc din afara listei.
- **Limite:**
  - întrebarea are maximum 300 de caractere;
  - istoricul are maximum 4 replici;
  - PDF-ul are maximum 20 MB și 200 de pagini;
  - timeout-urile: 8 s pentru recomandări și 20 s pentru reguli.
- **Reîncercări:** întrebările și recomandările sunt doar citiri, deci UI-ul poate oferi „Încearcă din nou” fără risc. Încărcarea PDF nu se retrimite automat.
- **Cheia modelului** e o variabilă de mediu doar în serviciul AI. Nu apare în loguri și nici în repo.

## 10. Ordinea de implementare
1. **Recomandările.** Nu au nevoie de PDF și au deja fallback în UI: endpoint-ul din Core cu fallback determinist, apoi serviciul AI minimal pentru ordonare și explicații, apoi ecranul 4h.
2. **Documentele PDF:** migrarea V10, încărcarea și stările în Core, ingestia în AI, apoi UI-ul de management (7c, 2n, 1g).
3. **Asistentul de reguli:** căutarea în manual și răspunsul cu citări în AI, endpoint-ul `ask` în Core, apoi ecranul 4e.
4. **Teste:**
   - Core: eligibilitatea, validarea răspunsului AI și fallback-ul la timeout;
   - AI: un manual mic de test, cu întrebări al căror răspuns și pagină sunt cunoscute;
   - UI: verificare manuală cu AI pornit și oprit.

## 11. De decis înainte de implementare
1. ~~**Furnizorul modelului**~~ **Decis:** model local, gratuit, prin **Ollama**: `qwen2.5:7b` pentru răspunsuri și `bge-m3` pentru embeddings (multilingv). Serviciul AI folosește API-ul compatibil OpenAI, deci un furnizor extern se poate configura din `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL`, fără modificări de cod. `scripts/start-ai.ps1` pornește o instanță Ollama proprie pe `127.0.0.1:11435`, cu `OLLAMA_FLASH_ATTENTION=0`, pentru că pe Vulkan + AMD RX 6800S flash attention dă răspunsuri goale.
2. ~~**Limbajul serviciului AI**~~ **Decis:** Python + FastAPI (`backend/ai-service`).
3. **Unde stau fișierele PDF:** folder local configurabil (propus) sau în baza de date.
4. **Limba răspunsurilor:** manualele pot fi în engleză, iar răspunsurile ar trebui să fie în română. Citarea rămâne pagina din manualul original.
