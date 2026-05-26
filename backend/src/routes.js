import express from 'express';
import { z } from 'zod';
import { getAvailableSlots } from './availability.js';
import { hashPassword, loginWithPassword, requireAuth } from './auth.js';
import { handleConversation } from './conversation.js';
import { getCompany, getCompanyByInstance, requireSupabase, settingsFromCompany, updateCompanySettings } from './db.js';
import { createEvolutionInstance, configureEvolutionWebhook, getEvolutionInstanceStatus, getEvolutionQrCode, sendWhatsAppText } from './evolution.js';
import { fetchGoogleSheetFaqs } from './googleSheets.js';

export const router = express.Router();

function tenantId(req) {
  return req.user?.companyId || req.query.companyId || req.body?.companyId || process.env.DEFAULT_COMPANY_ID;
}

function extractEvolutionMessage(payload) {
  const data = payload?.data || payload || {};
  const message =
    data?.message?.conversation ||
    data?.message?.extendedTextMessage?.text ||
    data?.message?.imageMessage?.caption ||
    data?.text ||
    data?.body ||
    data?.messageText;

  const phone =
    data?.key?.remoteJid ||
    data?.remoteJid ||
    data?.from ||
    data?.phone ||
    data?.sender ||
    payload?.sender;

  return {
    message,
    phone,
    fromMe: Boolean(data?.key?.fromMe || data?.fromMe),
    instance: payload?.instance || payload?.instanceName || data?.instance || data?.instanceName
  };
}

function flattenAppointment(item) {
  return {
    ...item,
    full_name: item.clients?.full_name || null,
    phone: item.clients?.phone || null
  };
}

router.get('/', (req, res) => {
  res.json({
    ok: true,
    name: 'ArthillesBot API',
    mode: 'saas',
    stack: ['Node.js', 'Supabase', 'Evolution API', 'OpenRouter', 'Google Sheets'],
    health: '/health',
    docs: 'README.md'
  });
});

router.get('/health', async (req, res) => {
  let supabaseOk = false;
  try {
    const db = requireSupabase();
    const { error } = await db.from('companies').select('id').limit(1);
    supabaseOk = !error;
  } catch {
    supabaseOk = false;
  }
  res.json({ ok: true, service: 'arthillesbot-backend', supabaseOk, time: new Date().toISOString() });
});

router.post('/auth/login', async (req, res) => {
  const result = await loginWithPassword(req.body);
  if (!result) return res.status(401).json({ error: 'Email ou senha invalidos' });
  res.json(result);
});

router.post('/webhook/evolution', async (req, res) => {
  const sharedSecret = process.env.WEBHOOK_SHARED_SECRET;
  if (sharedSecret && req.query.secret !== sharedSecret && req.headers['x-webhook-secret'] !== sharedSecret) {
    return res.status(401).json({ error: 'Webhook nao autorizado' });
  }

  const event = extractEvolutionMessage(req.body);
  if (!event.phone || !event.message || event.fromMe) {
    return res.json({ ok: true, ignored: true });
  }

  const company = req.query.companyId ? await getCompany(req.query.companyId) : await getCompanyByInstance(event.instance);
  const result = await handleConversation({ company, phone: event.phone, body: event.message, rawPayload: req.body });
  const outbound = await sendWhatsAppText(company, result.phone, result.reply);
  res.json({ ok: true, reply: result.reply, outbound });
});

router.get('/status', async (req, res) => {
  const db = requireSupabase();
  const company = await getCompany(req.query.companyId || process.env.DEFAULT_COMPANY_ID);
  const settings = settingsFromCompany(company);
  const supabaseCheck = await db.from('companies').select('id').eq('id', company.id).limit(1);
  const evolution = await getEvolutionInstanceStatus(company);
  const sheets = await fetchGoogleSheetFaqs(settings).then((rows) => ({ ok: true, count: rows.length })).catch((error) => ({
    ok: false,
    error: error.message
  }));

  res.json({
    backend: { ok: true },
    supabase: { ok: !supabaseCheck.error },
    evolution,
    openrouter: { ok: Boolean(process.env.OPENROUTER_API_KEY), model: settings.assistant.model },
    googleSheets: settings.google_sheets.enabled ? sheets : { ok: true, enabled: false },
    dashboard: { url: process.env.DASHBOARD_PUBLIC_URL || null }
  });
});

router.use(requireAuth);

router.get('/companies', async (req, res) => {
  const db = requireSupabase();
  const request = req.user.role === 'super_admin'
    ? db.from('companies').select('id, name, slug, logo_url, primary_color, created_at').order('created_at', { ascending: false })
    : db.from('companies').select('id, name, slug, logo_url, primary_color, created_at').eq('id', tenantId(req));
  const { data, error } = await request;
  if (error) throw error;
  res.json(data || []);
});

router.post('/companies', async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Apenas super_admin pode criar empresas.' });
  const schema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    adminEmail: z.string().email().optional().or(z.literal('')),
    adminPassword: z.string().min(6).optional().or(z.literal(''))
  });
  const input = schema.parse(req.body);
  const db = requireSupabase();
  const { data, error } = await db.from('companies').insert({ name: input.name, slug: input.slug, evolution_instance_name: input.slug }).select('*').single();
  if (error) throw error;
  if (input.adminEmail && input.adminPassword) {
    const user = await db.from('app_users').insert({
      company_id: data.id,
      name: 'Administrador',
      email: input.adminEmail,
      password_hash: hashPassword(input.adminPassword),
      role: 'admin'
    });
    if (user.error) throw user.error;
  }
  res.status(201).json(data);
});

router.get('/settings', async (req, res) => {
  const company = await getCompany(tenantId(req));
  res.json(settingsFromCompany(company));
});

router.put('/settings', async (req, res) => {
  res.json(await updateCompanySettings(tenantId(req), req.body || {}));
});

router.get('/clients', async (req, res) => {
  const db = requireSupabase();
  const { data, error } = await db
    .from('clients')
    .select('*')
    .eq('company_id', tenantId(req))
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  res.json(data || []);
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
  const db = requireSupabase();
  const { data, error } = await db
    .from('clients')
    .insert({ ...input, email: input.email || null, company_id: tenantId(req) })
    .select('*')
    .single();
  if (error) throw error;
  res.status(201).json(data);
});

router.get('/messages', async (req, res) => {
  const db = requireSupabase();
  const { data, error } = await db
    .from('messages')
    .select('*')
    .eq('company_id', tenantId(req))
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw error;
  res.json(data || []);
});

router.get('/conversations', async (req, res) => {
  const db = requireSupabase();
  const { data, error } = await db
    .from('conversation_sessions')
    .select('*, clients(full_name, email)')
    .eq('company_id', tenantId(req))
    .order('updated_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  res.json(data || []);
});

router.get('/appointments', async (req, res) => {
  const db = requireSupabase();
  const { data, error } = await db
    .from('appointments')
    .select('*, clients(full_name, phone)')
    .eq('company_id', tenantId(req))
    .order('starts_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  res.json((data || []).map(flattenAppointment));
});

router.post('/appointments', async (req, res) => {
  const schema = z.object({
    client_id: z.string().uuid(),
    starts_at: z.string().datetime(),
    ends_at: z.string().datetime(),
    notes: z.string().optional()
  });
  const input = schema.parse(req.body);
  const company = await getCompany(tenantId(req));
  const slots = await getAvailableSlots({ company, from: input.starts_at, to: input.ends_at });
  const requestedStart = new Date(input.starts_at).getTime();
  const requestedEnd = new Date(input.ends_at).getTime();
  const allowed = slots.some((slot) => (
    new Date(slot.startsAt).getTime() === requestedStart &&
    new Date(slot.endsAt).getTime() === requestedEnd
  ));
  if (!allowed) return res.status(409).json({ error: 'Horario indisponivel ou com menos de 6 horas de antecedencia.' });

  const db = requireSupabase();
  const { data, error } = await db
    .from('appointments')
    .insert({ ...input, company_id: company.id, status: 'scheduled' })
    .select('*')
    .single();
  if (error) throw error;
  res.status(201).json(data);
});

router.get('/availability', async (req, res) => {
  const company = await getCompany(tenantId(req));
  res.json(await getAvailableSlots({ company, from: req.query.from, to: req.query.to }));
});

router.get('/availability/blocks', async (req, res) => {
  const db = requireSupabase();
  const { data, error } = await db
    .from('availability_blocks')
    .select('*')
    .eq('company_id', tenantId(req))
    .order('starts_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  res.json(data || []);
});

router.post('/availability/block', async (req, res) => {
  const schema = z.object({
    title: z.string().min(2),
    starts_at: z.string().datetime(),
    ends_at: z.string().datetime(),
    block_type: z.enum(['manual', 'holiday', 'vacation']).default('manual')
  });
  const input = schema.parse(req.body);
  const db = requireSupabase();
  const { data, error } = await db
    .from('availability_blocks')
    .insert({ ...input, company_id: tenantId(req) })
    .select('*')
    .single();
  if (error) throw error;
  res.status(201).json(data);
});

router.delete('/availability/block/:id', async (req, res) => {
  const db = requireSupabase();
  const { error } = await db
    .from('availability_blocks')
    .delete()
    .eq('company_id', tenantId(req))
    .eq('id', req.params.id);
  if (error) throw error;
  res.status(204).end();
});

router.get('/faqs', async (req, res) => {
  const db = requireSupabase();
  const { data, error } = await db
    .from('faq_items')
    .select('*')
    .eq('company_id', tenantId(req))
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json(data || []);
});

router.post('/faqs', async (req, res) => {
  const schema = z.object({
    question: z.string().min(3),
    answer: z.string().min(3),
    keywords: z.array(z.string()).default([]),
    active: z.boolean().default(true)
  });
  const input = schema.parse(req.body);
  const db = requireSupabase();
  const { data, error } = await db
    .from('faq_items')
    .insert({ ...input, company_id: tenantId(req) })
    .select('*')
    .single();
  if (error) throw error;
  res.status(201).json(data);
});

router.get('/faqs/google-sheets/preview', async (req, res) => {
  const company = await getCompany(tenantId(req));
  const rows = await fetchGoogleSheetFaqs(settingsFromCompany(company));
  res.json({ ok: true, count: rows.length, rows: rows.slice(0, 20) });
});

router.get('/evolution/status', async (req, res) => {
  res.json(await getEvolutionInstanceStatus(await getCompany(tenantId(req))));
});

router.post('/evolution/instance', async (req, res) => {
  res.json(await createEvolutionInstance(await getCompany(tenantId(req))));
});

router.post('/evolution/webhook', async (req, res) => {
  res.json(await configureEvolutionWebhook(await getCompany(tenantId(req))));
});

router.get('/evolution/qrcode', async (req, res) => {
  res.json(await getEvolutionQrCode(await getCompany(tenantId(req))));
});

router.get('/logs', async (req, res) => {
  const db = requireSupabase();
  const messages = await db
    .from('messages')
    .select('created_at, direction, phone, body')
    .eq('company_id', tenantId(req))
    .order('created_at', { ascending: false })
    .limit(100);
  if (messages.error) throw messages.error;

  const sessions = await db
    .from('conversation_sessions')
    .select('updated_at, phone, state')
    .eq('company_id', tenantId(req))
    .order('updated_at', { ascending: false })
    .limit(50);
  if (sessions.error) throw sessions.error;

  res.json({
    application: [
      ...(messages.data || []).map((row) => ({
        time: row.created_at,
        type: `message:${row.direction}`,
        detail: `${row.phone} - ${row.body}`
      })),
      ...(sessions.data || []).map((row) => ({
        time: row.updated_at,
        type: 'session',
        detail: `${row.phone} - ${row.state}`
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 120)
  });
});
