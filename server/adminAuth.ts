import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { NextFunction, Request, Response } from 'express';

function getAdminAuth() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  try {
    const serviceAccount = JSON.parse(raw);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = String(serviceAccount.private_key).replace(/\\n/g, '\n');
    }
    const app = getApps().length
      ? getApps()[0]
      : initializeApp({ credential: cert(serviceAccount) });
    return getAuth(app);
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    return null;
  }
}

function csv(value: string | undefined): string[] {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authorization = String(req.headers.authorization || '');
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: 'Authentication required' });

  const adminAuth = getAdminAuth();
  if (!adminAuth) return res.status(503).json({ error: 'Server authentication is not configured' });

  try {
    const decoded = await adminAuth.verifyIdToken(match[1]);
    const allowedEmails = csv(process.env.ADMIN_EMAILS);
    const allowedUids = csv(process.env.ADMIN_UIDS);
    const email = String(decoded.email || '').toLowerCase();
    const isAdmin = allowedUids.includes(decoded.uid.toLowerCase()) || (email && allowedEmails.includes(email));

    if (!isAdmin) return res.status(403).json({ error: 'Administrator access required' });

    (req as any).admin = { uid: decoded.uid, email: decoded.email || null };
    (req as any).adminEmail = decoded.email || decoded.uid;
    return next();
  } catch (error: any) {
    console.error('Admin token verification failed:', error?.message || error);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}
