# Porneste serviciul AI (backend/ai-service) local, pe http://127.0.0.1:8081.
#
# Necesita:
#   - Ollama instalat si pornit (gratuit, local):  winget install Ollama.Ollama
#   - modelele descarcate o data:                   ollama pull gemma2:9b ; ollama pull bge-m3
#
# Prima rulare creeaza mediul Python (.venv) si instaleaza dependintele din requirements.txt.
# Secretul comun cu Core (BGC_AI_INTERNAL_TOKEN) vine din acelasi fisier criptat ca la start-backend.ps1.
#
# Utilizare (din radacina proiectului):
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-ai.ps1
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-ai.ps1 -Model qwen2.5:7b   # mai rapid, romana mai slaba

param([string]$Model = 'gemma2:9b')

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'bgc-keys.ps1')
$aiService = Join-Path $PSScriptRoot '..\backend\ai-service'
$venvPython = Join-Path $aiService '.venv\Scripts\python.exe'

Import-BgcKeys -Names 'BGC_AI_INTERNAL_TOKEN'

# Instanta Ollama proprie proiectului, pe 11435 (nu cea din tray, de pe 11434), cu flash attention oprit:
# pe Vulkan + AMD RX 6800S flash attention produce raspunsuri goale/corupte. Modelele (~\.ollama) sunt comune.
$ollamaPort = 11435
$ollamaUrl = "http://127.0.0.1:$ollamaPort"
$env:LLM_BASE_URL = "$ollamaUrl/v1"
$env:LLM_MODEL = $Model

function Test-Ollama {
    try { Invoke-RestMethod -TimeoutSec 2 "$ollamaUrl/api/version" | Out-Null; return $true } catch { return $false }
}
$startedOllama = $null
if (-not (Test-Ollama)) {
    $ollama = (Get-Command ollama -ErrorAction SilentlyContinue).Source
    if (-not $ollama) { $ollama = Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe' }
    if (-not (Test-Path $ollama)) {
        throw 'Ollama nu este instalat. Ruleaza: winget install Ollama.Ollama'
    }
    Write-Host "Pornesc Ollama pe $ollamaUrl..." -ForegroundColor Cyan
    $env:OLLAMA_HOST = "127.0.0.1:$ollamaPort"
    $env:OLLAMA_FLASH_ATTENTION = '0'
    # Modelul ramane incarcat cat timp ruleaza serviciul (instanta se opreste la Ctrl+C), deci nu se reincarca dupa pauze.
    $env:OLLAMA_KEEP_ALIVE = '-1'
    $startedOllama = Start-Process -PassThru -WindowStyle Hidden $ollama 'serve'
    foreach ($i in 1..30) { if (Test-Ollama) { break }; Start-Sleep -Milliseconds 500 }
    if (-not (Test-Ollama)) { throw "Ollama nu a pornit pe $ollamaUrl." }
}

# Modelele trebuie descarcate o data (ollama pull); fara ele serviciul porneste, dar nu poate raspunde.
$installed = (Invoke-RestMethod -TimeoutSec 5 "$ollamaUrl/api/tags").models.name
foreach ($needed in @($Model, 'bge-m3')) {
    if (-not ($installed -contains $needed -or $installed -contains "${needed}:latest")) {
        Write-Host "Lipseste modelul $needed. Descarca-l o data cu:  ollama pull $needed" -ForegroundColor Yellow
    }
}

if (-not (Test-Path $venvPython)) {
    Write-Host 'Prima rulare: creez mediul Python si instalez dependintele...' -ForegroundColor Cyan
    & python -m venv (Join-Path $aiService '.venv')
    & $venvPython -m pip install --disable-pip-version-check -q -r (Join-Path $aiService 'requirements.txt')
}

Write-Host "Pornesc serviciul AI pe http://127.0.0.1:8081 cu modelul $Model (oprire: Ctrl+C)..." -ForegroundColor Cyan
Push-Location $aiService
try {
    & $venvPython -m uvicorn app.main:app --host 127.0.0.1 --port 8081
} finally {
    Pop-Location
    if ($startedOllama) { Stop-Process -Id $startedOllama.Id -Force -ErrorAction SilentlyContinue }
}
