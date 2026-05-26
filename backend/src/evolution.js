import axios from 'axios';
import { logger } from './logger.js';

function configForCompany(company = {}) {
  return {
    baseURL: company.evolution_base_url || process.env.EVOLUTION_API_URL || process.env.EVOLUTION_BASE_URL,
    apiKey: company.evolution_api_key || process.env.EVOLUTION_API_KEY,
    instance: company.evolution_instance_name || process.env.EVOLUTION_INSTANCE_NAME || 'arthilles'
  };
}

function headers(apiKey) {
  return { apikey: apiKey };
}

export async function sendWhatsAppText(company, phone, text) {
  const config = configForCompany(company);
  if (!config.baseURL || !config.apiKey) {
    logger.warn({ phone }, 'Evolution API not configured; outbound message skipped');
    return { ok: false, skipped: true };
  }

  try {
    const response = await axios.post(
      `${config.baseURL}/message/sendText/${config.instance}`,
      { number: phone, text },
      { headers: headers(config.apiKey), timeout: 15000 }
    );
    return { ok: true, data: response.data };
  } catch (error) {
    logger.error({ err: error.response?.data || error.message, phone }, 'Evolution sendText failed');
    return { ok: false, error: error.response?.data || error.message };
  }
}

export async function configureEvolutionWebhook(company) {
  const config = configForCompany(company);
  const publicUrl = process.env.BACKEND_PUBLIC_URL;
  if (!config.baseURL || !config.apiKey || !publicUrl || !company?.id) {
    return { ok: false, skipped: true, error: 'Evolution ou BACKEND_PUBLIC_URL nao configurados' };
  }

  const webhookUrl = `${publicUrl.replace(/\/$/, '')}/webhook/evolution?companyId=${company.id}`;
  try {
    const response = await axios.post(
      `${config.baseURL}/webhook/set/${config.instance}`,
      {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        events: ['MESSAGES_UPSERT']
      },
      { headers: headers(config.apiKey), timeout: 15000 }
    );
    return { ok: true, instance: config.instance, webhookUrl, data: response.data };
  } catch (error) {
    return { ok: false, instance: config.instance, webhookUrl, error: error.response?.data || error.message };
  }
}

export async function getEvolutionInstanceStatus(company) {
  const config = configForCompany(company);
  if (!config.baseURL || !config.apiKey) return { ok: false, error: 'Evolution API nao configurada' };

  try {
    const response = await axios.get(`${config.baseURL}/instance/connectionState/${config.instance}`, {
      headers: headers(config.apiKey),
      timeout: 10000
    });
    return { ok: true, instance: config.instance, data: response.data };
  } catch (error) {
    return { ok: false, instance: config.instance, error: error.response?.data || error.message };
  }
}

export async function createEvolutionInstance(company) {
  const config = configForCompany(company);
  if (!config.baseURL || !config.apiKey) return { ok: false, error: 'Evolution API nao configurada' };

  try {
    const response = await axios.post(
      `${config.baseURL}/instance/create`,
      {
        instanceName: config.instance,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      },
      { headers: headers(config.apiKey), timeout: 20000 }
    );
    const webhook = await configureEvolutionWebhook(company);
    return { ok: true, instance: config.instance, webhook, data: response.data };
  } catch (error) {
    const message = error.response?.data || error.message;
    if (JSON.stringify(message).toLowerCase().includes('already')) {
      return { ok: true, instance: config.instance, data: message };
    }
    return { ok: false, instance: config.instance, error: message };
  }
}

export async function getEvolutionQrCode(company) {
  const config = configForCompany(company);
  if (!config.baseURL || !config.apiKey) return { ok: false, error: 'Evolution API nao configurada' };

  const requestConfig = { headers: headers(config.apiKey), timeout: 15000 };
  const attempts = [
    { method: 'get', url: `${config.baseURL}/instance/connect/${config.instance}` },
    { method: 'get', url: `${config.baseURL}/instance/qrcode/${config.instance}` }
  ];

  for (const attempt of attempts) {
    try {
      const response = await axios({ ...attempt, ...requestConfig });
      return { ok: true, instance: config.instance, data: response.data };
    } catch (error) {
      logger.warn({ err: error.response?.data || error.message, url: attempt.url }, 'Evolution QR attempt failed');
    }
  }

  return { ok: false, instance: config.instance, error: 'Nao foi possivel obter QR Code da Evolution API' };
}
