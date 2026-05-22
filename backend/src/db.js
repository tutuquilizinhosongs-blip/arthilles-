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
