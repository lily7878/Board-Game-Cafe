# Creeaza PRIMUL cont de manager (o singura data; dupa ce exista un cont, backend-ul refuza).
# Backend-ul trebuie sa ruleze deja (start-backend.ps1 intr-un alt terminal).
#
# Utilizare (din radacina proiectului):
#   powershell -ExecutionPolicy Bypass -File .\scripts\create-manager.ps1

$ErrorActionPreference = 'Stop'
$keysFile = Join-Path $env:USERPROFILE '.bgc-local\keys.json'

if (-not (Test-Path $keysFile)) {
    throw 'Nu gasesc cheile. Ruleaza mai intai scripts\start-backend.ps1.'
}
$keys = Get-Content $keysFile -Raw | ConvertFrom-Json
$bootstrapToken = [System.Net.NetworkCredential]::new('', (ConvertTo-SecureString $keys.BGC_BOOTSTRAP_TOKEN)).Password

$fullName = Read-Host 'Nume complet'
$email = Read-Host 'Email (cu el te loghezi)'
do {
    $secure = Read-Host 'Parola (minim 12 caractere)' -AsSecureString
    $password = [System.Net.NetworkCredential]::new('', $secure).Password
    if ($password.Length -lt 12) { Write-Host 'Parola trebuie sa aiba minim 12 caractere.' -ForegroundColor Red }
} while ($password.Length -lt 12)

$body = @{ fullName = $fullName; email = $email; password = $password } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Method Post -Uri 'http://localhost:8082/api/setup/manager' `
        -Headers @{ 'X-Bootstrap-Token' = $bootstrapToken } -ContentType 'application/json; charset=utf-8' `
        -Body ([Text.Encoding]::UTF8.GetBytes($body))
    Write-Host "Cont creat: $($result.fullName) <$($result.email)>, rol $($result.role)." -ForegroundColor Green
    Write-Host 'Te poti loga acum in management-ui (http://localhost:5174).' -ForegroundColor Green
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if (-not $status) {
        Write-Host 'Backend-ul nu raspunde. Porneste-l mai intai cu scripts\start-backend.ps1.' -ForegroundColor Red
    } elseif ($status -eq 409) {
        Write-Host 'Primul manager exista deja in baza de date. Logheaza-te cu contul acela.' -ForegroundColor Yellow
    } elseif ($status -eq 401) {
        Write-Host 'Token de bootstrap gresit: backend-ul a fost pornit cu alte chei decat cele din .bgc-local. Reporneste-l cu scripts\start-backend.ps1.' -ForegroundColor Red
    } else {
        Write-Host "Eroare $status : $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
