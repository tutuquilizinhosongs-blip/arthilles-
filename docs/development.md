# Desenvolvimento

## Requisitos

- Node.js 20+
- Conta Supabase
- Evolution API acessivel pela internet para testar WhatsApp real
- Chave OpenRouter para respostas com IA

## Backend

```powershell
cd backend
copy .env.example .env
npm install
npm run dev
```

Principais arquivos:

- `src/server.js`: Express e CORS
- `src/routes.js`: endpoints HTTP
- `src/conversation.js`: fluxo WhatsApp, FAQ e agenda
- `src/availability.js`: regras de horario e bloqueios
- `src/evolution.js`: QR Code, webhook e envio de mensagens
- `src/openrouter.js`: chamada de IA
- `src/db.js`: cliente Supabase e mapeamento de configuracoes

## Dashboard

```powershell
cd dashboard
copy .env.example .env.local
npm install
npm run dev
```

Defina `NEXT_PUBLIC_BACKEND_URL=http://localhost:3001` para desenvolvimento.

## Banco

Execute `supabase/schema.sql` no SQL Editor do Supabase.

Tabelas principais:

- `companies`
- `app_users`
- `clients`
- `appointments`
- `availability_blocks`
- `messages`
- `conversation_sessions`
- `faq_items`

## Variaveis Importantes

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`
- `DEFAULT_COMPANY_ID`
- `OPENROUTER_API_KEY`
- `BACKEND_PUBLIC_URL`
- `DASHBOARD_PUBLIC_URL`
- `NEXT_PUBLIC_BACKEND_URL`

## Testes Manuais

1. `GET /health`
2. Login pelo dashboard
3. `GET /status`
4. Configurar Evolution API no painel
5. Criar instancia e gerar QR Code
6. Enviar `oi` para o WhatsApp conectado
7. Enviar `agendar` e concluir o fluxo
