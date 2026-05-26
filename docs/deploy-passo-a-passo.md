# Deploy Passo a Passo (Railway + Vercel + Supabase)

Este guia conecta todo o Arthilles online sem localhost final.

## 1. O que voce ja precisa ter

- Conta no GitHub com este repositorio.
- Projeto Supabase criado.
- Conta Railway aberta.
- Conta Vercel aberta.
- Conta OpenRouter com API key.
- Evolution API publicada com URL HTTPS e API key.
- Google Sheet publico em CSV (FAQ).

## 2. Pastas corretas de deploy

- Backend no Railway: `backend`
- Frontend no Vercel: `dashboard`

## 3. Dados para copiar do Supabase

No Supabase Dashboard:

1. Abra `Project Settings` -> `API Keys`.
2. Copie:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (anon/publishable key)
   - `SUPABASE_SERVICE_ROLE_KEY` (service role / secret key)
3. Abra `SQL Editor` e rode `supabase/schema.sql`.
4. Guarde o `DEFAULT_COMPANY_ID` inicial:
   - `00000000-0000-0000-0000-000000000001` (seed atual)

## 4. Variaveis .env necessarias

### Backend (Railway)

```env
NODE_ENV=production
BACKEND_PUBLIC_URL=https://SEU-BACKEND.up.railway.app
DASHBOARD_PUBLIC_URL=https://SEU-FRONTEND.vercel.app
CORS_ORIGIN=https://SEU-FRONTEND.vercel.app,https://*.vercel.app

AUTH_SECRET=gere_um_segredo_forte
ALLOW_BOOTSTRAP_LOGIN=false
ADMIN_EMAIL=admin@seudominio.com
ADMIN_PASSWORD=troque_essa_senha
DEFAULT_COMPANY_ID=00000000-0000-0000-0000-000000000001
WEBHOOK_SHARED_SECRET=segredo_webhook_opcional

SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=seu_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

OPENROUTER_API_KEY=sua_openrouter_key
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

GOOGLE_SHEETS_CSV_URL=https://docs.google.com/spreadsheets/d/.../export?format=csv

EVOLUTION_API_URL=https://SUA-EVOLUTION.exemplo.com
EVOLUTION_API_KEY=sua_evolution_api_key
EVOLUTION_INSTANCE_NAME=arthilles-demo
```

Nao defina `NPM_CONFIG_PRODUCTION=true`.

### Frontend (Vercel)

```env
NEXT_PUBLIC_API_URL=https://SEU-BACKEND.up.railway.app
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=seu_anon_key
```

Nota: hoje o frontend usa a API do backend para dados. `SUPABASE_URL` e `SUPABASE_ANON_KEY` ficam prontos para evolucao futura no frontend sem novo redesenho de variaveis.

## 5. Conectar repositorio GitHub no Vercel

1. Entre no Vercel Dashboard.
2. Clique em `Add New` -> `Project`.
3. Selecione o repositorio `arthilles`.
4. Em `Root Directory`, escolha `dashboard`.
5. Em `Environment Variables`, adicione:
   - `NEXT_PUBLIC_API_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
6. Clique em `Deploy`.
7. Ao final, copie a URL publica do frontend (`https://...vercel.app`).

## 6. Conectar backend no Railway

1. Entre no Railway.
2. Clique em `New Project` -> `Deploy from GitHub Repo`.
3. Selecione o repositorio `arthilles`.
4. Em `Root Directory`, configure `backend`.
5. Em `Build`, use `Dockerfile` (arquivo `Dockerfile` dentro de `backend`) e deixe `Build Command` vazio.
6. Em `Deploy`, confirme `Start Command` = `npm start` e `Healthcheck` = `/health`.
7. Em `Variables`, cole todas as variaveis do bloco Backend acima.
8. Em `Networking`, clique `Generate Domain`.
9. Copie a URL publica (`https://...up.railway.app`) e atualize:
   - `BACKEND_PUBLIC_URL`
   - `NEXT_PUBLIC_API_URL` no Vercel

## 7. Corrigir URLs publicas (ordem exata)

1. Deploy backend no Railway e gere dominio.
2. Pegue a URL do backend e atualize `NEXT_PUBLIC_API_URL` no Vercel.
3. Deploy frontend no Vercel e pegue a URL do frontend.
4. Atualize no Railway:
   - `DASHBOARD_PUBLIC_URL`
   - `CORS_ORIGIN` com URL do frontend (e opcional `https://*.vercel.app` para preview).
5. Redeploy backend no Railway.

## 8. Configurar Evolution API no painel

1. Acesse o frontend Vercel.
2. Faça login no painel.
3. Abra `Configuracoes` e preencha:
   - URL Evolution
   - API key
   - Nome da instancia
4. Abra aba `WhatsApp`.
5. Clique `Criar instancia`.
6. Clique `Gerar QR Code`.
7. Escaneie no WhatsApp.
8. Clique `Configurar webhook`.

## 9. Configurar FAQ Google Sheets

1. Crie planilha com cabecalho:
   - `pergunta,resposta,palavras`
2. Publique em CSV.
3. Cole URL CSV no painel (`Configuracoes`).
4. Clique `Testar planilha`.

## 10. Configurar OpenRouter

1. Gere sua chave em OpenRouter.
2. Defina `OPENROUTER_API_KEY` no Railway.
3. Opcional: ajuste `OPENROUTER_MODEL`.

## 11. Teste funcional final

1. Abra frontend.
2. Faça login.
3. Envie `oi` para o WhatsApp conectado.
4. Envie `agendar`.
5. Complete o fluxo.
6. Confirme no painel:
   - `Clientes`
   - `Conversas`
   - `Agendamentos`
7. Abra `Status` para validar servicos.

## 12. Checklists finais

### Checklist Supabase

- [ ] `supabase/schema.sql` executado
- [ ] `SUPABASE_URL` copiado
- [ ] `SUPABASE_ANON_KEY` copiado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` copiado
- [ ] seed e usuario admin validados

### Checklist Railway

- [ ] Repo conectado
- [ ] Root directory = `backend`
- [ ] Variaveis backend preenchidas
- [ ] Dominio publico gerado
- [ ] Healthcheck `/health`
- [ ] `BACKEND_PUBLIC_URL` correto
- [ ] `DASHBOARD_PUBLIC_URL` correto
- [ ] `CORS_ORIGIN` correto

### Checklist Vercel

- [ ] Repo conectado
- [ ] Root directory = `dashboard`
- [ ] `NEXT_PUBLIC_API_URL` preenchido
- [ ] `SUPABASE_URL` preenchido
- [ ] `SUPABASE_ANON_KEY` preenchido
- [ ] Deploy concluido

### Checklist teste final

- [ ] `GET https://SEU-BACKEND.up.railway.app/` = 200
- [ ] `GET https://SEU-BACKEND.up.railway.app/health` = 200
- [ ] `GET https://SEU-BACKEND.up.railway.app/status` = 200
- [ ] Login funciona no frontend
- [ ] QR Code Evolution conecta
- [ ] FAQ Google Sheets responde
- [ ] IA OpenRouter responde
- [ ] Fluxo de agendamento grava no Supabase
