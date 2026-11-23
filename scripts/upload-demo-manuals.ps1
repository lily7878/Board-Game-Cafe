# Incarca manualele PDF demo (docs\demo-manuals) pentru jocurile care nu au inca un manual activ.
# Trece prin API-ul backend-ului, ca serviciul AI sa le indexeze pentru asistentul de reguli.
# Cere backend-ul si serviciul AI pornite (start-all.ps1). Se poate rula de oricate ori: sare peste
# jocurile care au deja manual sau al caror manual e in procesare.
#
# Utilizare (din radacina proiectului):
#   powershell -ExecutionPolicy Bypass -File .\scripts\upload-demo-manuals.ps1
# Implicit se logheaza cu managerul demo din seed-dev-data.sql; altfel: -Email ... -Password ...

param(
    [string]$Email = 'manager@bgc.test',
    [string]$Password = 'Demo-Cafe-2026',
    [string]$BaseUrl = 'http://localhost:8082',
    [int]$WaitSeconds = 300
)

$ErrorActionPreference = 'Stop'
$manualsDir = Join-Path $PSScriptRoot '..\docs\demo-manuals' | Resolve-Path
$manifest = Get-Content (Join-Path $manualsDir 'manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json

try {
    $login = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/admin/auth/login" -ContentType 'application/json' `
        -Body (@{ email = $Email; password = $Password } | ConvertTo-Json)
} catch {
    throw "Nu ma pot loga ca $Email la $BaseUrl (backend oprit sau parola gresita): $($_.Exception.Message)"
}
$headers = @{ Authorization = "Bearer $($login.accessToken)" }
$games = Invoke-RestMethod -Uri "$BaseUrl/api/admin/games" -Headers $headers

$submitted = @()
foreach ($entry in $manifest) {
    $game = $games | Where-Object { $_.title -eq $entry.title } | Select-Object -First 1
    if (-not $game) { Write-Host "  - $($entry.title): jocul nu exista in baza, sar peste." -ForegroundColor Yellow; continue }
    $rules = Invoke-RestMethod -Uri "$BaseUrl/api/admin/games/$($game.id)/rules" -Headers $headers
    if ($rules.available -or ($rules.latest -and $rules.latest.status -eq 'PROCESSING')) {
        Write-Host "  = $($entry.title): are deja manual." -ForegroundColor DarkGray
        continue
    }
    $file = Join-Path $manualsDir $entry.file
    $status = & curl.exe -s -o NUL -w '%{http_code}' -X POST "$BaseUrl/api/admin/games/$($game.id)/rules" `
        -H "Authorization: Bearer $($login.accessToken)" -F "file=@$file;type=application/pdf"
    if ($status -in '200', '201') {
        Write-Host "  + $($entry.title): trimis ($($entry.file))." -ForegroundColor Green
        $submitted += $game
    } else {
        Write-Host "  ! $($entry.title): HTTP $status." -ForegroundColor Red
    }
}

if (-not $submitted) { Write-Host 'Nimic nou de incarcat.' -ForegroundColor Green; return }

Write-Host "Astept indexarea in serviciul AI (maxim $WaitSeconds s)..." -ForegroundColor Cyan
$deadline = (Get-Date).AddSeconds($WaitSeconds)
do {
    Start-Sleep -Seconds 5
    $states = foreach ($game in $submitted) {
        (Invoke-RestMethod -Uri "$BaseUrl/api/admin/games/$($game.id)/rules" -Headers $headers).latest.status
    }
    $pending = @($states | Where-Object { $_ -eq 'PROCESSING' }).Count
} while ($pending -gt 0 -and (Get-Date) -lt $deadline)

foreach ($game in $submitted) {
    $latest = (Invoke-RestMethod -Uri "$BaseUrl/api/admin/games/$($game.id)/rules" -Headers $headers).latest
    $color = @{ READY = 'Green'; FAILED = 'Red' }[$latest.status]; if (-not $color) { $color = 'Yellow' }
    $detail = if ($latest.failureReason) { " - $($latest.failureReason)" } else { '' }
    Write-Host "  $($game.title): $($latest.status)$detail" -ForegroundColor $color
}
