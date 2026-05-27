# Deploy Checklist - ArthillesBot (100% Gratuito)

Foco: fazer funcionar com **apenas FAQ do Google Sheets + mensagem de encaminhamento para equipe**. OpenRouter e totalmente opcional.

## 1. Supabase (gratuito)

- [ ] Projeto criado (plano gratuito)
- [ ] Script `supabase/schema.sql` executado (leia os avisos sobre AUTH_SECRET no topo!)
- [ ] Chaves copiadas: URL, ANON_KEY, SERVICE_ROLE_KEY
- [ ] Usuario bootstrap testado (ou crie admin manualmente)

## 2. Backend Railway (gratuito)

- [ ] Root Directory = `backend`
- [ ] Build = Dockerfile (dentro da pasta backend)
- [ ] Healthcheck = `/health`
- [ ] Variaveis minimas obrigatorias:
  - NODE_ENV=production
  - AUTH_SECRET (forte!)
  - SUPABASE_*
  - EVOLUTION_API_URL + KEY + INSTANCE
  - BACKEND_PUBLIC_URL (dominio gerado)
  - DASHBOARD_PUBLIC_URL
  - CORS_ORIGIN
  - GOOGLE_SHEETS_CSV_URL (sua planilha de FAQ)
- [ ] OpenRouter: deixe vazio para modo FAQ puro (recomendado para comecar)
- [ ] Deploy + teste /health

## 3. Dashboard Vercel (gratuito)

- [ ] Root Directory = `dashboard`
- [ ] NEXT_PUBLIC_API_URL = URL do backend Railway
- [ ] Deploy

## 4. Evolution API

- [ ] Instancia criada + QR lido
- [ ] Webhook configurado (use WEBHOOK_SHARED_SECRET se possivel)

## 5. Google Sheets FAQ (principal)

- [ ] Planilha publica com colunas pergunta,resposta,palavras
- [ ] Link CSV colado em Configuracoes
- [ ] Teste no painel retorna linhas

## 6. Testes Obrigatorios (modo gratuito)

- [ ] /health OK + supabaseOk true
- [ ] /status mostra googleSheets com count > 0
- [ ] Login funciona
- [ ] Enviar "oi" no WhatsApp -> resposta de boas vindas
- [ ] Enviar pergunta que existe na planilha -> resposta da FAQ
- [ ] Enviar pergunta desconhecida -> "Sua pergunta foi encaminhada para nossa equipe..."
- [ ] Fluxo "agendar" funciona ate o agendamento

## 7. Apos primeiro uso

- [ ] Crie usuario admin real no painel ou via SQL
- [ ] Defina ALLOW_BOOTSTRAP_LOGIN=false no Railway
- [ ] Troque senha do admin@arthilles.local (use o SQL no schema)
- [ ] (Opcional) Adicione OpenRouter depois se quiser respostas mais inteligentes
