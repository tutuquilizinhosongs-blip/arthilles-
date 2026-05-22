$ErrorActionPreference = "Stop"

if (!(Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Arquivo .env criado a partir do .env.example. Revise as senhas quando desejar."
}

docker compose up -d --build

Write-Host ""
Write-Host "ArthillesBot iniciado."
Write-Host "Dashboard:     http://localhost:3000"
Write-Host "Backend:       http://localhost:3001"
Write-Host "Evolution API: http://localhost:8080"
Write-Host "n8n:           http://localhost:5678"
Write-Host "Ollama:        http://localhost:11434"
