Write-Host "=== Instalando dependencias ===" -ForegroundColor Cyan
pip install -r requirements.txt
Write-Host ""
Write-Host "=== Arrancando la aplicacion ===" -ForegroundColor Green
Write-Host "Abre el navegador en: http://localhost:8501" -ForegroundColor Yellow
Write-Host ""
streamlit run Inicio.py
