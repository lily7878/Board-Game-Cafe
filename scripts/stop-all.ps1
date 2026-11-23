# Opreste toate serviciile pornite cu start-all.ps1 (sau cu scripturile individuale):
#   - ferestrele "BGC ..." deschise de start-all.ps1, impreuna cu procesele pornite din ele
#   - orice proces ramas care asculta pe porturile proiectului:
#       8082 backend, 8081 serviciul AI, 5174 management-ui, 5173 customer-ui, 11435 Ollama-ul proiectului
# Ollama din tray (portul 11434) nu este atins.
#
# Utilizare (din radacina proiectului):
#   powershell -ExecutionPolicy Bypass -File .\scripts\stop-all.ps1

$services = @(
    @{ Port = 8082; Name = 'Backend' }
    @{ Port = 8081; Name = 'Serviciu AI' }
    @{ Port = 5174; Name = 'Management UI' }
    @{ Port = 5173; Name = 'Customer UI' }
    @{ Port = 11435; Name = 'Ollama (proiect)' }
)

function Stop-Tree([int]$processId, [string]$label) {
    if ($processId -eq $PID) { return }
    & taskkill.exe /T /F /PID $processId 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Host "  oprit: $label (PID $processId)" -ForegroundColor Green }
}

$stopped = 0

# 1. Ferestrele deschise de start-all.ps1 (inchide fereastra si tot ce a pornit din ea).
#    Se recunosc dupa linia de comanda (titlul nu e vizibil cand ruleaza in Windows Terminal).
Get-CimInstance Win32_Process -Filter "Name='powershell.exe' OR Name='pwsh.exe'" |
    Where-Object { $_.CommandLine -match "WindowTitle = '(BGC [^']+)'" } |
    ForEach-Object { Stop-Tree $_.ProcessId "fereastra '$($Matches[1])'"; $stopped++ }

# 2. Procesele ramase pe porturile proiectului (ex. Ollama ramas orfan dupa inchiderea ferestrei AI).
Start-Sleep -Milliseconds 500
foreach ($svc in $services) {
    $owners = Get-NetTCPConnection -State Listen -LocalPort $svc.Port -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($owner in $owners) {
        $name = (Get-Process -Id $owner -ErrorAction SilentlyContinue).ProcessName
        Stop-Tree $owner "$($svc.Name) :$($svc.Port) ($name)"
        $stopped++
    }
}

# 3. Verificare.
Start-Sleep -Milliseconds 500
$still = @($services | Where-Object { Get-NetTCPConnection -State Listen -LocalPort $_.Port -ErrorAction SilentlyContinue } | ForEach-Object { $_.Port })
if ($still.Count) {
    Write-Host "Inca ocupate: $($still -join ', ')" -ForegroundColor Red
    exit 1
} elseif ($stopped -eq 0) {
    Write-Host 'Nu rula niciun serviciu.' -ForegroundColor Yellow
} else {
    Write-Host 'Toate serviciile sunt oprite.' -ForegroundColor Green
}
