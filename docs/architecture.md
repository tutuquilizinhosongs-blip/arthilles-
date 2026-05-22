# Arquitetura ArthillesBot

```text
WhatsApp
  -> Evolution API
  -> Webhook unico do Backend Node.js
  -> PostgreSQL
  -> Dashboard Next.js

n8n atua apenas como orquestrador auxiliar.
Ollama fornece IA local gratuita para respostas complementares.
Redis atende cache e dependencias da Evolution API.
```

## Decisoes principais

- O backend centraliza cadastro, agenda, disponibilidade e conversa.
- O n8n nao recebe o webhook principal para evitar fluxos conflitantes.
- O PostgreSQL e a fonte de verdade.
- O Ollama e opcional em runtime: se o modelo ainda nao foi baixado, o bot usa mensagens deterministicas.
