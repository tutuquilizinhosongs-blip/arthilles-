# ArthillesBot

Plataforma local de automacao inteligente para WhatsApp com Evolution API, backend Node.js, PostgreSQL, Redis, dashboard Next.js, n8n auxiliar e IA local gratuita com Ollama.

## Arquitetura

```text
WhatsApp -> Evolution API -> Webhook unico -> Backend Node.js -> PostgreSQL -> Dashboard Next.js
                                      |
                                      -> Ollama

n8n fica disponivel apenas para orquestracoes auxiliares.
```

## Requisitos no Windows

1. Instale o Docker Desktop.
2. Baixe este projeto do GitHub.
3. Copie `.env.example` para `.env` ou deixe o script criar automaticamente.
4. Rode:

```powershell
.\scripts\start-windows.ps1
```

Se o Windows bloquear scripts PowerShell por politica de execucao, use:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-windows.ps1
```

Ou manualmente:

```powershell
docker compose up -d --build
```

## URLs

- Dashboard: http://localhost:3000
- Backend: http://localhost:3001
- Evolution API: http://localhost:8080
- n8n: http://localhost:5678
- Ollama: http://localhost:11434

## Baixar o modelo da IA local

Depois que os containers estiverem rodando:

```powershell
docker exec -it arthilles_ollama ollama pull llama3
```

O bot funciona sem APIs pagas. Se o modelo ainda nao existir, ele usa respostas deterministicas para cadastro e agenda.

## Conectar WhatsApp

1. Acesse a Evolution API em http://localhost:8080.
2. Use a API key definida em `EVOLUTION_API_KEY` no `.env`.
3. Crie ou use a instancia definida em `EVOLUTION_INSTANCE_NAME` (`arthilles` por padrao).
4. Configure o webhook da instancia para:

```text
http://backend:3001/webhook/evolution
```

O backend tambem tenta configurar esse webhook automaticamente ao iniciar.

A Evolution API e o n8n usam o mesmo container PostgreSQL, mas em bancos separados (`arthilles_evolution` e `arthilles_n8n`) para que suas migrations internas nao conflitem com as tabelas do ArthillesBot.

## Testar a mensagem "oi"

Com o WhatsApp conectado pela Evolution API, envie:

```text
oi
```

O bot deve responder pedindo o nome completo e seguir o cadastro:

- nome completo
- telefone detectado pelo WhatsApp
- email
- tipo de empresa
- cidade/estado
- principal problema

Ao final, ele mostra horarios disponiveis e agenda quando o usuario responde com o numero desejado.

## Regras de agenda

- Atendimento de segunda a sexta.
- Horario padrao de 13:30 ate 16:30.
- Reunioes de 1 hora.
- Bloqueio automatico para horarios com menos de 6 horas.
- Horarios ocupados nao aparecem.
- Ferias, feriados e bloqueios manuais ficam em `availability_blocks`.

## Endpoints do backend

- `GET /health`
- `POST /webhook/evolution`
- `GET /clients`
- `POST /clients`
- `GET /appointments`
- `POST /appointments`
- `GET /availability`
- `POST /availability/block`
- `GET /settings`
- `PUT /settings`

## Logs

Todos os servicos:

```powershell
.\scripts\logs-windows.ps1
```

Servico especifico:

```powershell
.\scripts\logs-windows.ps1 backend
```

## Backup do banco

```powershell
.\scripts\backup-windows.ps1
```

Fallback se houver bloqueio de politica de execucao:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-windows.ps1
```

Os arquivos `.sql` ficam em `backups/`.

## Parar

```powershell
.\scripts\stop-windows.ps1
```

## Estrutura

```text
arthilles/
├── backend/
├── dashboard/
├── database/
├── docker/
├── docs/
├── n8n/
├── ollama/
├── scripts/
├── workflows/
├── .env.example
├── docker-compose.yml
└── README.md
```

## Observacoes de seguranca

- Troque todas as senhas do `.env` antes de uso real.
- Nao publique `.env`.
- O projeto nao exige OpenAI, APIs pagas, SQLite ou servicos externos obrigatorios.
