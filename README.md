# ArthillesBot

ArthillesBot e um sistema white-label local para pequenas empresas fazerem atendimento automatico no WhatsApp, cadastro de clientes, agendamentos, FAQ e acompanhamento pelo painel.

O computador Windows do cliente funciona como servidor local. O celular Android acessa o painel pelo navegador/PWA na mesma rede, sem instalar Docker no Android.

## Arquitetura

```text
Windows do cliente
  -> Docker Compose
  -> Evolution API
  -> Backend Node.js
  -> PostgreSQL
  -> Dashboard Next.js PWA
  -> Google Sheets para FAQ
  -> Ollama opcional para IA local

Android
  -> Navegador/PWA
  -> http://IP-DO-COMPUTADOR:3000
```

n8n nao e obrigatorio. Ele fica disponivel apenas como opcional para automacoes futuras.

## O Que O Cliente Consegue Fazer

- Entrar no painel com login local.
- Personalizar nome da empresa, logo, cores e mensagem inicial.
- Conectar WhatsApp por QR Code usando Evolution API.
- Responder duvidas por FAQ local ou Google Sheets.
- Usar Ollama como IA local opcional, sem OpenAI paga.
- Cadastrar clientes automaticamente.
- Agendar reunioes automaticamente.
- Bloquear feriados, viagens, folgas e horarios indisponiveis.
- Ver clientes, conversas, agendamentos, logs e status.
- Acessar pelo Android na mesma rede como PWA.

## Instalacao Windows

1. Instale o Docker Desktop.
2. Baixe ou clone este repositorio.
3. Abra o PowerShell na pasta do projeto.
4. Rode:

```powershell
copy .env.example .env
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\start-windows.ps1
```

O script mostra os enderecos locais e tambem os links para abrir no Android.

## Acesso

- Dashboard: http://localhost:3000
- Status do dashboard: http://localhost:3000/status
- Backend: http://localhost:3001
- Evolution API: http://localhost:8080
- Ollama: http://localhost:11434

No Android, use:

```text
http://IP-DO-COMPUTADOR:3000
```

O IP aparece ao rodar `scripts/start-windows.ps1`. Tambem pode ser encontrado com:

```powershell
ipconfig
```

## Login Inicial

As credenciais iniciais ficam no `.env`:

```text
ADMIN_EMAIL=admin@arthilles.local
ADMIN_PASSWORD=admin123
```

Troque antes de entregar para um cliente.

## WhatsApp

1. Acesse o dashboard.
2. Faca login.
3. Abra a aba `WhatsApp`.
4. Clique em `Criar instancia`.
5. Clique em `Gerar QR Code`.
6. Leia o QR Code com o WhatsApp.

O webhook principal fica no backend:

```text
http://backend:3001/webhook/evolution
```

## White-label

No painel, abra `Configuracoes` para editar:

- Nome da empresa
- URL da logo
- Cor principal
- Cor de destaque
- Horario de atendimento
- Antecedencia minima
- Mensagem inicial do WhatsApp
- Ativar/desativar Ollama
- Google Sheets para FAQ

## FAQ Com Google Sheets

Crie uma planilha publica com as colunas:

```text
pergunta,resposta,palavras
```

Publique ou exporte como CSV e cole o link na tela `Configuracoes`.

Exemplo de cabecalho:

```csv
pergunta,resposta,palavras
Como funciona?,Atendemos pelo WhatsApp e agendamos uma reuniao.,atendimento;agenda
```

## Ollama Opcional

O sistema funciona sem modelo baixado. Para usar IA local:

```powershell
docker exec -it arthilles_ollama ollama pull llama3
```

Sem OpenAI paga e sem API paga.

## n8n Opcional

n8n nao sobe no fluxo padrao. Para habilitar quando quiser:

```powershell
docker compose --profile optional up -d n8n
```

Depois acesse:

```text
http://localhost:5678
```

## Backup

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\backup-windows.ps1
```

## Logs

```powershell
.\scripts\logs-windows.ps1
.\scripts\logs-windows.ps1 backend
```

## Parar

```powershell
.\scripts\stop-windows.ps1
```

## Validacao Tecnica

```powershell
docker compose config
docker compose up -d --build
docker compose ps
```

Endpoints importantes:

- `GET /`
- `GET /health`
- `GET /status`
- `GET /network`
- `POST /webhook/evolution`
- `GET /availability`
- `GET /availability/blocks`
- `GET /faqs`
- `GET /faqs/google-sheets/preview`

## Ubuntu

Ubuntu nao e prioridade do produto white-label, mas os scripts continuam disponiveis para uso tecnico:

```bash
cp .env.example .env
chmod +x scripts/*.sh
./scripts/start-ubuntu.sh
```
