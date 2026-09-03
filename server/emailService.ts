import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth as firebaseGetAdminAuth } from 'firebase-admin/auth';

let adminAuth: ReturnType<typeof firebaseGetAdminAuth> | null = null;
const esc = (v: unknown) => String(v ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' } as any)[c] || c);
const appUrl = () => (process.env.APP_URL || 'https://www.axitrades.com').replace(/\/$/, '');
function getAdminAuth() {
  if (adminAuth) return adminAuth;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw);
    if (sa.private_key) sa.private_key = String(sa.private_key).replace(/\\n/g, '\n');
    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(sa) });
    adminAuth = firebaseGetAdminAuth(app);
    return adminAuth;
  } catch (e) { console.error('[Axi email] Firebase Admin init failed', e); return null; }
}
function button(label: string, url: string) { return `<p style="margin:28px 0"><a href="${esc(url)}" style="display:inline-block;background:#e3000f;color:#fff;text-decoration:none;font-weight:800;padding:13px 22px;border-radius:10px">${esc(label)}</a></p>`; }
function html(title: string, pre: string, body: string) {
  const url = appUrl();
  const logo = process.env.EMAIL_LOGO_URL || `${url}/axi-avatar.png`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head><body style="margin:0;background:#f3f5f7;font-family:Arial,Helvetica,sans-serif;color:#111827"><div style="display:none">${esc(pre)}</div><table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 12px;background:#f3f5f7"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden"><tr><td style="background:#080b10;padding:26px 30px"><img src="${esc(logo)}" width="58" height="58" alt="Axi Trades" style="display:block;border:0;border-radius:12px"><div style="margin-top:14px;color:#fff;font-size:12px;font-weight:800;letter-spacing:2px">AXI TRADES</div></td></tr><tr><td style="padding:34px 30px"><h1 style="margin:0 0 14px;font-size:27px;line-height:1.25">${esc(title)}</h1>${body}</td></tr><tr><td style="padding:20px 30px;background:#f8fafc;border-top:1px solid #e5e7eb;color:#64748b;font-size:12px;line-height:1.65">Axi Trades Official<br><a href="${esc(url)}" style="color:#111827">${esc(url.replace(/^https?:\/\//,''))}</a><br><br>This is an automated message. Please do not reply directly.</td></tr></table></td></tr></table></body></html>`;
}
export async function sendAxiEmail(to: string, subject: string, title: string, pre: string, body: string) {
  if (!to) return false;
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@axitrades.com';
  const fromName = process.env.RESEND_FROM_NAME || 'Axi Trades Official';
  if (!apiKey) { console.error('[Axi email] RESEND_API_KEY is not configured'); return false; }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `${fromName} <${fromEmail}>`, to: [to], subject, html: html(title, pre, body), text: `${title}\n\n${pre}` })
    });
    if (!response.ok) { const detail = await response.text(); console.error('[Axi email] Resend delivery failed', response.status, detail); return false; }
    return true;
  } catch (e) { console.error('[Axi email] Resend request failed', e); return false; }
}
export async function sendRegistrationEmails(user: any) {
  const a = getAdminAuth();
  if (!a) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
  let verify = appUrl() + '/verify-email';
  try {
    const link = await a.generateEmailVerificationLink(user.email, { url: appUrl() + '/verify-email', handleCodeInApp: false });
    const code = new URL(link).searchParams.get('oobCode');
    if (code) verify = appUrl() + '/verify-email?mode=verifyEmail&oobCode=' + encodeURIComponent(code);
  } catch (e) { console.error('[Axi email] verification link failed', e); }
  const name = esc(user.name || String(user.email).split('@')[0]);
  await sendAxiEmail(user.email, 'Welcome to Axi Trades — Registration confirmed', 'Welcome to Axi Trades', 'Your Axi Trades account has been created successfully.', `<p style="font-size:15px;line-height:1.75;color:#334155">Hello ${name},</p><p style="font-size:15px;line-height:1.75;color:#334155">Thank you for opening an account with <strong>Axi Trades</strong>. Your registration has been received and is pending the required verification and review steps.</p>${button('Verify Email Address', verify)}<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;color:#475569"><strong>What happens next</strong><br>Your account status, verification and transaction updates will be sent to this registered email address.</div>`);
  const admin = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (admin) await sendAxiEmail(admin, 'New Axi Trades registration', 'New user registration', 'A new Axi Trades account requires attention.', `<p>A new user has registered on Axi Trades.</p><p><strong>Name:</strong> ${name}<br><strong>Email:</strong> ${esc(user.email)}<br><strong>Country:</strong> ${esc(user.country || 'Not provided')}</p>${button('Open Axi Trades', appUrl())}`);
}
export async function sendPasswordResetEmail(email: string) {
  const a = getAdminAuth();
  if (!a) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
  const user = await a.getUserByEmail(email);
  const link = await a.generatePasswordResetLink(email, { url: appUrl() + '/reset-password', handleCodeInApp: false });
  const code = new URL(link).searchParams.get('oobCode');
  if (!code) throw new Error('No Firebase reset code');
  const reset = appUrl() + '/reset-password?mode=resetPassword&oobCode=' + encodeURIComponent(code);
  const sent = await sendAxiEmail(email, 'Axi Trades — Reset your password', 'Reset your Axi Trades password', 'A secure password reset link was requested for your Axi Trades account.', `<p style="font-size:15px;line-height:1.75;color:#334155">Hello ${esc(user.displayName || email.split('@')[0])},</p><p style="font-size:15px;line-height:1.75;color:#334155">We received a request to reset your Axi Trades password. Use the secure button below to choose a new password.</p>${button('Reset Password', reset)}<p style="font-size:13px;color:#64748b">If you did not request this, you can safely ignore this email.</p>`);
  if (!sent) throw new Error('Password reset email could not be delivered');
  return true;
}
export async function sendAccountStatusEmail(user: any, status: string, reason?: string) {
  if (!user?.email) return false;
  return sendAxiEmail(user.email, 'Axi Trades — Account status update', 'Account status update', 'Your Axi Trades account status has changed.', `<p>Hello ${esc(user.name || user.email.split('@')[0])},</p><p>Your account status is now <strong>${esc(status)}</strong>.</p>${reason ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px">${esc(reason)}</div>` : ''}${button('Open Axi Trades', appUrl())}`);
}