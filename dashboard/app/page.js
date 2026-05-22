import { Activity, Bot, CalendarDays, Clock, Settings, Users } from 'lucide-react';

const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

async function fetchJson(path, fallback) {
  try {
    const response = await fetch(`${backendUrl}${path}`, { cache: 'no-store' });
    if (!response.ok) return fallback;
    return response.json();
  } catch {
    return fallback;
  }
}

function dateLabel(value) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo'
  });
}

export default async function Dashboard() {
  const [health, clients, appointments, availability, settings] = await Promise.all([
    fetchJson('/health', { ok: false }),
    fetchJson('/clients', []),
    fetchJson('/appointments', []),
    fetchJson('/availability', []),
    fetchJson('/settings', {})
  ]);

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Bot size={28} />
          <div>
            <strong>ArthillesBot</strong>
            <span>WhatsApp local</span>
          </div>
        </div>
        <nav>
          <a href="#clientes"><Users size={18} />Clientes</a>
          <a href="#agenda"><CalendarDays size={18} />Agenda</a>
          <a href="#calendario"><Clock size={18} />Calendario</a>
          <a href="#config"><Settings size={18} />Configuracoes</a>
          <a href="#status"><Activity size={18} />Status</a>
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <h1>Atendimento e agenda</h1>
            <p>Operacao local com Evolution API, PostgreSQL, n8n e Ollama.</p>
          </div>
          <span className={health.ok ? 'pill ok' : 'pill bad'}>{health.ok ? 'Online' : 'Offline'}</span>
        </header>

        <section className="metrics">
          <article><Users /><span>Clientes</span><strong>{clients.length}</strong></article>
          <article><CalendarDays /><span>Agendamentos</span><strong>{appointments.length}</strong></article>
          <article><Clock /><span>Horarios livres</span><strong>{availability.length}</strong></article>
          <article><Bot /><span>IA local</span><strong>{settings.assistant?.model || 'llama3'}</strong></article>
        </section>

        <section className="grid">
          <div id="clientes" className="panel">
            <h2>Clientes</h2>
            <div className="table">
              {clients.map((client) => (
                <div className="row" key={client.id}>
                  <strong>{client.full_name}</strong>
                  <span>{client.phone}</span>
                  <span>{client.city || '-'} {client.state || ''}</span>
                </div>
              ))}
              {!clients.length && <p className="empty">Nenhum cliente cadastrado ainda.</p>}
            </div>
          </div>

          <div id="agenda" className="panel">
            <h2>Agendamentos</h2>
            <div className="table">
              {appointments.map((appointment) => (
                <div className="row" key={appointment.id}>
                  <strong>{appointment.full_name}</strong>
                  <span>{dateLabel(appointment.starts_at)}</span>
                  <span>{appointment.status}</span>
                </div>
              ))}
              {!appointments.length && <p className="empty">Nenhum agendamento salvo.</p>}
            </div>
          </div>
        </section>

        <section className="grid">
          <div id="calendario" className="panel">
            <h2>Proximos horarios</h2>
            <div className="slots">
              {availability.slice(0, 12).map((slot) => <span key={slot.startsAt}>{dateLabel(slot.startsAt)}</span>)}
              {!availability.length && <p className="empty">Sem horarios disponiveis.</p>}
            </div>
          </div>

          <div id="config" className="panel">
            <h2>Configuracoes</h2>
            <dl>
              <dt>Atendimento</dt>
              <dd>{settings.business_hours?.start || '13:30'} ate {settings.business_hours?.end || '16:30'}</dd>
              <dt>Antecedencia minima</dt>
              <dd>{settings.business_hours?.minimumNoticeHours || 6} horas</dd>
              <dt>Modelo Ollama</dt>
              <dd>{settings.assistant?.model || 'llama3'}</dd>
            </dl>
          </div>
        </section>

        <section id="status" className="panel">
          <h2>Status dos servicos</h2>
          <div className="status-grid">
            {['Backend:3001', 'Dashboard:3000', 'Evolution:8080', 'n8n:5678', 'Ollama:11434', 'PostgreSQL:5432'].map((item) => (
              <span key={item}><Activity size={16} />{item}</span>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
