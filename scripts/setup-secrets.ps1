# Script para configurar secrets de GitHub usando la API
# Requiere un Personal Access Token de GitHub con permisos 'repo' y 'admin:repo_hook'

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken
)

$RepoOwner = "fafadaloia"
$RepoName = "portfolio"

# Secrets a configurar
$Secrets = @(
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
    "VITE_GOOGLE_TRANSLATE_API_KEY"
)

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
                $value = $parts[1].Trim()
                $EnvVars[$key] = $value
            }
        }
    }
} else {
    Write-Host "⚠️  No se encontró el archivo .env" -ForegroundColor Yellow
}

# Función para obtener la clave pública del repositorio
function Get-PublicKey {
    $url = "https://api.github.com/repos/$RepoOwner/$RepoName/actions/secrets/public-key"
    $headers = @{
        "Authorization" = "token $GitHubToken"
        "Accept" = "application/vnd.github.v3+json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
        return $response
    } catch {
        Write-Host "❌ Error obteniendo clave pública: $_" -ForegroundColor Red
        return $null
    }
}

# Función para encriptar el secret (requiere librería externa)
# Por ahora, usaremos la API directamente con el valor encriptado
function Set-Secret {
    param(
        [string]$SecretName,
        [string]$SecretValue
    )
    
    Write-Host "`n🔐 Configurando secret: $SecretName" -ForegroundColor Cyan
    
    # Obtener clave pública
    $publicKey = Get-PublicKey
    if (-not $publicKey) {
        Write-Host "❌ No se pudo obtener la clave pública" -ForegroundColor Red
        return $false
    }
    
    # Nota: Para encriptar correctamente, necesitarías usar una librería como libsodium
    # Por ahora, mostraremos las instrucciones manuales
    Write-Host "⚠️  La encriptación requiere librerías adicionales." -ForegroundColor Yellow
    Write-Host "   Por favor, configura este secret manualmente:" -ForegroundColor Yellow
    Write-Host "   1. Ve a: https://github.com/$RepoOwner/$RepoName/settings/secrets/actions" -ForegroundColor Yellow
    Write-Host "   2. Click en 'New repository secret'" -ForegroundColor Yellow
    Write-Host "   3. Name: $SecretName" -ForegroundColor Yellow
    Write-Host "   4. Value: [valor del .env]" -ForegroundColor Yellow
    Write-Host ""
    
    return $false
}

# Mostrar instrucciones
Write-Host "`n📋 Configuración de Secrets en GitHub" -ForegroundColor Green
Write-Host "=====================================`n" -ForegroundColor Green

Write-Host "Para configurar los secrets automáticamente, necesitas:" -ForegroundColor Cyan
Write-Host "1. Un Personal Access Token de GitHub con permisos 'repo' y 'admin:repo_hook'" -ForegroundColor White
Write-Host "2. Instalar la librería libsodium para encriptación`n" -ForegroundColor White

Write-Host "Método recomendado (más fácil):" -ForegroundColor Yellow
Write-Host "1. Ve a: https://github.com/$RepoOwner/$RepoName/settings/secrets/actions" -ForegroundColor White
Write-Host "2. Para cada secret, haz click en 'New repository secret'`n" -ForegroundColor White

foreach ($secretName in $Secrets) {
    $value = if ($EnvVars.ContainsKey($secretName)) { 
        $val = $EnvVars[$secretName]
        if ($val.Length -gt 30) { $val.Substring(0, 30) + "..." } else { $val }
    } else { 
        "[valor del .env]" 
    }
    
    Write-Host "   📌 $secretName" -ForegroundColor Cyan
    Write-Host "      Value: $value" -ForegroundColor Gray
}

Write-Host "`n✅ Una vez configurados todos los secrets, el workflow funcionará correctamente.`n" -ForegroundColor Green
