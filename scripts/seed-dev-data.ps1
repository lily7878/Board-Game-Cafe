# Incarca datele demo (scripts\seed-dev-data.sql) in baza locala board_game_cafe.
# Foloseste parola bgc_app salvata criptat de start-backend.ps1. Se poate rula de oricate ori.
#
# Utilizare (din radacina proiectului):
#   powershell -ExecutionPolicy Bypass -File .\scripts\seed-dev-data.ps1

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'bgc-keys.ps1')
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
$dbPasswordFile = Join-Path $BgcSecretsDir 'db-password.txt'

if (-not (Test-Path $psql)) { throw "Nu gasesc psql la $psql." }
if (-not (Test-Path $dbPasswordFile)) { throw 'Nu gasesc parola bazei de date. Ruleaza mai intai scripts\start-backend.ps1.' }

$env:PGPASSWORD = Unprotect (Get-Content $dbPasswordFile -Raw).Trim()
try {
    & $psql -U bgc_app -h 127.0.0.1 -d board_game_cafe -v ON_ERROR_STOP=1 -q -f (Join-Path $PSScriptRoot 'seed-dev-data.sql')
    if ($LASTEXITCODE -ne 0) { throw 'Incarcarea datelor demo a esuat.' }
    Write-Host 'Datele demo sunt incarcate.' -ForegroundColor Green
} finally {
    Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
}
