#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f ".env" ]; then
  cp ".env.example" ".env"
  echo "Arquivo .env criado a partir do .env.example. Revise as senhas antes de uso real."
fi

docker compose up -d --build

echo ""
echo "ArthillesBot iniciado."
echo "Dashboard:     http://localhost:3000"
echo "Backend:       http://localhost:3001"
echo "Evolution API: http://localhost:8080"
echo "n8n opcional:  docker compose --profile optional up -d n8n"
echo "Ollama:        http://localhost:11434"
echo ""
echo "Acesso pelo Android na mesma rede:"
hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+\.' | while read -r ip; do
  echo "Dashboard:     http://${ip}:3000"
done
