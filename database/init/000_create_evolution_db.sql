SELECT 'CREATE DATABASE arthilles_evolution'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'arthilles_evolution')\gexec

SELECT 'CREATE DATABASE arthilles_n8n'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'arthilles_n8n')\gexec
