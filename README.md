# ArthillesBot

ArthillesBot e uma plataforma local de atendimento WhatsApp para pequenas empresas. O sistema roda no Windows com Docker Desktop e combina Evolution API, backend Node.js, PostgreSQL, Redis, dashboard Next.js, n8n auxiliar e IA local gratuita com Ollama.

O objetivo e oferecer uma base simples de instalar e pronta para evoluir como produto SaaS local: atendimento automatico, CRM, agendamento, dashboard administrativo e respostas assistidas por modelo open source.

## Arquitetura

```text
WhatsApp
  -> Evolution API
  -> Webhook unico do backend
  -> Backend Node.js/Express
  -> PostgreSQL
  -> Dashboard Next.js

Redis: cache e suporte de infraestrutura
n8n: orquestracao auxiliar, sem duplicar a regra principal
Ollama: IA local gratuita
```

## Stack

- Docker Compose
- Evolution API
- n8n
- PostgreSQL
- Redis
- Backend Node.js/Express
- Dashboard Next.js
- Ollama com modelo `llama3` por padrao

## Login do painel

Credenciais iniciais configuradas no `.env.example`:

- Email: `admin@arthilles.local`
- Senha: `admin123`

Troque `ADMIN_EMAIL` e `ADMIN_PASSWORD` antes de uso real.

## Instalacao no Windows

1. Instale o Docker Desktop.
2. Baixe ou clone este projeto.
3. Copie `.env.example` para `.env`.
4. Inicie os servicos:

```powershell
.\scripts\start-windows.ps1
```

Se o Windows bloquear scripts PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-windows.ps1
```

Comando manual equivalente:

```powershell
docker compose up -d --build
```

## Instalacao no Ubuntu

```bash
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

## IA local

Baixe o modelo padrao depois que o container subir:

```powershell
docker exec -it arthilles_ollama ollama pull llama3
```

O atendimento principal nao depende de API paga. Se o modelo ainda nao existir, o backend usa respostas deterministicas para cadastro e agenda.

## WhatsApp

1. Acesse a Evolution API em http://localhost:8080.
2. Use a chave `EVOLUTION_API_KEY` definida no `.env`.
3. Crie ou use a instancia definida em `EVOLUTION_INSTANCE_NAME`.
4. No dashboard, abra `WhatsApp` e clique em `Criar instancia`.
5. Clique em `Gerar QR Code` e leia o codigo com o WhatsApp.
6. O webhook da instancia deve apontar para:

```text
http://backend:3001/webhook/evolution
```

O backend tambem tenta configurar esse webhook ao iniciar.

## Teste rapido

Com o WhatsApp conectado, envie:

```text
oi
```

O bot inicia o cadastro, coleta dados do cliente, mostra horarios disponiveis e agenda quando o usuario escolhe um horario.

## Regras de agenda

- Atendimento de segunda a sexta.
- Horario padrao de 13:30 ate 16:30.
- Reunioes de 1 hora.
- Bloqueio automatico para horarios com menos de 6 horas de antecedencia.
- Horarios ocupados nao aparecem.
- Ferias, feriados e bloqueios manuais usam `availability_blocks`.

## Endpoints

- `GET /health`
- `POST /webhook/evolution`
- `GET /clients`
- `POST /clients`
- `GET /appointments`
- `POST /appointments`
- `GET /availability`
- `POST /availability/block`
- `GET /settings`
- `PUT /settings`
- `POST /auth/login`
- `GET /messages`
- `GET /conversations`
- `GET /faqs`
- `POST /faqs`
- `GET /evolution/qrcode`
- `GET /evolution/status`
- `POST /evolution/instance`
- `GET /status`

## Scripts Windows

```powershell
.\scripts\start-windows.ps1
.\scripts\stop-windows.ps1
.\scripts\logs-windows.ps1
.\scripts\backup-windows.ps1
```

Logs de um servico especifico:

```powershell
.\scripts\logs-windows.ps1 backend
```

Backup com fallback de politica de execucao:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-windows.ps1
```

Ubuntu:

```bash
./scripts/start-ubuntu.sh
./scripts/stop-ubuntu.sh
./scripts/logs-ubuntu.sh
./scripts/backup-ubuntu.sh
```

## Estrutura

```text
arthilles/
|-- backend/
|-- dashboard/
|-- database/
|-- docker/
|-- docs/
|-- n8n/
|-- ollama/
|-- scripts/
|-- workflows/
|-- .env.example
|-- docker-compose.yml
`-- README.md
```

## Bancos internos

Todos usam o mesmo container PostgreSQL, mas com bancos separados para evitar conflito de migrations:

- `arthillesbot`: dados do produto
- `arthilles_evolution`: Evolution API
- `arthilles_n8n`: n8n

## Seguranca

- Troque todas as senhas do `.env` antes de uso real.
- Nunca publique `.env`.
- O projeto nao exige OpenAI, APIs pagas, SQLite ou servicos externos obrigatorios.
- Em producao, revise exposicao de portas, senhas, backups e logs.
