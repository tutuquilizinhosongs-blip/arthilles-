# Deploy

## 1. Supabase

1. Crie um projeto Supabase.
2. Abra `SQL Editor`.
3. Execute `supabase/schema.sql`.
4. Copie `Project URL` e `service_role key`.

## 2. Railway Backend

Configure a pasta raiz do servico como `backend`.

Variaveis:

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
BACKEND_PUBLIC_URL=https://seu-backend.railway.app
DASHBOARD_PUBLIC_URL=https://seu-dashboard.vercel.app
CORS_ORIGIN=https://seu-dashboard.vercel.app
```

## 3. Vercel Dashboard

Configure a pasta raiz do projeto como `dashboard`.

Variavel:

```env
NEXT_PUBLIC_BACKEND_URL=https://seu-backend.railway.app
```

## 4. Evolution API

No painel Arthilles:

1. Abra `Configuracoes`.
2. Configure URL, instancia e API key.
3. Abra `WhatsApp`.
4. Crie instancia, gere QR Code e configure webhook.

## 5. Validacao

```text
GET https://seu-backend.railway.app/health
GET https://seu-backend.railway.app/status
```

Depois envie `oi` para o WhatsApp conectado.

Depois de criar usuarios reais, ajuste `ALLOW_BOOTSTRAP_LOGIN=false`.

## Deploy Automatico

Railway e Vercel podem ficar conectados ao GitHub. Com isso, cada push em `main` publica uma nova versao do backend e do dashboard.

O CI do repositorio roda instalacao de dependencias, checagem do backend e build do dashboard.
