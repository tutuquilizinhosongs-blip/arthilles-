'use client';

import { useEffect, useState } from 'react';
import { Activity, Bot } from 'lucide-react';

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
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
        <div><h1>Status</h1><p>Resumo dos servicos web do ArthillesBot.</p></div>
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
