# Deploy Checklist

Use este checklist para colocar o Arthilles em producao SaaS.

## 1. Supabase

- [ ] Projeto criado no Supabase.
- [ ] Script `supabase/schema.sql` executado no SQL Editor.
- [ ] `SUPABASE_URL` copiada.
- [ ] `SUPABASE_ANON_KEY` copiada.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` copiada.
- [ ] Usuario inicial confirmado em `app_users` (ou criado novo admin).

## 2. Backend (Railway)

- [ ] Servico criado com raiz em `backend`.
- [ ] Variaveis configuradas:
  - `NODE_ENV=production`
  - `PORT=3001`
  - `AUTH_SECRET`
  - `ALLOW_BOOTSTRAP_LOGIN`
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
  - `DEFAULT_COMPANY_ID`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_MODEL`
  - `BACKEND_PUBLIC_URL`
  - `DASHBOARD_PUBLIC_URL`
  - `CORS_ORIGIN` (ex.: `https://SEU-FRONTEND.vercel.app,https://*.vercel.app`)
  - `WEBHOOK_SHARED_SECRET` (opcional)
  - `GOOGLE_SHEETS_CSV_URL` (opcional, fallback do painel)
  - `EVOLUTION_API_URL`
  - `EVOLUTION_API_KEY`
- [ ] Deploy realizado com `npm start`.
- [ ] Healthcheck Railway apontando para `/health`.

## 3. Dashboard (Vercel)

- [ ] Projeto criado com raiz em `dashboard`.
- [ ] Variavel `NEXT_PUBLIC_API_URL` configurada com a URL publica do backend.
- [ ] Variavel `SUPABASE_URL` configurada.
- [ ] Variavel `SUPABASE_ANON_KEY` configurada.
- [ ] Deploy concluido sem erro.

## 4. Evolution API

- [ ] Evolution API publicada com URL HTTPS.
- [ ] API key criada.
- [ ] No painel Arthilles, configurados:
  - URL Evolution
  - Nome da instancia
  - API key
- [ ] Botao `Criar instancia` executado.
- [ ] Botao `Gerar QR Code` executado.
- [ ] QR lido no WhatsApp.
- [ ] Botao `Configurar webhook` executado.

## 5. Google Sheets FAQ

- [ ] Planilha publica criada com colunas `pergunta,resposta,palavras`.
- [ ] Link CSV configurado em `Configuracoes`.
- [ ] Botao `Testar planilha` retorna contagem maior que zero.

## 6. Smoke Tests

- [ ] `GET {BACKEND_PUBLIC_URL}/` retorna `200`.
- [ ] `GET {BACKEND_PUBLIC_URL}/health` retorna `ok: true`.
- [ ] `GET {BACKEND_PUBLIC_URL}/status` retorna diagnostico JSON.
- [ ] Login no dashboard funciona com usuario valido.
- [ ] Dashboard abre e carrega cards principais.
- [ ] Envio de mensagem `oi` no WhatsApp gera mensagem em `Conversas`.
- [ ] Fluxo `agendar` cria registro em `Agendamentos`.

## 7. URLs finais

- Dashboard: `https://SEU-PROJETO.vercel.app`
- Backend: `https://SEU-SERVICO.up.railway.app`
- Backend health: `https://SEU-SERVICO.up.railway.app/health`
- Backend status: `https://SEU-SERVICO.up.railway.app/status`
