import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { router } from './routes.js';
import { logger } from './logger.js';

const app = express();
const port = Number(process.env.PORT || process.env.BACKEND_PORT || 3001);

// Validacao de variaveis criticas no startup (ajuda muito em deploys gratuitos)
const critical = {
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  BACKEND_PUBLIC_URL: !!process.env.BACKEND_PUBLIC_URL,
};

const warnings = [];
if (!critical.SUPABASE_URL || !critical.SUPABASE_SERVICE_ROLE_KEY) {
  warnings.push('SUPABASE nao configurado - /health e webhook vao falhar');
}
if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_API_KEY) {
  warnings.push('Evolution API nao configurada - WhatsApp nao vai funcionar');
}
if (!process.env.GOOGLE_SHEETS_CSV_URL) {
  warnings.push('GOOGLE_SHEETS_CSV_URL vazio - FAQ principal desativada');
}
if (!process.env.OPENROUTER_API_KEY) {
  warnings.push('OpenRouter ausente - operando em modo FAQ + handoff 100% gratuito (recomendado para comecar)');
}

if (warnings.length) {
  logger.warn({ warnings }, 'Avisos de configuracao (comum no plano gratuito)');
} else {
  logger.info('Todas as integracoes principais parecem configuradas');
}

const allowedOrigins = (process.env.CORS_ORIGIN || process.env.DASHBOARD_PUBLIC_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function matchOriginPattern(origin, pattern) {
  if (pattern === '*') return true;
  if (!pattern.includes('*')) return origin === pattern;

  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(origin);
}

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || !allowedOrigins.length) return callback(null, true);
    if (allowedOrigins.some((allowed) => matchOriginPattern(origin, allowed))) return callback(null, true);
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(pinoHttp({ logger }));
app.use(router);

app.use((error, req, res, next) => {
  req.log?.error({ err: error }, 'Request failed');
  const status = error.status || error.statusCode || 400;
  res.status(status).json({ error: error.message || 'Erro inesperado' });
});

app.listen(port, '0.0.0.0', () => {
  logger.info({ port, warningsCount: warnings.length }, 'ArthillesBot SaaS backend started (modo gratuito priorizado)');
});
