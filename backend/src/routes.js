import express from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import os from 'os';
import { query, getSettingsMap } from './db.js';
import { getAvailableSlots } from './availability.js';
import { handleConversation } from './conversation.js';
import { sendWhatsAppText, getEvolutionInstanceStatus, getEvolutionQrCode, configureEvolutionWebhook, createEvolutionInstance } from './evolution.js';
import { fetchGoogleSheetFaqs } from './googleSheets.js';

export const router = express.Router();

function adminToken() {
  return crypto
    .createHash('sha256')
    .update(`${process.env.ADMIN_EMAIL || 'admin@arthilles.local'}:${process.env.ADMIN_PASSWORD || 'admin123'}:${process.env.ADMIN_API_KEY || 'local'}`)
    .digest('hex');
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer\s+/i, '');
  if (token && token === adminToken()) return next();
  return res.status(401).json({ error: 'Nao autenticado' });
}

router.get('/health', async (req, res) => {
  await query('SELECT 1');
  res.json({ ok: true, service: 'arthillesbot-backend', time: new Date().toISOString() });
});

router.get('/network', (req, res) => {
  const addresses = Object.values(os.networkInterfaces())
    .flat()
    .filter((item) => item && item.family === 'IPv4' && !item.internal)
    .map((item) => item.address);
  const host = req.headers.host?.split(':')[0] || 'localhost';

  res.json({
    host,
    addresses,
    dashboardUrls: addresses.map((address) => `http://${address}:${process.env.DASHBOARD_PORT || 3000}`),
    note: 'Se a lista mostrar apenas IPs internos do Docker, use ipconfig no Windows para encontrar o IPv4 do computador.'
  });
});

router.get('/', async (req, res) => {
  res.json({
    ok: true,
    name: 'ArthillesBot Backend',
    service: 'backend',
    health: '/health',
    dashboard: process.env.DASHBOARD_PUBLIC_URL || 'http://localhost:3000',
    docs: 'Consulte o README.md para instalacao e uso.'
  });
});

router.post('/auth/login', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const input = schema.parse(req.body);
  const expectedEmail = process.env.ADMIN_EMAIL || 'admin@arthilles.local';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (input.email !== expectedEmail || input.password !== expectedPassword) {
    return res.status(401).json({ error: 'Email ou senha invalidos' });
  }

  res.json({
    token: adminToken(),
    user: { name: 'Administrador', email: expectedEmail }
  });
});

router.post('/webhook/evolution', async (req, res) => {
  const payload = req.body;
  const data = payload?.data || payload;
  const message = data?.message?.conversation || data?.message?.extendedTextMessage?.text || data?.text || data?.body;
  const phone = data?.key?.remoteJid || data?.remoteJid || data?.from || data?.phone;

  if (!phone || !message || data?.key?.fromMe) {
    return res.json({ ok: true, ignored: true });
  }

  const result = await handleConversation({ phone, body: message });
  await sendWhatsAppText(result.phone, result.reply);
  res.json({ ok: true, reply: result.reply });
});

router.get('/clients', async (req, res) => {
  const result = await query('SELECT * FROM clients ORDER BY created_at DESC LIMIT 200');
  res.json(result.rows);
});

router.get('/messages', async (req, res) => {
  const result = await query(
    `SELECT messages.*, clients.full_name
     FROM messages
     LEFT JOIN clients ON clients.phone = messages.phone
     ORDER BY messages.created_at DESC
     LIMIT 300`
  );
  res.json(result.rows);
});

router.get('/conversations', async (req, res) => {
  const result = await query(
    `SELECT conversation_sessions.*, clients.full_name, clients.email
     FROM conversation_sessions
     LEFT JOIN clients ON clients.id = conversation_sessions.client_id
     ORDER BY conversation_sessions.updated_at DESC
     LIMIT 200`
  );
  res.json(result.rows);
});

router.get('/faqs', async (req, res) => {
  const result = await query('SELECT * FROM faq_items ORDER BY created_at DESC');
  res.json(result.rows);
});

router.get('/faqs/google-sheets/preview', async (req, res) => {
  const settings = await getSettingsMap();
  const rows = await fetchGoogleSheetFaqs(settings);
  res.json({ ok: true, count: rows.length, rows: rows.slice(0, 20) });
});

router.post('/faqs', requireAdmin, async (req, res) => {
  const schema = z.object({
    question: z.string().min(3),
    answer: z.string().min(3),
    keywords: z.array(z.string()).default([]),
    active: z.boolean().default(true)
  });
  const input = schema.parse(req.body);
  const result = await query(
    `INSERT INTO faq_items (question, answer, keywords, active)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.question, input.answer, input.keywords, input.active]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/faqs/:id', requireAdmin, async (req, res) => {
  const schema = z.object({
    question: z.string().min(3),
    answer: z.string().min(3),
    keywords: z.array(z.string()).default([]),
    active: z.boolean().default(true)
  });
  const input = schema.parse(req.body);
  const result = await query(
    `UPDATE faq_items
     SET question = $2, answer = $3, keywords = $4, active = $5, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [req.params.id, input.question, input.answer, input.keywords, input.active]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'FAQ nao encontrada' });
  res.json(result.rows[0]);
});

router.delete('/faqs/:id', requireAdmin, async (req, res) => {
  await query('DELETE FROM faq_items WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

router.post('/clients', async (req, res) => {
  const schema = z.object({
    full_name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email().optional().or(z.literal('')),
    company_type: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    main_problem: z.string().optional()
  });
  const input = schema.parse(req.body);
  const result = await query(
    `INSERT INTO clients (full_name, phone, email, company_type, city, state, main_problem)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [input.full_name, input.phone, input.email || null, input.company_type, input.city, input.state, input.main_problem]
  );
  res.status(201).json(result.rows[0]);
});

router.get('/appointments', async (req, res) => {
  const result = await query(
    `SELECT appointments.*, clients.full_name, clients.phone
     FROM appointments
     JOIN clients ON clients.id = appointments.client_id
     ORDER BY starts_at DESC
     LIMIT 200`
  );
  res.json(result.rows);
});

router.post('/appointments', async (req, res) => {
  const schema = z.object({
    client_id: z.string().uuid(),
    starts_at: z.string().datetime(),
    ends_at: z.string().datetime(),
    notes: z.string().optional()
  });
  const input = schema.parse(req.body);
  const slots = await getAvailableSlots({ from: input.starts_at, to: input.ends_at });
  const requestedStart = new Date(input.starts_at).getTime();
  const requestedEnd = new Date(input.ends_at).getTime();
  const allowed = slots.some((slot) => (
    new Date(slot.startsAt).getTime() === requestedStart &&
    new Date(slot.endsAt).getTime() === requestedEnd
  ));
  if (!allowed) return res.status(409).json({ error: 'Horario indisponivel ou com menos de 6 horas de antecedencia.' });

  const result = await query(
    `INSERT INTO appointments (client_id, starts_at, ends_at, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.client_id, input.starts_at, input.ends_at, input.notes || null]
  );
  res.status(201).json(result.rows[0]);
});

router.get('/availability', async (req, res) => {
  const slots = await getAvailableSlots({ from: req.query.from, to: req.query.to });
  res.json(slots);
});

router.get('/availability/blocks', async (req, res) => {
  const result = await query('SELECT * FROM availability_blocks ORDER BY starts_at DESC LIMIT 200');
  res.json(result.rows);
});

router.post('/availability/block', async (req, res) => {
  const schema = z.object({
    title: z.string().min(2),
    starts_at: z.string().datetime(),
    ends_at: z.string().datetime(),
    block_type: z.enum(['manual', 'holiday', 'vacation']).default('manual')
  });
  const input = schema.parse(req.body);
  const result = await query(
    `INSERT INTO availability_blocks (title, starts_at, ends_at, block_type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.title, input.starts_at, input.ends_at, input.block_type]
  );
  res.status(201).json(result.rows[0]);
});

router.delete('/availability/block/:id', requireAdmin, async (req, res) => {
  await query('DELETE FROM availability_blocks WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

router.get('/settings', async (req, res) => {
  res.json(await getSettingsMap());
});

router.put('/settings', requireAdmin, async (req, res) => {
  const entries = Object.entries(req.body || {});
  for (const [key, value] of entries) {
    await query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    );
  }
  res.json(await getSettingsMap());
});

router.get('/evolution/status', async (req, res) => {
  res.json(await getEvolutionInstanceStatus());
});

router.post('/evolution/webhook', requireAdmin, async (req, res) => {
  await configureEvolutionWebhook();
  res.json({ ok: true });
});

router.post('/evolution/instance', requireAdmin, async (req, res) => {
  res.json(await createEvolutionInstance());
});

router.get('/evolution/qrcode', async (req, res) => {
  res.json(await getEvolutionQrCode());
});

router.get('/status', async (req, res) => {
  async function checkHttp(url) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      return { ok: response.ok, status: response.status, url };
    } catch (error) {
      return { ok: false, url, error: error.message };
    }
  }

  const checks = await Promise.allSettled([
    query('SELECT 1'),
    getEvolutionInstanceStatus(),
    checkHttp(`${process.env.OLLAMA_BASE_URL || 'http://ollama:11434'}/api/tags`)
  ]);
  const n8nEnabled = process.env.N8N_ENABLED === 'true';
  const n8nStatus = n8nEnabled ? await checkHttp('http://n8n:5678/healthz') : { ok: true, optional: true, enabled: false, message: 'n8n opcional e desativado no fluxo padrao.' };

  res.json({
    backend: { ok: true },
    postgres: { ok: checks[0].status === 'fulfilled' },
    evolution: checks[1].status === 'fulfilled' ? checks[1].value : { ok: false },
    n8n: n8nStatus,
    ollama: {
      ...(checks[2].status === 'fulfilled' ? checks[2].value : { ok: false }),
      model: process.env.OLLAMA_MODEL || 'llama3'
    },
    redis: { configured: Boolean(process.env.REDIS_URL) }
  });
});

router.get('/logs', async (req, res) => {
  const messages = await query(
    `SELECT created_at, direction, phone, body
     FROM messages
     ORDER BY created_at DESC
     LIMIT 100`
  );
  const sessions = await query(
    `SELECT updated_at, phone, state
     FROM conversation_sessions
     ORDER BY updated_at DESC
     LIMIT 50`
  );

  res.json({
    application: [
      ...messages.rows.map((row) => ({
        time: row.created_at,
        type: `message:${row.direction}`,
        detail: `${row.phone} - ${row.body}`
      })),
      ...sessions.rows.map((row) => ({
        time: row.updated_at,
        type: 'session',
        detail: `${row.phone} - ${row.state}`
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 120)
  });
});
