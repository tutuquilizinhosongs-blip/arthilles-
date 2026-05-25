import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { router } from './routes.js';
import { logger } from './logger.js';

const app = express();
const port = Number(process.env.PORT || process.env.BACKEND_PORT || 3001);

const allowedOrigins = (process.env.CORS_ORIGIN || process.env.DASHBOARD_PUBLIC_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) return callback(null, true);
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
  logger.info({ port }, 'ArthillesBot SaaS backend started');
});
