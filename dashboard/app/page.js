'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  Activity,
  Ban,
  Bot,
  CalendarDays,
  Clock,
  HelpCircle,
  LogOut,
  MessageSquare,
  QrCode,
  RefreshCw,
  Settings,
  Users
} from 'lucide-react';

function getBackendUrl() {
  const configured = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  if (typeof window === 'undefined') return configured;
  const configuredUrl = new URL(configured);
  const localHosts = ['localhost', '127.0.0.1', '::1'];
  if (localHosts.includes(configuredUrl.hostname) && !localHosts.includes(window.location.hostname)) {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return configured;
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

export default function Dashboard() {
  const [token, setToken] = useState('');
  const [login, setLogin] = useState({ email: 'admin@arthilles.local', password: 'admin123' });
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState({
    health: {},
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
    network: {},
    qr: null
  });
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', keywords: '' });
  const [blockForm, setBlockForm] = useState({ title: '', starts_at: '', ends_at: '', block_type: 'manual' });
  const [settingsText, setSettingsText] = useState('');
  const [settingsForm, setSettingsForm] = useState({
    companyName: 'Arthilles',
    logoUrl: '',
    primaryColor: '#176b87',
    accentColor: '#2f7d32',
    start: '13:30',
    end: '16:30',
    minimumNoticeHours: 6,
    welcomeMessage: '',
    googleSheetsEnabled: false,
    googleSheetsUrl: '',
    aiEnabled: true
  });
  const [qrSrc, setQrSrc] = useState('');
  const [error, setError] = useState('');

  const nav = useMemo(() => [
    ['overview', Activity, 'Visao geral'],
    ['whatsapp', QrCode, 'WhatsApp'],
    ['android', Activity, 'Android/PWA'],
    ['clients', Users, 'Clientes'],
    ['appointments', CalendarDays, 'Agendamentos'],
    ['blocks', Ban, 'Bloqueios'],
    ['messages', MessageSquare, 'Conversas'],
    ['faqs', HelpCircle, 'Duvidas'],
    ['settings', Settings, 'Configuracoes'],
    ['status', Activity, 'Status']
  ], []);

  async function loadAll() {
    setError('');
    const [health, clients, appointments, availability, settings, messages, conversations, faqs, status, blocks, logs, network] = await Promise.all([
      request('/health').catch(() => ({ ok: false })),
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
      request('/network').catch(() => ({}))
    ]);
    setData((current) => ({ ...current, health, clients, appointments, availability, settings, messages, conversations, faqs, status, blocks, logs: logs.application || [], network }));
    setSettingsText(JSON.stringify(settings, null, 2));
    setSettingsForm({
      companyName: settings.company?.name || 'Arthilles',
      logoUrl: settings.theme?.logoUrl || '',
      primaryColor: settings.theme?.primaryColor || '#176b87',
      accentColor: settings.theme?.accentColor || '#2f7d32',
      start: settings.business_hours?.start || '13:30',
      end: settings.business_hours?.end || '16:30',
      minimumNoticeHours: settings.business_hours?.minimumNoticeHours || 6,
      welcomeMessage: settings.company?.welcomeMessage || 'Ola! Sou o assistente virtual. Vou te ajudar com atendimento e agendamento.',
      googleSheetsEnabled: Boolean(settings.google_sheets?.enabled),
      googleSheetsUrl: settings.google_sheets?.csvUrl || '',
      aiEnabled: settings.assistant?.enabled !== false
    });
  }

  useEffect(() => {
    const stored = localStorage.getItem('arthilles_token');
    if (stored) {
      setToken(stored);
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

    QRCode.toDataURL(String(code), { width: 320, margin: 2 })
      .then(setQrSrc)
      .catch(() => setQrSrc(''));
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
      setToken(result.token);
      await loadAll();
    } catch {
      setError('Login invalido. Confira ADMIN_EMAIL e ADMIN_PASSWORD no .env.');
    }
  }

  async function loadQr() {
    const qr = await request('/evolution/qrcode');
    setData((current) => ({ ...current, qr }));
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

  async function saveSettings() {
    await request('/settings', { method: 'PUT', body: settingsText });
    await loadAll();
  }

  async function saveWhiteLabelSettings(event) {
    event.preventDefault();
    const payload = {
      company: {
        ...(data.settings.company || {}),
        name: settingsForm.companyName,
        welcomeMessage: settingsForm.welcomeMessage
      },
      theme: {
        ...(data.settings.theme || {}),
        logoUrl: settingsForm.logoUrl,
        primaryColor: settingsForm.primaryColor,
        accentColor: settingsForm.accentColor
      },
      business_hours: {
        ...(data.settings.business_hours || {}),
        start: settingsForm.start,
        end: settingsForm.end,
        minimumNoticeHours: Number(settingsForm.minimumNoticeHours) || 6
      },
      google_sheets: {
        ...(data.settings.google_sheets || {}),
        enabled: settingsForm.googleSheetsEnabled,
        csvUrl: settingsForm.googleSheetsUrl
      },
      assistant: {
        ...(data.settings.assistant || {}),
        enabled: settingsForm.aiEnabled
      }
    };
    await request('/settings', { method: 'PUT', body: JSON.stringify(payload) });
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

  if (!token) {
    return (
      <main className="login-screen">
        <form className="login-card" onSubmit={doLogin}>
          <Bot size={34} />
          <h1>ArthillesBot</h1>
          <p>Painel administrativo local</p>
          <label>Email<input value={login.email} onChange={(event) => setLogin({ ...login, email: event.target.value })} /></label>
          <label>Senha<input type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} /></label>
          <button type="submit">Entrar</button>
          {error && <span className="error">{error}</span>}
        </form>
      </main>
    );
  }

  return (
    <main className="shell" style={{ '--accent': data.settings.theme?.primaryColor || settingsForm.primaryColor, '--ok': data.settings.theme?.accentColor || settingsForm.accentColor }}>
      <aside className="sidebar">
        <div className="brand">{data.settings.theme?.logoUrl ? <img src={data.settings.theme.logoUrl} alt="Logo" /> : <Bot size={28} />}<div><strong>{data.settings.company?.name || settingsForm.companyName}</strong><span>Operacao local</span></div></div>
        <nav>
          {nav.map(([id, Icon, label]) => (
            <button className={tab === id ? 'active' : ''} key={id} onClick={() => setTab(id)}><Icon size={18} />{label}</button>
          ))}
        </nav>
        <button className="ghost" onClick={() => { localStorage.removeItem('arthilles_token'); setToken(''); }}><LogOut size={18} />Sair</button>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><h1>{nav.find(([id]) => id === tab)?.[2]}</h1><p>WhatsApp, agenda, CRM e IA local em Docker.</p></div>
          <button className="icon-button" onClick={loadAll}><RefreshCw size={18} />Atualizar</button>
        </header>
        {error && <div className="banner">{error}</div>}

        {tab === 'overview' && (
          <>
            <section className="metrics">
              <article><Users /><span>Clientes</span><strong>{data.clients.length}</strong></article>
              <article><CalendarDays /><span>Agendamentos</span><strong>{data.appointments.length}</strong></article>
              <article><MessageSquare /><span>Mensagens</span><strong>{data.messages.length}</strong></article>
              <article><Bot /><span>IA local</span><strong>{data.settings.assistant?.model || 'llama3'}</strong></article>
            </section>
            <section className="grid">
              <Panel title="Proximos horarios">{data.availability.slice(0, 8).map((slot) => <Line key={slot.startsAt} left={dateLabel(slot.startsAt)} right={dateLabel(slot.endsAt)} />)}</Panel>
              <Panel title="Agendamentos recentes">{data.appointments.slice(0, 8).map((item) => <Line key={item.id} left={item.full_name} right={dateLabel(item.starts_at)} />)}</Panel>
            </section>
          </>
        )}

        {tab === 'whatsapp' && (
          <Panel title="Conexao WhatsApp">
            <div className="actions">
              <button onClick={() => request('/evolution/instance', { method: 'POST' }).then(loadQr)}>Criar instancia</button>
              <button onClick={loadQr}><QrCode size={18} />Gerar QR Code</button>
              <button onClick={() => request('/evolution/webhook', { method: 'POST' })}>Configurar webhook</button>
            </div>
            {qrSrc ? <img className="qr" src={qrSrc} alt="QR Code WhatsApp" /> : <pre>{JSON.stringify(data.qr || data.status.evolution || {}, null, 2)}</pre>}
          </Panel>
        )}

        {tab === 'android' && (
          <section className="grid">
            <Panel title="Acesso pelo Android">
              <div className="stack">
                <p>Conecte o celular na mesma rede Wi-Fi do computador e abra o endereco abaixo.</p>
                {(data.network.dashboardUrls || []).map((url) => <code className="copy-box" key={url}>{url}</code>)}
                <code className="copy-box">{typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3000` : 'http://IP-DO-COMPUTADOR:3000'}</code>
                <p>No Chrome Android, use Adicionar a tela inicial para instalar como PWA.</p>
              </div>
            </Panel>
            <Panel title="Quando aparecer localhost">
              <div className="stack">
                <p>Se o painel mostrar localhost, descubra o IPv4 do computador no Windows:</p>
                <code className="copy-box">ipconfig</code>
                <p>Use o endereco IPv4 da sua rede, por exemplo:</p>
                <code className="copy-box">http://192.168.0.25:3000</code>
              </div>
            </Panel>
          </section>
        )}

        {tab === 'clients' && <Panel title="Clientes">{data.clients.map((client) => <Line key={client.id} left={client.full_name} mid={client.phone} right={`${client.city || '-'} ${client.state || ''}`} />)}</Panel>}

        {tab === 'appointments' && <Panel title="Agendamentos">{data.appointments.map((item) => <Line key={item.id} left={item.full_name} mid={dateLabel(item.starts_at)} right={item.status} />)}</Panel>}

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
            <Panel title="White-label">
              <form className="stack" onSubmit={saveWhiteLabelSettings}>
                <label>Nome da empresa<input value={settingsForm.companyName} onChange={(event) => setSettingsForm({ ...settingsForm, companyName: event.target.value })} /></label>
                <label>URL da logo<input placeholder="https://..." value={settingsForm.logoUrl} onChange={(event) => setSettingsForm({ ...settingsForm, logoUrl: event.target.value })} /></label>
                <label>Cor principal<input type="color" value={settingsForm.primaryColor} onChange={(event) => setSettingsForm({ ...settingsForm, primaryColor: event.target.value })} /></label>
                <label>Cor de destaque<input type="color" value={settingsForm.accentColor} onChange={(event) => setSettingsForm({ ...settingsForm, accentColor: event.target.value })} /></label>
                <label>Mensagem inicial<textarea value={settingsForm.welcomeMessage} onChange={(event) => setSettingsForm({ ...settingsForm, welcomeMessage: event.target.value })} /></label>
                <div className="two-cols">
                  <label>Inicio<input type="time" value={settingsForm.start} onChange={(event) => setSettingsForm({ ...settingsForm, start: event.target.value })} /></label>
                  <label>Fim<input type="time" value={settingsForm.end} onChange={(event) => setSettingsForm({ ...settingsForm, end: event.target.value })} /></label>
                </div>
                <label>Antecedencia minima em horas<input type="number" min="1" value={settingsForm.minimumNoticeHours} onChange={(event) => setSettingsForm({ ...settingsForm, minimumNoticeHours: event.target.value })} /></label>
                <label className="check-row"><input type="checkbox" checked={settingsForm.aiEnabled} onChange={(event) => setSettingsForm({ ...settingsForm, aiEnabled: event.target.checked })} /> Usar Ollama quando disponivel</label>
                <button type="submit">Salvar white-label</button>
              </form>
            </Panel>
            <Panel title="FAQ por Google Sheets">
              <form className="stack" onSubmit={saveWhiteLabelSettings}>
                <label className="check-row"><input type="checkbox" checked={settingsForm.googleSheetsEnabled} onChange={(event) => setSettingsForm({ ...settingsForm, googleSheetsEnabled: event.target.checked })} /> Usar planilha publica como base de FAQ</label>
                <label>Link CSV publicado<input placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv" value={settingsForm.googleSheetsUrl} onChange={(event) => setSettingsForm({ ...settingsForm, googleSheetsUrl: event.target.value })} /></label>
                <p>A planilha deve ter as colunas: pergunta, resposta, palavras.</p>
                <button type="submit">Salvar Google Sheets</button>
                <button type="button" onClick={() => request('/faqs/google-sheets/preview').then((preview) => setError(`Google Sheets: ${preview.count} linhas encontradas.`)).catch((err) => setError(err.message))}>Testar planilha</button>
              </form>
            </Panel>
            <Panel title="Avancado JSON">
              <textarea className="settings-editor" value={settingsText} onChange={(event) => setSettingsText(event.target.value)} />
              <div className="actions"><button onClick={saveSettings}>Salvar JSON</button></div>
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
