# Script completo para configurar secrets en GitHub usando la API
# Requiere un Personal Access Token de GitHub

param(
    [Parameter(Mandatory=$false)]
    [string]$GitHubToken
)

$RepoOwner = "fafadaloia"
$RepoName = "portfolio"

# Leer valores del .env
$EnvVars = @{}
$EnvPath = Join-Path $PSScriptRoot "..\.env"

if (Test-Path $EnvPath) {
    Write-Host "📖 Leyendo valores del archivo .env..." -ForegroundColor Cyan
    Get-Content $EnvPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=", 2
            if ($parts.Length -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim().Trim('"').Trim("'")
                $EnvVars[$key] = $value
            }
        }
    }
} else {
    Write-Host "❌ No se encontró el archivo .env" -ForegroundColor Red
    exit 1
}

# Valores extraídos del .env
$Secrets = @{
    "VITE_FIREBASE_API_KEY" = $EnvVars["VITE_FIREBASE_API_KEY"]
    "VITE_FIREBASE_AUTH_DOMAIN" = $EnvVars["VITE_FIREBASE_AUTH_DOMAIN"]
    "VITE_FIREBASE_PROJECT_ID" = $EnvVars["VITE_FIREBASE_PROJECT_ID"]
    "VITE_FIREBASE_STORAGE_BUCKET" = $EnvVars["VITE_FIREBASE_STORAGE_BUCKET"]
    "VITE_FIREBASE_MESSAGING_SENDER_ID" = if ($EnvVars["VITE_FIREBASE_MESSAGING_SENDER_ID"]) { 
        $EnvVars["VITE_FIREBASE_MESSAGING_SENDER_ID"] 
    } else { 
        # Extraer del APP_ID si no está definido (formato: 1:145048693635:web:...)
        if ($EnvVars["VITE_FIREBASE_APP_ID"] -match '1:(\d+):') {
            $matches[1]
        } else {
            ""
        }
    }
    "VITE_FIREBASE_APP_ID" = $EnvVars["VITE_FIREBASE_APP_ID"]
    "VITE_GOOGLE_TRANSLATE_API_KEY" = $EnvVars["VITE_GOOGLE_TRANSLATE_API_KEY"]
}

# Verificar si tenemos token
if (-not $GitHubToken) {
    $GitHubToken = $env:GITHUB_TOKEN
}

if (-not $GitHubToken) {
    Write-Host "`n❌ Se requiere un token de GitHub" -ForegroundColor Red
    Write-Host "`nPara crear un token:" -ForegroundColor Yellow
    Write-Host "1. Ve a: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "2. Click en 'Generate new token (classic)'" -ForegroundColor White
    Write-Host "3. Selecciona los scopes: repo, admin:repo_hook" -ForegroundColor White
    Write-Host "4. Copia el token generado" -ForegroundColor White
    Write-Host "`nLuego ejecuta:" -ForegroundColor Yellow
    Write-Host "  .\scripts\setup-secrets-complete.ps1 -GitHubToken <tu_token>" -ForegroundColor Cyan
    Write-Host "  o" -ForegroundColor White
    Write-Host "  `$env:GITHUB_TOKEN='<tu_token>'; .\scripts\setup-secrets-complete.ps1" -ForegroundColor Cyan
    exit 1
}

Write-Host "`n🔐 Configurando secrets en GitHub..." -ForegroundColor Green
Write-Host "=====================================`n" -ForegroundColor Green

# Función para obtener la clave pública
function Get-PublicKey {
    $url = "https://api.github.com/repos/$RepoOwner/$RepoName/actions/secrets/public-key"
    $headers = @{
        "Authorization" = "Bearer $GitHubToken"
        "Accept" = "application/vnd.github.v3+json"
        "User-Agent" = "PowerShell"
    }
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
        return $response
    } catch {
        Write-Host "❌ Error obteniendo clave pública: $_" -ForegroundColor Red
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "   El token no es válido o no tiene permisos suficientes" -ForegroundColor Yellow
        }
        return $null
    }
}

# Función para encriptar usando libsodium (requiere librería externa)
# Por ahora, usaremos un método alternativo con la API directamente
function Set-GitHubSecret {
    param(
        [string]$SecretName,
        [string]$SecretValue,
        [string]$PublicKey,
        [string]$KeyId
    )
    
    # Nota: La encriptación real requiere libsodium
    # Por ahora, mostraremos las instrucciones con los valores
    Write-Host "📌 $SecretName" -ForegroundColor Cyan
    Write-Host "   Valor: $($SecretValue.Substring(0, [Math]::Min(30, $SecretValue.Length)))..." -ForegroundColor Gray
    
    # Intentar usar la API directamente (puede fallar sin encriptación correcta)
    $url = "https://api.github.com/repos/$RepoOwner/$RepoName/actions/secrets/$SecretName"
    $headers = @{
        "Authorization" = "Bearer $GitHubToken"
        "Accept" = "application/vnd.github.v3+json"
        "User-Agent" = "PowerShell"
    }
    
    # Para encriptar correctamente, necesitarías usar libsodium
    # Por ahora, mostraremos instrucciones manuales con los valores
    Write-Host "   ⚠️  Configura manualmente en:" -ForegroundColor Yellow
    Write-Host "   https://github.com/$RepoOwner/$RepoName/settings/secrets/actions" -ForegroundColor White
    Write-Host ""
}

# Obtener clave pública
Write-Host "🔑 Obteniendo clave pública del repositorio..." -ForegroundColor Cyan
$publicKey = Get-PublicKey

if ($publicKey) {
    Write-Host "✅ Clave pública obtenida" -ForegroundColor Green
    Write-Host "`n⚠️  Para configurar los secrets automáticamente, se requiere la librería libsodium." -ForegroundColor Yellow
    Write-Host "   Por ahora, usa estos valores para configurarlos manualmente:`n" -ForegroundColor Yellow
} else {
    Write-Host "`n⚠️  No se pudo obtener la clave pública. Usa estos valores para configurar manualmente:`n" -ForegroundColor Yellow
}

# Mostrar todos los secrets con sus valores
foreach ($secretName in $Secrets.Keys) {
    $value = $Secrets[$secretName]
    if ($value) {
        Write-Host "📌 $secretName" -ForegroundColor Cyan
        Write-Host "   Valor: $value" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "⚠️  $secretName - VALOR NO ENCONTRADO" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "`n🔗 Configura estos secrets en:" -ForegroundColor Green
Write-Host "   https://github.com/$RepoOwner/$RepoName/settings/secrets/actions" -ForegroundColor Cyan
Write-Host "`n✅ Una vez configurados, el workflow funcionará correctamente.`n" -ForegroundColor Green
