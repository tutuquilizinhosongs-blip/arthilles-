import { createClient } from '@supabase/supabase-js';
import { companyIdFromEvolutionInstance, evolutionInstanceForCompanyId } from './evolutionInstance.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase nao configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  }
  return supabase;
}

export function defaultBusinessHours() {
  return {
    days: [1, 2, 3, 4, 5],
    start: '13:30',
    end: '16:30',
    slotMinutes: 60,
    minimumNoticeHours: 6
  };
}

export function normalizeCompany(company = {}) {
  const settings = company.settings || {};
  const business = { ...defaultBusinessHours(), ...(settings.business_hours || {}) };
  const instanceName =
    evolutionInstanceForCompanyId(company.id) ||
    company.evolution_instance_name ||
    process.env.EVOLUTION_INSTANCE_NAME ||
    'arthilles';

  return {
    ...company,
    evolution_instance_name: instanceName,
    settings: {
      welcomeMessage: settings.welcomeMessage || 'Ola! Sou o assistente virtual. Posso tirar duvidas ou agendar um horario.',
      business_hours: business,
      assistant: {
        enabled: settings.assistant?.enabled !== false,
        provider: 'openrouter'
      }
    }
  };
}

export async function getCompany(companyId) {
  const db = requireSupabase();
  const targetId = companyId || process.env.DEFAULT_COMPANY_ID;
  let request = db.from('companies').select('*');

  request = targetId ? request.eq('id', targetId).maybeSingle() : request.limit(1).maybeSingle();
  const { data, error } = await request;
  if (error) throw error;
  if (!data) throw new Error('Empresa nao encontrada no Supabase.');
  return normalizeCompany(data);
}

export async function getCompanyByInstance(instanceName) {
  const db = requireSupabase();
  const companyId = companyIdFromEvolutionInstance(instanceName);

  if (companyId) {
    const { data, error } = await db
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .maybeSingle();
    if (error) throw error;
    if (data) return normalizeCompany(data);
  }

  if (instanceName) {
    const { data, error } = await db
      .from('companies')
      .select('*')
      .eq('evolution_instance_name', instanceName)
      .maybeSingle();
    if (error) throw error;
    if (data) return normalizeCompany(data);
  }

  return getCompany();
}

export function settingsFromCompany(company) {
  const normalized = normalizeCompany(company);
  const settings = normalized.settings || {};
  const envGoogleSheets = process.env.GOOGLE_SHEETS_CSV_URL || '';

  return {
    company: {
      id: normalized.id,
      name: normalized.name || 'Arthilles',
      slug: normalized.slug || 'arthilles',
      welcomeMessage: settings.welcomeMessage
    },
    theme: {
      logoUrl: normalized.logo_url || '',
      primaryColor: normalized.primary_color || '#176b87',
      accentColor: normalized.accent_color || '#2f7d32'
    },
    business_hours: settings.business_hours || defaultBusinessHours(),
    google_sheets: {
      enabled: Boolean(normalized.google_sheets_url || envGoogleSheets),
      csvUrl: normalized.google_sheets_url || envGoogleSheets,
      instructions: 'Use uma planilha publica com colunas pergunta,resposta,palavras.'
    },
    assistant: {
      enabled: settings.assistant?.enabled !== false,
      provider: 'openrouter',
      model: normalized.openrouter_model || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free'
    },
    evolution: {
      configured: Boolean(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY)
    }
  };
}

export async function updateCompanySettings(companyId, payload = {}) {
  const db = requireSupabase();
  const current = await getCompany(companyId);
  const currentSettings = current.settings || {};
  const nextSettings = {
    ...currentSettings,
    welcomeMessage: payload.company?.welcomeMessage ?? currentSettings.welcomeMessage,
    business_hours: {
      ...(currentSettings.business_hours || defaultBusinessHours()),
      ...(payload.business_hours || {})
    },
    assistant: {
      ...(currentSettings.assistant || {}),
      ...(payload.assistant || {})
    }
  };

  const changes = {
    name: payload.company?.name ?? current.name,
    logo_url: payload.theme?.logoUrl ?? current.logo_url,
    primary_color: payload.theme?.primaryColor ?? current.primary_color,
    accent_color: payload.theme?.accentColor ?? current.accent_color,
    google_sheets_url: payload.google_sheets?.csvUrl ?? current.google_sheets_url,
    openrouter_model: payload.assistant?.model ?? current.openrouter_model,
    settings: nextSettings,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await db
    .from('companies')
    .update(changes)
    .eq('id', companyId)
    .select('*')
    .single();

  if (error) throw error;
  return settingsFromCompany(data);
}
