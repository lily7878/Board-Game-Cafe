# Handoff: Board Game Café — Customer UI + Management UI

## Prezentare
Machete hi-fi pentru cele două aplicații frontend ale proiectului SCD Board Game Café:
- **customer-ui** (mobile-first, `localhost:5173`): acces la masă prin QR + PIN + nume, meniu, coș, comenzi, catalog jocuri + AI, nota comună, checkout și plată simulată.
- **management-ui** (desktop-first + tabletă, `localhost:5174`): Staff (operațiuni) și Manager (operațiuni + administrare, rapoarte, End of Day).

Sursa funcțională este **Board Game Café — Frontend Specification v1.0** (08.11.2026). Machetele aplică și corecturile față de Atlas Vizual v1.0 (meniu hamburger, drawer cu 5 taburi, fără fotografii, statusuri pastelate cu text + icon).

## Despre fișierele de design
Fișierele din `designs/` sunt **referințe de design create în HTML**: arată aspectul și comportamentul dorit. **Nu sunt cod de producție.** Sarcina este **recrearea lor în cele două aplicații React/Vite existente** (`frontend/customer-ui`, `frontend/management-ui`), cu arhitectura confirmată în spec:
- `app/` (shell, router, providers), `features/`, `shared/` (UI, hooks, utilitare), `styles/` (tokens);
- **CSS Modules + design tokens identice** în ambele aplicații (vezi `tokens.css`);
- React Hooks + Context; fără Redux/Zustand/TanStack Query în v1;
- History API cu router intern minimal;
- WebSocket doar ca semnal, după care se face refetch REST.

Deschideți `designs/Management UI.dc.html` și `designs/Customer UI.dc.html` într-un browser. Fiecare pagină e un canvas cu toate ecranele, grupate pe runde și etichetate cu un ID (`1a`, `2g`…). ID-urile sunt folosite mai jos.

## Fidelitate
**High-fidelity.** Culorile, tipografia, razele, spațierea și textele sunt finale pentru v1. Recreați pixel-perfect cu componentele din `shared/`. Toate textele UI sunt în română și se preiau exact. Datele (mese, sume, nume) sunt demo.

---

## Design tokens
Paleta confirmată este **Cozy Café / Dusty Rose, doar Light Mode**. Fișierul gata de folosit este `tokens.css`.

### Culori de brand
| Token | Hex | Utilizare |
|---|---|---|
| `--color-cream` | `#F7F1E9` | fundal pagină, fundal input, suprafețe secundare din carduri |
| `--color-white` | `#FFFFFF` | carduri, drawer, modal |
| `--color-blush` | `#EAD6D8` | element activ în sidebar, suprafețe accentuate, avatar |
| `--color-dusty-rose` | `#B7848C` | accent, iconuri din meta-uri, inel de focus pe input |
| `--color-deep-rose` | `#925E68` | buton principal, linkuri, accent text |
| `--color-deep-rose-hover` | `#7A4B55` | hover/pressed pe butonul principal |
| `--color-espresso` | `#49382F` | text principal, sidebar, carduri întunecate |
| `--color-espresso-2` | `#5A463B` | cercuri decorative pe espresso |

### Neutre și text
| Token | Hex | Utilizare |
|---|---|---|
| `--text-secondary` | `#6B5A50` | paragrafe secundare |
| `--text-muted` | `#7A6A60` | meta, etichete de tabel, timestamp |
| `--text-on-dark-muted` | `#CDBDB1` / `#B9A89C` | text secundar pe espresso |
| `--rose-50` | `#F5EAEB` | cerc de icon, hover pe ghost |
| `--sand-100` | `#F2EAE0` | tag de categorie (text `#5C4A3F`) |
| `--sand-200` | `#EDE3D8` / `#EFE6DC` / `#F5EDE4` | track progres, skeleton |
| `--border` | `rgba(73,56,47,0.08)` | separatoare rânduri |
| `--border-strong` | `rgba(73,56,47,0.16)` | contur buton secundar (inset 1.5px) |

### Statusuri (fundal pastel / text) — obligatoriu cu etichetă + icon
| Stare | Fundal | Text | Punct / bară | Exemple |
|---|---|---|---|---|
| Liber / Succes / Livrat / Activ | `#E4EEDF` | `#3E5A37` | `#7FA373` | masă liberă, comandă livrată, plată reușită |
| Activ (sesiune) / Nou | `#F3E1E3` | `#7A4B55` | `#B7848C` | masă activă, comandă nouă, joc la masă |
| Avertizare / Checkout / În preparare / În așteptare | `#F7E7C8` | `#7A5316` (text lung `#5E3F0F`) | `#D9A54A` | checkout pending, cerere în așteptare |
| Rezervat / Acceptat | `#E8E4F0` | `#4A3F66` | `#8C7BB0` | cerere rezervată, comandă acceptată |
| Inactiv / Returnat / Neutru | `#EDE6DE` | `#5C4E45` | `#C9BBAE` / `#D8C7BB` | joc inactiv, returnat, offline |
| Eroare / Timeout | `#F6E0DC` | `#6E2B22` | — | timeout, conflict 409 |
| Eroare de validare | inel `#C9786B` | text `#A0453A` | — | câmp invalid |

Verdele se folosește **doar semantic** (succes/liber), niciodată ca accent de brand.

### Tipografie
- Font unic: **Manrope** (Google Fonts), ponderi 400/500/600/700/800. Fallback: `system-ui, sans-serif`.

| Rol | Mărime | Pondere | Letter-spacing |
|---|---|---|---|
| Display (login hero) | 56px / lh 1.04 | 800 | -0.035em |
| Titlu pagină (topbar) | 24px | 800 | -0.02em |
| KPI | 36px / lh 1 | 800 | -0.03em |
| Titlu mobil mare | 30–36px / lh 1.05–1.1 | 800 | -0.03em |
| Titlu card / drawer | 17–28px | 800 | -0.02em |
| Body | 14–15px / lh 1.5 | 500–600 | — |
| Meta / etichetă | 12–13px | 600–700 | — |
| Overline | 11–12px, UPPERCASE | 800 | 0.08–0.1em |
| Badge | 11–12px | 700–800 | — |

### Raze
- Pill `999px`: toate butoanele, inputurile, badge-urile, tab-urile segmentate, chips.
- `20–24px`: carduri mici, blocuri interne, toast.
- `28–32px`: carduri mari, panouri.
- `36px`: modal, bottom sheet (doar colțurile de sus), drawer (colțurile din stânga: `32px 0 0 32px`).

### Umbre
- Card: `0 1px 2px rgba(73,56,47,.06), 0 4px 14px rgba(73,56,47,.04)`.
- Card hover: `0 0 0 2px #EAD6D8, 0 8px 24px rgba(73,56,47,.08)`.
- Modal: `0 24px 60px rgba(46,33,27,.28)`.
- Drawer: `-12px 0 40px rgba(46,33,27,.18)`.
- Toast / bara coșului: `0 12–16px 30–40px rgba(46,33,27,.3)`.
- Overlay: `rgba(46,33,27,.38–.45)`; `.55` pentru expirarea sesiunii.

### Spațiere
Grilă de 4px: `4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36`.
- Padding pagină desktop: `24px 36px 28px`.
- Gap între carduri: `16px`.
- Padding card: `20–28px`.
- Padding ecran mobil: `62px 18px 34px` (sub status bar).

### Înălțimi de control
- Butoane: `38–46px` desktop, `52–58px` mobil.
- Inputuri: `44–52px`.
- Hit target minim pe mobil: `44px`.
- Icon-buttons: `36–44px`, cerc.

---

## Componente comune (`shared/`)
Conform spec §2: Button, Card, Badge, Input, Modal, Drawer, Tabs, Toast, Skeleton, Spinner, EmptyMessage, StatusIndicator.

| Componentă | Specificații |
|---|---|
| **Button** | `primary`: bg `#925E68`, text alb, 800; hover `#7A4B55`. `secondary`: transparent, `box-shadow: inset 0 0 0 1.5px rgba(73,56,47,.16)`, text `#925E68` sau `#49382F`; hover bg `#F5EAEB`. `ghost`: text `#925E68`. `disabled`: opacity .45 + cursor not-allowed + icon `lock` când acțiunea e blocată de reguli. `submitting`: spinner 18px în buton (border 2.5px), text „Se procesează…”. |
| **Badge / StatusIndicator** | pill, `padding 4px 10px`, 12px/700, icon 12px + text. Vezi tabelul de statusuri. |
| **Tabs (segmented)** | container `#F7F1E9` sau `rgba(73,56,47,.06)`, padding 4px, pill. Tab activ: bg alb, `box-shadow 0 1px 3px rgba(73,56,47,.12)`, 800. Contorul e în `#925E68`. |
| **Chip filtru** | 40px pill; activ `#49382F` + text `#F7F1E9` (desktop) sau `#925E68` + alb (mobil); inactiv alb; număr în muted. |
| **Input** | pill, bg `#F7F1E9` (inactiv) sau `#FFFFFF` + `box-shadow 0 0 0 2px #B7848C` (focus). Etichetă 13px/700 deasupra. Eroare: inel `#C9786B` + mesaj 12px/700 `#A0453A`. |
| **Toggle** | 38×22 (desktop) / 44×26 (mobil); on `#925E68`, off `#D8C7BB`, knob alb. |
| **Stepper** | pill `#F7F1E9`, butoane rotunde albe 38–60px, valoare 800. |
| **Modal** | 440–620px lățime, radius 36, padding 32, gap 16–20; header cu icon în cerc 52px + titlu 22/800; acțiuni aliniate dreapta. |
| **Drawer (Management)** | 600px, din dreapta, radius `32px 0 0 32px`; header (titlu 28/800 + badge + meta), tabs segmentate, conținut scrollabil, footer cu acțiuni. |
| **Bottom sheet (Customer)** | radius `36px 36px 0 0`, handle 44×5 `#E3D6CB`. |
| **Toast** | succes: pill `#E4EEDF`/`#2F4A2A`; eroare: card espresso `#49382F`, text cream, icon `#EAD6D8`; închidere cu x. Desktop jos-dreapta, mobil jos sau sus. |
| **Skeleton** | blocuri pill `#EFE6DC` / `#F5EDE4` în carduri albe; rândurile de mai jos la opacity .8 și .55. |
| **EmptyMessage** | cerc 84–96px cu icon + titlu 24–26/800 + text secundar + CTA opțional, aliniat stânga. |
| **Icon** | Lucide (stroke 2). În machete sunt randate din `lucide-static@0.460.0` cu CSS mask; în cod folosiți `lucide-react`. |

---

## Ecrane — Management UI (`designs/Management UI.dc.html`, cadru 1440×900)
**Shell:**
- **Sidebar** 248px, `#49382F`. Conține: logo (cerc blush 42px + „Board Game Café / Management”), secțiunea „Operațiuni” (Dashboard, Mese, Comenzi [contor], Cereri jocuri [contor]) și secțiunea „Administrare”, vizibilă **doar pentru Manager** (Toate modulele, Personal, Configurare mese, Jocuri, Meniu, Setări, Rapoarte). Jos: cardul utilizatorului (inițiale, nume, rol, logout).
  - Item: pill, `10px 14px`, 14px/600. Activ: bg `#EAD6D8`, text `#49382F`, 700. Overline 11px/700 uppercase `#B9A89C`.
- **Topbar** 76px, border-bottom. Conține titlul paginii (24/800), pill „Ziua #N deschisă”, indicatorul live „Live” (`#E4EEDF`) sau „Reconectare…” (`#EDE6DE` + „Reîncearcă”) și clopoțelul cu contor `#925E68`.

| ID | Ecran | Note cheie |
|---|---|---|
| 1a | Login | Split: hero stânga, card alb 36px radius dreapta. **Fără selector de rol** — rolul vine din cont. Notă despre expirarea la 60 min. |
| 1b | Dashboard Staff | Bandă de alertă checkout (`#F7E7C8`); 4 KPI (mese active, comenzi noi, cereri jocuri, sesiuni în checkout); 3 carduri de modul; listă „Comenzi noi” cu „Procesează”; „Activitate recentă” (derivată din starea curentă, nu un jurnal salvat). |
| 1c | Dashboard Manager | KPI + card espresso „Ziua curentă” (sesiuni închise/deschise, încasat) + EOD dezactivat cu motiv + card „Administrare” (blush). Fără grafice orare. |
| 1d | Mese | Chips de filtru + grilă 4 col de carduri (radius 24). Liberă: buton „Deschide masa”. Activă: 2×2 meta (conectați, timp, comenzi, jocuri). Checkout: card `#FFFBF2` cu inel `#E7C98F` și avertizare „blochează plata”. |
| 1e / 2a / 2b / 2c / 1f | Drawer masă | Tab-uri **Rezumat / Participanți / Comenzi / Jocuri / QR-PIN**. Rezumat: stare, zi, tarif fixat, persoane declarate, jocuri x/3, total preliminar, „Necesită atenție”. QR-PIN: doar personal autentificat, PIN 4 cifre, „Afișează fullscreen”. |
| 2d | Drawer — checkout pending | Ce blochează plata (comenzi nelivrate, jocuri nereturnate), total final, „Redeschide sesiunea”. Notă: tarifele rămân blocate pentru client. |
| 2e | Confirmare deschidere masă | Modal cu tariful curent, capacitate, limita de jocuri, mesaj că tariful se fixează la deschidere. |
| 2f | Notificări | Popover 420px sub clopoțel; necitite pe `#FBF5F5` cu punct. |
| 2g | Comenzi | Carduri extensibile, cele mai vechi primele. Expandat: **Acceptă/Respinge per poziție** (segmented), motiv obligatoriu la respingere, „Confirmă deciziile” trimite tot setul. Tranzițiile Acceptată → În preparare → Gata → Livrată sunt butoane separate. |
| 2h | Comenzi — timeout | Badge „Stare neconfirmată”, banner `#F6E0DC`, deciziile la opacity .6. Primar „Verifică starea”; „Confirmă din nou” dezactivat până la refetch. **Nicio retrimitere automată.** |
| 2i | Cereri jocuri | 4 coloane: În așteptare (Respinge/Rezervă) → Rezervate (Livrează) → La mese (Returnat) → Încheiate azi. |
| 2j | Administrare hub | 6 carduri (radius 32): Personal, Configurare mese, Jocuri, Meniu, Setări, Rapoarte (espresso). |
| 2k | Personal | Tabel + modal „Adaugă cont” (nume, email, rol segmented Staff/Manager, parolă inițială min 12). |
| 1g / 2l / 2m / 2n / 7c | Jocuri | Tab-uri Jocuri (carduri) / Categorii (tabel) / Exemplare (tabel cu cod, stare, unde, notă). Detaliu joc cu exemplare + reguli PDF. Pagina „Adaugă joc” cu upload PDF și progres. Starea PDF: Gata / În procesare / Încarcă. Dezactivare logică, fără ștergere. |
| 1h / 7b | Meniu | Tab-uri Produse (tabel cu toggle disponibilitate și coloana „Comandabil”) / Categorii (ordonabile). Modal „Adaugă produs” cu validare preț > 0 și alegere de icon. |
| 2o / 2p | Setări | Setări generale: tarif cu avertizarea „se aplică doar meselor deschise după salvare”, limită jocuri prin stepper. Program: pe zile, toggle + interval, informativ, independent de EOD. |
| 2q / 5c / 5d | Rapoarte / EOD | Card „Ziua curentă” + bare de venit pe zile simulate (ziua curentă hașurată, preliminară) + tabel istoric cu export PDF. EOD blocat afișează lista sesiunilor deschise. Confirmarea EOD e un modal cu totaluri și „Ziua #N+1 se deschide automat”. |
| 5a | QR/PIN fullscreen | Fundal espresso, QR 440px, număr masă 140px, PIN 4×96px, „Închide (Esc)”. |
| 5b | Verificare plată incertă | Modal Staff (contract **PROPUS** `GET /api/admin/sessions/{id}/payments`). Rezultatul vine din Core, plus lista de încercări (ora, id idempotency, sumă, stare). |
| 7a | Configurare mese | Tabel + modal de editare; dezactivarea e blocată cât masa are sesiune deschisă. |
| 7d | Istoric comenzi | Tabel livrate/anulate, filtru pe zi; pozițiile respinse sunt tăiate. |
| 7e | Conflict 409 / reconectare | Banner 409 în card + refetch, coloane goale, toast de succes, topbar „Reconectare…”. |
| 7f | Sesiune expirată | Modal blocant, CTA „Autentifică-te din nou”. |
| 1i | Loading | Skeleton al grilei de mese. |

## Ecrane — Customer UI (`designs/Customer UI.dc.html`, iPhone 402×874)
Header mobil: buton hamburger sau înapoi (44px, alb) + titlu centrat 17/800.

| ID | Ecran / rută | Note cheie |
|---|---|---|
| 3a | `/join/:token` | Badge masă, PIN 4 celule 70px, câmp nume, CTA „Intră la masă”. Fără cont. |
| 3b | `/dashboard` | Card rezumat cu secțiune extensibilă (participanți, comenzi active, jocuri, nota curentă) + grilă **2×2**: Meniu, Jocuri, Comenzile mele, Nota mesei (espresso). |
| 3c | Hamburger | Panou stânga 318px, radius `0 36 36 0`. Item activ pe blush, item „Ieși de pe acest telefon” jos. |
| 3d | `/menu` | Căutare, categorii pe scroll orizontal, un card produs pe rând (icon, fără foto), buton + sau contor. **Bara coșului fixă jos** (espresso, pill 64px). |
| 4a | Modal produs | Bottom sheet; clientul schimbă doar cantitatea; CTA cu prețul total. |
| 3e | `/cart` | Pagină separată; stepper per poziție (coș la cantitatea 1); notă despre confirmarea per poziție. |
| 3f | Coș — timeout | Banner „Nu am primit confirmarea”, **coșul rămâne**. Primar „Verifică Comenzile mele”, secundar „Trimite din nou” cu avertizare de dublare. |
| 3g / 6b | `/orders` | Carduri cu progres în 5 pași (Trimisă → Acceptată → Preparare → Gata → Livrată). Modifică/Anulează doar înainte de acceptare. Pozițiile respinse sunt tăiate și au motiv. Stare goală. |
| 4b / 4c | `/games` | Card mare pe rând (icon, categorii, jucători/durată/dificultate, disponibilitate calculată). Chips rapide + bottom sheet de filtre avansate (jucători, durată, dificultate, categorii, „doar disponibile”). CTA spre recomandări. |
| 4d | `/games/:id` | Detalii + bottom sheet de confirmare a cererii (disponibilitate, jocuri x/3). |
| 4e / 4f | Asistent reguli | Chat cu sursa citată („Manual, pagina 3”), sugestii rapide. Dacă PDF-ul nu e READY: ecran explicit, fără reguli inventate. |
| 4g / 4h / 4i | Recomandări AI | Chestionar în 3 pași, apoi carduri cu explicația AI. Dacă AI-ul nu răspunde: **rezultate deterministe etichetate** + „Încearcă din nou cu AI”. |
| 4j | `/game-requests` | Badge pe card + cronologie (Cerere trimisă → Rezervat → Livrat → Returnat); ramura Respins are motiv. |
| 3h | `/bill` | Total estimativ (espresso), stepper pentru **persoane fizice** (≠ participanți conectați), tarif fixat, detalii pe participanți. |
| 3i / 6a / 3j | `/checkout` | Flux în 3 pași cu progres: Persoane → Rezumat → Confirmare (cu avertizarea că se blochează comenzile noi). |
| 3k | `/bill` în CHECKOUT_PENDING | Ce blochează plata; buton de plată dezactivat cu motiv. |
| 4k | Plată | Total, „Toate comenzile și jocurile sunt rezolvate”, metodă simulată, buton în stare submitting. |
| 4l | `/payment-result` — reușită | Cerc verde, rezumat final, accesul s-a încheiat. |
| 4m | `/payment-result` — necunoscut | „Plata nu a putut fi confirmată” (nu „a eșuat”), chemați personalul, **„Plătește din nou” blocat**. |
| 4n | Acces încheiat | Sesiune închisă / QR invalid; coșul golit; CTA „Scanează un cod nou”. |
| 6c / 6d | Stări | Bandă „Actualizările live sunt oprite” + Reîncearcă, toast de eroare, conflict 409 la cererea de joc cu refetch, toast de succes. |

---

## Interacțiuni și comportament
- **Tranziții:** discrete; recomandat `150–200ms ease-out` pentru hover, culoare și opacitate. Drawer/sheet: `240ms cubic-bezier(.2,.8,.2,1)` translate. Modal: fade + scale .98→1.
- **Hover (desktop):** bg `#F5EAEB` pe ghost/secundar; pe primar `#7A4B55`; card hover cu inel blush.
- **Focus:** `outline: 2px solid #925E68; outline-offset: 2px` pe `:focus-visible`.
- **Stări standard (spec §10):** INITIAL, LOADING (skeleton), SUCCESS, EMPTY (EmptyMessage), ERROR (inline + toast), SUBMITTING (spinner în buton, buton dezactivat), REFRESHING, RECONNECTING.
- **Mutații:** nu se reîncearcă niciodată automat pe timeout/5xx. Nu afișați succes înainte de răspunsul Core.
- **Erori HTTP:**
  - 400: validare inline, datele se păstrează.
  - 401: ștergeți identitatea locală și cereți login sau rejoin (7f, 4n).
  - 403: acces interzis.
  - 409: refetch + mesaj clar (7e, 6d).
  - 429: respectați `retry-after`.
  - 5xx/timeout: mesaj controlat (2h, 3f, 4m).
- **WebSocket:** eveniment → refetch REST al datelor afectate (tabelul din spec §10). La reconectare se reîncarcă tot ce e relevant.
- **Responsive:**
  - Management: grila de mese 4 → 3 → 2 coloane pe tabletă; drawer-ul pe tabletă poate ocupa 100% din lățime.
  - Customer: proiectat la 402px, fluid de la 360px.

## State management
- `CustomerSessionContext`: participantul, sesiunea și token-ul (în `sessionStorage`).
- `StaffAuthContext`: JWT în `localStorage`, valabil 60 min, fără refresh; rolul STAFF/MANAGER decide ce apare în sidebar.
- **Coș:** în `localStorage` sub cheia `cart:{sessionId}:{participantId}`. Se golește la succes, la CLOSED sau la invalidare, **dar nu la timeout**.
- **Plată incertă:** flag PROPUS în `sessionStorage` care păstrează blocarea (4m) după refresh.
- **Hooks per feature:** `{data, loading, error, refetch}` cu abort și protecție la răspunsuri depășite.

## Assets
- **Iconuri:** Lucide. Nume folosite, printre altele: dices, armchair, clipboard-list, layout-dashboard, puzzle, coffee, settings, trending-up, users, receipt, qr-code, door-open, chef-hat, hourglass, key-round, undo-2, sparkles, file-text, lock, wifi-off, cloud-off, circle-help, flag, timer-off.
- **Fără fotografii** de produse sau jocuri în v1; se folosesc iconuri tematice în cercuri `#F5EAEB` / `#925E68`.
- **Codul QR** e un placeholder; imaginea reală vine din Core.
- **Logo-ul propriu** vine ulterior; acum se folosește iconul `dices` în cerc.

## Fișiere
- `tokens.css` — variabilele CSS gata de importat în `styles/` din ambele aplicații.
- `designs/Management UI.dc.html` — toate cadrele Management (rundele 1, 2, 5, 7).
- `designs/Customer UI.dc.html` — toate cadrele Customer (rundele 3, 4, 6).
- `designs/Sidebar.dc.html`, `Topbar.dc.html`, `TablesGrid.dc.html`, `TableDrawer.dc.html` — componentele de shell folosite de cadrele Management.
- `designs/ios-frame.jsx`, `designs/support.js` — necesare doar pentru afișarea machetelor în browser.

## Puncte deschise (din spec §12, relevante pentru UI)
- Contractul Staff pentru verificarea plății (5b) este **PROPUS**.
- Modificarea/anularea unei comenzi de către client (3g) și atomicitatea procesării pe poziții (2g) sunt de confirmat cu backend-ul.
- Textele finale ale notificărilor și valorile de contrast trebuie validate.
