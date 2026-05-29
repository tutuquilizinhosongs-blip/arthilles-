# Deploy Checklist - ArthillesBot

## 1. Supabase

- [ ] Projeto criado
- [ ] `supabase/schema.sql` executado no SQL Editor
- [ ] `SUPABASE_URL` copiado
- [ ] `SUPABASE_ANON_KEY` copiado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` copiado

## 2. Backend Railway

- [ ] Root directory = `backend`
- [ ] Build strategy = `Dockerfile`
- [ ] Start command = `npm start`
- [ ] Healthcheck = `/health`
- [ ] Variaveis configuradas:
  - [ ] `NODE_ENV=production`
  - [ ] `AUTH_SECRET`
  - [ ] `ALLOW_BOOTSTRAP_LOGIN`
  - [ ] `ADMIN_EMAIL`
  - [ ] `ADMIN_PASSWORD`
  - [ ] `DEFAULT_COMPANY_ID`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `EVOLUTION_API_URL`
  - [ ] `EVOLUTION_API_KEY`
  - [ ] `BACKEND_PUBLIC_URL`
  - [ ] `DASHBOARD_PUBLIC_URL`
  - [ ] `CORS_ORIGIN`
- [ ] Deploy concluido
- [ ] `GET {BACKEND_PUBLIC_URL}/health` retornando 200

## 3. Frontend Vercel

- [ ] Root directory = `dashboard`
- [ ] `NEXT_PUBLIC_API_URL` configurado
- [ ] Deploy concluido

## 4. WhatsApp

- [ ] Login no dashboard realizado
- [ ] Aba WhatsApp exibindo status
- [ ] Botao `Conectar WhatsApp` executado
- [ ] QR Code exibido
- [ ] QR lido no WhatsApp
- [ ] Status `Conectado`
- [ ] Botao `Desconectar WhatsApp` validado

## 5. FAQ e Agendamento

- [ ] Google Sheets CSV configurado
- [ ] `oi` recebido e respondido
- [ ] `agendar` percorre fluxo e grava no banco

## 6. Pos go-live

- [ ] Trocar senha admin
- [ ] Definir `ALLOW_BOOTSTRAP_LOGIN=false`
- [ ] Rotacionar chaves expostas acidentalmente
