-- ============================================================
-- ArthillesBot - Schema Supabase (Plano Gratuito)
-- ============================================================
-- IMPORTANTE SOBRE O USUARIO INICIAL (BOOTSTRAP):
-- O hash abaixo usa a string literal 'change_me_auth_secret'.
-- Para o login inicial funcionar:
--   1. No Railway, defina AUTH_SECRET=change_me_auth_secret (temporariamente)
--   2. Rode este schema
--   3. Depois troque para um segredo forte e rode o SQL de correcao abaixo
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text not null default '#176b87',
  accent_color text not null default '#2f7d32',
  timezone text not null default 'America/Sao_Paulo',
  settings jsonb not null default '{
    "welcomeMessage": "Ola! Sou o assistente virtual. Posso tirar duvidas ou agendar um horario.",
    "business_hours": {
      "days": [1, 2, 3, 4, 5],
      "start": "13:30",
      "end": "16:30",
      "slotMinutes": 60,
      "minimumNoticeHours": 6
    },
    "assistant": {
      "enabled": true,
      "provider": "openrouter"
    }
  }'::jsonb,
  google_sheets_url text,
  openrouter_model text default 'meta-llama/llama-3.1-8b-instruct:free',
  evolution_base_url text,
  evolution_api_key text,
  evolution_instance_name text not null default 'arthilles',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  company_type text,
  city text,
  state text,
  main_problem text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, phone)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  phone text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  provider_message_id text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  phone text not null,
  state text not null default 'greeting',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, phone)
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  block_type text not null default 'manual',
  created_at timestamptz not null default now()
);

create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  question text not null,
  answer text not null,
  keywords text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_company_idx on public.clients(company_id, created_at desc);
create index if not exists messages_company_idx on public.messages(company_id, created_at desc);
create index if not exists appointments_company_time_idx on public.appointments(company_id, starts_at desc);
create index if not exists availability_blocks_company_time_idx on public.availability_blocks(company_id, starts_at desc);
create index if not exists faq_items_company_active_idx on public.faq_items(company_id, active);

insert into public.companies (id, name, slug, evolution_instance_name)
values ('00000000-0000-0000-0000-000000000001', 'Arthilles Demo', 'arthilles-demo', 'arthilles-demo')
on conflict (id) do nothing;

-- Usuario inicial (bootstrap) - veja aviso no topo do arquivo
insert into public.app_users (company_id, name, email, password_hash, role)
values (
  '00000000-0000-0000-0000-000000000001',
  'Administrador',
  'admin@arthilles.local',
  encode(digest('admin123:change_me_auth_secret', 'sha256'), 'hex'),
  'super_admin'
)
on conflict (email) do nothing;

insert into public.faq_items (company_id, question, answer, keywords)
values
  ('00000000-0000-0000-0000-000000000001', 'Como funciona o atendimento?', 'O atendimento automatico tira duvidas pelo WhatsApp e encaminha para agendamento quando o cliente quiser falar com a empresa.', array['atendimento', 'funciona']),
  ('00000000-0000-0000-0000-000000000001', 'Quais horarios estao disponiveis?', 'Os horarios aparecem automaticamente respeitando agenda, bloqueios e antecedencia minima.', array['horario', 'agenda', 'disponivel'])
on conflict do nothing;

-- ============================================================
-- SQL PARA CORRIGIR USUARIO APOS MUDAR AUTH_SECRET (execute no SQL Editor)
-- Troque 'SEU_NOVO_AUTH_SECRET_AQUI' e rode:
-- ============================================================
-- UPDATE public.app_users
-- SET password_hash = encode(digest('admin123:SEU_NOVO_AUTH_SECRET_AQUI', 'sha256'), 'hex')
-- WHERE email = 'admin@arthilles.local';
-- ============================================================
