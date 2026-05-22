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
