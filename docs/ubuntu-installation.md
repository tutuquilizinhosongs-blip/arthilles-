# Instalacao Ubuntu

## Requisitos

- Ubuntu 22.04 ou superior
- Docker Engine e Docker Compose plugin
- Git

## Instalar Docker

Siga a documentacao oficial do Docker para Ubuntu e confirme:

```bash
docker --version
docker compose version
```

## Instalar ArthillesBot

```bash
git clone https://github.com/tutuquilizinhosongs-blip/arthilles-.git
cd arthilles-
cp .env.example .env
chmod +x scripts/*.sh
./scripts/start-ubuntu.sh
```

## Acessos

- Dashboard: http://localhost:3000
- Backend: http://localhost:3001
- Evolution API: http://localhost:8080
- n8n: http://localhost:5678
- Ollama: http://localhost:11434

## Modelo local Ollama

```bash
docker exec -it arthilles_ollama ollama pull llama3
```

## Logs e parada

```bash
./scripts/logs-ubuntu.sh
./scripts/logs-ubuntu.sh backend
./scripts/stop-ubuntu.sh
```
