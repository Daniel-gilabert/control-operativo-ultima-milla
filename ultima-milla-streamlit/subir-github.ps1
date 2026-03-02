Write-Host "=== Configuracion de GitHub ===" -ForegroundColor Cyan

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git no esta instalado. Descargalo en: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

$repoUrl = Read-Host "Pega la URL de tu repositorio GitHub (ej: https://github.com/TuUsuario/ultima-milla.git)"
if (-not $repoUrl) { Write-Host "URL vacia. Saliendo." -ForegroundColor Red; exit 1 }

git init
git add .
git commit -m "feat: app control operativo ultima milla con Streamlit y Supabase"
git branch -M main
git remote add origin $repoUrl
git push -u origin main

Write-Host "Codigo subido a GitHub correctamente." -ForegroundColor Green
