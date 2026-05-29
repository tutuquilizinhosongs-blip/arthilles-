# Deploy Passo a Passo (Railway + Vercel + Supabase)

## 1. Preparar Supabase

1. Abra o projeto no Supabase.
2. SQL Editor -> execute `supabase/schema.sql`.
3. Copie:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 2. Deploy do backend no Railway

1. New Project -> Deploy from GitHub Repo.
2. Selecione este repositorio.
3. Service settings:
   - Root directory: `backend`
   - Build strategy: `Dockerfile`
   - Start command: `npm start`
   - Healthcheck: `/health`
4. Configure variaveis:

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

EVOLUTION_API_URL=https://SUA-EVOLUTION
EVOLUTION_API_KEY=SUA_CHAVE

BACKEND_PUBLIC_URL=https://SEU-BACKEND.up.railway.app
DASHBOARD_PUBLIC_URL=https://SEU-FRONTEND.vercel.app
CORS_ORIGIN=https://SEU-FRONTEND.vercel.app,https://*.vercel.app

GOOGLE_SHEETS_CSV_URL=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
WEBHOOK_SHARED_SECRET=
```

5. Gere dominio publico em Networking.
6. Teste:
   - `GET https://SEU-BACKEND.up.railway.app/health`

## 3. Deploy do frontend no Vercel

1. Add New -> Project.
2. Selecione o repositorio.
3. Root directory: `dashboard`.
4. Variaveis:

```env
NEXT_PUBLIC_API_URL=https://SEU-BACKEND.up.railway.app
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
```

5. Deploy.
6. Copie a URL publica do Vercel.

## 4. Ajuste cruzado de URLs

1. No Railway, ajuste:
   - `DASHBOARD_PUBLIC_URL=https://SEU-FRONTEND.vercel.app`
   - `CORS_ORIGIN=https://SEU-FRONTEND.vercel.app,https://*.vercel.app`
2. Redeploy backend.

## 5. Conectar WhatsApp (fluxo simplificado)

1. Entre no dashboard.
2. Abra aba `WhatsApp`.
3. Clique `Conectar WhatsApp`.
4. Escaneie o QR Code.
5. Aguarde status `Conectado`.
6. Para desconectar, clique `Desconectar WhatsApp`.

Observacao: o cliente final nao precisa preencher URL da Evolution, API key, instancia ou webhook.

## 6. Teste final

1. Backend:
   - `GET /health` -> 200
   - `GET /status` -> `supabase.ok=true`
2. Login no dashboard.
3. Envie `oi` no WhatsApp conectado.
4. Envie `agendar` e conclua o fluxo.
5. Confira no painel:
   - Clientes
   - Conversas
   - Agendamentos
