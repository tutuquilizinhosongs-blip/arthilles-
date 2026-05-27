# Deploy Passo a Passo - ArthillesBot (Foco Gratuito)

**Objetivo principal**: ter o sistema funcionando 100% gratis usando **somente FAQ do Google Sheets + mensagem automatica de encaminhamento** para a equipe. OpenRouter e opcional e pode ficar desativado.

## Aviso Critico - Usuario Inicial e AUTH_SECRET

O arquivo supabase/schema.sql cria o admin com hash baseado em 'change_me_auth_secret'.

**Solucao recomendada**:
1. No primeiro deploy do Railway, defina temporariamente:
   AUTH_SECRET=change_me_auth_secret
2. Rode o schema no Supabase
3. Teste login
4. Imediatamente mude AUTH_SECRET para um valor forte
5. Rode o SQL de atualizacao de senha que esta comentado no final do schema.sql

Ou simplesmente crie um novo usuario admin via SQL apos o primeiro deploy.

## 1. Supabase

Crie projeto gratuito -> SQL Editor -> cole todo o conteudo de supabase/schema.sql

## 2. Variaveis minimas (backend Railway)

```env
NODE_ENV=production
AUTH_SECRET=segredo_forte
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...   # obrigatoria no backend
EVOLUTION_API_URL=...
EVOLUTION_API_KEY=...
BACKEND_PUBLIC_URL=... (gere no Railway)
DASHBOARD_PUBLIC_URL=...
CORS_ORIGIN=...
GOOGLE_SHEETS_CSV_URL=...   # sua FAQ principal

# Deixe vazias para modo 100% FAQ + handoff (recomendado para comecar)
OPENROUTER_API_KEY=
```

## 3. Vercel (dashboard)

Root = dashboard
Apenas: NEXT_PUBLIC_API_URL = URL do backend

## 4. Ordem de configuracao

1. Deploy backend Railway primeiro (gere dominio)
2. Atualize NEXT_PUBLIC_API_URL no Vercel
3. Deploy Vercel
4. Atualize BACKEND_PUBLIC_URL + CORS no Railway
5. Redeploy backend

## 5. WhatsApp + FAQ

- Configure Evolution no painel
- Crie instancia + QR
- Configure webhook
- Crie planilha Google com colunas pergunta,resposta,palavras
- Publique CSV e cole URL no painel

## 6. Teste sem IA (modo gratuito)

Envie para o WhatsApp:
- Mensagens que batem com sua planilha -> respostas da FAQ
- Qualquer outra coisa -> "Sua pergunta foi encaminhada para nossa equipe. Em breve responderemos com mais detalhes."

Isso e o que garante que o sistema e viavel sem nenhum custo mensal.

## Proximos passos opcionais

- Adicionar OpenRouter depois (modelos free disponiveis)
- Melhorar matching de FAQ
- Adicionar notificacao de escalas (webhook Discord/Slack gratuito etc)
