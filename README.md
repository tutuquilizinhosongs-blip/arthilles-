# ArthillesBot

ArthillesBot e um SaaS web para atendimento no WhatsApp com CRM simples, agendamentos e FAQ por Google Sheets.

O foco e deploy online barato/gratuito com:
- Frontend no Vercel
- Backend no Railway
- Banco no Supabase
- Evolution API para WhatsApp
- OpenRouter opcional para IA

## Stack

- Dashboard: Next.js
- Backend: Node.js + Express
- Banco: Supabase Postgres
- WhatsApp: Evolution API
- FAQ: Google Sheets CSV
- IA opcional: OpenRouter

## Arquitetura

```text
Cliente no WhatsApp
  -> Evolution API
  -> Webhook unico no backend
  -> Supabase (clientes, mensagens, sessoes, agendamentos)
  -> FAQ Sheets e/ou OpenRouter
  -> Resposta no WhatsApp

Admin
  -> Dashboard Next.js
  -> Backend Express autenticado
```

## Funcionalidades

- Login no painel
- Multiempresa (`company_id`)
- Conexao WhatsApp simplificada:
  - status da conexao
  - botao Conectar WhatsApp
  - QR Code quando necessario
  - botao Desconectar WhatsApp
- Cadastro automatico de clientes
- Conversas e mensagens
- Agendamento com bloqueios e antecedencia minima
- FAQ local + Google Sheets
- IA opcional via OpenRouter

## Estrutura

```text
backend/
dashboard/
docs/
supabase/
.env.example
```

## Supabase

1. Crie um projeto no Supabase.
2. Abra SQL Editor.
3. Execute `supabase/schema.sql`.

## Deploy Backend (Railway)

Root directory: `backend`

- Build strategy: `Dockerfile`
- Start command: `npm start`
- Healthcheck: `/health`

Variaveis principais:

```env
NODE_ENV=production
LOG_LEVEL=info

AUTH_SECRET=troque_por_um_segredo_forte
ALLOW_BOOTSTRAP_LOGIN=true
ADMIN_EMAIL=admin@arthilles.local
ADMIN_PASSWORD=troque_essa_senha
DEFAULT_COMPANY_ID=00000000-0000-0000-0000-000000000001

SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

BACKEND_PUBLIC_URL=https://SEU-BACKEND.up.railway.app
DASHBOARD_PUBLIC_URL=https://SEU-FRONTEND.vercel.app
CORS_ORIGIN=https://SEU-FRONTEND.vercel.app,https://*.vercel.app

EVOLUTION_API_URL=https://SUA-EVOLUTION
EVOLUTION_API_KEY=SUA_CHAVE

GOOGLE_SHEETS_CSV_URL=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
WEBHOOK_SHARED_SECRET=
```

## Deploy Frontend (Vercel)

Root directory: `dashboard`

```env
NEXT_PUBLIC_API_URL=https://SEU-BACKEND.up.railway.app
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
```

## Conexao WhatsApp (cliente final)

Com `EVOLUTION_API_URL` e `EVOLUTION_API_KEY` no backend, o cliente final nao precisa ver configuracoes tecnicas.

Na aba WhatsApp:
1. Clicar `Conectar WhatsApp`
2. Escanear QR Code
3. Aguardar status `Conectado`
4. Para trocar aparelho/numero, usar `Desconectar WhatsApp`

Webhook configurado automaticamente:

```text
https://SEU-BACKEND.up.railway.app/webhook/evolution
```

Cada empresa usa uma instancia propria baseada no `company_id`.

## Google Sheets FAQ

Cabecalho minimo da planilha:

```csv
pergunta,resposta,palavras
Como funciona?,Atendemos pelo WhatsApp e agendamos pelo painel.,atendimento;agenda
```

Publique em CSV e cole no painel em Configuracoes.

## Teste rapido

1. `GET /health` no backend publico
2. Login no dashboard
3. Aba WhatsApp -> Conectar -> QR -> status Conectado
4. Enviar `oi` para o WhatsApp conectado
5. Enviar `agendar` e concluir fluxo
6. Validar clientes, conversas e agendamentos no painel

## Seguranca

- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend
- Troque `AUTH_SECRET` e senha admin em producao
- Desative `ALLOW_BOOTSTRAP_LOGIN` apos criar usuarios reais
- Se possivel, use `WEBHOOK_SHARED_SECRET`

## Documentacao adicional

- `docs/deploy.md`
- `docs/deploy-passo-a-passo.md`
- `docs/deploy-checklist.md`
- `docs/development.md`
