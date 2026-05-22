# n8n no ArthillesBot

O n8n fica disponivel como orquestrador auxiliar em `http://localhost:5678`.

Use para tarefas secundarias, como notificacoes internas, relatórios e rotinas administrativas. A logica principal de atendimento, cadastro e agenda fica no backend em `POST /webhook/evolution`, mantendo webhook unico e evitando fluxos duplicados.
