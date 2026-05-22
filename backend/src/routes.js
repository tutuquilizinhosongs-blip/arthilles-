import express from 'express';
import { z } from 'zod';
import { query, getSettingsMap } from './db.js';
import { getAvailableSlots } from './availability.js';
import { handleConversation } from './conversation.js';
import { sendWhatsAppText } from './evolution.js';

export const router = express.Router();

router.get('/health', async (req, res) => {
  await query('SELECT 1');
  res.json({ ok: true, service: 'arthillesbot-backend', time: new Date().toISOString() });
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

router.get('/settings', async (req, res) => {
  res.json(await getSettingsMap());
});

router.put('/settings', async (req, res) => {
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
