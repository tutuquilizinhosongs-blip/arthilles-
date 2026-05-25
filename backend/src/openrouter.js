import axios from 'axios';

export async function askOpenRouter({ company, settings, context, message, faqs = [] }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const assistant = settings?.assistant || {};
  if (!apiKey || assistant.enabled === false) return null;

  const model = assistant.model || company?.openrouter_model || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';
  const faqContext = faqs.slice(0, 8).map((item) => `Pergunta: ${item.question}\nResposta: ${item.answer}`).join('\n\n');

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages: [
        {
          role: 'system',
          content: [
            `Voce e o atendente virtual da empresa ${settings?.company?.name || company?.name || 'Arthilles'}.`,
            'Responda em portugues do Brasil, com clareza, educacao e objetividade.',
            'Quando a pessoa quiser agendar, nao invente horarios. Oriente a responder "agendar" para o fluxo de agenda.',
            'Use a base de FAQ quando ela for relevante.',
            faqContext ? `FAQ disponivel:\n${faqContext}` : '',
            `Contexto operacional: ${JSON.stringify(context || {})}`
          ].filter(Boolean).join('\n')
        },
        { role: 'user', content: String(message || '') }
      ]
    }, {
      timeout: 25000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.DASHBOARD_PUBLIC_URL || 'https://arthilles.app',
        'X-Title': 'ArthillesBot'
      }
    });

    return response.data?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}
