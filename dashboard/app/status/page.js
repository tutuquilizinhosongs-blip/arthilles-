'use client';

import { useEffect, useState } from 'react';
import { Activity, Bot } from 'lucide-react';

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

export default function StatusPage() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch(`${getBackendUrl()}/status`)
      .then((response) => response.json())
      .then(setStatus)
      .catch((error) => setStatus({ error: error.message }));
  }, []);

  return (
    <main className="content status-page">
      <header className="topbar">
        <div><h1>Status</h1><p>Resumo dos servicos locais do ArthillesBot.</p></div>
        <Bot size={30} />
      </header>
      <section className="panel">
        <h2>Servicos</h2>
        <div className="status-cards">
          {status ? Object.entries(status).map(([key, value]) => (
            <article key={key}>
              <Activity size={18} />
              <strong>{key}</strong>
              <span>{value?.ok === false ? 'Atencao' : 'OK'}</span>
            </article>
          )) : <p>Carregando...</p>}
        </div>
        <pre>{JSON.stringify(status, null, 2)}</pre>
      </section>
    </main>
  );
}
