import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import Redis from 'ioredis';
import { router } from './routes.js';
import { logger } from './logger.js';
import { configureEvolutionWebhook } from './evolution.js';

const app = express();
const port = Number(process.env.BACKEND_PORT || 3001);

app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));
app.use(pinoHttp({ logger }));
app.use(router);

app.use((error, req, res, next) => {
  req.log.error({ err: error }, 'Request failed');
  res.status(error.status || 400).json({ error: error.message || 'Erro inesperado' });
});

const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379', { lazyConnect: true });
redis.connect().then(() => logger.info('Redis connected')).catch((error) => {
  logger.warn({ err: error.message }, 'Redis not connected yet');
});

app.listen(port, '0.0.0.0', async () => {
  logger.info({ port }, 'ArthillesBot backend started');
  await configureEvolutionWebhook();
});
