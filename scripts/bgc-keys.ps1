# Cheile aplicatiei, comune pentru start-backend.ps1 si start-ai.ps1 (se incarca prin dot-sourcing).
# Cheile sunt generate o singura data si salvate CRIPTAT (DPAPI, doar contul tau Windows le poate citi)
# in %USERPROFILE%\.bgc-local\keys.json, in afara repository-ului. O cheie noua (ex. BGC_AI_INTERNAL_TOKEN)
# se adauga automat la fisierul existent, fara sa le schimbe pe celelalte.

$BgcSecretsDir = Join-Path $env:USERPROFILE '.bgc-local'
$BgcKeysFile = Join-Path $BgcSecretsDir 'keys.json'
$BgcKeyNames = 'BGC_SESSION_CREDENTIAL_KEY', 'BGC_STAFF_JWT_KEY', 'BGC_BOOTSTRAP_TOKEN', 'BGC_AI_INTERNAL_TOKEN'

function Protect([string]$plain) {
    ConvertTo-SecureString $plain -AsPlainText -Force | ConvertFrom-SecureString
}
function Unprotect([string]$encrypted) {
    $secure = ConvertTo-SecureString $encrypted
    [System.Net.NetworkCredential]::new('', $secure).Password
}
function New-Base64Key {
    $bytes = New-Object byte[] 32
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    [Convert]::ToBase64String($bytes)
}

# Seteaza variabilele de mediu cerute ($Names), generand si salvand cheile care lipsesc.
function Import-BgcKeys([string[]]$Names = $BgcKeyNames) {
    New-Item -ItemType Directory -Force $BgcSecretsDir | Out-Null
    $keys = [ordered]@{}
    if (Test-Path $BgcKeysFile) {
        (Get-Content $BgcKeysFile -Raw | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $keys[$_.Name] = $_.Value }
    }
    $changed = $false
    foreach ($name in $BgcKeyNames) {
        if (-not $keys.Contains($name)) {
            Write-Host "Generez cheia $name..." -ForegroundColor Cyan
            $keys[$name] = Protect (New-Base64Key)
            $changed = $true
        }
    }
    if ($changed) {
        $keys | ConvertTo-Json | Set-Content -Encoding UTF8 $BgcKeysFile
        Write-Host "Cheile au fost salvate criptat in $BgcKeysFile" -ForegroundColor Green
    }
    foreach ($name in $Names) {
        Set-Item "env:$name" (Unprotect $keys[$name])
    }
}
