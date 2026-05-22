import axios from 'axios';

const baseURL = process.env.OLLAMA_BASE_URL || 'http://ollama:11434';
const model = process.env.OLLAMA_MODEL || 'llama3';

export async function askLocalAssistant(context, message) {
  try {
    const response = await axios.post(`${baseURL}/api/generate`, {
      model,
      stream: false,
      prompt: [
        'Voce e o ArthillesBot, um atendente profissional de WhatsApp.',
        'Ajude de forma objetiva, em portugues do Brasil.',
        'Nao invente horarios: quando o assunto for agenda, oriente o usuario a escolher um horario disponivel informado pelo sistema.',
        `Contexto: ${JSON.stringify(context)}`,
        `Mensagem: ${message}`
      ].join('\n')
    }, { timeout: 20000 });

    return response.data?.response?.trim() || null;
  } catch (error) {
    return null;
  }
}
