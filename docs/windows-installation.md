# Uso No Windows

O ArthillesBot nao precisa mais ser instalado localmente no Windows do cliente.

O cliente acessa o painel pelo navegador:

```text
https://seu-dashboard.vercel.app
```

## Para Desenvolver No Windows

Instale Node.js 20+ e rode os dois projetos:

```powershell
cd backend
copy .env.example .env
npm install
npm run dev
```

Em outro PowerShell:

```powershell
cd dashboard
copy .env.example .env.local
npm install
npm run dev
```

Acesse:

```text
http://localhost:3000
```

## Android

No Android, abra a mesma URL do dashboard publicada na Vercel:

```text
https://seu-dashboard.vercel.app
```

O layout e responsivo e ja possui manifest para evoluir como PWA.

## Sem Docker Obrigatorio

Nao ha `docker compose`, scripts PowerShell de instalacao ou banco local obrigatorio. Os dados ficam no Supabase e o backend roda online.
