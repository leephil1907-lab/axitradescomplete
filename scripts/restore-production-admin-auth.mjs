import fs from 'node:fs';

const target = 'server/adminAuth.ts';
const source = `import crypto from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { NextFunction, Request, Response } from 'express';

const ADMIN_EMAILS = String(process.env.ADMIN_EMAILS || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean);
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || ADMIN_EMAILS[0] || '').trim().toLowerCase();
const ADMIN_PASSWORD_HASH = String(process.env.ADMIN_PASSWORD_HASH || '');
const ADMIN_PASSWORD_SALT = String(process.env.ADMIN_PASSWORD_SALT || '');
const ADMIN_SESSION_SECRET = String(process.env.ADMIN_SESSION_SECRET || '');
const SESSION_TTL_SECONDS = 43200;

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a); const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function validPassword(password: string) {
  if (!ADMIN_PASSWORD_HASH || !ADMIN_PASSWORD_SALT) return false;
  return safeEqual(crypto.scryptSync(password, ADMIN_PASSWORD_SALT, 64).toString('hex'), ADMIN_PASSWORD_HASH);
}
function signature(payload: string) {
  if (!ADMIN_SESSION_SECRET) return '';
  return crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(payload).digest('base64url');
}
function allowedAdminEmails() { return ADMIN_EMAILS.length ? ADMIN_EMAILS : (ADMIN_EMAIL ? [ADMIN_EMAIL] : []); }

export function authenticateAdminCredentials(email: string, password: string) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !allowedAdminEmails().includes(normalizedEmail) || !validPassword(String(password || ''))) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ email: normalizedEmail, exp }), 'utf8').toString('base64url');
  return payload + '.' + signature(payload);
}
export function verifyAdminSession(token: string) {
  if (!ADMIN_SESSION_SECRET || !token) return null;
  const [payload, suppliedSignature] = String(token).split('.');
  if (!payload || !suppliedSignature || !safeEqual(signature(payload), suppliedSignature)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { email?: string; exp?: number };
    const email = String(value.email || '').toLowerCase();
    if (!allowedAdminEmails().includes(email) || Number(value.exp) <= Math.floor(Date.now() / 1000)) return null;
    return { email, exp: Number(value.exp) };
  } catch { return null; }
}
export function adminLoginConfigured() {
  return Boolean(allowedAdminEmails().length && ADMIN_PASSWORD_HASH && ADMIN_PASSWORD_SALT && ADMIN_SESSION_SECRET);
}
function getFirebaseAuth() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const serviceAccount = JSON.parse(raw);
    if (serviceAccount.private_key) serviceAccount.private_key = String(serviceAccount.private_key).replace(/\\\\n/g, '\\n');
    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
    return getAuth(app);
  } catch (error) { console.error('Firebase Admin initialization failed:', error); return null; }
}
export async function verifyBearer(req: Request) {
  const match = String(req.headers.authorization || '').match(/^Bearer\\s+(.+)$/i);
  if (!match) return null;
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Server authentication is not configured');
  return auth.verifyIdToken(match[1], true);
}
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const match = String(req.headers.authorization || '').match(/^Bearer\\s+(.+)$/i);
  const session = verifyAdminSession(match?.[1] || '');
  if (session) { (req as any).adminEmail = session.email; (req as any).admin = { email: session.email }; return next(); }
  try {
    const decoded = await verifyBearer(req);
    if (!decoded) return res.status(401).json({ error: 'Administrator authentication required' });
    const email = String(decoded.email || '').toLowerCase();
    const admins = new Set((process.env.ADMIN_EMAILS || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean));
    const uids = new Set((process.env.ADMIN_UIDS || '').split(',').map(v => v.trim()).filter(Boolean));
    if (!admins.has(email) && !uids.has(decoded.uid)) return res.status(403).json({ error: 'Administrator access required' });
    (req as any).authUser = decoded; (req as any).adminEmail = email || decoded.uid; return next();
  } catch { return res.status(401).json({ error: 'Invalid administrator authentication' }); }
}
export async function requireAdminForOperational(req: Request, res: Response, next: NextFunction) { return requireAdmin(req, res, next); }
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const match = String(req.headers.authorization || '').match(/^Bearer\\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: 'Authentication required' });
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return res.status(503).json({ error: 'Server authentication is not configured' });
  try {
    const decoded = await firebaseAuth.verifyIdToken(match[1]);
    (req as any).user = { uid: decoded.uid, email: decoded.email || '' }; return next();
  } catch (error: any) { console.error('Customer token verification failed:', error?.message || error); return res.status(401).json({ error: 'Invalid authentication token' }); }
}
`;
fs.writeFileSync(target, source);
console.log('Production admin authentication implementation restored.');
