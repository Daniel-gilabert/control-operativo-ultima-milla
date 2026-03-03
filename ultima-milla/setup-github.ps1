# =============================================
# Script de configuración de GitHub
# Ejecutar desde la carpeta ultima-milla/
# =============================================
# USO: powershell -ExecutionPolicy Bypass -File setup-github.ps1

Write-Host "=== Configuracion de GitHub para ultima-milla ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que git está instalado
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Git no esta instalado." -ForegroundColor Red
    Write-Host "Descargalo en: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Pedir datos al usuario
$repoUrl = Read-Host "Pega aqui la URL de tu repositorio GitHub (ej: https://github.com/TuUsuario/ultima-milla.git)"

if (-not $repoUrl) {
    Write-Host "ERROR: Debes introducir la URL del repositorio." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Inicializando repositorio git..." -ForegroundColor Green
git init
git add .
git commit -m "feat: estructura inicial del proyecto ultima-milla"
git branch -M main
git remote add origin $repoUrl
git push -u origin main

Write-Host ""
Write-Host "Listo! El codigo se ha subido a GitHub." -ForegroundColor Green
Write-Host "URL: $repoUrl" -ForegroundColor Cyan
