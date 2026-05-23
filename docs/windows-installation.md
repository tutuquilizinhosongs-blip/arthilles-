# Instalacao Windows Para Cliente

## Requisitos

- Windows 10 ou 11
- Docker Desktop instalado e aberto
- PowerShell

## Passos

```powershell
copy .env.example .env
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\start-windows.ps1
```

Se a execucao de scripts estiver bloqueada:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
powershell -ExecutionPolicy Bypass -File .\scripts\start-windows.ps1
```

## Validacao

```powershell
docker compose ps
docker exec arthilles_backend node -e "fetch('http://localhost:3001/health').then(r=>r.text()).then(console.log)"
```

## Android na mesma rede

O script de inicio mostra o link para abrir no celular. Se precisar descobrir manualmente:

```powershell
ipconfig
```

No celular Android, abra:

```text
http://IP-DO-PC:3000
```

No Chrome, use `Adicionar a tela inicial` para instalar como PWA.

## Personalizacao

No dashboard, abra `Configuracoes` para alterar nome da empresa, logo, cores, horarios, mensagem inicial e Google Sheets de FAQ.

## Portas

- `3000`: Dashboard
- `3001`: Backend
- `5432`: PostgreSQL
- `5678`: n8n
- `6379`: Redis
- `8080`: Evolution API
- `11434`: Ollama
