# Board Game Café

Proiect universitar SCD: aplicație distribuită pentru o cafenea cu jocuri de societate.

- **Clienții** intră la masă cu QR + PIN, fără cont. Comandă din meniu, cer jocuri, primesc recomandări AI, întreabă despre reguli și plătesc împreună nota.
- **Personalul** procesează comenzile și împrumuturile de jocuri.
- **Managerul** administrează cafeneaua și închide zilele simulate (End of Day) cu rapoarte și export PDF.

| Componentă | Tehnologie | Port |
|---|---|---|
| `backend/core-service` | Java 25, Spring Boot 4, PostgreSQL 18, Flyway, WebSocket | 8082 |
| `backend/ai-service` | Python, FastAPI, Ollama (`gemma2:9b`, `bge-m3`) | 8081 |
| `frontend/management-ui` | React + Vite (staff și manager) | 5174 |
| `frontend/customer-ui` | React + Vite (clienți, mobil) | 5173 |

## Pornire rapidă

```powershell
.\scripts\start-all.ps1     # pornește tot
.\scripts\stop-all.ps1      # oprește tot
```

Instalarea, configurarea, datele demo, API-ul complet, WebSocket-ul, AI-ul, baza de date și testarea sunt descrise în **[docs/Ghid_Proiect.md](docs/Ghid_Proiect.md)**.
