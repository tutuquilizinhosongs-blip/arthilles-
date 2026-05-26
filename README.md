# ArthillesBot

ArthillesBot e um SaaS web simples para atendimento automatico no WhatsApp com agenda, CRM, FAQ por Google Sheets e IA via OpenRouter.

O projeto deixou de depender de Docker, n8n, Ollama e instalacao local pesada. A arquitetura atual e pensada para deploy gratuito ou de baixo custo em Vercel + Railway + Supabase.

## Stack

- Dashboard: Next.js responsivo, pronto para PWA
- Backend: Node.js/Express
- Banco: Supabase Postgres
- WhatsApp: Evolution API
- IA: OpenRouter
- FAQ externa: Google Sheets publicado em CSV

## Arquitetura

```text
Cliente no WhatsApp
  -> Evolution API
  -> Webhook unico do backend Railway
  -> Supabase
  -> OpenRouter e/ou Google Sheets FAQ
  -> Resposta pelo WhatsApp

Administrador
  -> Dashboard Next.js na Vercel
  -> Backend Express na Railway
  -> Supabase
```

## Funcionalidades

- Login no painel
- Base multiempresa com `company_id`
- Conexao WhatsApp por QR Code
- Recebimento de mensagens por webhook
- Respostas automaticas por FAQ e IA
- Cadastro automatico de clientes
- Agendamento automatico com bloqueios
- Painel de clientes, conversas, agendamentos, duvidas e configuracoes
- Configuracao de marca, cores, horarios, Google Sheets, OpenRouter e Evolution API
- Dashboard responsivo para Android

## Estrutura

```text
backend/       API Express para Railway
dashboard/     Painel Next.js para Vercel
docs/          Guias de deploy e operacao
supabase/      Schema SQL inicial
.env.example   Variaveis de ambiente de referencia
```

## Configuracao Do Banco

1. Crie um projeto no Supabase.
2. Abra `SQL Editor`.
3. Execute o arquivo:

```text
supabase/schema.sql
```

O schema cria uma empresa demo e um usuario inicial:

```text
email: admin@arthilles.local
senha: admin123
```

Troque a senha antes de usar em producao. O hash depende de `AUTH_SECRET`; se mudar `AUTH_SECRET`, gere novo `password_hash`.

## Backend No Railway

1. Crie um novo projeto Railway apontando para a pasta `backend`.
2. Configure as variaveis:

```env
NODE_ENV=production
PORT=3001
AUTH_SECRET=troque_este_segredo
ALLOW_BOOTSTRAP_LOGIN=true
ADMIN_EMAIL=admin@arthilles.local
ADMIN_PASSWORD=admin123
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
DEFAULT_COMPANY_ID=00000000-0000-0000-0000-000000000001
OPENROUTER_API_KEY=sua_chave_openrouter
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
BACKEND_PUBLIC_URL=https://seu-backend.railway.app
DASHBOARD_PUBLIC_URL=https://seu-dashboard.vercel.app
CORS_ORIGIN=https://seu-dashboard.vercel.app
WEBHOOK_SHARED_SECRET=um_segredo_opcional
```

3. Deploy command: `npm start`.
4. Healthcheck: `/health`.

## Dashboard Na Vercel

1. Crie um projeto Vercel apontando para a pasta `dashboard`.
2. Configure:

```env
NEXT_PUBLIC_BACKEND_URL=https://seu-backend.railway.app
```

3. Deploy normalmente.

## Deploy Automatico

Conecte este repositorio ao Railway e a Vercel. Depois disso, cada push na branch `main` gera novo deploy dos servicos configurados.

O workflow `.github/workflows/ci.yml` valida backend e dashboard em pull requests e pushes.

Checklist operacional: `docs/deploy-checklist.md`.

## Evolution API

Hospede ou use uma Evolution API acessivel pela internet. No painel:

1. Abra `Configuracoes`.
2. Preencha URL da Evolution, instancia e API key.
3. Abra `WhatsApp`.
4. Clique em `Criar instancia`.
5. Clique em `Gerar QR Code`.
6. Escaneie com o WhatsApp.
7. Clique em `Configurar webhook`.

O webhook gerado segue este formato:

```text
https://seu-backend.railway.app/webhook/evolution?companyId=ID_DA_EMPRESA
```

## Google Sheets FAQ

Crie uma planilha publica com as colunas:

```csv
pergunta,resposta,palavras
Como funciona?,Atendemos pelo WhatsApp e agendamos pelo painel.,atendimento;agenda
```

Publique como CSV e cole o link em `Configuracoes`.

## Desenvolvimento Local

Backend:

```powershell
cd backend
copy .env.example .env
npm install
npm run dev
```

Dashboard:

```powershell
cd dashboard
copy .env.example .env.local
npm install
npm run dev
```

Acesse:

- Dashboard: http://localhost:3000
- Backend: http://localhost:3001
- Status: http://localhost:3000/status

## Teste Rapido Do Fluxo

1. Entre no painel.
2. Configure Supabase, Evolution API, OpenRouter e Google Sheets.
3. Conecte o WhatsApp por QR Code.
4. Envie `oi` para o numero conectado.
5. Envie `agendar`.
6. Responda os dados solicitados.
7. Escolha um horario da lista.
8. Confira o cliente, mensagens e agendamento no dashboard.

## Android

O painel e responsivo. No celular, abra a URL da Vercel:

```text
https://seu-dashboard.vercel.app
```

Quando o PWA estiver habilitado no navegador, use `Adicionar a tela inicial`.

## Observacoes De Seguranca

- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no dashboard.
- A service role key fica somente no backend.
- Troque `AUTH_SECRET`, usuario inicial e senhas antes de producao.
- Depois de criar usuarios reais, defina `ALLOW_BOOTSTRAP_LOGIN=false`.
- Use um segredo em `WEBHOOK_SHARED_SECRET` se sua Evolution API permitir configurar headers ou query string.

## Variaveis .env

- Backend local: `backend/.env.example`
- Dashboard local: `dashboard/.env.example`
- Referencia consolidada: `.env.example`
