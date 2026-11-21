# Porneste backend-ul (core-service) local.
#
# Prima rulare:
#   - genereaza cheile BGC_* si le salveaza CRIPTAT (DPAPI, doar contul tau Windows le poate citi)
#     in %USERPROFILE%\.bgc-local\  (in afara repository-ului, nu ajung in Git)
#   - cere parola PostgreSQL pentru utilizatorul bgc_app, o verifica si o salveaza tot criptat
# Rularile urmatoare refolosesc aceleasi chei si aceeasi parola, fara intrebari.
#
# Utilizare (din radacina proiectului):
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1 -ResetDbPassword

param([switch]$ResetDbPassword)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'bgc-keys.ps1')
$secretsDir = $BgcSecretsDir
$dbPasswordFile = Join-Path $secretsDir 'db-password.txt'
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
$coreService = Join-Path $PSScriptRoot '..\backend\core-service'

# 1. Cheile aplicatiei: generate o singura data, apoi refolosite.
#    BGC_AI_INTERNAL_TOKEN e secretul comun cu serviciul AI (start-ai.ps1 il citeste din acelasi fisier).
Import-BgcKeys

# 2. Parola PostgreSQL: ceruta o data, verificata cu psql, salvata criptat.
function Test-DbPassword([string]$password) {
    if (-not (Test-Path $psql)) { return $true }  # fara psql nu putem verifica dinainte
    $env:PGPASSWORD = $password
    try {
        & $psql -U bgc_app -h localhost -d board_game_cafe -tAc 'select 1' 2>$null | Out-Null
        return ($LASTEXITCODE -eq 0)
    } finally {
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

if ($ResetDbPassword -and (Test-Path $dbPasswordFile)) { Remove-Item $dbPasswordFile }

$dbPassword = $null
if (Test-Path $dbPasswordFile) {
    $dbPassword = Unprotect (Get-Content $dbPasswordFile -Raw).Trim()
    if (-not (Test-DbPassword $dbPassword)) {
        Write-Host 'Parola salvata nu mai functioneaza.' -ForegroundColor Yellow
        $dbPassword = $null
    }
}
while (-not $dbPassword) {
    $secure = Read-Host 'Parola PostgreSQL pentru utilizatorul bgc_app' -AsSecureString
    $candidate = [System.Net.NetworkCredential]::new('', $secure).Password
    if (Test-DbPassword $candidate) {
        $dbPassword = $candidate
        Protect $dbPassword | Set-Content $dbPasswordFile
        Write-Host 'Parola este corecta si a fost salvata criptat.' -ForegroundColor Green
    } else {
        Write-Host 'Nu m-am putut conecta la board_game_cafe cu bgc_app si aceasta parola. Mai incearca (Ctrl+C pentru iesire).' -ForegroundColor Red
    }
}
$env:DB_PASSWORD = $dbPassword

# 3. Pornire.
Write-Host 'Pornesc backend-ul pe http://localhost:8082 (oprire: Ctrl+C)...' -ForegroundColor Cyan
Push-Location $coreService
try {
    & .\mvnw.cmd spring-boot:run
} finally {
    Pop-Location
}
