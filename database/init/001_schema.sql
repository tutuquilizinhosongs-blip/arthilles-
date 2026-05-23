CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  company_type TEXT,
  city TEXT,
  state TEXT,
  main_problem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT appointments_valid_range CHECK (ends_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS appointments_unique_active_slot
ON appointments (starts_at)
WHERE status IN ('scheduled', 'confirmed');

CREATE TABLE IF NOT EXISTS availability_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  block_type TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT availability_blocks_valid_range CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  direction TEXT NOT NULL,
  body TEXT NOT NULL,
  provider_message_id TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL DEFAULT 'greeting',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
('business_hours', '{"days":[1,2,3,4,5],"start":"13:30","end":"16:30","slotMinutes":60,"minimumNoticeHours":6}'::jsonb),
('assistant', '{"model":"llama3","enabled":true,"fallbackMessage":"Obrigado pela mensagem. Vou te ajudar com o cadastro e agendamento."}'::jsonb),
('company', '{"name":"Arthilles","timezone":"America/Sao_Paulo","welcomeMessage":"Ola! Sou o assistente virtual. Vou te ajudar com atendimento e agendamento."}'::jsonb),
('whatsapp', '{"instance":"arthilles","connected":false}'::jsonb),
('faq', '{"enabled":true,"preferFaq":true}'::jsonb),
('theme', '{"primaryColor":"#176b87","accentColor":"#2f7d32","logoUrl":""}'::jsonb),
('google_sheets', '{"enabled":false,"csvUrl":"","instructions":"Use uma planilha publica com colunas pergunta,resposta,palavras."}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO faq_items (question, answer, keywords) VALUES
('Como funciona o atendimento?', 'Nos fazemos um diagnostico inicial pelo WhatsApp e, se fizer sentido, agendamos uma reuniao.', ARRAY['atendimento','funciona','como funciona']),
('Quais horarios estao disponiveis?', 'Os horarios disponiveis aparecem automaticamente durante o agendamento, respeitando agenda, bloqueios e antecedencia minima.', ARRAY['horario','agenda','disponivel']),
('A IA e paga?', 'Nao. O ArthillesBot usa Ollama com modelo open source local, sem OpenAI paga.', ARRAY['ia','openai','paga','ollama'])
ON CONFLICT DO NOTHING;
