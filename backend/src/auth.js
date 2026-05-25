import crypto from 'crypto';
import { z } from 'zod';
import { requireSupabase } from './db.js';

const secret = process.env.AUTH_SECRET || 'change_me_auth_secret';

function base64url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(value) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

export function hashPassword(password) {
  return crypto.createHash('sha256').update(`${password}:${secret}`).digest('hex');
}

export function createToken(payload) {
  const header = base64url({ alg: 'HS256', typ: 'JWT' });
  const body = base64url({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12
  });
  return `${header}.${body}.${sign(`${header}.${body}`)}`;
}

export function verifyToken(token) {
  try {
    const [header, body, signature] = String(token || '').split('.');
    if (!header || !body || !signature) return null;
    if (sign(`${header}.${body}`) !== signature) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function loginWithPassword(input) {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const credentials = schema.parse(input);
  const db = requireSupabase();

  const { data: user, error } = await db
    .from('app_users')
    .select('id, company_id, name, email, password_hash, role')
    .eq('email', credentials.email)
    .maybeSingle();

  if (error) throw error;
  const expectedHash = hashPassword(credentials.password);
  if (user && user.password_hash === expectedHash) {
    return {
      token: createToken({
        sub: user.id,
        companyId: user.company_id,
        email: user.email,
        role: user.role || 'admin'
      }),
      user: {
        id: user.id,
        companyId: user.company_id,
        name: user.name,
        email: user.email,
        role: user.role || 'admin'
      }
    };
  }

  const bootstrapEnabled = process.env.ALLOW_BOOTSTRAP_LOGIN === 'true';
  const bootstrapEmail = process.env.ADMIN_EMAIL || 'admin@arthilles.local';
  const bootstrapPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const bootstrapCompany = process.env.DEFAULT_COMPANY_ID;
  if (bootstrapEnabled && credentials.email === bootstrapEmail && credentials.password === bootstrapPassword && bootstrapCompany) {
    return {
      token: createToken({
        sub: 'bootstrap',
        companyId: bootstrapCompany,
        email: bootstrapEmail,
        role: 'super_admin'
      }),
      user: {
        id: 'bootstrap',
        companyId: bootstrapCompany,
        name: 'Administrador',
        email: bootstrapEmail,
        role: 'super_admin'
      }
    };
  }

  return null;
}

export function requireAuth(req, res, next) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const payload = verifyToken(token);
  if (!payload?.companyId) return res.status(401).json({ error: 'Nao autenticado' });
  req.user = payload;
  next();
}
