# Arquitetura

O ArthillesBot agora e um SaaS web leve. Nao ha Docker obrigatorio, n8n obrigatorio, Ollama ou banco local.

```text
WhatsApp
  -> Evolution API
  -> POST /webhook/evolution
  -> Backend Node.js/Express
  -> Supabase Postgres
  -> FAQ Google Sheets e IA OpenRouter
  -> Evolution API envia resposta

Dashboard Next.js
  -> Backend Express
  -> Supabase
```

## Decisoes

- O backend centraliza webhook, agenda, conversa, CRM e configuracoes.
- O dashboard nunca acessa a service role do Supabase.
- Todo registro operacional tem `company_id`.
- O FAQ pode vir do banco ou de uma planilha Google Sheets publicada em CSV.
- OpenRouter e opcional: se nao houver chave, o bot usa FAQ e respostas deterministicas.
- O webhook principal e unico para evitar fluxos duplicados.

## Deploy

- `backend/`: Railway com Nixpacks e healthcheck `/health`.
- `dashboard/`: Vercel com `NEXT_PUBLIC_BACKEND_URL`.
- `supabase/schema.sql`: schema inicial do banco.
