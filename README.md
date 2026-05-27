# ArthillesBot

ArthillesBot e um SaaS web simples para atendimento automatico no WhatsApp com agenda, CRM, FAQ por Google Sheets (100% gratuito) e IA opcional via OpenRouter.

**Foco total em gratuidade e open source**: funciona perfeitamente so com FAQ (Google Sheets + faq_items no Supabase) + mensagem de encaminhamento para a equipe. Nenhuma API paga e obrigatoria.

O projeto usa apenas ferramentas gratuitas: Vercel (frontend), Railway (backend), Supabase (banco gratuito), Google Sheets publico (FAQ) e Evolution API self-hosted/open source (WhatsApp).

## Stack (100% gratuito / open source)

- Dashboard: Next.js responsivo, pronto para PWA (Vercel Hobby gratuito)
- Backend: Node.js/Express (Railway gratuito)
- Banco: Supabase Postgres (plano gratuito)
- WhatsApp: Evolution API (instancia propria gratuita)
- FAQ: Google Sheets publicado em CSV (gratuito)
- IA: OpenRouter (opcional - use apenas modelos free ou desative completamente)

## Arquitetura

```text
Cliente no WhatsApp
  -> Evolution API (gratuita)
  -> Webhook do backend Railway
  -> Supabase
  -> FAQ Google Sheets + regras locais
  -> (Opcional) OpenRouter IA
  -> Resposta automatica ou "Sua pergunta foi encaminhada para nossa equipe..."

Administrador
  -> Dashboard Next.js na Vercel
  -> Backend Express na Railway
  -> Supabase
```

## Funcionalidades

- Login no painel (auth proprio leve, sem provedor pago)
- Base multiempresa com `company_id`
- Conexao WhatsApp por QR Code (Evolution)
- Recebimento de mensagens por webhook seguro (com shared secret opcional)
- Respostas automaticas por FAQ (Sheets + local) + fallback para equipe humana
- Cadastro automatico de clientes
- Agendamento automatico com bloqueios e antecedencia minima
- Painel completo (clientes, conversas, agendamentos, configuracoes)
- Configuracao de marca, cores, horarios, Google Sheets, Evolution API
- IA OpenRouter 100% opcional (desative removendo a chave)
- Dashboard responsivo para Android (PWA)

## Estrutura

```text
backend/       API Express para Railway
dashboard/     Painel Next.js para Vercel
docs/          Guias de deploy e operacao
supabase/      Schema SQL inicial
.env.example   Variaveis de ambiente de referencia
```

## Configuracao Do Banco

1. Crie um projeto no Supabase (plano gratuito).
2. Abra `SQL Editor`.
3. Execute o arquivo:

```text
supabase/schema.sql
```

Leia os comentarios no topo do schema sobre o usuario inicial e AUTH_SECRET.

O schema cria uma empresa demo e um usuario inicial:

```text
email: admin@arthilles.local
senha: admin123
```

**Apos o primeiro login, troque a senha e defina ALLOW_BOOTSTRAP_LOGIN=false no Railway.**

## Backend No Railway (gratuito)

1. Crie um novo projeto Railway apontando para a pasta `backend`.
2. Em `Settings` do servico:
   - `Root Directory`: `backend`
   - `Build Strategy`: `Dockerfile`
   - `Build Command`: vazio
   - `Start Command`: `npm start`
   - `Healthcheck Path`: `/health`
3. Configure as variaveis minimas (veja lista completa em docs):

```env
NODE_ENV=production
AUTH_SECRET=um_segredo_forte_aqui
ALLOW_BOOTSTRAP_LOGIN=true          # desative depois
ADMIN_EMAIL=admin@arthilles.local
ADMIN_PASSWORD=admin123
DEFAULT_COMPANY_ID=00000000-0000-0000-0000-000000000001
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
BACKEND_PUBLIC_URL=https://seu-backend.up.railway.app
DASHBOARD_PUBLIC_URL=https://seu-dashboard.vercel.app
CORS_ORIGIN=https://seu-dashboard.vercel.app,https://*.vercel.app
GOOGLE_SHEETS_CSV_URL=...          # FAQ (principal)
EVOLUTION_API_URL=...
EVOLUTION_API_KEY=...

# OpenRouter (OPCIONAL - remova ou deixe vazio para usar so FAQ + handoff)
OPENROUTER_API_KEY=
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

4. Nao defina `NPM_CONFIG_PRODUCTION=true`.
5. Valide: GET https://SEU-BACKEND.up.railway.app/health

## Dashboard Na Vercel (gratuito)

1. Crie projeto Vercel -> Root Directory = `dashboard`
2. Variavel obrigatoria:
   - NEXT_PUBLIC_API_URL=https://seu-backend.up.railway.app
3. (Opcional para futuro) SUPABASE_URL / ANON_KEY
4. Deploy.

## Fallback para perguntas sem resposta (gratuito)

Quando a pergunta nao bater com a FAQ do Google Sheets e OpenRouter nao estiver configurado (ou falhar), o bot responde automaticamente:

> Sua pergunta foi encaminhada para nossa equipe. Em breve responderemos com mais detalhes.

Isso permite operacao 100% gratuita sem IA.

## Deploy Automatico

Conecte o repositorio ao Railway e Vercel. Push na main redeploya tudo.

CI basico em .github/workflows/ci.yml

Guias detalhados: docs/deploy-checklist.md e docs/deploy-passo-a-passo.md

## Evolution API (open source)

Hospede sua propria instancia (varias opcoes gratuitas/open source disponiveis) ou use um provedor barato.

No painel:
1. Configuracoes -> Evolution
2. WhatsApp -> Criar instancia + QR Code + Configurar webhook

Webhook: https://seu-backend.railway.app/webhook/evolution?companyId=ID

## Google Sheets FAQ (principal mecanismo gratuito)

Colunas obrigatorias:

pergunta,resposta,palavras

Publique a aba como CSV e cole o link export no painel.

O backend faz cache de 5 minutos para estabilidade.

## Desenvolvimento Local

Backend:
cd backend
copy .env.example .env
npm install
npm run dev

Dashboard:
cd dashboard
copy .env.example .env.local
npm install
npm run dev

## Teste Rapido Do Fluxo (sem IA)

1. Configure apenas Supabase + Evolution + Google Sheets FAQ
2. Conecte WhatsApp
3. Envie mensagens que batam com sua planilha
4. Envie perguntas fora da FAQ -> recebe o handoff para equipe
5. Use "agendar" para testar fluxo completo de agendamento

## Android / PWA

Abra no celular e "Adicionar a tela inicial".

## Seguranca (importante no gratuito)

- Service role key do Supabase SOMENTE no backend (nunca no Vercel)
- Troque AUTH_SECRET e senha do admin em producao
- Desative ALLOW_BOOTSTRAP_LOGIN apos criar usuarios reais
- Use WEBHOOK_SHARED_SECRET sempre que possivel
- Mantenha Evolution API com firewall/restricoes se possivel

## Variaveis de Ambiente Essenciais (gratuito)

Obrigatorias para funcionamento basico (FAQ + WhatsApp):
- SUPABASE_*
- EVOLUTION_*
- BACKEND_PUBLIC_URL
- GOOGLE_SHEETS_CSV_URL
- AUTH_SECRET
- CORS_ORIGIN

OpenRouter e totalmente opcional.
