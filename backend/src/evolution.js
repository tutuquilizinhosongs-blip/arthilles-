import axios from 'axios';
import { logger } from './logger.js';

const baseURL = process.env.EVOLUTION_BASE_URL || 'http://evolution-api:8080';
const apiKey = process.env.EVOLUTION_API_KEY;
const instance = process.env.EVOLUTION_INSTANCE_NAME || 'arthilles';

export async function sendWhatsAppText(phone, text) {
  if (!apiKey) {
    logger.warn({ phone }, 'Evolution API key not configured; skipping outbound WhatsApp message');
    return;
  }

  try {
    await axios.post(
      `${baseURL}/message/sendText/${instance}`,
      { number: phone, text },
      { headers: { apikey: apiKey }, timeout: 15000 }
    );
  } catch (error) {
    logger.error({ err: error.message, phone }, 'Failed to send WhatsApp message through Evolution API');
  }
}

export async function configureEvolutionWebhook() {
  const webhookUrl = process.env.EVOLUTION_WEBHOOK_URL;
  if (!apiKey || !webhookUrl) return;

  try {
    await axios.post(
      `${baseURL}/webhook/set/${instance}`,
      {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        events: ['MESSAGES_UPSERT']
      },
      { headers: { apikey: apiKey }, timeout: 15000 }
    );
    logger.info({ webhookUrl }, 'Evolution webhook configured');
  } catch (error) {
    logger.warn({ err: error.message }, 'Could not auto-configure Evolution webhook yet');
  }
}

export async function getEvolutionInstanceStatus() {
  if (!apiKey) return { ok: false, error: 'Evolution API key not configured' };

  try {
    const response = await axios.get(`${baseURL}/instance/connectionState/${instance}`, {
      headers: { apikey: apiKey },
      timeout: 10000
    });
    return { ok: true, instance, data: response.data };
  } catch (error) {
    return { ok: false, instance, error: error.response?.data || error.message };
  }
}

export async function createEvolutionInstance() {
  if (!apiKey) return { ok: false, error: 'Evolution API key not configured' };

  try {
    const response = await axios.post(
      `${baseURL}/instance/create`,
      {
        instanceName: instance,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      },
      { headers: { apikey: apiKey }, timeout: 20000 }
    );
    await configureEvolutionWebhook();
    return { ok: true, instance, data: response.data };
  } catch (error) {
    const message = error.response?.data || error.message;
    if (JSON.stringify(message).toLowerCase().includes('already')) {
      return { ok: true, instance, data: message };
    }
    return { ok: false, instance, error: message };
  }
}

export async function getEvolutionQrCode() {
  if (!apiKey) return { ok: false, error: 'Evolution API key not configured' };

  const status = await getEvolutionInstanceStatus();
  if (!status.ok && JSON.stringify(status.error).includes('does not exist')) {
    await createEvolutionInstance();
  }

  const headers = { apikey: apiKey };
  const attempts = [
    { method: 'get', url: `${baseURL}/instance/connect/${instance}` },
    { method: 'get', url: `${baseURL}/instance/qrcode/${instance}` }
  ];

  for (const attempt of attempts) {
    try {
      const response = await axios({ ...attempt, headers, timeout: 15000 });
      return { ok: true, instance, data: response.data };
    } catch (error) {
      logger.warn({ err: error.message, url: attempt.url }, 'Evolution QR attempt failed');
    }
  }

  return { ok: false, instance, error: 'Could not get QR code from Evolution API' };
}
