import { query, getSettingsMap } from './db.js';
import { getAvailableSlots } from './availability.js';
import { askLocalAssistant } from './ollama.js';
import { fetchGoogleSheetFaqs } from './googleSheets.js';

const fields = [
  ['full_name', 'Qual e o seu nome completo?'],
  ['email', 'Qual e o seu email?'],
  ['company_type', 'Qual e o tipo da sua empresa?'],
  ['city_state', 'Qual e sua cidade e estado?'],
  ['main_problem', 'Qual e a principal necessidade que voce quer resolver?']
];

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function splitCityState(value) {
  const [city, state] = String(value || '').split('/').map((item) => item?.trim());
  return { city: city || value || null, state: state || null };
}

async function getSession(phone) {
  const result = await query(
    `INSERT INTO conversation_sessions (phone)
     VALUES ($1)
     ON CONFLICT (phone) DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [phone]
  );
  return result.rows[0];
}

async function updateSession(phone, state, data, clientId = null) {
  await query(
    `UPDATE conversation_sessions
     SET state = $2, data = $3::jsonb, client_id = COALESCE($4, client_id), updated_at = NOW()
     WHERE phone = $1`,
    [phone, state, JSON.stringify(data), clientId]
  );
}

async function upsertClient(phone, data) {
  const { city, state } = splitCityState(data.city_state);
  const result = await query(
    `INSERT INTO clients (full_name, phone, email, company_type, city, state, main_problem)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (phone) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       email = EXCLUDED.email,
       company_type = EXCLUDED.company_type,
       city = EXCLUDED.city,
       state = EXCLUDED.state,
       main_problem = EXCLUDED.main_problem,
       updated_at = NOW()
     RETURNING *`,
    [data.full_name, phone, data.email, data.company_type, city, state, data.main_problem]
  );
  return result.rows[0];
}

function formatSlots(slots) {
  if (!slots.length) return 'Nao encontrei horarios disponiveis nos proximos dias. Posso avisar quando abrir uma vaga.';
  return [
    'Horarios disponiveis:',
    ...slots.slice(0, 6).map((slot, index) => {
      const date = new Date(slot.startsAt);
      return `${index + 1}. ${date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })}`;
    }),
    'Responda com o numero do horario desejado.'
  ].join('\n');
}

function normalizeText(message) {
  return String(message || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function wantsScheduling(message) {
  return /\b(agenda|agendar|reuniao|marcar|horario|consulta|call)\b/i.test(normalizeText(message));
}

async function findFaqAnswer(message) {
  const terms = normalizeText(message).split(/\s+/).filter((term) => term.length > 2);
  const settings = await getSettingsMap();
  const sheetFaqs = await fetchGoogleSheetFaqs(settings).catch(() => []);
  const result = await query(
    `SELECT question, answer, keywords
     FROM faq_items
     WHERE active = true
     ORDER BY updated_at DESC`
  );

  for (const item of [...sheetFaqs, ...result.rows]) {
    const haystack = normalizeText(`${item.question} ${(item.keywords || []).join(' ')}`);
    if (terms.some((term) => haystack.includes(term))) return item.answer;
  }

  return null;
}

export async function handleConversation({ phone: rawPhone, body }) {
  const phone = normalizePhone(rawPhone);
  const cleanBody = String(body || '').trim();
  await query(
    'INSERT INTO messages (phone, direction, body) VALUES ($1, $2, $3)',
    [phone, 'inbound', cleanBody]
  );

  const session = await getSession(phone);
  const data = session.data || {};
  const settings = await getSettingsMap();
  const company = settings.company || {};
  let reply;

  if (['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'inicio'].includes(normalizeText(cleanBody))) {
    await updateSession(phone, 'collecting', {});
    reply = `${company.welcomeMessage || 'Ola! Vou fazer seu cadastro rapido para encontrar um horario.'}\n${fields[0][1]}`;
  } else if (session.state === 'greeting' && wantsScheduling(cleanBody)) {
    await updateSession(phone, 'collecting', {});
    reply = `Claro. Vou coletar seus dados para agendar.\n${fields[0][1]}`;
  } else if (session.state === 'greeting') {
    const faq = await findFaqAnswer(cleanBody);
    const assistantEnabled = settings.assistant?.enabled !== false;
    const ai = faq || (assistantEnabled ? await askLocalAssistant({ state: session.state, faqMatched: Boolean(faq) }, cleanBody) : null);
    reply = ai || 'Posso responder duvidas ou agendar uma reuniao. Para comecar um agendamento, envie "agendar".';
  } else if (session.state === 'collecting') {
    const nextField = fields.find(([key]) => !data[key]);
    if (nextField && cleanBody) {
      data[nextField[0]] = cleanBody;
    }

    const missing = fields.find(([key]) => !data[key]);
    if (missing) {
      await updateSession(phone, 'collecting', data);
      reply = missing[1];
    } else {
      const client = await upsertClient(phone, data);
      const slots = await getAvailableSlots({});
      data.availableSlots = slots.slice(0, 6);
      await updateSession(phone, 'scheduling', data, client.id);
      reply = `Cadastro salvo, ${client.full_name}.\n${formatSlots(slots)}`;
    }
  } else if (session.state === 'scheduling') {
    const index = Number(cleanBody) - 1;
    const selected = data.availableSlots?.[index];
    if (!selected) {
      reply = 'Responda com o numero de um horario da lista para agendar.';
    } else {
      const result = await query(
        `INSERT INTO appointments (client_id, starts_at, ends_at, status)
         VALUES ($1, $2, $3, 'scheduled')
         RETURNING *`,
        [session.client_id, selected.startsAt, selected.endsAt]
      );
      await updateSession(phone, 'scheduled', { appointmentId: result.rows[0].id }, session.client_id);
      const date = new Date(selected.startsAt).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo'
      });
      reply = `Agendamento confirmado para ${date}. Obrigado!`;
    }
  } else {
    const faq = await findFaqAnswer(cleanBody);
    const ai = faq || (settings.assistant?.enabled !== false ? await askLocalAssistant({ state: session.state }, cleanBody) : null);
    reply = ai || 'Seu atendimento ja esta registrado. Para iniciar novamente, envie "oi".';
  }

  await query(
    'INSERT INTO messages (phone, direction, body) VALUES ($1, $2, $3)',
    [phone, 'outbound', reply]
  );
  return { phone, reply };
}
