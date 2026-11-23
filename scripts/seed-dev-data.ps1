# Incarca datele demo in baza locala board_game_cafe:
#   1. scripts\seed-dev-data.sql    - mese, jocuri, exemplare, meniu, conturi de personal (oricate rulari)
#   2. scripts\seed-dev-history.sql - 14 zile de istoric cu sesiuni, comenzi si rapoarte (o singura data)
#   3. scripts\upload-demo-manuals.ps1 - manualele PDF, doar daca backend-ul ruleaza (sau cu -SkipManuals)
# Foloseste parola bgc_app salvata criptat de start-backend.ps1. Se poate rula de oricate ori.
#
# Utilizare (din radacina proiectului):
#   powershell -ExecutionPolicy Bypass -File .\scripts\seed-dev-data.ps1

param([switch]$SkipManuals)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'bgc-keys.ps1')
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
$dbPasswordFile = Join-Path $BgcSecretsDir 'db-password.txt'

if (-not (Test-Path $psql)) { throw "Nu gasesc psql la $psql." }
if (-not (Test-Path $dbPasswordFile)) { throw 'Nu gasesc parola bazei de date. Ruleaza mai intai scripts\start-backend.ps1.' }

$env:PGPASSWORD = Unprotect (Get-Content $dbPasswordFile -Raw).Trim()
try {
    foreach ($file in 'seed-dev-data.sql', 'seed-dev-history.sql') {
        & $psql -U bgc_app -h 127.0.0.1 -d board_game_cafe -v ON_ERROR_STOP=1 -q -f (Join-Path $PSScriptRoot $file)
        if ($LASTEXITCODE -ne 0) { throw "Incarcarea $file a esuat." }
    }
    Write-Host 'Datele demo sunt incarcate.' -ForegroundColor Green
} finally {
    Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
}

if ($SkipManuals) { return }
try {
    Invoke-RestMethod -Uri 'http://localhost:8082/actuator/health' -TimeoutSec 3 | Out-Null
} catch {
    Write-Host 'Backend-ul nu ruleaza: manualele PDF nu au fost incarcate. Dupa start-all.ps1 ruleaza scripts\upload-demo-manuals.ps1.' -ForegroundColor Yellow
    return
}
& (Join-Path $PSScriptRoot 'upload-demo-manuals.ps1')
