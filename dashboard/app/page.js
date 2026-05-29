'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  Activity,
  Ban,
  Bot,
  Building2,
  CalendarDays,
  HelpCircle,
  LogOut,
  MessageSquare,
  QrCode,
  RefreshCw,
  Settings,
  Sparkles,
  Users
} from 'lucide-react';

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
}

function dateLabel(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo'
  });
}

async function request(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('arthilles_token') : null;
  const response = await fetch(`${getBackendUrl()}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(await response.text());
  if (response.status === 204) return null;
  return response.json();
}

function qrImage(data) {
  const value = data?.data?.base64 || data?.data?.qrcode?.base64 || data?.data?.code || data?.base64;
  if (!value) return null;
  if (String(value).startsWith('data:image')) return value;
  if (String(value).length > 200) return `data:image/png;base64,${value}`;
  return null;
}

function initialSettings() {
  return {
    companyName: 'Arthilles',
    logoUrl: '',
    primaryColor: '#176b87',
    accentColor: '#2f7d32',
    start: '13:30',
    end: '16:30',
    minimumNoticeHours: 6,
    welcomeMessage: 'Ola! Sou o assistente virtual. Posso tirar duvidas ou agendar um horario.',
    googleSheetsUrl: '',
    aiEnabled: true,
    openrouterModel: 'meta-llama/llama-3.1-8b-instruct:free'
  };
}

export default function Dashboard() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [login, setLogin] = useState({ email: 'admin@arthilles.local', password: 'admin123' });
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [data, setData] = useState({
    health: {},
    companies: [],
    clients: [],
    appointments: [],
    availability: [],
    settings: {},
    messages: [],
    conversations: [],
    faqs: [],
    status: {},
    blocks: [],
    logs: [],
    qr: null,
    whatsapp: {}
  });
  const [settingsForm, setSettingsForm] = useState(initialSettings());
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', keywords: '' });
  const [blockForm, setBlockForm] = useState({ title: '', starts_at: '', ends_at: '', block_type: 'manual' });
  const [companyForm, setCompanyForm] = useState({ name: '', slug: '', adminEmail: '', adminPassword: '' });
  const [qrSrc, setQrSrc] = useState('');
  const [whatsappBusy, setWhatsappBusy] = useState(false);

  const nav = useMemo(() => [
    ['overview', Activity, 'Visao geral'],
    ['companies', Building2, 'Empresas'],
    ['whatsapp', QrCode, 'WhatsApp'],
    ['clients', Users, 'Clientes'],
    ['appointments', CalendarDays, 'Agendamentos'],
    ['blocks', Ban, 'Bloqueios'],
    ['messages', MessageSquare, 'Conversas'],
    ['faqs', HelpCircle, 'Duvidas'],
    ['settings', Settings, 'Configuracoes'],
    ['status', Activity, 'Status']
  ], []);

  function hydrateSettings(settings) {
    setSettingsForm({
      companyName: settings.company?.name || 'Arthilles',
      logoUrl: settings.theme?.logoUrl || '',
      primaryColor: settings.theme?.primaryColor || '#176b87',
      accentColor: settings.theme?.accentColor || '#2f7d32',
      start: settings.business_hours?.start || '13:30',
      end: settings.business_hours?.end || '16:30',
      minimumNoticeHours: settings.business_hours?.minimumNoticeHours || 6,
      welcomeMessage: settings.company?.welcomeMessage || 'Ola! Sou o assistente virtual. Posso tirar duvidas ou agendar um horario.',
      googleSheetsUrl: settings.google_sheets?.csvUrl || '',
      aiEnabled: settings.assistant?.enabled !== false,
      openrouterModel: settings.assistant?.model || 'meta-llama/llama-3.1-8b-instruct:free'
    });
  }

  async function loadAll() {
    setError('');
    const [health, companies, clients, appointments, availability, settings, messages, conversations, faqs, status, blocks, logs, whatsapp] = await Promise.all([
      request('/health').catch(() => ({ ok: false })),
      request('/companies').catch(() => []),
      request('/clients').catch(() => []),
      request('/appointments').catch(() => []),
      request('/availability').catch(() => []),
      request('/settings').catch(() => ({})),
      request('/messages').catch(() => []),
      request('/conversations').catch(() => []),
      request('/faqs').catch(() => []),
      request('/status').catch(() => ({})),
      request('/availability/blocks').catch(() => []),
      request('/logs').catch(() => ({ application: [] })),
      request('/evolution/status').catch(() => ({}))
    ]);
    setData((current) => ({ ...current, health, companies, clients, appointments, availability, settings, messages, conversations, faqs, status, blocks, logs: logs.application || [], whatsapp }));
    hydrateSettings(settings);
  }

  useEffect(() => {
    const stored = localStorage.getItem('arthilles_token');
    const storedUser = localStorage.getItem('arthilles_user');
    if (stored) {
      setToken(stored);
      setUser(storedUser ? JSON.parse(storedUser) : null);
      loadAll().catch((err) => setError(err.message));
    }
  }, []);

  useEffect(() => {
    const image = qrImage(data.qr);
    if (image) {
      setQrSrc(image);
      return;
    }

    const code = data.qr?.data?.code || data.qr?.data?.pairingCode || data.qr?.code;
    if (!code) {
      setQrSrc('');
      return;
    }

    QRCode.toDataURL(String(code), { width: 320, margin: 2 }).then(setQrSrc).catch(() => setQrSrc(''));
  }, [data.qr]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  async function doLogin(event) {
    event.preventDefault();
    setError('');
    try {
      const result = await request('/auth/login', { method: 'POST', body: JSON.stringify(login) });
      localStorage.setItem('arthilles_token', result.token);
      localStorage.setItem('arthilles_user', JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);
      await loadAll();
    } catch {
      setError('Login invalido. Confira o usuario no Supabase ou as variaveis de bootstrap.');
    }
  }

  function whatsappState(source) {
    return String(
      source?.data?.instance?.state ||
      source?.instance?.state ||
      source?.data?.state ||
      source?.state ||
      ''
    ).toLowerCase();
  }

  function isWhatsappConnected(source) {
    const state = whatsappState(source);
    return state === 'open' || state === 'connected';
  }

  function whatsappStatusText(source) {
    const state = whatsappState(source);
    if (state === 'open' || state === 'connected') return 'Conectado';
    if (state === 'close' || state === 'closed') return 'Desconectado';
    if (!state) return 'Aguardando configuracao';
    return state;
  }

  async function refreshWhatsApp() {
    const [status, qr] = await Promise.all([
      request('/evolution/status').catch(() => ({})),
      request('/evolution/qrcode').catch(() => ({ ok: false }))
    ]);
    setData((current) => ({ ...current, whatsapp: status, qr }));
  }

  async function connectWhatsApp() {
    setWhatsappBusy(true);
    setError('');
    try {
      const result = await request('/evolution/connect', { method: 'POST' });
      setData((current) => ({ ...current, qr: result.qr || current.qr, whatsapp: result.status || current.whatsapp }));
      await refreshWhatsApp();
      setNotice('WhatsApp em processo de conexao. Escaneie o QR Code.');
    } catch (err) {
      setError(err.message || 'Nao foi possivel conectar o WhatsApp.');
    } finally {
      setWhatsappBusy(false);
    }
  }

  async function disconnectWhatsApp() {
    setWhatsappBusy(true);
    setError('');
    try {
      const result = await request('/evolution/disconnect', { method: 'POST' });
      setData((current) => ({ ...current, whatsapp: result.status || current.whatsapp, qr: null }));
      setNotice('WhatsApp desconectado.');
    } catch (err) {
      setError(err.message || 'Nao foi possivel desconectar o WhatsApp.');
    } finally {
      setWhatsappBusy(false);
    }
  }

  async function saveSettings(event) {
    event.preventDefault();
    const payload = {
      company: {
        name: settingsForm.companyName,
        welcomeMessage: settingsForm.welcomeMessage
      },
      theme: {
        logoUrl: settingsForm.logoUrl,
        primaryColor: settingsForm.primaryColor,
        accentColor: settingsForm.accentColor
      },
      business_hours: {
        days: [1, 2, 3, 4, 5],
        start: settingsForm.start,
        end: settingsForm.end,
        slotMinutes: 60,
        minimumNoticeHours: Number(settingsForm.minimumNoticeHours) || 6
      },
      google_sheets: {
        csvUrl: settingsForm.googleSheetsUrl
      },
      assistant: {
        enabled: settingsForm.aiEnabled,
        model: settingsForm.openrouterModel
      }
    };

    const settings = await request('/settings', { method: 'PUT', body: JSON.stringify(payload) });
    setNotice('Configuracoes salvas.');
    setData((current) => ({ ...current, settings }));
    hydrateSettings(settings);
  }

  async function saveFaq(event) {
    event.preventDefault();
    await request('/faqs', {
      method: 'POST',
      body: JSON.stringify({
        question: faqForm.question,
        answer: faqForm.answer,
        keywords: faqForm.keywords.split(',').map((item) => item.trim()).filter(Boolean),
        active: true
      })
    });
    setFaqForm({ question: '', answer: '', keywords: '' });
    await loadAll();
  }

  async function saveBlock(event) {
    event.preventDefault();
    await request('/availability/block', {
      method: 'POST',
      body: JSON.stringify({
        ...blockForm,
        starts_at: new Date(blockForm.starts_at).toISOString(),
        ends_at: new Date(blockForm.ends_at).toISOString()
      })
    });
    setBlockForm({ title: '', starts_at: '', ends_at: '', block_type: 'manual' });
    await loadAll();
  }

  async function createCompany(event) {
    event.preventDefault();
    await request('/companies', { method: 'POST', body: JSON.stringify(companyForm) });
    setCompanyForm({ name: '', slug: '', adminEmail: '', adminPassword: '' });
    await loadAll();
  }

  if (!token) {
    return (
      <main className="login-screen">
        <form className="login-card" onSubmit={doLogin}>
          <Bot size={34} />
          <h1>ArthillesBot</h1>
          <p>SaaS web para WhatsApp, agenda e IA</p>
          <label>Email<input value={login.email} onChange={(event) => setLogin({ ...login, email: event.target.value })} /></label>
          <label>Senha<input type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} /></label>
          <button type="submit">Entrar</button>
          {error && <span className="error">{error}</span>}
        </form>
      </main>
    );
  }

  return (
    <main className="shell" style={{ '--accent': settingsForm.primaryColor, '--ok': settingsForm.accentColor }}>
      <aside className="sidebar">
        <div className="brand">
          {settingsForm.logoUrl ? <img src={settingsForm.logoUrl} alt="Logo" /> : <Bot size={28} />}
          <div><strong>{settingsForm.companyName}</strong><span>SaaS WhatsApp</span></div>
        </div>
        <nav>
          {nav.map(([id, Icon, label]) => (
            <button className={tab === id ? 'active' : ''} key={id} onClick={() => setTab(id)}><Icon size={18} />{label}</button>
          ))}
        </nav>
        <button className="ghost" onClick={() => { localStorage.removeItem('arthilles_token'); localStorage.removeItem('arthilles_user'); setToken(''); }}><LogOut size={18} />Sair</button>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><h1>{nav.find(([id]) => id === tab)?.[2]}</h1><p>{user?.email} - {data.settings.company?.slug || 'empresa'}</p></div>
          <button className="icon-button" onClick={loadAll}><RefreshCw size={18} />Atualizar</button>
        </header>
        {error && <div className="banner">{error}</div>}
        {notice && <div className="success">{notice}</div>}

        {tab === 'overview' && (
          <>
            <section className="metrics">
              <article><Users /><span>Clientes</span><strong>{data.clients.length}</strong></article>
              <article><CalendarDays /><span>Agendamentos</span><strong>{data.appointments.length}</strong></article>
              <article><MessageSquare /><span>Mensagens</span><strong>{data.messages.length}</strong></article>
              <article><Sparkles /><span>IA</span><strong>OpenRouter</strong></article>
            </section>
            <section className="grid">
              <Panel title="Proximos horarios">{data.availability.slice(0, 8).map((slot) => <Line key={slot.startsAt} left={dateLabel(slot.startsAt)} right={dateLabel(slot.endsAt)} />)}</Panel>
              <Panel title="Agendamentos recentes">{data.appointments.slice(0, 8).map((item) => <Line key={item.id} left={item.full_name || 'Cliente'} right={dateLabel(item.starts_at)} />)}</Panel>
            </section>
          </>
        )}

        {tab === 'companies' && (
          <section className="grid">
            <Panel title="Empresas">
              {data.companies.map((company) => <Line key={company.id} left={company.name} mid={company.slug} right={company.id} />)}
            </Panel>
            <Panel title="Nova empresa">
              <form className="stack" onSubmit={createCompany}>
                <label>Nome<input value={companyForm.name} onChange={(event) => setCompanyForm({ ...companyForm, name: event.target.value })} /></label>
                <label>Slug<input placeholder="minha-empresa" value={companyForm.slug} onChange={(event) => setCompanyForm({ ...companyForm, slug: event.target.value })} /></label>
                <label>Email do admin<input value={companyForm.adminEmail} onChange={(event) => setCompanyForm({ ...companyForm, adminEmail: event.target.value })} /></label>
                <label>Senha inicial<input type="password" value={companyForm.adminPassword} onChange={(event) => setCompanyForm({ ...companyForm, adminPassword: event.target.value })} /></label>
                <button type="submit"><Building2 size={18} />Criar empresa</button>
              </form>
            </Panel>
          </section>
        )}

        {tab === 'whatsapp' && (
          <Panel title="Conexao WhatsApp">
            <div className="row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <strong>Status da conexao</strong>
              <span>{whatsappStatusText(data.whatsapp)}</span>
            </div>
            <div className="actions">
              <button onClick={connectWhatsApp} disabled={whatsappBusy}><QrCode size={18} />Conectar WhatsApp</button>
              <button onClick={disconnectWhatsApp} disabled={whatsappBusy}>Desconectar WhatsApp</button>
              <button onClick={refreshWhatsApp} disabled={whatsappBusy}><RefreshCw size={18} />Atualizar status</button>
            </div>
            {!isWhatsappConnected(data.whatsapp) && qrSrc ? <img className="qr" src={qrSrc} alt="QR Code WhatsApp" /> : null}
            {!isWhatsappConnected(data.whatsapp) ? <span>Clique em "Conectar WhatsApp" e escaneie o QR Code.</span> : <span>WhatsApp conectado e pronto para atendimento.</span>}
          </Panel>
        )}

        {tab === 'clients' && <Panel title="Clientes">{data.clients.map((client) => <Line key={client.id} left={client.full_name} mid={client.phone} right={`${client.city || '-'} ${client.state || ''}`} />)}</Panel>}

        {tab === 'appointments' && <Panel title="Agendamentos">{data.appointments.map((item) => <Line key={item.id} left={item.full_name || 'Cliente'} mid={dateLabel(item.starts_at)} right={item.status} />)}</Panel>}

        {tab === 'blocks' && (
          <section className="grid">
            <Panel title="Novo bloqueio">
              <form className="stack" onSubmit={saveBlock}>
                <input placeholder="Titulo" value={blockForm.title} onChange={(event) => setBlockForm({ ...blockForm, title: event.target.value })} />
                <select value={blockForm.block_type} onChange={(event) => setBlockForm({ ...blockForm, block_type: event.target.value })}>
                  <option value="manual">Manual</option>
                  <option value="holiday">Feriado</option>
                  <option value="vacation">Ferias/Folga</option>
                </select>
                <label>Inicio<input type="datetime-local" value={blockForm.starts_at} onChange={(event) => setBlockForm({ ...blockForm, starts_at: event.target.value })} /></label>
                <label>Fim<input type="datetime-local" value={blockForm.ends_at} onChange={(event) => setBlockForm({ ...blockForm, ends_at: event.target.value })} /></label>
                <button type="submit">Bloquear horario</button>
              </form>
            </Panel>
            <Panel title="Bloqueios cadastrados">{data.blocks.map((item) => <Line key={item.id} left={item.title} mid={`${dateLabel(item.starts_at)} ate ${dateLabel(item.ends_at)}`} right={item.block_type} />)}</Panel>
          </section>
        )}

        {tab === 'messages' && (
          <Panel title="Conversas e mensagens">
            {data.messages.map((message) => <Line key={message.id} left={`${message.direction} - ${message.phone}`} mid={message.body} right={dateLabel(message.created_at)} />)}
          </Panel>
        )}

        {tab === 'faqs' && (
          <section className="grid">
            <Panel title="Cadastrar duvida">
              <form className="stack" onSubmit={saveFaq}>
                <input placeholder="Pergunta" value={faqForm.question} onChange={(event) => setFaqForm({ ...faqForm, question: event.target.value })} />
                <textarea placeholder="Resposta" value={faqForm.answer} onChange={(event) => setFaqForm({ ...faqForm, answer: event.target.value })} />
                <input placeholder="palavras, separadas, por virgula" value={faqForm.keywords} onChange={(event) => setFaqForm({ ...faqForm, keywords: event.target.value })} />
                <button type="submit">Salvar FAQ</button>
              </form>
            </Panel>
            <Panel title="Duvidas frequentes">{data.faqs.map((faq) => <Line key={faq.id} left={faq.question} mid={faq.answer} right={faq.active ? 'Ativa' : 'Inativa'} />)}</Panel>
          </section>
        )}

        {tab === 'settings' && (
          <section className="grid">
            <Panel title="Empresa e marca">
              <form className="stack" onSubmit={saveSettings}>
                <label>Nome da empresa<input value={settingsForm.companyName} onChange={(event) => setSettingsForm({ ...settingsForm, companyName: event.target.value })} /></label>
                <label>URL da logo<input placeholder="https://..." value={settingsForm.logoUrl} onChange={(event) => setSettingsForm({ ...settingsForm, logoUrl: event.target.value })} /></label>
                <div className="two-cols">
                  <label>Cor principal<input type="color" value={settingsForm.primaryColor} onChange={(event) => setSettingsForm({ ...settingsForm, primaryColor: event.target.value })} /></label>
                  <label>Cor de destaque<input type="color" value={settingsForm.accentColor} onChange={(event) => setSettingsForm({ ...settingsForm, accentColor: event.target.value })} /></label>
                </div>
                <label>Mensagem inicial<textarea value={settingsForm.welcomeMessage} onChange={(event) => setSettingsForm({ ...settingsForm, welcomeMessage: event.target.value })} /></label>
                <button type="submit">Salvar</button>
              </form>
            </Panel>
            <Panel title="Agenda e IA">
              <form className="stack" onSubmit={saveSettings}>
                <div className="two-cols">
                  <label>Inicio<input type="time" value={settingsForm.start} onChange={(event) => setSettingsForm({ ...settingsForm, start: event.target.value })} /></label>
                  <label>Fim<input type="time" value={settingsForm.end} onChange={(event) => setSettingsForm({ ...settingsForm, end: event.target.value })} /></label>
                </div>
                <label>Antecedencia minima em horas<input type="number" min="1" value={settingsForm.minimumNoticeHours} onChange={(event) => setSettingsForm({ ...settingsForm, minimumNoticeHours: event.target.value })} /></label>
                <label className="check-row"><input type="checkbox" checked={settingsForm.aiEnabled} onChange={(event) => setSettingsForm({ ...settingsForm, aiEnabled: event.target.checked })} /> Usar IA via OpenRouter</label>
                <label>Modelo OpenRouter<input value={settingsForm.openrouterModel} onChange={(event) => setSettingsForm({ ...settingsForm, openrouterModel: event.target.value })} /></label>
                <button type="submit">Salvar</button>
              </form>
            </Panel>
            <Panel title="Google Sheets FAQ">
              <form className="stack" onSubmit={saveSettings}>
                <label>Link CSV publicado<input placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv" value={settingsForm.googleSheetsUrl} onChange={(event) => setSettingsForm({ ...settingsForm, googleSheetsUrl: event.target.value })} /></label>
                <button type="submit">Salvar Google Sheets</button>
                <button type="button" onClick={() => request('/faqs/google-sheets/preview').then((preview) => setNotice(`Google Sheets: ${preview.count} linhas encontradas.`)).catch((err) => setError(err.message))}>Testar planilha</button>
              </form>
            </Panel>
          </section>
        )}

        {tab === 'status' && (
          <section className="grid">
            <Panel title="Status dos servicos"><pre>{JSON.stringify(data.status, null, 2)}</pre></Panel>
            <Panel title="Logs recentes">{data.logs.map((item, index) => <Line key={`${item.time}-${index}`} left={item.type} mid={item.detail} right={dateLabel(item.time)} />)}</Panel>
          </section>
        )}
      </section>
    </main>
  );
}

function Panel({ title, children }) {
  return <section className="panel"><h2>{title}</h2><div className="panel-body">{children}</div></section>;
}

function Line({ left, mid, right }) {
  return <div className="row"><strong>{left}</strong><span>{mid}</span><span>{right}</span></div>;
}
