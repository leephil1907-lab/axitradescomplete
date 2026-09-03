import nodemailer from 'nodemailer';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: process.env.SMTP_SECURE === 'true', auth: { user, pass } });
}

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c] as string));

export function renderAxiEmail(title: string, bodyHtml: string, preheader = '') {
  return `<!doctype html><html><body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#17202a"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div><table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center"><table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.08)"><tr><td style="background:#111827;padding:26px 32px;color:#fff;font-size:24px;font-weight:700">Axi Trades</td></tr><tr><td style="padding:34px 32px"><h1 style="margin:0 0 18px;font-size:25px">${escapeHtml(title)}</h1>${bodyHtml}</td></tr><tr><td style="padding:20px 32px;background:#f8fafc;color:#64748b;font-size:12px">Axi Trades • This is an automated service message. Please do not reply to this email unless instructed.</td></tr></table></td></tr></table></body></html>`;
}

export async function sendAxiEmail(to: string, subject: string, title: string, bodyHtml: string, preheader?: string) {
  if (!to || !/^\S+@\S+\.\S+$/.test(to)) throw new Error('A valid recipient email is required');
  const transporter = getTransporter();
  if (!transporter) throw new Error('SMTP email service is not configured');
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  if (!from) throw new Error('EMAIL_FROM/SMTP_USER is not configured');
  await transporter.sendMail({ from, to, subject, html: renderAxiEmail(title, bodyHtml, preheader), text: `${title}\n\n${bodyHtml.replace(/<[^>]+>/g, ' ')}` });
}
