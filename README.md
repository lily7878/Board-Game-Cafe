
# Board Game Cafe

Proiect universitar SCD - aplicatie distribuita
pentru administrarea unei cafenele cu jocuri
de societate.

## Tehnologii

- Java 25
- Spring Boot 4.0.8
- Maven
- PostgreSQL 18
- React (planificat)
- REST API si WebSocket

## Structura

- backend/core-service - backend principal
- backend/ai-service - serviciu AI (viitor)
- frontend/customer-ui - interfata clienti
- frontend/management-ui - interfata staff
- infrastructure - configurari infrastructura
- docs - documentatie

## Stadiu

Core Service include administrarea meselor si jocurilor, catalogul pentru clienti,
sesiuni si fluxul de cereri pentru jocuri. Autentificarea STAFF/MANAGER si accesul
participantilor sunt implementate pentru aceste API-uri.

Configurarea secretelor si bootstrap-ul primului manager sunt descrise in
[ghidul backend inainte de M6](docs/Backend_Pre_M6_Setup.md).
