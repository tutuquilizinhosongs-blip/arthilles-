# Desenvolvimento

## Fluxo local

```powershell
copy .env.example .env
docker compose up -d --build
docker compose ps
```

## Backend

O backend centraliza webhook, CRM, agenda, disponibilidade e integracao com Ollama.

Principais arquivos:

- `backend/src/server.js`
- `backend/src/routes.js`
- `backend/src/conversation.js`
- `backend/src/availability.js`

## Dashboard

O dashboard Next.js consome o backend por `BACKEND_INTERNAL_URL` dentro do Docker e por `NEXT_PUBLIC_BACKEND_URL` no navegador.

## Banco

Schema principal:

- `clients`
- `appointments`
- `availability_blocks`
- `messages`
- `conversation_sessions`
- `settings`

As migrations iniciais ficam em `database/init`.

## Commits sugeridos

- `feat: add backend conversation flow`
- `feat: add dashboard overview`
- `chore: configure docker compose`
- `docs: update windows installation guide`

## Dashboard

O painel possui login local usando `ADMIN_EMAIL` e `ADMIN_PASSWORD`. O token gerado pelo backend e salvo no `localStorage` do navegador.

Telas disponiveis:

- Visao geral
- WhatsApp / QR Code
- Clientes
- Agendamentos
- Conversas
- Duvidas frequentes
- Configuracoes
- Status

## n8n

n8n esta em profile opcional no Docker Compose. O fluxo principal nao depende dele.

```powershell
docker compose --profile optional up -d n8n
```
