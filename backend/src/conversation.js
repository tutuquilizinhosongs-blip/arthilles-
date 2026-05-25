import { getAvailableSlots } from './availability.js';
import { fetchGoogleSheetFaqs } from './googleSheets.js';
import { askOpenRouter } from './openrouter.js';
import { requireSupabase, settingsFromCompany } from './db.js';

const fields = [
  ['full_name', 'Qual e o seu nome completo?'],
  ['email', 'Qual e o seu email?'],
  ['company_type', 'Qual e o tipo da sua empresa?'],
  ['city_state', 'Qual e sua cidade/estado?'],
  ['main_problem', 'Qual e a principal necessidade que voce quer resolver?']
];

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function normalizeText(message) {
  return String(message || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function splitCityState(value) {
  const [city, state] = String(value || '').split('/').map((item) => item?.trim());
  return { city: city || value || null, state: state || null };
}

function wantsScheduling(message) {
  return /\b(agenda|agendar|reuniao|marcar|horario|consulta|call|visita)\b/i.test(normalizeText(message));
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

async function storeMessage(companyId, phone, direction, body, rawPayload = null) {
  const db = requireSupabase();
  const { error } = await db.from('messages').insert({
    company_id: companyId,
    phone,
    direction,
    body,
    raw_payload: rawPayload
  });
  if (error) throw error;
}

async function getSession(companyId, phone) {
  const db = requireSupabase();
  const { data, error } = await db
    .from('conversation_sessions')
    .upsert({ company_id: companyId, phone, updated_at: new Date().toISOString() }, { onConflict: 'company_id,phone' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function updateSession(companyId, phone, state, data, clientId = null) {
  const db = requireSupabase();
  const update = {
    state,
    data,
    updated_at: new Date().toISOString()
  };
  if (clientId) update.client_id = clientId;

  const { error } = await db
    .from('conversation_sessions')
    .update(update)
    .eq('company_id', companyId)
    .eq('phone', phone);
  if (error) throw error;
}

async function upsertClient(companyId, phone, data) {
  const db = requireSupabase();
  const { city, state } = splitCityState(data.city_state);
  const { data: client, error } = await db
    .from('clients')
    .upsert({
      company_id: companyId,
      full_name: data.full_name,
      phone,
      email: data.email || null,
      company_type: data.company_type || null,
      city,
      state,
      main_problem: data.main_problem || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'company_id,phone' })
    .select('*')
    .single();
  if (error) throw error;
  return client;
}

async function localFaqs(companyId) {
  const db = requireSupabase();
  const { data, error } = await db
    .from('faq_items')
    .select('question, answer, keywords')
    .eq('company_id', companyId)
    .eq('active', true)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function findFaqAnswer(company, settings, message) {
  const terms = normalizeText(message).split(/\s+/).filter((term) => term.length > 2);
  const sheetFaqs = await fetchGoogleSheetFaqs(settings).catch(() => []);
  const savedFaqs = await localFaqs(company.id);
  const faqs = [...sheetFaqs, ...savedFaqs];

  for (const item of faqs) {
    const haystack = normalizeText(`${item.question} ${(item.keywords || []).join(' ')}`);
    if (terms.some((term) => haystack.includes(term))) return { answer: item.answer, faqs };
  }

  return { answer: null, faqs };
}

export async function handleConversation({ company, phone: rawPhone, body, rawPayload }) {
  const db = requireSupabase();
  const phone = normalizePhone(rawPhone);
  const cleanBody = String(body || '').trim();
  const settings = settingsFromCompany(company);

  await storeMessage(company.id, phone, 'inbound', cleanBody, rawPayload);

  const session = await getSession(company.id, phone);
  const data = session.data || {};
  let reply;

  if (['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'inicio', 'iniciar'].includes(normalizeText(cleanBody))) {
    await updateSession(company.id, phone, 'greeting', {});
    reply = `${settings.company.welcomeMessage}\n\nPosso tirar duvidas ou agendar um atendimento. Para agendar, responda "agendar".`;
  } else if (wantsScheduling(cleanBody) && !['collecting', 'scheduling'].includes(session.state)) {
    await updateSession(company.id, phone, 'collecting', {});
    reply = `Claro. Vou coletar seus dados para agendar.\n${fields[0][1]}`;
  } else if (session.state === 'collecting') {
    const nextField = fields.find(([key]) => !data[key]);
    if (nextField && cleanBody) data[nextField[0]] = cleanBody;

    const missing = fields.find(([key]) => !data[key]);
    if (missing) {
      await updateSession(company.id, phone, 'collecting', data);
      reply = missing[1];
    } else {
      const client = await upsertClient(company.id, phone, data);
      const slots = await getAvailableSlots({ company });
      data.availableSlots = slots.slice(0, 6);
      await updateSession(company.id, phone, 'scheduling', data, client.id);
      reply = `Cadastro salvo, ${client.full_name}.\n${formatSlots(slots)}`;
    }
  } else if (session.state === 'scheduling') {
    const index = Number(cleanBody) - 1;
    const selected = data.availableSlots?.[index];
    if (!selected) {
      reply = 'Responda com o numero de um horario da lista para confirmar o agendamento.';
    } else {
      const { data: appointment, error } = await db
        .from('appointments')
        .insert({
          company_id: company.id,
          client_id: session.client_id,
          starts_at: selected.startsAt,
          ends_at: selected.endsAt,
          status: 'scheduled'
        })
        .select('*')
        .single();
      if (error) throw error;

      await updateSession(company.id, phone, 'scheduled', { appointmentId: appointment.id }, session.client_id);
      const date = new Date(selected.startsAt).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo'
      });
      reply = `Agendamento confirmado para ${date}. Obrigado!`;
    }
  } else {
    const faq = await findFaqAnswer(company, settings, cleanBody);
    const ai = faq.answer || await askOpenRouter({
      company,
      settings,
      context: { state: session.state, phone },
      message: cleanBody,
      faqs: faq.faqs
    });
    reply = ai || 'Posso responder duvidas ou agendar um atendimento. Para comecar um agendamento, envie "agendar".';
  }

  await storeMessage(company.id, phone, 'outbound', reply);
  return { phone, reply };
}
