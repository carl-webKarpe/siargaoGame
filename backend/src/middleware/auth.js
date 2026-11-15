import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';
import { HttpError } from '../utils/http.js';

export function signToken(user) {
  return jwt.sign({ sub: String(user.id) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn, algorithm: 'HS256' });
}

async function loadUser(token) {
  const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  const [rows] = await pool.query('SELECT id, username, email, role, account_type FROM users WHERE id = ?', [Number(payload.sub)]);
  return rows[0] || null;
}

function bearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

/** Requires a valid JWT; sets req.user. */
export async function requireAuth(req, _res, next) {
  try {
    const token = bearer(req);
    if (!token) throw new HttpError(401, 'Authentication required');
    const user = await loadUser(token).catch(() => null);
    if (!user) throw new HttpError(401, 'Invalid or expired session');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Sets req.user when a valid token is present, otherwise continues anonymously. */
export async function optionalAuth(req, _res, next) {
  const token = bearer(req);
  if (token) req.user = await loadUser(token).catch(() => null);
  next();
}

export function requireAdmin(req, _res, next) {
  if (!req.user || req.user.account_type !== 'admin') return next(new HttpError(403, 'Administrator access required'));
  next();
}
