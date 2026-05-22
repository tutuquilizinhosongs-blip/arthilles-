import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function getSettingsMap() {
  const result = await query('SELECT key, value FROM settings ORDER BY key');
  return Object.fromEntries(result.rows.map((row) => [row.key, row.value]));
}

export async function ensureApplicationSchema() {
  await query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS faq_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      keywords TEXT[] NOT NULL DEFAULT '{}',
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    INSERT INTO settings (key, value) VALUES
    ('whatsapp', '{"instance":"arthilles","connected":false}'::jsonb),
    ('faq', '{"enabled":true,"preferFaq":true}'::jsonb)
    ON CONFLICT (key) DO NOTHING;

    INSERT INTO faq_items (question, answer, keywords) VALUES
    ('Como funciona o atendimento?', 'Nos fazemos um diagnostico inicial pelo WhatsApp e, se fizer sentido, agendamos uma reuniao.', ARRAY['atendimento','funciona','como funciona']),
    ('Quais horarios estao disponiveis?', 'Os horarios disponiveis aparecem automaticamente durante o agendamento, respeitando agenda, bloqueios e antecedencia minima.', ARRAY['horario','agenda','disponivel']),
    ('A IA e paga?', 'Nao. O ArthillesBot usa Ollama com modelo open source local, sem OpenAI paga.', ARRAY['ia','openai','paga','ollama'])
    ON CONFLICT DO NOTHING;
  `);
}
