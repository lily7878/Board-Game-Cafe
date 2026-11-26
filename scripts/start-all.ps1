# Porneste toate serviciile proiectului, fiecare in propria fereastra PowerShell:
#   1. Backend (core-service)  -> http://localhost:8082   (scripts\start-backend.ps1)
#   2. Serviciul AI + Ollama   -> http://127.0.0.1:8081   (scripts\start-ai.ps1)
#   3. Management UI           -> http://localhost:5174
#   4. Customer UI             -> http://localhost:5173
#
# Interfetele pornesc dupa ce backend-ul raspunde la /actuator/health (proxy-ul Vite are nevoie de el).
# Fiecare serviciu se opreste cu Ctrl+C in fereastra lui (sau inchizand fereastra).
#
# Utilizare (din radacina proiectului):
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1 -NoAi          # fara serviciul AI
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1 -NoCustomerUi  # fara customer-ui
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1 -AiModel qwen2.5:7b

param(
    [switch]$NoAi,
    [switch]$NoCustomerUi,
    [switch]$NoManagementUi,
    [string]$AiModel = 'gemma2:9b',
    [int]$BackendTimeoutSec = 180
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

function Test-Port([int]$port) {
    [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
}

# Deschide o fereastra PowerShell noua, cu titlu, care ruleaza $command in $workDir si ramane deschisa la final.
function Start-ServiceWindow([string]$title, [string]$workDir, [string]$command) {
    $script = "`$Host.UI.RawUI.WindowTitle = '$title'; Set-Location -LiteralPath '$workDir'; $command"
    Start-Process powershell -WorkingDirectory $workDir -ArgumentList @(
        '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $script
    ) | Out-Null
    Write-Host "  -> $title" -ForegroundColor Green
}

# 0. PostgreSQL trebuie sa ruleze.
$pg = Get-Service postgresql-x64-18 -ErrorAction SilentlyContinue
if ($pg -and $pg.Status -ne 'Running') {
    Write-Host 'PostgreSQL (postgresql-x64-18) nu ruleaza. Porneste-l (ca administrator): Start-Service postgresql-x64-18' -ForegroundColor Red
    exit 1
}

# 1. Backend.
if (Test-Port 8082) {
    Write-Host 'Backend-ul ruleaza deja pe 8082, nu il mai pornesc.' -ForegroundColor Yellow
} else {
    Write-Host 'Pornesc backend-ul...' -ForegroundColor Cyan
    Start-ServiceWindow 'BGC Backend :8082' $root "& '$root\scripts\start-backend.ps1'"
}

# 2. Serviciul AI (independent de backend, poate porni in paralel).
if (-not $NoAi) {
    if (Test-Port 8081) {
        Write-Host 'Serviciul AI ruleaza deja pe 8081, nu il mai pornesc.' -ForegroundColor Yellow
    } else {
        Write-Host 'Pornesc serviciul AI...' -ForegroundColor Cyan
        Start-ServiceWindow 'BGC AI :8081' $root "& '$root\scripts\start-ai.ps1' -Model '$AiModel'"
    }
}

# 3. Asteapta backend-ul (la prima rulare poate cere parola bazei de date in fereastra lui).
Write-Host "Astept backend-ul pe http://localhost:8082/actuator/health (max $BackendTimeoutSec s)..." -ForegroundColor Cyan
$deadline = (Get-Date).AddSeconds($BackendTimeoutSec)
$backendUp = $false
while ((Get-Date) -lt $deadline) {
    try {
        $health = Invoke-RestMethod -TimeoutSec 2 'http://localhost:8082/actuator/health'
        if ($health.status -eq 'UP') { $backendUp = $true; break }
    } catch { }
    Start-Sleep -Seconds 2
}
if ($backendUp) {
    Write-Host 'Backend-ul este UP.' -ForegroundColor Green
} else {
    Write-Host 'Backend-ul nu a raspuns la timp; pornesc totusi interfetele. Verifica fereastra "BGC Backend".' -ForegroundColor Yellow
}

# 4. Interfetele (npm install automat daca lipseste node_modules; npm.cmd evita blocarea npm.ps1).
$uis = @()
if (-not $NoManagementUi) { $uis += @{ Name = 'management-ui'; Port = 5174 } }
if (-not $NoCustomerUi) { $uis += @{ Name = 'customer-ui'; Port = 5173 } }
foreach ($ui in $uis) {
    $dir = Join-Path $root "frontend\$($ui.Name)"
    if (Test-Port $ui.Port) {
        Write-Host "$($ui.Name) ruleaza deja pe $($ui.Port), nu il mai pornesc." -ForegroundColor Yellow
        continue
    }
    $cmd = 'npm.cmd run dev'
    if (-not (Test-Path (Join-Path $dir 'node_modules'))) { $cmd = "npm.cmd install; if (`$?) { $cmd }" }
    Write-Host "Pornesc $($ui.Name)..." -ForegroundColor Cyan
    Start-ServiceWindow "BGC $($ui.Name) :$($ui.Port)" $dir $cmd
}

Write-Host ''
Write-Host 'Gata. Adrese:' -ForegroundColor Green
Write-Host '  Backend        http://localhost:8082'
if (-not $NoAi) { Write-Host '  Serviciu AI    http://127.0.0.1:8081' }
if (-not $NoManagementUi) { Write-Host '  Management UI  http://localhost:5174' }
if (-not $NoCustomerUi) { Write-Host '  Customer UI    http://localhost:5173' }
Write-Host 'Oprire: Ctrl+C sau inchide fereastra fiecarui serviciu.'
