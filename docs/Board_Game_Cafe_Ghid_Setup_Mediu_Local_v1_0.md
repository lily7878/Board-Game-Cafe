git # Board Game Café — Setup mediu de dezvoltare

**Versiune:** 1.0  
**Data:** 11 octombrie 2026  
**Referință:** Board Game Café — Document Master v1.0  
**Status:** configurarea locală inițială este finalizată; aplicația nu este implementată integral.

## 1. Scop și concluzie

Acest document păstrează configurația tehnică locală verificată pentru proiectul universitar SCD Board Game Café, astfel încât mediul să poată fi reprodus și verificat. Au fost pornite Core Service, ambele aplicații React, conexiunea PostgreSQL și integrarea Flyway. Nu au fost implementate încă funcționalitățile de business, autentificarea finală, serviciul AI sau deploy-ul.

## 2. Instrumente instalate și verificate

| Instrument | Versiune / stare |
| --- | --- |
| Sistem | Windows + PowerShell |
| VS Code | 1.141.0 x64, extensii Java, Spring Boot, ESLint, Prettier și EditorConfig |
| Java | Eclipse Temurin JDK 25.0.4.1 LTS; `JAVA_HOME` și `PATH` funcționale |
| Spring Boot | 4.0.8; `java.version=25` |
| Maven | Maven Wrapper `mvnw.cmd` (fără instalare globală obligatorie) |
| Node / npm | Node v24.21.0 / npm 11.19.0 |
| Git | 2.56.0.windows.2; branch `main` |
| PostgreSQL / psql | 18.6; `postgresql-x64-18` activ și autentificare validată |
| Hibernate | ORM 7.2.24.Final, inițializat |
| React / Vite | `customer-ui` și `management-ui` generate; ambele pornesc |
| Flyway | activ, `flyway_schema_history` creat, 0 migrații de business |

Versiunile exacte ale React, Vite și Maven Wrapper nu au fost consemnate în jurnal; pot fi consultate în `package.json`, `package-lock.json` și cu `./mvnw.cmd -version`.

## 3. Locația proiectului și porturi

Repository local:

```text
C:\Personal\Facultate\An_4\Sem1\SCD\Proiect
```

```text
Proiect/
├── backend/
│   └── core-service/      # Spring Boot + Maven Wrapper
├── frontend/
│   ├── customer-ui/       # React / Vite
│   └── management-ui/     # React / Vite
├── infrastructure/        # configurații viitoare
├── docs/
├── .gitignore
└── README.md
```

| Componentă | Adresă | Stare |
| --- | --- | --- |
| Core Service | `http://localhost:8080` | Funcțional |
| Customer UI | `http://localhost:5173` | Funcțional |
| Management UI | `http://localhost:5174` | Funcțional |
| PostgreSQL | `localhost:5432` | Funcțional |
| AI Service | `localhost:8081` — convenție propusă | Necreat |

Ambele aplicații Vite au porturi fixe (`strictPort: true`) și proxy către Core Service pentru `/api` și `/actuator`. Testele `/actuator/health` au funcționat prin ambele proxy-uri; **nu există încă endpoint-uri funcționale de business**.

## 4. Configurație backend și DB

Fișier: `backend/core-service/src/main/resources/application.properties`

```properties
spring.application.name=core-service
spring.datasource.url=jdbc:postgresql://localhost:5432/board_game_cafe
spring.datasource.username=bgc_app
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false
server.port=8080
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
```

Baza de date `board_game_cafe` și utilizatorul dedicat `bgc_app` au fost verificate prin conexiunea reușită a Spring Boot.

### Secrete în PowerShell

Pentru fiecare terminal nou din care se pornește backend-ul:

```powershell
$secret = Read-Host "Parola PostgreSQL pentru bgc_app" -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new("", $secret).Password
Remove-Variable secret
```

Nu se salvează parole în `application.properties`, în `.env` versionat sau în Git. Spring Security încă utilizează autentificarea implicită de dezvoltare, nu identitățile STAFF/MANAGER.

### Flyway și Code First

- Dependențe Maven: `spring-boot-starter-flyway`, `flyway-database-postgresql`.
- Folder migrații: `backend/core-service/src/main/resources/db/migration/`.
- `flyway_schema_history` a fost creat în schema `public`.
- Mesajul „Successfully validated 0 migrations” este normal: **nu există migrații de business** încă.
- Strategia planificată: JPA pentru modelul Java, Flyway pentru SQL versionat, Hibernate `ddl-auto=validate`.

## 5. Pornire locală

**Terminal 1 — Core Service:**

```powershell
cd "C:\Personal\Facultate\An_4\Sem1\SCD\Proiect\backend\core-service"
# Configurează DB_PASSWORD în același terminal, conform §4.
.\mvnw.cmd spring-boot:run
```

Verificare: `http://localhost:8080/actuator/health` → JSON cu `status: UP`; grupurile `liveness` și `readiness` au apărut în rezultat. Oprire: `Ctrl+C`.

**Terminal 2 — Customer UI:**

```powershell
cd "C:\Personal\Facultate\An_4\Sem1\SCD\Proiect\frontend\customer-ui"
npm.cmd run dev
```

**Terminal 3 — Management UI:**

```powershell
cd "C:\Personal\Facultate\An_4\Sem1\SCD\Proiect\frontend\management-ui"
npm.cmd run dev
```

Verificări: `http://localhost:5173`, `http://localhost:5174`, precum și `/actuator/health` pe ambele adrese.

### Build și Git

```powershell
cd "C:\Personal\Facultate\An_4\Sem1\SCD\Proiect\backend\core-service"
.\mvnw.cmd package "-DskipTests"

cd "C:\Personal\Facultate\An_4\Sem1\SCD\Proiect"
git status
git log -2 --oneline
```

`BUILD SUCCESS` a fost obținut cu testele **omise**; nu dovedește că suita de teste a trecut.

## 6. Dovezi verificate

- Maven: `BUILD SUCCESS`, inclusiv după integrarea Flyway.
- JDBC: `HikariPool-1 - Start completed`, conectat la PostgreSQL 18.6.
- Flyway: `flyway_schema_history` creat, 0 migrații validate, schemă la zi.
- Spring Boot: `Tomcat started on port 8080`, apoi `Started CoreServiceApplication`.
- Actuator: `{ "groups": ["liveness", "readiness"], "status": "UP" }`.
- React: ambele UI pornesc pe porturile fixate.
- Proxy: `/actuator/health` reușit prin ambele interfețe.
- `.gitignore`: ignorarea `.env`, `target/`, `node_modules/` confirmată cu `git check-ignore -v`.

Commit-uri:

```text
05af5e7 (main) chore: complete local development environment
4ad5777        chore: initialize Board Game Cafe project
```

Comenzile `git log` au fost verificate. Pentru confirmarea stării curente `working tree clean`, se rulează `git status` (neconsemnat după ultimul commit).

## 7. Probleme cunoscute / atenționări

- **Spring Security:** parola de dezvoltare generată automat este temporară; autentificarea și autorizarea STAFF/MANAGER sunt neimplementate.
- **Maven / Flyway:** a apărut warning HTTP 401 pentru metadata repository-ului `flyway-community-db-support`, dar compilarea și pornirea au reușit; de investigat dacă persistă.
- **Port 8080:** inițial era ocupat de Apache `httpd`; conflictul a fost rezolvat înainte de pornirea reușită. Identificați procesul înainte de orice oprire forțată.
- **Testare:** build-ul cu `-DskipTests` nu înlocuiește testele unitare/integrate.

## 8. Explicit în afara setup-ului inițial

- Entități JPA / tabelele business / migrații reale / CRUD, sesiuni, checkout, jocuri și rapoarte.
- Autentificare completă STAFF/MANAGER, RBAC, securitate producție.
- AI Service, baza AI, PDF/RAG și chei pentru un model extern.
- Docker, CI/CD, hosting, HTTPS public, backup și secret management pentru producție.
- Validarea academică a PWA ca aplicație mobilă.

**Concluzie:** mediul local inițial este pregătit pentru implementare graduală, în acord cu Clean Code, SOLID, Code First și Flyway. Nu este încă un sistem pregătit de producție.

### Anexă: reproducerea configurării editorului

Extensii VS Code verificate prin `code --list-extensions`:

```text
vscjava.vscode-java-pack
vmware.vscode-boot-dev-pack
dbaeumer.vscode-eslint
esbenp.prettier-vscode
editorconfig.editorconfig
```

Configurație Vite relevantă pentru fiecare UI; se schimbă doar portul:

```javascript
server: {
  port: 5173, // Customer; 5174 pentru Management
  strictPort: true,
  proxy: {
    '/api': { target: 'http://localhost:8080', changeOrigin: true },
    '/actuator': { target: 'http://localhost:8080', changeOrigin: true },
  },
},
```

**Referință:** *Board Game Café — Document Master v1.0* (11.10.2026), §6–7, §10, §17 și §21. Datele de instalare și logurile provin din verificările locale ale aceleiași zile.
