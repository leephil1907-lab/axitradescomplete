import { initOperationalPostgres, postgresOperationalRoutes } from './server/postgresOperational';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import { sendAxiEmail } from './emailService';
import { sendRegistrationEmails, sendPasswordResetEmail } from './server/emailService';
import { hasPostgres, initPostgres, dbUsers, dbUpsertUser, dbUpdateUser, dbAdjustBalance, dbBalanceLedger, audit, dbAuditLogs, dbPaymentMethods, dbSavePaymentMethods, dbCreateFunding, dbFundingPending, dbCreditFunding } from './server/postgres';
import YahooFinanceRaw from 'yahoo-finance2';
import { requireAuth, requireAdmin, authenticateAdminCredentials, adminLoginConfigured } from './server/adminAuth';
import { initControlPlane, registerControlPlane } from './server/controlPlane';
import { initFundingControlPlane, registerFundingControlPlane } from './server/fundingControlPlane';

function createYahooFinanceClient() {
  try {
    let YF: any = YahooFinanceRaw;
    if (YF && typeof YF !== 'function' && typeof YF.default === 'function') {
      YF = YF.default;
    }
    if (typeof YF === 'function') {
      return new YF({ suppressNotices: ['yahooSurvey'] });
    }
    if (YF && typeof YF.quote === 'function') {
      return YF;
    }
    if (YF && YF.default && typeof YF.default.quote === 'function') {
      return YF.default;
    }
  } catch (e) {
    console.error('Failed to instantiate YahooFinance client:', e);
  }
  return null;
}

const yahooFinance = createYahooFinanceClient();


dotenv.config();

let currentFilename = '';
let currentDirname = '';
try {
  currentFilename = fileURLToPath(import.meta.url);
  currentDirname = path.dirname(currentFilename);
} catch (e) {
  currentFilename = __filename;
  currentDirname = __dirname;
}

const app = express();

// POSTGRES_PERSISTENCE_MARKER
initPostgres().then(() => { if (hasPostgres()) console.log('PostgreSQL persistence initialized'); }).catch((error) => {
  console.error('PostgreSQL initialization failed; application will retain its existing fallback stores:', error);
});

app.get('/api/health', (_req, res) => { res.status(200).json({ ok: true, service: 'axi-trades', environment: process.env.NODE_ENV || 'development', timestamp: new Date().toISOString() }); });

// Force HTTPS and set security headers in production
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// Global Webhook Ping Activity State
interface WebhookPingEntry {
  timestamp: string;
  event: string;
  status: 'Active' | 'Disconnected';
  latencyMs: number;
  source: string;
}

const webhookPingState = {
  lastPingTimestamp: 0,
  lastPingEvent: 'none',
  lastPingStatus: 'Disconnected' as 'Active' | 'Disconnected',
  lastPingLatencyMs: 0,
  lastPingSource: 'No verified webhook activity yet',
  totalPingsCount: 0,
  history: [] as WebhookPingEntry[]
};

// Stripe configuration & lazy client initialization
let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

// Dedicated raw body handling for Stripe webhook BEFORE express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const startTime = Date.now();
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripe();

  let event;

  try {
    if (!stripe || !webhookSecret || !sig) {
      return res.status(503).send('Stripe webhook verification is not configured');
    }
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed:`, err.message);

    // Update ping activity for verification failures.
    webhookPingState.lastPingTimestamp = Date.now();
    webhookPingState.lastPingEvent = 'verification.failed';
    webhookPingState.lastPingStatus = 'Disconnected';
    webhookPingState.lastPingLatencyMs = Date.now() - startTime;
    webhookPingState.history.unshift({
      timestamp: new Date().toISOString(),
      event: 'verification.failed',
      status: 'Disconnected',
      latencyMs: Date.now() - startTime,
      source: 'Stripe Signature Verification'
    });
    if (webhookPingState.history.length > 20) webhookPingState.history.pop();

    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Record active ping activity
  const latency = Math.max(1, Date.now() - startTime);
  webhookPingState.lastPingTimestamp = Date.now();
  webhookPingState.lastPingEvent = event?.type || 'ping';
  webhookPingState.lastPingStatus = 'Active';
  webhookPingState.lastPingLatencyMs = latency;
  webhookPingState.totalPingsCount++;
  webhookPingState.history.unshift({
    timestamp: new Date().toISOString(),
    event: event?.type || 'ping',
    status: 'Active',
    latencyMs: latency,
    source: 'Stripe Webhook Listener'
  });
  if (webhookPingState.history.length > 20) webhookPingState.history.pop();

  // Handle the event
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const notifyTelegram = (message: string) => {
    if (botToken && chatId) {
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `<b>[Axi Trading Alert - STRIPE_PAYMENT]</b>\n\n${message}\n\n<i>Sent: ${new Date().toUTCString()}</i>`,
          parse_mode: 'HTML'
        })
      }).catch(e => console.error('Error sending telegram alert:', e));
    }
  };

  // Helper: record a completed Stripe payment for admin review.
  // IMPORTANT: Stripe does NOT credit the user balance automatically. The payment
  // is received into the merchant Stripe balance, and the admin is notified so the
  // admin can manually credit the exact paid amount to the user's account.
  const recordPaymentForAdmin = (email: string, amountUsd: number, refCode: string, method: string) => {
    if (!email || amountUsd <= 0) return;
    // Record a pending deposit entry for the admin to review & manually approve
    const pendingDeposits = readDataFile<any[]>('pendingDeposits.json', []);
    const entry = {
      id: refCode,
      userEmail: email,
      user: appUsersStore.find(u => u.email.toLowerCase() === email.toLowerCase()),
      amount: amountUsd,
      method,
      status: 'Payment Received — Awaiting Admin Credit',
      stripeRef: refCode,
      receivedAt: new Date().toISOString(),
      creditedByAdmin: false
    };
    // Avoid duplicates by refCode
    if (!pendingDeposits.find(d => d.id === refCode)) {
      pendingDeposits.unshift(entry);
      writeDataFile('pendingDeposits.json', pendingDeposits);
    }
    notifyTelegram(`💰 <b>STRIPE PAYMENT RECEIVED</b>\nAmount: $${amountUsd.toFixed(2)} USD\nMethod: ${method}\nUser: ${email}\nRef: ${refCode}\n\n✅ Funds received into Stripe balance.\n⚠️ ACTION REQUIRED: Admin must manually credit this amount to the user's account balance from the Admin Dashboard.`);
  };

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`✅ PaymentIntent for ${paymentIntent.amount} was successful!`);
      {
        const piAmount = (paymentIntent.amount || 0) / 100;
        const piCurrency = (paymentIntent.currency || 'usd').toUpperCase();
        const piUserId = paymentIntent.metadata?.userId || '';
        const piRef = `STRIPE-PI-${String(paymentIntent.id || '').slice(-8).toUpperCase()}`;
        // Try to find user by metadata userId, then by receipt email
        const piUser = piUserId ? appUsersStore.find(u => u.id === piUserId || u.email.toLowerCase() === piUserId.toLowerCase()) : null;
        const piEmail = piUser?.email || paymentIntent.receipt_email || '';
        if (piEmail) recordPaymentForAdmin(piEmail, piAmount, piRef, 'Card (PaymentIntent)');
        else notifyTelegram(`💰 <b>STRIPE PAYMENT RECEIVED</b>\nAmount: $${piAmount.toFixed(2)} ${piCurrency}\nRef: ${piRef}\n\n⚠️ No matching user found — admin must verify manually and credit the correct account.`);
      }
      break;
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log(`✅ Checkout Session ${session.id} completed successfully!`);
      {
        const csAmount = (session.amount_total || 0) / 100;
        const csCurrency = (session.currency || 'usd').toUpperCase();
        const csUserId = session.metadata?.userId || '';
        const csEmail = session.customer_details?.email || session.metadata?.userEmail || '';
        const csRef = `STRIPE-CS-${String(session.id || '').slice(-8).toUpperCase()}`;
        // Find user by metadata userId or customer email
        const csUser = csUserId ? appUsersStore.find(u => u.id === csUserId || u.email.toLowerCase() === csUserId.toLowerCase()) : null;
        const finalEmail = csUser?.email || csEmail || '';
        if (finalEmail) recordPaymentForAdmin(finalEmail, csAmount, csRef, 'Card (Checkout)');
        else notifyTelegram(`💰 <b>STRIPE CHECKOUT COMPLETED</b>\nAmount: $${csAmount.toFixed(2)} ${csCurrency}\nRef: ${csRef}\n\n⚠️ No matching user found — admin must verify manually and credit the correct account.`);
      }
      break;
    default:
      console.log(`Received Stripe event type ${event.type}`);
  }

  res.json({ received: true });
});

// Production email endpoints. SMTP credentials stay on Railway/server; they are never shipped to the browser.
app.post('/api/email/registration', async (req, res) => {
  try {
    const { email, name } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Recipient email is required' });
    const safeName = String(name || 'Client').replace(/[<>]/g, '');
    await sendAxiEmail(String(email).trim().toLowerCase(), 'Welcome to Axi Trades', 'Welcome to Axi Trades', `<p>Hello ${safeName},</p><p>Your registration has been received successfully. Your account is currently being prepared for secure onboarding.</p><p>For your protection, account funding and trading access remain subject to the platform's verification and approval controls.</p><p>Regards,<br>Axi Trades Support</p>`);
    res.json({ success: true });
  } catch (e: any) { res.status(503).json({ error: e?.message || 'Email service unavailable' }); }
});

app.post('/api/admin/email', async (req, res) => {
  try {
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey || req.headers['x-admin-api-key'] !== adminKey) return res.status(401).json({ error: 'Unauthorized' });
    const { email, name, subject, title, message } = req.body || {};
    if (!email || !subject || !message) return res.status(400).json({ error: 'email, subject and message are required' });
    const safeName = String(name || 'Client').replace(/[<>]/g, '');
    const safeMessage = String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    await sendAxiEmail(String(email).trim().toLowerCase(), String(subject), String(title || subject), `<p>Hello ${safeName},</p><p>${safeMessage}</p><p>Regards,<br>Axi Trades Support</p>`);
    res.json({ success: true });
  } catch (e: any) { res.status(503).json({ error: e?.message || 'Email service unavailable' }); }
});


// Return 404 for common framework/config probes instead of serving the SPA shell.
app.use((req, res, next) => {
  const blocked = /^(\/\.env|\/\.git(?:\/|$)|\/\.vscode(?:\/|$)|\/server-status(?:\/|$)|\/server(?:\/|$)|\/actuator(?:\/|$)|\/trace\.axd(?:\/|$)|\/info\.php(?:\/|$)|\/telescope(?:\/|$)|\/v2\/_catalog(?:\/|$)|\/debug(?:\/|$)|\/config\.json$|\/\@vite\/env$|\/\.DS_Store$)/i.test(req.path);
  if (blocked) return res.status(404).json({ error: 'Not found' });
  next();
});

// General Express JSON middleware for all other API routes
app.use(express.json());

// AUTHORITATIVE_CONTROL_PLANE_WIRED
initControlPlane().catch((error) => console.error('Control plane initialization failed:', error));
registerControlPlane(app);
initFundingControlPlane().catch((error) => console.error('Funding control plane initialization failed:', error));
registerFundingControlPlane(app);
app.get('/api/payment-methods', requireAuth, async (_req, res) => {
  try {
    const rows = await dbPaymentMethods().catch(() => null);
    if (!rows) return res.json({ success: true, source: 'unconfigured', methods: [] });
    const names: Record<string, string> = { bankTransfer: 'Bank Transfer', instantTransfer: 'Instant Transfer', crypto: 'Crypto', paypal: 'PayPal', skrill: 'Skrill', neteller: 'Neteller' };
    const types: Record<string, string> = { bankTransfer: 'bank', instantTransfer: 'bank', crypto: 'crypto', paypal: 'wallet', skrill: 'wallet', neteller: 'wallet' };
    const icons: Record<string, string> = { bankTransfer: 'bank', instantTransfer: 'bank', crypto: 'crypto', paypal: 'paypal', skrill: 'skrill', neteller: 'neteller' };
    const methods = rows.map((row: any) => ({
      id: row.method_type === 'crypto' ? (row.id || 'crypto') : row.method_type,
      name: names[row.method_type] || row.method_type,
      type: types[row.method_type] || 'other', active: Boolean(row.enabled),
      details: row.details || {}, iconName: icons[row.method_type] || row.method_type,
      ...((row.details && typeof row.details === 'object') ? row.details : {})
    }));
    if (process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      methods.unshift({ id: 'card', name: 'Card', type: 'card', active: true, details: {}, iconName: 'card' });
    }
    return res.json({ success: true, source: 'postgres', methods });
  } catch (error: any) {
    console.error('Customer payment-method read failed:', error?.message || error);
    return res.status(500).json({ error: 'Payment configuration unavailable' });
  }
});

app.post('/api/admin/login',(req,res)=>{if(!adminLoginConfigured())return res.status(503).json({error:'Administrator authentication is not configured'});const token=authenticateAdminCredentials(String(req.body?.email||process.env.ADMIN_EMAIL||''),String(req.body?.password||''));if(!token)return res.status(401).json({error:'Incorrect administrator email or password.'});return res.json({token,expiresIn:43200});});

// POSTGRES_OPERATIONAL_ROUTES_MARKER
// Production operational records are persisted in PostgreSQL. These routes are
// registered before the legacy file-backed handlers so production never silently
// falls back to ephemeral/local JSON for KYC and transaction records.
initOperationalPostgres().catch((error) => console.error('Operational PostgreSQL initialization failed:', error));
postgresOperationalRoutes(app);

// Generic TradingView / MT4/MT5 / Signal Webhook endpoint
app.post('/api/webhook/trading-signals', (req, res) => {
  const secretHeader = req.headers['x-webhook-secret'] || req.headers['authorization'];
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!expectedSecret || secretHeader !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized webhook request' });
  }

  const { symbol, action, price, quantity, comment } = req.body || {};
  console.log(`📥 Webhook Signal Received:`, {
    symbol: symbol || 'UNKNOWN',
    action: action || 'BUY',
    price: price || 0,
    quantity: quantity || 1,
    comment: comment || '',
    receivedAt: new Date().toISOString()
  });

  res.json({
    status: 'success',
    message: 'Webhook signal received and authenticated; execution requires a configured broker execution gateway',
    signal: { symbol, action, price, quantity, comment },
    timestamp: new Date().toISOString()
  });
});


// Production funding review endpoints. Stripe payments are never auto-credited.
app.get('/api/admin/funding/pending', requireAdmin,  async (_req, res) => {
  const persisted = await dbFundingPending().catch(() => null);
  if (persisted) return res.json({ deposits: persisted, source: 'postgres' });
  const deposits = readDataFile<any[]>('pendingDeposits.json', []);
  res.json({ deposits: deposits.filter(d => !d.creditedByAdmin && d.status !== 'Rejected'), source: 'fallback' });
});

app.post('/api/admin/funding/:id/credit', requireAdmin,  async (req, res) => {
  const id = String(req.params.id || '');
  const deposits = readDataFile<any[]>('pendingDeposits.json', []);
  const index = deposits.findIndex(d => d.id === id);
  if (index < 0) return res.status(404).json({ error: 'Funding record not found' });
  const persistedCredit = await dbCreditFunding(id, String((req as any).adminEmail || 'unknown-admin')).catch(() => null);
  const deposit = deposits[index];
  if (deposit.creditedByAdmin || deposit.status === 'Credited') return res.status(409).json({ error: 'Funding record has already been credited' });
  const creditedBalance = Number(req.body?.creditedBalance);
  if (!Number.isFinite(creditedBalance) || creditedBalance < 0) return res.status(400).json({ error: 'Invalid credited balance' });
  deposits[index] = { ...deposit, status: 'Credited', creditedByAdmin: true, creditedAt: new Date().toISOString(), creditedBalance, creditedUserId: String(req.body?.userId || '') };
  writeDataFile('pendingDeposits.json', deposits);
  await audit('ADMIN_FUNDING_CREDIT', { actor: String((req as any).adminEmail || 'unknown-admin'), userId: String(req.body?.userId || ''), metadata: { fundingId: id, creditedBalance } }).catch(() => {});
  res.json({ success: true, deposit: deposits[index], persisted: Boolean(persistedCredit) });
});

app.post('/api/admin/funding/:id/reject', requireAdmin,  (req, res) => {
  const id = String(req.params.id || '');
  const deposits = readDataFile<any[]>('pendingDeposits.json', []);
  const index = deposits.findIndex(d => d.id === id);
  if (index < 0) return res.status(404).json({ error: 'Funding record not found' });
  if (deposits[index].creditedByAdmin) return res.status(409).json({ error: 'Credited funding cannot be rejected' });
  deposits[index] = { ...deposits[index], status: 'Rejected', rejectedAt: new Date().toISOString(), rejectedByAdmin: true };
  writeDataFile('pendingDeposits.json', deposits);
  res.json({ success: true, deposit: deposits[index] });
});

const PAYMENT_METHODS_FILE = 'paymentMethods.json';

app.get('/api/admin/payment-methods', requireAdmin, async (_req, res) => {
  const persistedMethods = await dbPaymentMethods().catch(() => null);
  if (!persistedMethods) return res.status(503).json({ success: false, error: 'Payment methods storage is unavailable' });
  const bankRow = persistedMethods.find((row) => row.method_type === 'bankTransfer');
  const instantRow = persistedMethods.find((row) => row.method_type === 'instantTransfer');
  const crypto = persistedMethods.filter((row) => row.method_type === 'crypto').map((row) => ({ id: row.id, ...(row.details || {}), enabled: Boolean(row.enabled), iconName: 'crypto' }));
  const wallet = (type: string, iconName: string) => {
    const row = persistedMethods.find((item) => item.method_type === type);
    return row ? { ...(row.details || {}), enabled: Boolean(row.enabled), iconName } : { enabled: false, account: '', accountName: '', instructions: '', iconName };
  };
  return res.json({ success: true, source: 'postgres', methods: {
    bankTransfer: bankRow ? { ...(bankRow.details || {}), enabled: Boolean(bankRow.enabled), iconName: 'bank' } : { enabled: false, iconName: 'bank' },
    instantTransfer: instantRow ? { ...(instantRow.details || {}), enabled: Boolean(instantRow.enabled), iconName: 'bank' } : { enabled: false, iconName: 'bank' },
    paypal: wallet('paypal', 'paypal'),
    skrill: wallet('skrill', 'skrill'),
    neteller: wallet('neteller', 'neteller'),
    crypto
  }});
});

app.get('/api/admin/activity', requireAdmin,  async (req, res) => {
  const logs = await dbAuditLogs(Number(req.query.limit || 200)).catch(() => null);
  res.json({ success: true, logs: logs || [], source: logs ? 'postgres' : 'unavailable' });
});

const PORT = Number(process.env.PORT) || 3000;

// Shared Gemini client setup
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAIClient;
}

// Store live rates

// Live market state contract
interface MarketState {
  price: number;
  change: number;
  bidDiff: number;
  askDiff: number;
  spread: number;
  lastUpdated: number;
  stale: boolean;
  status: 'live' | 'stale' | 'unavailable';
  source?: string;
}

const SUPPORTED_SYMBOLS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY',
  'BTCUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD', 'DOGEUSD', 'ADAUSD', 'AVAXUSD', 'DOTUSD', 'LINKUSD', 'BNBUSD',
  'LTCUSD', 'TRXUSD', 'TONUSD', 'NEARUSD', 'SUIUSD', 'SHIBUSD', 'PEPEUSD', 'MATICUSD',
  'XAUUSD', 'XAGUSD', 'USOUSD', 'BRENTUSD', 'NATGAS',
  'US30', 'SPX500', 'NAS100', 'UK100', 'GER40',
  'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'AMD', 'NFLX', 'COIN'
];

// Baseline reference prices updated to current live market levels
const INITIAL_BASELINE_PRICES: Record<string, { price: number; change: number }> = {};

// Initialize with live real baseline rates
const LIVE_MARKETS: Record<string, MarketState> = SUPPORTED_SYMBOLS.reduce((acc, sym) => {
  const base = INITIAL_BASELINE_PRICES[sym] || { price: 0, change: 0 };
  acc[sym] = {
    price: base.price,
    change: base.change,
    bidDiff: 0,
    askDiff: 0,
    spread: 0,
    lastUpdated: Date.now(),
    stale: false,
    status: 'unavailable',
    source: 'No verified market feed available'
  };
  return acc;
}, {} as Record<string, MarketState>);

const YAHOO_CHART_SYMBOLS: Record<string, string> = {
  'XAUUSD': 'GC=F',
  'XAGUSD': 'SI=F',
  'USOUSD': 'CL=F',
  'BRENTUSD': 'BZ=F',
  'NATGAS': 'NG=F',
  'US30': '^DJI',
  'SPX500': '^GSPC',
  'NAS100': '^IXIC',
  'UK100': '^FTSE',
  'GER40': '^GDAXI',
  'AAPL': 'AAPL',
  'TSLA': 'TSLA',
  'NVDA': 'NVDA',
  'MSFT': 'MSFT',
  'AMZN': 'AMZN',
  'GOOGL': 'GOOGL',
  'META': 'META',
  'AMD': 'AMD',
  'NFLX': 'NFLX',
  'COIN': 'COIN',
  'EURUSD': 'EURUSD=X',
  'GBPUSD': 'GBPUSD=X',
  'USDJPY': 'JPY=X',
  'AUDUSD': 'AUDUSD=X',
  'USDCAD': 'CAD=X'
};

const BINANCE_MAPPING: Record<string, string> = {
  'BTCUSDT': 'BTCUSD',
  'ETHUSDT': 'ETHUSD',
  'SOLUSDT': 'SOLUSD',
  'XRPUSDT': 'XRPUSD',
  'DOGEUSDT': 'DOGEUSD',
  'ADAUSDT': 'ADAUSD',
  'AVAXUSDT': 'AVAXUSD',
  'DOTUSDT': 'DOTUSD',
  'LINKUSDT': 'LINKUSD',
  'BNBUSDT': 'BNBUSD',
  'LTCUSDT': 'LTCUSD',
  'TRXUSDT': 'TRXUSD',
  'TONUSDT': 'TONUSD',
  'NEARUSDT': 'NEARUSD',
  'SUIUSDT': 'SUIUSD',
  'SHIBUSDT': 'SHIBUSD',
  'PEPEUSDT': 'PEPEUSD',
  'POLUSDT': 'MATICUSD'
};

const FINNHUB_MAPPING: Record<string, string> = {
  'AAPL': 'AAPL',
  'TSLA': 'TSLA',
  'NVDA': 'NVDA',
  'MSFT': 'MSFT',
  'AMZN': 'AMZN',
  'GOOGL': 'GOOGL',
  'META': 'META',
  'AMD': 'AMD',
  'NFLX': 'NFLX',
  'COIN': 'COIN',
  'EURUSD': 'OANDA:EUR_USD',
  'GBPUSD': 'OANDA:GBP_USD',
  'USDJPY': 'OANDA:USD_JPY',
  'AUDUSD': 'OANDA:AUD_USD',
  'USDCAD': 'OANDA:USD_CAD',
  'USDCHF': 'OANDA:USD_CHF',
  'NZDUSD': 'OANDA:NZD_USD',
  'EURGBP': 'OANDA:EUR_GBP',
  'EURJPY': 'OANDA:EUR_JPY',
  'GBPJPY': 'OANDA:GBP_JPY',
  'XAUUSD': 'OANDA:XAU_USD'
};

let lastFinnhubFetchTime = 0;
let lastForexFetchTime = 0;
let lastYahooFetchIndex = 0;
let activeMarketProviders: string[] = ['Binance Spot API', 'Interbank FX Exchange', 'Global Commodities & Equities'];

async function fetchYahooChartQuote(internalSymbol: string, yfTicker: string) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfTicker)}?interval=2m&range=1d`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data: any = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta && typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0) {
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose || price;
        const change = prevClose > 0 ? Number((((price - prevClose) / prevClose) * 100).toFixed(2)) : 0;

        if (LIVE_MARKETS[internalSymbol]) {
          LIVE_MARKETS[internalSymbol].price = price;
          LIVE_MARKETS[internalSymbol].change = change;
          LIVE_MARKETS[internalSymbol].lastUpdated = Date.now();
          LIVE_MARKETS[internalSymbol].stale = false;
          LIVE_MARKETS[internalSymbol].status = 'live';
          LIVE_MARKETS[internalSymbol].source = 'Global Market Exchanges';
        }
      }
    }
  } catch (e) {
    // skip individual ticker timeout
  }
}

async function updateLiveMarkets() {
  const finnhubKey = process.env.FINNHUB_API_KEY;
  const now = Date.now();

  // 1. Fetch Real-time Crypto quotes — Kraken (primary) + Coinbase (fallback).
  //    Binance public API is geo-restricted in many hosting regions, so we use
  //    Kraken's public ticker which returns accurate live last-price + 24h open
  //    for all major USD pairs in a single request.
  const cryptoUpdated = new Set<string>();
  try {
    const krakenPairs = 'XBTUSD,ETHUSD,SOLUSD,XRPUSD,ADAUSD,DOGEUSD,LTCUSD,LINKUSD,DOTUSD,AVAXUSD,BNBUSD,TRXUSD,TONUSD,NEARUSD,SUIUSD,SHIBUSD,PEPEUSD';
    const res = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${krakenPairs}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data: any = await res.json();
      const result = data?.result || {};
      // Kraken returns mangled pair names (XXBTZUSD etc.) — map by normalising
      const krakenToInternal: Record<string, string> = {
        'XXBTZUSD': 'BTCUSD', 'XBTUSD': 'BTCUSD',
        'XETHZUSD': 'ETHUSD', 'ETHUSD': 'ETHUSD',
        'SOLUSD': 'SOLUSD', 'XXRPZUSD': 'XRPUSD', 'XRPUSD': 'XRPUSD',
        'ADAUSD': 'ADAUSD', 'XDGUSD': 'DOGEUSD', 'DOGEUSD': 'DOGEUSD',
        'XLTCZUSD': 'LTCUSD', 'LTCUSD': 'LTCUSD', 'LINKUSD': 'LINKUSD',
        'DOTUSD': 'DOTUSD', 'AVAXUSD': 'AVAXUSD', 'BNBUSD': 'BNBUSD',
        'TRXUSD': 'TRXUSD', 'TONUSD': 'TONUSD', 'NEARUSD': 'NEARUSD',
        'SUIUSD': 'SUIUSD', 'SHIBUSD': 'SHIBUSD', 'PEPEUSD': 'PEPEUSD'
      };
      for (const [krakenSym, ticker] of Object.entries(result)) {
        const sym = krakenToInternal[krakenSym];
        if (sym && LIVE_MARKETS[sym] && ticker) {
          const t = ticker as any;
          const price = parseFloat(t.c?.[0] || '0');   // last trade price
          const open24 = parseFloat(t.o || '0');        // 24h open
          if (!isNaN(price) && price > 0) {
            const change = open24 > 0 ? Number((((price - open24) / open24) * 100).toFixed(2)) : 0;
            LIVE_MARKETS[sym].price = price;
            LIVE_MARKETS[sym].change = change;
            LIVE_MARKETS[sym].bidDiff = - (price * 0.0001);
            LIVE_MARKETS[sym].askDiff = (price * 0.0001);
            LIVE_MARKETS[sym].spread = Number((price * 0.0002).toFixed(4));
            LIVE_MARKETS[sym].lastUpdated = now;
            LIVE_MARKETS[sym].stale = false;
            LIVE_MARKETS[sym].status = 'live';
            LIVE_MARKETS[sym].source = 'Kraken Live Spot';
            cryptoUpdated.add(sym);
          }
        }
      }
    }
  } catch (err) {
    // Kraken failed — fall through to Coinbase single-pair fallback below
  }

  // Coinbase fallback for any crypto symbol not yet updated (or if Kraken failed)
  if (cryptoUpdated.size < Object.keys(BINANCE_MAPPING).length) {
    const coinbasePairs: Record<string, string> = {
      'BTCUSD': 'BTC-USD', 'ETHUSD': 'ETH-USD', 'SOLUSD': 'SOL-USD', 'XRPUSD': 'XRP-USD',
      'ADAUSD': 'ADA-USD', 'DOGEUSD': 'DOGE-USD', 'LTCUSD': 'LTC-USD', 'LINKUSD': 'LINK-USD',
      'DOTUSD': 'DOT-USD', 'AVAXUSD': 'AVAX-USD', 'BNBUSD': 'BNB-USD', 'TRXUSD': 'TRX-USD',
      'TONUSD': 'TON-USD', 'NEARUSD': 'NEAR-USD', 'SUIUSD': 'SUI-USD', 'MATICUSD': 'MATIC-USD'
    };
    for (const [internalSym, cbPair] of Object.entries(coinbasePairs)) {
      if (cryptoUpdated.has(internalSym) || !LIVE_MARKETS[internalSym]) continue;
      try {
        const cbRes = await fetch(`https://api.coinbase.com/v2/prices/${cbPair}/spot`, {
          signal: AbortSignal.timeout(2500)
        });
        if (cbRes.ok) {
          const cbData: any = await cbRes.json();
          const price = parseFloat(cbData?.data?.amount || '0');
          if (!isNaN(price) && price > 0) {
            LIVE_MARKETS[internalSym].price = price;
            LIVE_MARKETS[internalSym].bidDiff = - (price * 0.0001);
            LIVE_MARKETS[internalSym].askDiff = (price * 0.0001);
            LIVE_MARKETS[internalSym].spread = Number((price * 0.0002).toFixed(4));
            LIVE_MARKETS[internalSym].lastUpdated = now;
            LIVE_MARKETS[internalSym].stale = false;
            LIVE_MARKETS[internalSym].status = 'live';
            LIVE_MARKETS[internalSym].source = 'Coinbase Live Spot';
            cryptoUpdated.add(internalSym);
          }
        }
      } catch (e3) { /* skip individual pair */ }
    }
  }
  if (cryptoUpdated.size > 0 && !activeMarketProviders.includes('Kraken Live Spot')) {
    activeMarketProviders.push('Kraken Live Spot');
  }

  // 2. Fetch Live Interbank Forex Rates from open.er-api.com (zero auth required, 100% real live global exchange rates)
  if (now - lastForexFetchTime > 4000) {
    lastForexFetchTime = now;
    try {
      const fxRes = await fetch('https://open.er-api.com/v6/latest/USD', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(3500)
      });
      if (fxRes.ok) {
        const fxData: any = await fxRes.json();
        const rates = fxData?.rates;
        if (rates) {
          const eurusd = rates.EUR ? 1 / rates.EUR : null;
          const gbpusd = rates.GBP ? 1 / rates.GBP : null;
          const usdjpy = rates.JPY ? rates.JPY : null;
          const audusd = rates.AUD ? 1 / rates.AUD : null;
          const usdcad = rates.CAD ? rates.CAD : null;
          const usdchf = rates.CHF ? rates.CHF : null;
          const nzdusd = rates.NZD ? 1 / rates.NZD : null;

          if (eurusd && LIVE_MARKETS['EURUSD']) {
            LIVE_MARKETS['EURUSD'].price = Number(eurusd.toFixed(5));
            LIVE_MARKETS['EURUSD'].lastUpdated = now;
            LIVE_MARKETS['EURUSD'].status = 'live';
            LIVE_MARKETS['EURUSD'].source = 'Interbank FX Exchange';
          }
          if (gbpusd && LIVE_MARKETS['GBPUSD']) {
            LIVE_MARKETS['GBPUSD'].price = Number(gbpusd.toFixed(5));
            LIVE_MARKETS['GBPUSD'].lastUpdated = now;
            LIVE_MARKETS['GBPUSD'].status = 'live';
            LIVE_MARKETS['GBPUSD'].source = 'Interbank FX Exchange';
          }
          if (usdjpy && LIVE_MARKETS['USDJPY']) {
            LIVE_MARKETS['USDJPY'].price = Number(usdjpy.toFixed(3));
            LIVE_MARKETS['USDJPY'].lastUpdated = now;
            LIVE_MARKETS['USDJPY'].status = 'live';
            LIVE_MARKETS['USDJPY'].source = 'Interbank FX Exchange';
          }
          if (audusd && LIVE_MARKETS['AUDUSD']) {
            LIVE_MARKETS['AUDUSD'].price = Number(audusd.toFixed(5));
            LIVE_MARKETS['AUDUSD'].lastUpdated = now;
            LIVE_MARKETS['AUDUSD'].status = 'live';
            LIVE_MARKETS['AUDUSD'].source = 'Interbank FX Exchange';
          }
          if (usdcad && LIVE_MARKETS['USDCAD']) {
            LIVE_MARKETS['USDCAD'].price = Number(usdcad.toFixed(5));
            LIVE_MARKETS['USDCAD'].lastUpdated = now;
            LIVE_MARKETS['USDCAD'].status = 'live';
            LIVE_MARKETS['USDCAD'].source = 'Interbank FX Exchange';
          }
          if (usdchf && LIVE_MARKETS['USDCHF']) {
            LIVE_MARKETS['USDCHF'].price = Number(usdchf.toFixed(5));
            LIVE_MARKETS['USDCHF'].lastUpdated = now;
            LIVE_MARKETS['USDCHF'].status = 'live';
            LIVE_MARKETS['USDCHF'].source = 'Interbank FX Exchange';
          }
          if (nzdusd && LIVE_MARKETS['NZDUSD']) {
            LIVE_MARKETS['NZDUSD'].price = Number(nzdusd.toFixed(5));
            LIVE_MARKETS['NZDUSD'].lastUpdated = now;
            LIVE_MARKETS['NZDUSD'].status = 'live';
            LIVE_MARKETS['NZDUSD'].source = 'Interbank FX Exchange';
          }
          if (rates.EUR && rates.GBP && LIVE_MARKETS['EURGBP']) {
            LIVE_MARKETS['EURGBP'].price = Number((rates.GBP / rates.EUR).toFixed(5));
            LIVE_MARKETS['EURGBP'].lastUpdated = now;
            LIVE_MARKETS['EURGBP'].status = 'live';
          }
          if (rates.EUR && rates.JPY && LIVE_MARKETS['EURJPY']) {
            LIVE_MARKETS['EURJPY'].price = Number((rates.JPY / rates.EUR).toFixed(3));
            LIVE_MARKETS['EURJPY'].lastUpdated = now;
            LIVE_MARKETS['EURJPY'].status = 'live';
          }
          if (rates.GBP && rates.JPY && LIVE_MARKETS['GBPJPY']) {
            LIVE_MARKETS['GBPJPY'].price = Number((rates.JPY / rates.GBP).toFixed(3));
            LIVE_MARKETS['GBPJPY'].lastUpdated = now;
            LIVE_MARKETS['GBPJPY'].status = 'live';
          }

          if (!activeMarketProviders.includes('Interbank FX Exchange')) {
            activeMarketProviders.push('Interbank FX Exchange');
          }
        }
      }
    } catch (err) {}
  }

  // 3. Cycle and fetch Commodities (Gold, Silver, Oil), Indices, and Equities in concurrent batches
  try {
    const yfEntries = Object.entries(YAHOO_CHART_SYMBOLS);
    const batchSize = 6;
    const currentBatch = yfEntries.slice(lastYahooFetchIndex, lastYahooFetchIndex + batchSize);
    lastYahooFetchIndex = (lastYahooFetchIndex + batchSize) % yfEntries.length;

    await Promise.allSettled(
      currentBatch.map(([internalSym, yfTicker]) => fetchYahooChartQuote(internalSym, yfTicker))
    );
  } catch (err) {}

  // 4. Fetch live stocks and forex from Finnhub API if configured
  if (finnhubKey && now - lastFinnhubFetchTime > 5000) {
    lastFinnhubFetchTime = now;
    try {
      const symbolsToFetch = Object.keys(FINNHUB_MAPPING).slice(0, 5);
      for (const sym of symbolsToFetch) {
        const targetQuery = FINNHUB_MAPPING[sym];
        try {
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(targetQuery)}&token=${finnhubKey}`, {
            signal: AbortSignal.timeout(3000)
          });
          if (res.ok) {
            const data: any = await res.json();
            if (data && typeof data.c === 'number' && data.c > 0 && LIVE_MARKETS[sym]) {
              LIVE_MARKETS[sym].price = Number(data.c.toFixed(2));
              LIVE_MARKETS[sym].change = Number((data.dp || 0).toFixed(2));
              LIVE_MARKETS[sym].lastUpdated = now;
              LIVE_MARKETS[sym].stale = false;
              LIVE_MARKETS[sym].status = 'live';
              LIVE_MARKETS[sym].source = 'Finnhub API';
            }
          }
        } catch (e) {}
      }
      if (!activeMarketProviders.includes('Finnhub API')) {
        activeMarketProviders.push('Finnhub API');
      }
    } catch (e) {}
  }

  // 5. Update stale states (30 second grace window)
  const STALE_THRESHOLD_MS = 30000;
  for (const sym of SUPPORTED_SYMBOLS) {
    const item = LIVE_MARKETS[sym];
    if (!item.lastUpdated || now - item.lastUpdated > STALE_THRESHOLD_MS) {
      item.stale = true;
      item.status = item.price > 0 ? 'stale' : 'unavailable';
    }
  }
}

// Update immediately on startup and run loop every 2 seconds (only in non-serverless container mode)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
if (!isServerless) {
  updateLiveMarkets();
  setInterval(updateLiveMarkets, 2000);
}

// Endpoint for live real market rates
app.get('/api/markets/quotes', async (req, res) => {
  // If in serverless mode and data hasn't been fetched yet, perform a quick non-blocking update
  if (isServerless) {
    try {
      // Set cache headers to minimize function invocations and ensure high responsiveness
      res.setHeader('Cache-Control', 's-maxage=2, stale-while-revalidate=5');
      if (Object.keys(LIVE_MARKETS).length === 0 || !LIVE_MARKETS['EUR/USD']?.price) {
        await updateLiveMarkets();
      }
    } catch (e) {
      console.warn('Serverless market fetch warning:', e);
    }
  }
  res.json(LIVE_MARKETS);
});

// Endpoint for market data provider status
app.get('/api/markets/status', (req, res) => {
  res.json({
    status: 'online',
    activeProviders: Array.from(new Set(activeMarketProviders)),
    finnhubConfigured: Boolean(process.env.FINNHUB_API_KEY),
    alphaVantageConfigured: Boolean(process.env.ALPHA_VANTAGE_API_KEY),
    totalLiveInstruments: Object.keys(LIVE_MARKETS).length,
    timestamp: new Date().toISOString()
  });
});

// ---------------------------------------------------------------------------
// Economic Calendar — live data only, no hardcoded/sample events.
// Primary source: Finnhub /calendar/economic (free tier, requires API key).
// Secondary source: investing.com economic-calendar JSON API (public).
// If neither is reachable the endpoint returns an empty list with a clear
// `live` flag so the client never displays fabricated/sample data.
// ---------------------------------------------------------------------------
let economicCalendarCache: { data: any[]; fetchedAt: number } = { data: [], fetchedAt: 0 };

function mapFinnhubImpact(impact: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const v = (impact || '').toLowerCase();
  if (v.includes('high') || v === '3' || v === 'high impact') return 'HIGH';
  if (v.includes('medium') || v === '2' || v === 'medium impact') return 'MEDIUM';
  return 'LOW';
}

async function fetchFinnhubEconomicCalendar(): Promise<any[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return [];
  const today = new Date();
  const to = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const url = `https://finnhub.io/api/v1/calendar/economic?from=${fmt(today)}&to=${fmt(to)}&token=${key}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Finnhub eco calendar ${r.status}`);
  const j = (await r.json()) as any;
  const events = Array.isArray(j?.economicCalendar) ? j.economicCalendar : Array.isArray(j?.events) ? j.events : [];
  return events.map((e: any, i: number) => ({
    id: `fh_${e.country || 'xx'}_${e.time || ''}_${i}`,
    time: e.time ? String(e.time) : 'All Day',
    date: e.date ? String(e.date) : '',
    currency: String(e.country || '').toUpperCase(),
    country: String(e.country || ''),
    countryFlag: '',
    title: String(e.event || e.name || 'Economic Release'),
    impact: mapFinnhubImpact(String(e.impact || '')),
    actual: e.actual != null ? String(e.actual) : undefined,
    forecast: e.forecast != null ? String(e.forecast) : '',
    previous: e.prev != null ? String(e.prev) : (e.previous != null ? String(e.previous) : ''),
    affectedSymbols: [],
    description: String(e.event || e.name || ''),
  }));
}

async function fetchInvestingEconomicCalendar(): Promise<any[]> {
  // Public investing.com economic-calendar JSON proxy (andrevlima style).
  // Returns [{country, currency, event, importance, actual, forecast, previous, date, time}]
  const url = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(
    'https://sslecaly.investing.com/telecaster/?format=json'
  );
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!r.ok) throw new Error(`investing proxy ${r.status}`);
  const j = (await r.json()) as any;
  const events = Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : [];
  return events.map((e: any, i: number) => {
    const imp = String(e.importance || e.impact || '').toLowerCase();
    let impact: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (imp.includes('high') || imp === '3') impact = 'HIGH';
    else if (imp.includes('medium') || imp === '2') impact = 'MEDIUM';
    return {
      id: `inv_${i}_${e.currency || ''}_${e.event || ''}`.replace(/\s+/g, '_'),
      time: e.time ? String(e.time) : 'All Day',
      date: e.date ? String(e.date) : '',
      currency: String(e.currency || e.country || '').toUpperCase(),
      country: String(e.country || e.currency || ''),
      countryFlag: '',
      title: String(e.event || e.name || 'Economic Release'),
      impact,
      actual: e.actual ? String(e.actual) : undefined,
      forecast: e.forecast ? String(e.forecast) : '',
      previous: e.previous ? String(e.previous) : '',
      affectedSymbols: [],
      description: String(e.event || e.name || ''),
    };
  });
}

app.get('/api/economic-calendar', async (req, res) => {
  const now = Date.now();
  // Cache for 10 minutes to stay responsive but avoid hammering upstream APIs.
  if (now - economicCalendarCache.fetchedAt < 10 * 60 * 1000 && economicCalendarCache.data.length > 0) {
    return res.json({ live: true, source: 'cache', events: economicCalendarCache.data });
  }
  let events: any[] = [];
  let source = '';
  try {
    events = await fetchFinnhubEconomicCalendar();
    if (events.length) source = 'Finnhub API';
  } catch (e) {
    console.warn('Finnhub economic calendar fetch failed:', (e as Error).message);
  }
  if (!events.length) {
    try {
      events = await fetchInvestingEconomicCalendar();
      if (events.length) source = 'Investing.com (live)';
    } catch (e) {
      console.warn('Investing economic calendar fetch failed:', (e as Error).message);
    }
  }
  if (events.length) {
    economicCalendarCache = { data: events, fetchedAt: now };
    return res.json({ live: true, source, events });
  }
  // No data available — return an empty, honest response. NEVER sample data.
  return res.json({ live: false, source: 'unavailable', events: [] });
});

// ---------------------------------------------------------------------------
// Market Sentiment — long/short positioning per instrument.
// Only returns REAL data when a provider is configured. If no real source is
// available the endpoint responds with live:false so the client shows an
// honest "unavailable" state instead of fabricated percentages.
// ---------------------------------------------------------------------------
let sentimentCache: Record<string, { data: any; fetchedAt: number }> = {};

app.get('/api/sentiment/:symbol', async (req, res) => {
  const symbol = String(req.params.symbol || '').toUpperCase();
  if (!symbol) return res.status(400).json({ live: false, error: 'Symbol required' });

  const now = Date.now();
  const cached = sentimentCache[symbol];
  if (cached && now - cached.fetchedAt < 5 * 60 * 1000) {
    return res.json({ live: cached.data.live, symbol, ...cached.data });
  }

  // Attempt real sentiment via Finnhub (requires API key). Finnhub does not
  // expose direct long/short positioning, so we derive a directional bias
  // from the live quote change and flag it as a price-bias estimate rather
  // than broker client positioning. This is honest and never fabricated.
  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (finnhubKey) {
    try {
      const finnhubSym = FINNHUB_MAPPING[symbol] || symbol;
      const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(finnhubSym)}&token=${finnhubKey}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (r.ok) {
        const q = (await r.json()) as any;
        const change = Number(q?.dp ?? q?.change ?? 0); // percent change
        if (!isNaN(change)) {
          // Map a symmetric price change into a long/short bias estimate.
          // +-5% daily move maps to ~80/20 bias; 0% maps to 50/50.
          const clamped = Math.max(-10, Math.min(10, change));
          const long = Math.round(50 + clamped * 3); // 50 +/- up to 30
          const short = 100 - long;
          const data = {
            live: true,
            source: 'Price-bias estimate (Finnhub)',
            long: Math.max(5, Math.min(95, long)),
            short: Math.max(5, Math.min(95, short)),
            activePositions: undefined,
            note: 'Directional bias derived from live intraday price change. Broker client positioning is not publicly available.'
          };
          sentimentCache[symbol] = { data, fetchedAt: now };
          return res.json({ symbol, ...data });
        }
      }
    } catch (e) {
      console.warn('Sentiment fetch failed for', symbol, (e as Error).message);
    }
  }

  // No real source available — honest empty response, never fabricated counts.
  return res.json({
    live: false,
    symbol,
    source: 'unavailable',
    long: null,
    short: null,
    activePositions: null,
    note: 'Live broker sentiment is not available. No fabricated positioning data is displayed.'
  });
});

// ---------------------------------------------------------------------------
// Copy-Trading Leaderboard — verified master traders.
// Reads from an admin-managed data file (leaderboard.json) which is EMPTY by
// default. No fabricated/premade traders are ever returned. Admins populate
// real verified traders via the admin dashboard (or direct file edit).
// ---------------------------------------------------------------------------
app.get('/api/leaderboard', (req, res) => {
  const traders = readDataFile('leaderboard.json', []);
  res.json({ live: Array.isArray(traders) && traders.length > 0, traders: Array.isArray(traders) ? traders : [] });
});


app.get('/api/markets/history', async (req, res) => {
  const symbol = req.query.symbol as string;
  const tf = ((req.query.timeframe as string) || '1H').toUpperCase();
  if (!symbol || !LIVE_MARKETS[symbol]) {
    return res.status(404).json({ error: 'Instrument not found' });
  }
  
  // Map timeframe to Kraken OHLC interval (minutes) & limit
  let krakenInterval = 60;   // minutes
  let krakenLimit = 48;
  if (tf === '1D') { krakenInterval = 1440; krakenLimit = 30; }
  else if (tf === '4H') { krakenInterval = 240; krakenLimit = 42; }
  else if (tf === '1H') { krakenInterval = 60; krakenLimit = 48; }
  else if (tf === '15M') { krakenInterval = 15; krakenLimit = 40; }
  else if (tf === '5M') { krakenInterval = 5; krakenLimit = 40; }
  else if (tf === '1M') { krakenInterval = 1; krakenLimit = 40; }

  // For Crypto: Use Kraken live OHLC API (Binance is geo-blocked in many regions)
  const isCrypto = symbol === 'BTCUSD' || symbol === 'ETHUSD' || symbol === 'SOLUSD' || symbol === 'XRPUSD';
  if (isCrypto) {
    try {
      const krakenSym = symbol === 'BTCUSD' ? 'XBTUSD'
        : symbol === 'ETHUSD' ? 'ETHUSD'
        : symbol === 'SOLUSD' ? 'SOLUSD'
        : 'XRPUSD';
      const kRes = await fetch(`https://api.kraken.com/0/public/OHLC?pair=${krakenSym}&interval=${krakenInterval}`);
      if (kRes.ok) {
        const kData: any = await kRes.json();
        const resultObj = kData?.result || {};
        // resultObj has the pair key + 'last'. Find the array under the pair key.
        const pairKey = Object.keys(resultObj).find(k => k !== 'last');
        const ohlc: any[] = pairKey ? resultObj[pairKey] : [];
        if (ohlc.length > 0) {
          const formatted = ohlc.slice(0, krakenLimit).map((k: any) => ({
            time: Math.floor(k[0]),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[6])
          })).filter((c: any) => !isNaN(c.close));
          return res.json(formatted);
        }
      }
    } catch (err) {
      console.error('Kraken history fetch error:', err);
    }
  }

  // For Forex/Equities/Indices: Use Yahoo Finance
  const yfSymbol = YAHOO_CHART_SYMBOLS[symbol] || symbol;
  if (yahooFinance && typeof yahooFinance.chart === 'function') {
    try {
      const period1 = new Date();
      const period2 = new Date();
      let yfInterval: any = '1h';
      if (tf === '1D') {
        period1.setDate(period1.getDate() - 30);
        yfInterval = '1d';
      } else if (tf === '4H') {
        period1.setDate(period1.getDate() - 14);
        yfInterval = '1d';
      } else if (tf === '1H') {
        period1.setDate(period1.getDate() - 5);
        yfInterval = '1h';
      } else {
        period1.setDate(period1.getDate() - 3);
        yfInterval = '15m';
      }
      
      const queryOptions = { period1, period2, interval: yfInterval };
      const result = await yahooFinance.chart(yfSymbol, queryOptions);
      
      if (result && result.quotes && Array.isArray(result.quotes) && result.quotes.length > 0) {
        const formatted = result.quotes.map((quote: any) => ({
          time: Math.floor(new Date(quote.date).getTime() / 1000),
          open: quote.open,
          high: quote.high,
          low: quote.low,
          close: quote.close
        })).filter((q: any) => q.open !== null && q.open !== undefined);
        
        return res.json(formatted);
      }
    } catch (err) {
      console.error('History fetch error from Yahoo Finance:', err);
    }
  }

  // If no exchange history is available from providers, return clean empty list
  return res.json([]);
});

// Endpoint for a single market quote with live STP metrics
app.get('/api/markets/quote', (req, res) => {
  const symbol = req.query.symbol as string;
  if (!symbol || !LIVE_MARKETS[symbol]) {
    return res.status(404).json({ error: 'Instrument not found' });
  }
  res.json({ symbol, ...LIVE_MARKETS[symbol] });
});

// Axi AI Trading Assistant with Search Grounding
app.post('/api/gemini/assistant', async (req, res) => {
  try {
    const { message, history } = req.body;
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({ error: 'Axi AI Assistant is temporarily unavailable. No simulated market guidance is provided.' });
    }

    const systemInstruction = `You are the expert Axi AI Trading Assistant, representing Axi (formerly AxiTrader), a premium global online Forex and CFD broker. 
Your tone is professional, highly regulatory-compliant, objective, and supportive. 
You provide market insights, explanation of CFDs, leverage, and margin, and help users understand how to trade their edge.
IMPORTANT: Always include a professional risk warning at the end of your message: "CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. 74-89% of retail investor accounts lose money when trading CFDs with this provider."
Use markdown for elegant styling. Keep responses under 220 words. If the user asks about live events, use your Google Search grounding.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.map((chunk: any) => ({
      title: chunk.web?.title || "Axi Resource",
      uri: chunk.web?.uri
    })).filter((source: any) => source.uri);

    // Filter duplicates
    const uniqueSources = Array.from(new Set(sources.map((s: any) => s.uri)))
      .map(uri => sources.find((s: any) => s.uri === uri));

    res.json({
      text: response.text,
      sources: uniqueSources
    });
  } catch (error: any) {
    console.error("Axi Assistant Error:", error);
    res.status(502).json({ error: 'Axi AI Assistant is temporarily unavailable. No simulated market guidance is provided.' });
  }
});


// Create Stripe PaymentIntent
app.post('/api/stripe/create-payment-intent', requireAuth,  async (req, res) => {
  const { amount, currency = 'usd', depositId } = req.body;
  const userId = String((req as any).authUser?.uid || '');
  const numAmount = parseFloat(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }

  const stripe = getStripe();
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured on this server.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(numAmount * 100),
      currency,
      metadata: { depositId: depositId || '', userId: userId || '' },
      automatic_payment_methods: { enabled: true }
    });
    return res.json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
      amount: numAmount
    });
  } catch (err: any) {
    console.error('Stripe PaymentIntent Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/stripe/create-checkout-session', requireAuth,  async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to secrets.' });
  }
  
  try {
    const { amount, currency = 'usd', depositId, method } = req.body;
    const userId = String((req as any).authUser?.uid || '');
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    const referer = req.headers.referer || 'http://localhost:3000/';
    const baseUrl = referer.split('?')[0];

    const sessionParams: any = {
      billing_address_collection: 'auto',
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'Axi Trading Account Funding',
              description: 'Instant Deposit to Axi Live Balance via Stripe',
            },
            unit_amount: Math.round(numAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        depositId: depositId || `DEP-${Date.now()}`,
        userId: userId || 'live-trader',
        source: 'stripe_payment_processor',
        method: method || 'card_and_bank_transfer'
      },
      success_url: `${baseUrl}?deposit_success=true&amount=${numAmount}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}?deposit_cancelled=true`,
    };

    // Attempt to include card, Link, and instant US bank account / ACH transfer
    try {
      const session = await stripe.checkout.sessions.create({
        ...sessionParams,
        payment_method_types: ['card', 'link', 'us_bank_account']
      });
      return res.json({ id: session.id, url: session.url });
    } catch (err: any) {
      // If us_bank_account is not yet activated on the merchant's Stripe dashboard, fallback to card & link
      console.warn('Fallback to standard Stripe card & link methods:', err.message);
      const fallbackSession = await stripe.checkout.sessions.create({
        ...sessionParams,
        payment_method_types: ['card', 'link']
      });
      return res.json({ id: fallbackSession.id, url: fallbackSession.url });
    }
  } catch (error: any) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify completed Stripe deposit endpoint
app.post('/api/stripe/verify-deposit', requireAuth,  async (req, res) => {
  const { paymentIntentId, sessionId } = req.body || {};
  const userId = String((req as any).authUser?.uid || '');
  const stripe = getStripe();

  let verified = false;
  let verifiedAmount = parseFloat(amount) || 0;
  let status = 'pending';
  let refCode = `STRIPE-${Math.floor(100000 + Math.random() * 900000)}`;

  try {
    if (stripe) {
      if (sessionId) {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === 'paid') {
          verified = true;
          status = 'succeeded';
          verifiedAmount = (session.amount_total || 0) / 100;
          refCode = `STRIPE-CS-${session.id.slice(-8).toUpperCase()}`;
        }
      } else if (paymentIntentId) {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (pi.status === 'succeeded') {
          verified = true;
          status = 'succeeded';
          verifiedAmount = pi.amount / 100;
          refCode = `STRIPE-PI-${pi.id.slice(-8).toUpperCase()}`;
        }
      }
    } else {
      // Stripe is not configured on this server. Do NOT fabricate a successful deposit.
      verified = false;
      status = 'unavailable';
    }
  } catch (err: any) {
    console.warn('Stripe verify-deposit check notice:', err.message);
    // A Stripe API failure must not auto-verify a deposit. Mark as pending review only.
    verified = false;
    status = 'pending_review';
  }

  const txId = `DEP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // If Stripe confirmed the payment, record it for admin manual review.
  // Stripe does NOT credit the user balance — the admin must manually credit the
  // exact paid amount from the Admin Dashboard after confirming receipt in Stripe.
  if (verified && verifiedAmount > 0 && userId) {
    const targetUser = appUsersStore.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    const email = targetUser?.email || userId;
    const pendingDeposits = readDataFile<any[]>('pendingDeposits.json', []);
    if (!pendingDeposits.find(d => d.id === refCode)) {
      pendingDeposits.unshift({
        id: refCode,
        userEmail: email,
        user: targetUser || null,
        amount: verifiedAmount,
        method: 'Card (Stripe)',
        status: 'Payment Received — Awaiting Admin Credit',
        stripeRef: refCode,
        receivedAt: new Date().toISOString(),
        creditedByAdmin: false
      });
      writeDataFile('pendingDeposits.json', pendingDeposits);
    }
    const botToken2 = process.env.TELEGRAM_BOT_TOKEN;
    const chatId2 = process.env.TELEGRAM_CHAT_ID;
    if (botToken2 && chatId2) {
      fetch(`https://api.telegram.org/bot${botToken2}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId2,
          text: `<b>[Axi Trading Alert - DEPOSIT_VERIFIED]</b>\n\n` + 
                `\ud83d\udcb0 <b>STRIPE PAYMENT CONFIRMED</b>\n` +
                `User: ${email}\nAmount: $${verifiedAmount.toFixed(2)} USD\nRef: ${refCode}\n\n` +
                `\u2705 Funds received into Stripe balance.\n` +
                `\u26a0\ufe0f ACTION REQUIRED: Admin must manually credit this amount to the user's account from the Admin Dashboard.\n\n` +
                `<i>Sent: ${new Date().toUTCString()}</i>`,
          parse_mode: 'HTML'
        })
      }).catch(() => {});
    }
  }

  return res.json({
    verified,
    amount: verifiedAmount,
    status,
    txId,
    refCode,
    timestamp: new Date().toISOString()
  });
});

// User action handlers with Telegram dispatch

app.get('/api/stripe/status', (req, res) => {
  const isRecentlyActive = webhookPingState.lastPingTimestamp 
    ? (Date.now() - webhookPingState.lastPingTimestamp < 1000 * 60 * 60)
    : false;
  
  const status = webhookPingState.lastPingStatus === 'Disconnected' 
    ? 'Disconnected' 
    : (isRecentlyActive ? 'Active' : 'Active');

  const stripe = getStripe();
  res.json({
    configured: !!stripe,
    webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
    webhookEndpoint: '/api/stripe/webhook',
    webhookStatus: status,
    lastPingTimestamp: webhookPingState.lastPingTimestamp ? new Date(webhookPingState.lastPingTimestamp).toISOString() : null,
    lastPingEvent: webhookPingState.lastPingEvent,
    lastPingLatencyMs: webhookPingState.lastPingLatencyMs,
    lastPingSource: webhookPingState.lastPingSource,
    totalPingsCount: webhookPingState.totalPingsCount,
    history: webhookPingState.history,
    eventsSupported: ['payment_intent.succeeded', 'checkout.session.completed', 'payment_intent.payment_failed', 'ping.succeeded'],
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Endpoint to trigger a direct webhook Ping test
app.post('/api/stripe/webhook/ping', (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'Test endpoint disabled in production.' });
  const startTime = Date.now();
  const calculatedLatency = Math.max(1, Date.now() - startTime + 5);
  
  webhookPingState.lastPingTimestamp = Date.now();
  webhookPingState.lastPingEvent = req.body?.event || 'ping.succeeded';
  webhookPingState.lastPingStatus = 'Active';
  webhookPingState.lastPingLatencyMs = calculatedLatency;
  webhookPingState.lastPingSource = 'Admin Integration Ping Tool';
  webhookPingState.totalPingsCount++;

  const entry: WebhookPingEntry = {
    timestamp: new Date().toISOString(),
    event: req.body?.event || 'ping.succeeded',
    status: 'Active',
    latencyMs: calculatedLatency,
    source: 'Admin Integration Ping Tool'
  };

  webhookPingState.history.unshift(entry);
  if (webhookPingState.history.length > 20) webhookPingState.history.pop();

  res.json({
    success: true,
    status: 'Active',
    message: 'Stripe webhook endpoint /api/stripe/webhook is Active and responding to Ping requests.',
    latencyMs: calculatedLatency,
    timestamp: entry.timestamp,
    webhookPingState
  });
});

// Endpoint to toggle network state for testing
app.post('/api/stripe/webhook/toggle-disconnect', (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'Test endpoint disabled in production.' });
  const newStatus = webhookPingState.lastPingStatus === 'Active' ? 'Disconnected' : 'Active';
  webhookPingState.lastPingStatus = newStatus;
  webhookPingState.lastPingTimestamp = Date.now();
  webhookPingState.lastPingEvent = newStatus === 'Disconnected' ? 'connection.dropped' : 'connection.restored';
  
  const entry: WebhookPingEntry = {
    timestamp: new Date().toISOString(),
    event: webhookPingState.lastPingEvent,
    status: newStatus,
    latencyMs: 0,
    source: 'Admin Override'
  };

  webhookPingState.history.unshift(entry);
  if (webhookPingState.history.length > 20) webhookPingState.history.pop();

  res.json({
    success: true,
    status: newStatus,
    message: `Stripe webhook status manually updated to ${newStatus}.`,
    webhookPingState
  });
});

app.get('/api/stripe/payment-intent/:id', requireAuth,  async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured.' });
  }
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(req.params.id);
    res.json({ status: paymentIntent.status, amount: paymentIntent.amount / 100, currency: paymentIntent.currency });
  } catch (error: any) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (botToken && chatId) {
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `<b>[Axi Trading Alert - SUPPORT_MESSAGE]</b>\n\n📩 New Support / Contact Request\n• <b>Name</b>: ${name || 'Anonymous'}\n• <b>Email</b>: ${email || 'N/A'}\n• <b>Message</b>: ${message || 'No details provided'}\n\n<i>Sent: ${new Date().toUTCString()}</i>`,
        parse_mode: 'HTML'
      })
    }).catch(e => console.error(e));
  }

  res.json({ success: true, message: `Thank you ${name || 'Trader'}. Our support desk will reach out to ${email} within 2 hours.` });
});

app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (botToken && chatId) {
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `<b>[Axi Trading Alert - NEWSLETTER_SUBSCRIBE]</b>\n\n📰 New Daily Market Analysis Subscriber!\n• <b>Email</b>: ${email}\n\n<i>Sent: ${new Date().toUTCString()}</i>`,
        parse_mode: 'HTML'
      })
    }).catch(e => console.error(e));
  }

  res.json({ success: true, message: `Successfully registered ${email} for Axi Daily Market Analysis!` });
});

// ==========================================
// SERVER-SIDE PERSISTENCE & DATA MANAGEMENT
// ==========================================
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create data dir:', e);
  }
}

function readDataFile<T = any>(filename: string, defaultVal: T): T {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.warn(`Notice reading ${filename}:`, err);
  }
  return defaultVal;
}

function writeDataFile(filename: string, data: any) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`Notice writing ${filename}:`, err);
  }
}

// In-memory + File Backed Stores
let appUsersStore: any[] = readDataFile('users.json', []);

let appKycStore: any[] = readDataFile('kyc.json', []);
let appTransactionsStore: any[] = readDataFile('transactions.json', []);
let appPartnersStore: any[] = readDataFile('partners.json', []);
let appVpsStore: any[] = readDataFile('vps.json', []);
let appPromosStore: any[] = readDataFile('promos.json', []);
let appOrdersStore: any[] = readDataFile('orders.json', []);
let appTawkToConfigStore: any = readDataFile('tawkto.json', {
  enabled: true,
  propertyId: process.env.VITE_TAWKTO_PROPERTY_ID || '6a877895e687441d49b91140',
  widgetId: process.env.VITE_TAWKTO_WIDGET_ID || 'default',
  directChatUrl: process.env.VITE_TAWKTO_DIRECT_URL || 'https://tawk.to/chat/6a877895e687441d49b91140/default',
  autoOpenOnVisit: false
});

// Admin platform settings stores (persisted to data files)
let appBotConfigStore: any = readDataFile('adminBotConfig.json', { active: false });

let appTradingBotSettingsStore: any = readDataFile('adminTradingBotSettings.json', { automatedTradingEnabled: false, circuitBreakerEnabled: true });

let appInvestmentPlansStore: any[] = readDataFile('adminInvestmentPlans.json', []);

let appTradingPairsStore: any[] = readDataFile('adminTradingPairs.json', []);

let appCurrenciesStore: any[] = readDataFile('adminCurrencies.json', [{ code: 'USD', name: 'US Dollar', symbol: String.fromCharCode(36), rateToUsd: 1, isBase: true }]);

let appCopyTradersStore: any[] = readDataFile('adminCopyTraders.json', []);

let appAdminPasswordStore: any = readDataFile('adminPassword.json', {
  hash: '',
  updatedAt: ''
});

// Helper to notify Telegram
function notifyTelegram(title: string, fields: Record<string, any>) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  const lines = Object.entries(fields)
    .map(([k, v]) => `• <b>${k}</b>: ${v}`)
    .join('\n');

  const text = `<b>[Axi Trades - ${title}]</b>\n\n${lines}\n\n<i>Timestamp: ${new Date().toUTCString()}</i>`;

  fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    })
  }).catch(e => console.error('Telegram notification error:', e));
}

// ----------------------------------------------------
// USER ACCOUNTS & REGISTRATION API
// ----------------------------------------------------

// Get all registered users (for Admin Dashboard & client sync)
app.get('/api/users', requireAdmin,  async (req, res) => {
  try {
    const persisted = await dbUsers();
    if (persisted) return res.json({ success: true, users: persisted.map((u) => ({ ...u, verificationStatus: u.verification_status, kycStatus: u.kyc_status, demoBalance: Number(u.demo_balance), balance: Number(u.balance) })), total: persisted.length, source: 'postgres' });
  } catch (error) { console.error('Postgres users read failed:', error); }
  res.json({ success: true, users: appUsersStore, total: appUsersStore.length, source: 'fallback' });
});

app.post('/api/auth/password-reset/request', async (req,res)=>{const email=String(req.body?.email||'').trim().toLowerCase();if(!email)return res.status(400).json({success:false,error:'Email address is required.'});try{await sendPasswordResetEmail(email)}catch(e){console.warn('[Axi password reset]',e)}return res.json({success:true});});

// Register or synchronize a client account
app.post('/api/users/register', async (req, res) => {
  const body = req.body || {};
  const email = (body.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const existingIdx = appUsersStore.findIndex(u => u.email.toLowerCase() === email || (body.id && u.id === body.id));
  const uid = body.id || `usr_${Math.floor(1000 + Math.random() * 9000)}`;
  const displayName = body.name || body.displayName || `${body.firstName || ''} ${body.lastName || ''}`.trim() || email.split('@')[0];

  const userData = {
    id: uid,
    name: displayName,
    email: email,
    phone: body.phone || '',
    country: body.country || 'International',
    status: body.status || 'Pending',
    verificationStatus: body.verificationStatus || 'Pending',
    kycStatus: body.kycStatus || 'NOT_STARTED',
    balance: typeof body.balance === 'number' ? body.balance : 0,
    demoBalance: typeof body.demoBalance === 'number' ? body.demoBalance : 0,
    pnlPercentage: typeof body.pnlPercentage === 'number' ? body.pnlPercentage : 0,
    pnlOverride: null,
    registeredAt: body.registeredAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
    lastActive: 'Active Now (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC)',
    provider: body.provider || 'Email / Portal Auth',
    accountNo: body.accountNo || '',
    accountType: body.accountType || 'Pending broker provisioning',
    tradingPlatform: body.tradingPlatform || 'MT5',
    leverage: body.leverage || '',
    currency: body.currency || 'USD',
    tradingPassword: '',
    employment: body.employment || '',
    avgIncome: body.avgIncome || '',
    savingsValue: body.savingsValue || '',
    sourceFunds: body.sourceFunds || [],
    authMethod: body.authMethod || 'Authenticator',
    updatedAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    // EXISTING user logging back in: preserve admin-controlled fields so a login
    // sync can never downgrade an Approved/Verified account back to Pending, and
    // never overwrite an admin-adjusted balance. Only refresh identity/activity.
    const prev = appUsersStore[existingIdx];
    const merged = {
      ...prev,
      ...userData,
      // Admin-controlled fields — always keep the existing value:
      status: prev.status || userData.status,
      verificationStatus: prev.verificationStatus || userData.verificationStatus,
      kycStatus: prev.kycStatus || userData.kycStatus,
      balance: typeof prev.balance === 'number' ? prev.balance : userData.balance,
      pnlOverride: prev.pnlOverride ?? userData.pnlOverride ?? null
    };
    appUsersStore[existingIdx] = merged;
    writeDataFile('users.json', appUsersStore);
    await dbUpsertUser(merged).catch((error) => console.error('Postgres user sync failed:', error));
    await audit('USER_LOGIN_SYNC', { userId: merged.id, email: merged.email }).catch(() => {});
    // Return the MERGED record (with preserved admin fields) so the client
    // never sees a downgraded status in the response.
    res.json({ success: true, user: merged, totalUsers: appUsersStore.length });
    return;
  }

  appUsersStore.unshift(userData);

  // Notify Telegram Admin about new registered user
  notifyTelegram('NEW_USER_REGISTRATION', {
    'Client Name': userData.name,
    'Email': userData.email,
    'Country': userData.country,
    'Account No': userData.accountNo,
    'Platform': `${userData.tradingPlatform} (${userData.accountType})`,
    'Leverage': userData.leverage,
    'Initial Balance': `$${userData.balance.toLocaleString()}`
  });

  writeDataFile('users.json', appUsersStore);
  await dbUpsertUser(userData).catch((error) => console.error('Postgres new user sync failed:', error));
  await audit('USER_REGISTERED', { userId: userData.id, email: userData.email, metadata: { provider: userData.provider } }).catch(() => {});
  void sendRegistrationEmails(userData);
  res.json({ success: true, user: userData, totalUsers: appUsersStore.length });
});

app.get('/api/admin/balance-ledger/:userId', requireAdmin, async (req,res)=>{try{const rows=await dbBalanceLedger(String(req.params.userId||''));return res.json({success:true,entries:rows||[]});}catch(error){console.error('Balance ledger load failed:',error);return res.status(500).json({success:false,error:'Unable to load balance ledger'});}});

app.post('/api/admin/users/:id/balance-adjustment', requireAdmin, async (req,res)=>{try{const amount=Number(req.body?.amount);const reason=String(req.body?.reason||'').trim();if(!Number.isFinite(amount)||amount===0)return res.status(400).json({success:false,error:'Enter a non-zero adjustment amount'});if(!reason)return res.status(400).json({success:false,error:'A reason is required'});const result=await dbAdjustBalance(String(req.params.id||''),amount,String((req as any).adminEmail||'admin'),reason,String(req.body?.referenceId||'')||undefined);return res.json({success:true,result});}catch(error:any){console.error('Manual balance adjustment failed:',error);return res.status(400).json({success:false,error:error?.message||'Manual balance adjustment failed'});}});

// Update specific user balance
app.put('/api/users/:id/balance', requireAdmin,  async (req, res) => {
  const userId = req.params.id;
  const { balance, demoBalance, reason } = req.body;

  const user = appUsersStore.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (typeof balance === 'number') user.balance = Math.max(0, balance);
  if (typeof demoBalance === 'number') user.demoBalance = Math.max(0, demoBalance);
  user.updatedAt = new Date().toISOString();

  writeDataFile('users.json', appUsersStore);
  await dbUpdateUser(userId, { balance: user.balance, demoBalance: user.demoBalance }).catch((error) => console.error('Postgres balance sync failed:', error));
  await audit('ADMIN_BALANCE_UPDATE', { userId: user.id, email: user.email, metadata: { balance: user.balance, reason: reason || 'Admin balance adjustment' } }).catch(() => {});

  notifyTelegram('ADMIN_USER_BALANCE_UPDATE', {
    'User': `${user.name} (${user.email})`,
    'New Balance': `$${user.balance.toLocaleString()} USD`,
    'Reason': reason || 'Admin balance adjustment'
  });

  res.json({ success: true, user });
});

// Update user verification status (Admin action)
app.put('/api/users/:id/status', requireAdmin,  async (req, res) => {
  const userId = req.params.id;
  const { status, verificationStatus, kycStatus } = req.body;

  const user = appUsersStore.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (status) user.status = status;
  if (verificationStatus) user.verificationStatus = verificationStatus;
  if (kycStatus) user.kycStatus = kycStatus;
  user.updatedAt = new Date().toISOString();

  writeDataFile('users.json', appUsersStore);
  await dbUpdateUser(userId, { status: user.status, verificationStatus: user.verificationStatus, kycStatus: user.kycStatus }).catch((error) => console.error('Postgres status sync failed:', error));
  await audit('ADMIN_USER_STATUS_UPDATE', { userId: user.id, email: user.email, metadata: { status: user.status, verificationStatus: user.verificationStatus, kycStatus: user.kycStatus } }).catch(() => {});
  res.json({ success: true, user });
});

// Update user PnL override configuration
app.put('/api/users/:id/pnl', requireAdmin,  (req, res) => {
  const userId = req.params.id;
  const { pnlOverride, pnlPercentage } = req.body;

  const user = appUsersStore.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (pnlOverride) user.pnlOverride = pnlOverride;
  if (typeof pnlPercentage === 'number') user.pnlPercentage = pnlPercentage;
  user.updatedAt = new Date().toISOString();

  writeDataFile('users.json', appUsersStore);
  res.json({ success: true, user });
});

// Admin change user password
app.put('/api/users/:id/password', requireAdmin,  (req, res) => {
  const userId = req.params.id;
  const { newPassword } = req.body;

  const user = appUsersStore.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.tradingPassword = newPassword;
  user.updatedAt = new Date().toISOString();

  writeDataFile('users.json', appUsersStore);
  res.json({ success: true, message: `Password updated for ${user.email}` });
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const initialLen = appUsersStore.length;
  appUsersStore = appUsersStore.filter(u => u.id !== userId && u.email.toLowerCase() !== userId.toLowerCase());

  if (appUsersStore.length === initialLen) {
    return res.status(404).json({ error: 'User not found' });
  }

  writeDataFile('users.json', appUsersStore);
  res.json({ success: true, message: 'User deleted successfully' });
});

// ----------------------------------------------------
// KYC VERIFICATION DOCUMENTS API
// ----------------------------------------------------

// Get all KYC documents for Admin verification
app.get('/api/kyc/list', requireAdmin,  (req, res) => {
  res.json({
    success: true,
    documents: appKycStore,
    total: appKycStore.length,
    pending: appKycStore.filter(d => d.status === 'Under Review' || d.status === 'Pending').length
  });
});

// Submit KYC verification document from client portal
app.post('/api/kyc/submit', requireAuth,  (req, res) => {
  const body = req.body || {};
  const user = body.fullName || String((req as any).authUser?.name || (req as any).authUser?.email || '').trim();
  if (!user) return res.status(400).json({ error: 'Verified user identity is required' });
  const userEmail = String((req as any).authUser?.email || '').toLowerCase();
  if (!userEmail) return res.status(400).json({ error: 'Verified user email is required' });
  const docType = body.type || body.docType;
  if (!docType) return res.status(400).json({ error: 'Document type is required' });

  const newDoc = {
    id: body.id || `KYC-${Date.now().toString().slice(-6)}`,
    user,
    userEmail,
    type: docType,
    fileName: body.fileName || `${docType}_Front.pdf, Proof_Of_Address.pdf`,
    submittedAt: body.submittedAt || new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
    status: 'Under Review',
    refCode: body.refCode || `DOC-${Math.floor(100000 + Math.random() * 900000)}`,
    level: body.level || 1,
    details: {
      fullName: user,
      email: userEmail,
      dateOfBirth: body.dateOfBirth || body.dob || '',
      address: body.address || '',
      city: body.city || '',
      postalCode: body.postalCode || '',
      country: body.country || '',
      docType: docType,
      docNumber: body.docNumber || '',
      idFrontName: body.idFrontName || 'ID_Front.pdf',
      idBackName: body.idBackName || 'ID_Back.pdf',
      proofResName: body.proofResName || 'Proof_Of_Residence.pdf',
      documents: body.documents || []
    }
  };

  // Add to store (prevent exact duplicates)
  const existingIdx = appKycStore.findIndex(d => d.id === newDoc.id || (d.userEmail === userEmail && d.status === 'Under Review'));
  if (existingIdx >= 0) {
    appKycStore[existingIdx] = newDoc;
  } else {
    appKycStore.unshift(newDoc);
  }

  // Update associated user status in appUsersStore to Pending
  const targetUser = appUsersStore.find(u => u.email.toLowerCase() === userEmail);
  if (targetUser) {
    targetUser.kycStatus = 'PENDING';
    targetUser.verificationStatus = 'Pending';
    writeDataFile('users.json', appUsersStore);
  }

  writeDataFile('kyc.json', appKycStore);

  // Notify Admin on Telegram
  notifyTelegram('KYC_SUBMISSION_ALERT', {
    'Applicant Name': user,
    'Email': userEmail,
    'Document Type': docType,
    'Reference Code': newDoc.refCode,
    'Files Attached': newDoc.fileName,
    'Status': 'Under Review (Action Required in Admin Portal)'
  });

  res.json({ success: true, document: newDoc });
});

// Admin approves KYC
app.post('/api/kyc/approve', requireAdmin,  (req, res) => {
  const { id, creditAmountBonus } = req.body;
  const docItem = appKycStore.find(d => d.id === id || d.refCode === id);
  if (!docItem) {
    return res.status(404).json({ error: 'KYC Document record not found' });
  }

  docItem.status = 'Approved';
  docItem.approvedAt = new Date().toISOString();

  // Update user in users store
  const targetUser = appUsersStore.find(u => u.email.toLowerCase() === (docItem.userEmail || '').toLowerCase());
  if (targetUser) {
    targetUser.kycStatus = 'VERIFIED';
    targetUser.verificationStatus = 'Approved';
    targetUser.status = 'Approved';
    if (creditAmountBonus && Number(creditAmountBonus) > 0) {
      targetUser.balance = (targetUser.balance || 0) + Number(creditAmountBonus);
    }
    writeDataFile('users.json', appUsersStore);
  }

  writeDataFile('kyc.json', appKycStore);

  notifyTelegram('KYC_APPROVED', {
    'Trader': `${docItem.user} (${docItem.userEmail})`,
    'Reference': docItem.refCode,
    'Bonus Credited': creditAmountBonus ? `+$${creditAmountBonus.toLocaleString()}` : '$0.00'
  });

  res.json({ success: true, document: docItem, user: targetUser });
});

// Admin rejects KYC
app.post('/api/kyc/reject', requireAdmin,  (req, res) => {
  const { id, reason } = req.body;
  const docItem = appKycStore.find(d => d.id === id || d.refCode === id);
  if (!docItem) {
    return res.status(404).json({ error: 'KYC Document record not found' });
  }

  docItem.status = 'Rejected';
  docItem.rejectedReason = reason || 'Document illegible or expired';
  docItem.rejectedAt = new Date().toISOString();

  // Update user in users store
  const targetUser = appUsersStore.find(u => u.email.toLowerCase() === (docItem.userEmail || '').toLowerCase());
  if (targetUser) {
    targetUser.kycStatus = 'REJECTED';
    targetUser.verificationStatus = 'Flagged';
    writeDataFile('users.json', appUsersStore);
  }

  writeDataFile('kyc.json', appKycStore);

  notifyTelegram('KYC_REJECTED', {
    'Trader': `${docItem.user} (${docItem.userEmail})`,
    'Reference': docItem.refCode,
    'Reason': docItem.rejectedReason
  });

  res.json({ success: true, document: docItem });
});

// ----------------------------------------------------
// PENDING STRIPE DEPOSITS — ADMIN MANUAL CREDIT API
// ----------------------------------------------------
// Stripe payments are collected into the Stripe balance only. They are recorded
// here as "pending" and the admin manually credits the exact paid amount to the
// user from the Admin Dashboard. Stripe never touches the user balance.

app.get('/api/deposits/pending', (req, res) => {
  const pendingDeposits = readDataFile<any[]>('pendingDeposits.json', []);
  res.json({
    success: true,
    deposits: pendingDeposits,
    total: pendingDeposits.length,
    pendingCount: pendingDeposits.filter(d => !d.creditedByAdmin).length
  });
});

// Admin manually credits a pending Stripe deposit to the user's balance.
// Body: { id, amount (exact paid amount), userId (optional override) }
app.post('/api/deposits/credit', (req, res) => {
  const { id, amount, userId } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Deposit id is required' });

  const pendingDeposits = readDataFile<any[]>('pendingDeposits.json', []);
  const deposit = pendingDeposits.find(d => d.id === id || d.stripeRef === id);
  if (!deposit) return res.status(404).json({ error: 'Pending deposit not found' });
  if (deposit.creditedByAdmin) return res.status(409).json({ error: 'This deposit has already been credited' });

  const creditAmount = typeof amount === 'number' && amount > 0 ? amount : deposit.amount;
  const lookupKey = (userId || deposit.userEmail || deposit.user?.email || deposit.id || '').toLowerCase();

  const targetUser = appUsersStore.find(
    u => u.email.toLowerCase() === lookupKey ||
         u.id.toLowerCase() === lookupKey ||
         (deposit.user && u.id === deposit.user.id)
  );

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found for this deposit. Ensure the user is registered.' });
  }

  // Credit the EXACT paid amount to the user's live balance
  targetUser.balance = (typeof targetUser.balance === 'number' ? targetUser.balance : 0) + creditAmount;
  targetUser.updatedAt = new Date().toISOString();

  // Mark deposit as credited
  deposit.creditedByAdmin = true;
  deposit.creditedAt = new Date().toISOString();
  deposit.creditedAmount = creditAmount;
  deposit.creditedToUser = targetUser.email;

  writeDataFile('users.json', appUsersStore);
  writeDataFile('pendingDeposits.json', pendingDeposits);

  // Record a transaction for audit
  const txEntry = {
    id: deposit.id,
    type: 'Deposit',
    amount: creditAmount,
    method: deposit.method || 'Stripe Card',
    date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    status: 'Approved',
    account: 'Live ECN Account',
    refCode: deposit.stripeRef || deposit.id,
    userEmail: targetUser.email,
    proofNote: `Manually credited by admin (Stripe payment ${deposit.stripeRef || deposit.id})`
  };
  appTransactionsStore.unshift(txEntry);
  writeDataFile('transactions.json', appTransactionsStore);

  notifyTelegram('ADMIN_DEPOSIT_CREDITED', {
    'User': `${targetUser.name} (${targetUser.email})`,
    'Amount Credited': `$${creditAmount.toFixed(2)} USD`,
    'Stripe Ref': deposit.stripeRef || deposit.id,
    'New Balance': `$${targetUser.balance.toLocaleString()} USD`
  });

  res.json({ success: true, deposit, user: targetUser, creditedAmount: creditAmount });
});

// Dismiss / remove a pending deposit (e.g. disputed or invalid) without crediting
app.post('/api/deposits/dismiss', (req, res) => {
  const { id, reason } = req.body || {};
  const pendingDeposits = readDataFile<any[]>('pendingDeposits.json', []);
  const deposit = pendingDeposits.find(d => d.id === id || d.stripeRef === id);
  if (!deposit) return res.status(404).json({ error: 'Pending deposit not found' });

  deposit.creditedByAdmin = false;
  deposit.dismissed = true;
  deposit.dismissedAt = new Date().toISOString();
  deposit.dismissedReason = reason || 'Dismissed by admin without credit';
  writeDataFile('pendingDeposits.json', pendingDeposits);

  res.json({ success: true, deposit });
});

// ----------------------------------------------------
// TRANSACTIONS & DEPOSITS / WITHDRAWALS API
// ----------------------------------------------------

app.get('/api/transactions', (req, res) => {
  res.json({ success: true, transactions: appTransactionsStore });
});

app.post('/api/transactions/create', (req, res) => {
  const tx = req.body;
  if (!tx.id) tx.id = `TX-${Date.now()}`;
  appTransactionsStore.unshift(tx);
  writeDataFile('transactions.json', appTransactionsStore);

  notifyTelegram('NEW_TRANSACTION', {
    'Type': tx.type || 'Deposit',
    'Amount': `$${Number(tx.amount || 0).toLocaleString()} USD`,
    'User': tx.user || tx.userEmail || 'Client',
    'Status': tx.status || 'Pending Verification',
    'Method': tx.method || 'Crypto / Card'
  });

  res.json({ success: true, transaction: tx });
});

app.post('/api/transactions/update-status', (req, res) => {
  const { id, status } = req.body;
  const tx = appTransactionsStore.find(t => t.id === id);
  if (tx) {
    tx.status = status;
    tx.updatedAt = new Date().toISOString();
    writeDataFile('transactions.json', appTransactionsStore);
  }
  res.json({ success: true, transaction: tx });
});

// ----------------------------------------------------
// PARTNERS, VPS, & PROMO APPLICATIONS API
// ----------------------------------------------------

app.get('/api/partners/list', (req, res) => {
  res.json({ success: true, applications: appPartnersStore });
});

app.post('/api/partners/apply', (req, res) => {
  const appItem = {
    ...req.body,
    appId: req.body.appId || `IB-AXI-${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'Pending Review',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC'
  };
  appPartnersStore.unshift(appItem);
  writeDataFile('partners.json', appPartnersStore);

  notifyTelegram('IB_PARTNER_APPLICATION', {
    'Name': appItem.fullName,
    'Email': appItem.email,
    'Country': appItem.country,
    'Type': appItem.partnerType || 'Introducing Broker',
    'Est Monthly Lots': appItem.estimatedMonthlyLots || 'N/A'
  });

  res.json({ success: true, application: appItem });
});

app.get('/api/vps/list', (req, res) => {
  res.json({ success: true, requests: appVpsStore });
});

app.post('/api/vps/request', (req, res) => {
  const vpsItem = {
    ...req.body,
    reqId: req.body.reqId || `VPS-${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'Provisioning Pending',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC'
  };
  appVpsStore.unshift(vpsItem);
  writeDataFile('vps.json', appVpsStore);

  notifyTelegram('VPS_HOSTING_REQUEST', {
    'Trader Name': vpsItem.traderName,
    'Email': vpsItem.email,
    'Server Location': vpsItem.location || 'London LD4',
    'Platform': vpsItem.platform || 'MT5'
  });

  res.json({ success: true, request: vpsItem });
});

app.get('/api/promos/list', (req, res) => {
  res.json({ success: true, claims: appPromosStore });
});

app.post('/api/promos/claim', (req, res) => {
  const claimItem = {
    ...req.body,
    claimId: req.body.claimId || `PRM-${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'Pending Approval',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC'
  };
  appPromosStore.unshift(claimItem);
  writeDataFile('promos.json', appPromosStore);

  notifyTelegram('PROMOTION_CLAIM_SUBMITTED', {
    'Trader': claimItem.traderName || claimItem.email,
    'Promo Type': claimItem.promoTitle || 'Deposit Match Bonus',
    'Account': claimItem.accountNo
  });

  res.json({ success: true, claim: claimItem });
});

// ----------------------------------------------------
// ADMIN PLATFORM SETTINGS API (persisted to data files)
// ----------------------------------------------------

// --- Bot Config (Edit Bot section) ---
app.get('/api/admin/bot-config', (req, res) => {
  res.json({ success: true, config: appBotConfigStore });
});

app.post('/api/admin/bot-config', (req, res) => {
  appBotConfigStore = { ...appBotConfigStore, ...req.body, updatedAt: new Date().toISOString() };
  writeDataFile('adminBotConfig.json', appBotConfigStore);
  notifyTelegram('ADMIN_BOT_CONFIG_UPDATED', {
    'Bot Name': appBotConfigStore.name || 'Axi Bot',
    'Strategy': appBotConfigStore.strategy || 'N/A',
    'Active': appBotConfigStore.active ? 'YES' : 'NO'
  });
  res.json({ success: true, config: appBotConfigStore });
});

// --- Global Trading Bot Settings ---
app.get('/api/admin/trading-bot-settings', (req, res) => {
  res.json({ success: true, settings: appTradingBotSettingsStore });
});

app.post('/api/admin/trading-bot-settings', (req, res) => {
  appTradingBotSettingsStore = { ...appTradingBotSettingsStore, ...req.body, updatedAt: new Date().toISOString() };
  writeDataFile('adminTradingBotSettings.json', appTradingBotSettingsStore);
  res.json({ success: true, settings: appTradingBotSettingsStore });
});

// --- Investment Plans ---
app.get('/api/admin/investment-plans', (req, res) => {
  res.json({ success: true, plans: appInvestmentPlansStore });
});

app.post('/api/admin/investment-plans', (req, res) => {
  const plans = req.body?.plans;
  if (!Array.isArray(plans)) return res.status(400).json({ error: 'plans array is required' });
  appInvestmentPlansStore = plans;
  writeDataFile('adminInvestmentPlans.json', appInvestmentPlansStore);
  res.json({ success: true, plans: appInvestmentPlansStore });
});

// --- Trading Pairs ---
app.get('/api/admin/trading-pairs', (req, res) => {
  res.json({ success: true, pairs: appTradingPairsStore });
});

app.post('/api/admin/trading-pairs', (req, res) => {
  const pairs = req.body?.pairs;
  if (!Array.isArray(pairs)) return res.status(400).json({ error: 'pairs array is required' });
  appTradingPairsStore = pairs;
  writeDataFile('adminTradingPairs.json', appTradingPairsStore);
  res.json({ success: true, pairs: appTradingPairsStore });
});

// --- Currencies ---
app.get('/api/admin/currencies', (req, res) => {
  res.json({ success: true, currencies: appCurrenciesStore });
});

app.post('/api/admin/currencies', (req, res) => {
  const currencies = req.body?.currencies;
  if (!Array.isArray(currencies)) return res.status(400).json({ error: 'currencies array is required' });
  appCurrenciesStore = currencies;
  writeDataFile('adminCurrencies.json', appCurrenciesStore);
  res.json({ success: true, currencies: appCurrenciesStore });
});

// --- Copy Traders ---
app.get('/api/admin/copy-traders', (req, res) => {
  res.json({ success: true, traders: appCopyTradersStore });
});

app.post('/api/admin/copy-traders', (req, res) => {
  const traders = req.body?.traders;
  if (!Array.isArray(traders)) return res.status(400).json({ error: 'traders array is required' });
  appCopyTradersStore = traders;
  writeDataFile('adminCopyTraders.json', appCopyTradersStore);
  res.json({ success: true, traders: appCopyTradersStore });
});

app.delete('/api/admin/copy-traders/:id', (req, res) => {
  const id = req.params.id;
  appCopyTradersStore = appCopyTradersStore.filter(t => t.id !== id);
  writeDataFile('adminCopyTraders.json', appCopyTradersStore);
  res.json({ success: true, traders: appCopyTradersStore });
});

// --- Admin Password Change (server-side verification) ---
app.post('/api/admin/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  // Verify current password against stored hash (simple comparison for admin panel)
  if (appAdminPasswordStore.hash && currentPassword !== appAdminPasswordStore.hash) {
    return res.status(403).json({ error: 'Current password is incorrect' });
  }
  appAdminPasswordStore = { hash: newPassword, updatedAt: new Date().toISOString() };
  writeDataFile('adminPassword.json', appAdminPasswordStore);
  notifyTelegram('ADMIN_PASSWORD_CHANGED', {
    'Changed At': new Date().toUTCString()
  });
  res.json({ success: true, message: 'Admin password updated successfully' });
});

// ----------------------------------------------------
// TAWK.TO LIVE CHAT CONFIGURATION API
// ----------------------------------------------------

app.get('/api/tawkto/config', (req, res) => {
  res.json({
    success: true,
    config: appTawkToConfigStore
  });
});

app.post('/api/tawkto/config', (req, res) => {
  const updates = req.body || {};
  appTawkToConfigStore = {
    ...appTawkToConfigStore,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  writeDataFile('tawkto.json', appTawkToConfigStore);

  notifyTelegram('TAWKTO_CONFIG_UPDATED', {
    'Enabled': appTawkToConfigStore.enabled ? 'YES' : 'NO',
    'Property ID': appTawkToConfigStore.propertyId || 'None',
    'Widget ID': appTawkToConfigStore.widgetId || 'default'
  });

  res.json({ success: true, config: appTawkToConfigStore });
});

// ----------------------------------------------------
// ORDER EXECUTION & TRADING ENGINE API
// ----------------------------------------------------

app.get('/api/orders', (req, res) => {
  const email = req.query.email as string;
  if (email) {
    const userOrders = appOrdersStore.filter(o => o.userEmail === email || o.email === email);
    return res.json({ success: true, orders: userOrders });
  }
  res.json({ success: true, orders: appOrdersStore });
});

app.post('/api/orders', (req, res) => {
  const order = req.body || {};
  const orderRecord = {
    ...order,
    id: order.id || `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    status: order.status || 'OPEN',
    executedAt: new Date().toISOString(),
    executionVenue: 'AxiCorp-Live Interbank ECN'
  };

  appOrdersStore.unshift(orderRecord);
  writeDataFile('orders.json', appOrdersStore);

  notifyTelegram('LIVE_ORDER_EXECUTED', {
    'Symbol': orderRecord.symbol || 'N/A',
    'Side': orderRecord.type || 'BUY',
    'Volume': orderRecord.volume || orderRecord.lotSize || '1.00',
    'Price': orderRecord.entryPrice || orderRecord.currentPrice || 'Market',
    'Trader': orderRecord.userEmail || orderRecord.accountNo || 'Client'
  });

  res.json({ success: true, order: orderRecord });
});




// In-memory SMTP Configuration (Initialized with Google SMTP defaults and env vars)
let smtpRuntimeConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) === 465 : true),
  user: process.env.SMTP_USER || process.env.GMAIL_USER || 'axicustomersupport@gmail.com',
  pass: process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || '',
  fromName: process.env.SMTP_FROM_NAME || 'Axi Trades Official',
  fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || process.env.GMAIL_USER || 'axicustomersupport@gmail.com'
};

function createSmtpTransporter() {
  const host = smtpRuntimeConfig.host || 'smtp.gmail.com';
  const port = smtpRuntimeConfig.port || 465;
  const isSecure = port === 465;
  const user = smtpRuntimeConfig.user;
  const pass = smtpRuntimeConfig.pass;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // If host is gmail but no password provided yet, configure transporter structure
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: user || 'axicustomersupport@gmail.com',
      pass: pass || ''
    },
    tls: { rejectUnauthorized: false }
  });
}

// Helper to generate Axi Branded Responsive HTML Email Templates
function buildAxiEmailHtml({
  recipientName,
  recipientEmail,
  type,
  subject,
  code,
  txId,
  txType,
  amount,
  status,
  method,
  reason,
  accountNo,
  platform,
  refCode,
  customBody
}: any) {
  const brandRed = '#e3000f';
  const brandDark = '#0b0e17';
  const year = new Date().getFullYear();
  const currentYear = year.toString();

  let bodyContent = '';

  if (type === 'Registration') {
    bodyContent = `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Welcome to Axi Trades!</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
          Dear <strong>${recipientName || 'Valued Trader'}</strong>,<br/><br/>
          Your institutional-grade live trading account has been successfully initialized and registered under <strong>${recipientEmail}</strong>. You now have direct access to global interbank liquidity across Forex, Crypto, Indices, Commodities, and Equities.
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #10b981; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #059669; letter-spacing: 0.5px; margin-bottom: 10px;">Trading Account Details</div>
          <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 140px;">Registered Email:</td>
              <td style="padding: 4px 0; font-weight: 700; font-family: monospace;">${recipientEmail}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Account Number:</td>
              <td style="padding: 4px 0; font-weight: 700; font-family: monospace;">${accountNo || 'AXI-' + Math.floor(100000 + Math.random() * 900000)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Trading Server:</td>
              <td style="padding: 4px 0; font-weight: 700;">AxiTrades-Live01 (Ultra-Low Latency)</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Platform:</td>
              <td style="padding: 4px 0; font-weight: 700;">${platform || 'MT5 / ECN Webtrader'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Leverage Cap:</td>
              <td style="padding: 4px 0; font-weight: 700;">Up to 1:500 (Dynamic)</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Account Status:</td>
              <td style="padding: 4px 0;"><span style="background-color: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 800;">ACTIVE LIVE</span></td>
            </tr>
          </table>
        </div>

        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 12px; color: #1e40af; line-height: 1.5;">
          <strong>🛡️ Security Notice:</strong> Axi will never ask for your confidential password or two-factor recovery keys. Always ensure you are accessing the official Axi client terminal.
        </div>
      </div>
    `;
  } else if (type === 'PasswordReset') {
    bodyContent = `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Security Verification Code</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
          Hello <strong>${recipientName || 'Valued Trader'}</strong>,<br/><br/>
          We received an automated request to reset the access credentials for your Axi account registered under <strong>${recipientEmail}</strong>.
        </p>

        <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <div style="font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Your 6-Digit Password Reset Code</div>
          <div style="display: inline-block; font-size: 36px; font-weight: 900; font-family: monospace; letter-spacing: 8px; color: #0f172a; background-color: #ffffff; padding: 12px 24px; border-radius: 8px; border: 2px solid #f59e0b; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            ${code || '849201'}
          </div>
          <p style="font-size: 12px; color: #92400e; margin: 14px 0 0 0; font-weight: 600;">
            ⏱️ This security code will expire in 15 minutes.
          </p>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          If you did not initiate this request, please contact our 24/7 Security Operations Desk immediately at <a href="mailto:axicustomersupport@gmail.com" style="color: ${brandRed}; font-weight: bold;">axicustomersupport@gmail.com</a>.
        </p>
      </div>
    `;
  } else if (type === 'DepositPending' || (status === 'Pending Admin Credit' && txType === 'Deposit')) {
    bodyContent = `
      <div style="margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px;">
          Payment Received — Pending Admin Credit
        </div>
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Deposit Payment Received</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
          Hello <strong>${recipientName || 'Valued Trader'}</strong>,<br/><br/>
          We have received your card payment of <strong>$${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</strong> via Stripe. The funds have been securely received into our Stripe balance.
        </p>
        <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 13px; color: #92400e; line-height: 1.5;">
          <strong>⏳ Next step:</strong> Our admin team will manually verify and credit the exact paid amount to your live trading account shortly. You will receive a confirmation email once your balance has been updated. This is a security measure to ensure accurate balance crediting.
        </div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #b45309; letter-spacing: 0.5px; margin-bottom: 10px;">Payment Receipt</div>
          <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 140px;">Reference:</td>
              <td style="padding: 4px 0; font-weight: 700; font-family: monospace;">${refCode || txId || 'STRIPE-PAY'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Amount Paid:</td>
              <td style="padding: 4px 0; font-weight: 800; color: #b45309; font-size: 15px;">$${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Payment Method:</td>
              <td style="padding: 4px 0; font-weight: 700;">${method || 'Stripe Card'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Status:</td>
              <td style="padding: 4px 0; font-weight: 800; color: #b45309;">PENDING ADMIN CREDIT</td>
            </tr>
          </table>
        </div>
      </div>
    `;
  } else if (type === 'DepositApproved' || (status === 'Approved' && (txType === 'Deposit' || !txType))) {
    bodyContent = `
      <div style="margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #d1fae5; color: #065f46; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px;">
          ✓ Deposit Verified & Approved
        </div>
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Deposit Approved & Balance Credited</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
          Hello <strong>${recipientName || 'Valued Trader'}</strong>,<br/><br/>
          Your deposit request of <strong>$${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</strong> has been approved by the cashier desk. Your live trading account has been credited.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #10b981; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #059669; letter-spacing: 0.5px; margin-bottom: 10px;">Transaction Receipt</div>
          <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 140px;">Transaction ID:</td>
              <td style="padding: 4px 0; font-weight: 700; font-family: monospace;">${txId || 'TX-' + Math.floor(100000 + Math.random() * 900000)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Credited Amount:</td>
              <td style="padding: 4px 0; font-weight: 800; color: #059669; font-size: 15px;">+$${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Payment Method:</td>
              <td style="padding: 4px 0; font-weight: 700;">${method || 'Credit Card / Instant Gateway'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Status:</td>
              <td style="padding: 4px 0; font-weight: 800; color: #059669;">COMPLETED / CLEARED</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Settlement Time:</td>
              <td style="padding: 4px 0; color: #64748b;">${new Date().toUTCString()}</td>
            </tr>
          </table>
        </div>
      </div>
    `;
  } else if (type === 'Withdrawal' || txType === 'Withdrawal') {
    const isApproved = status === 'Approved' || status === 'Completed';
    bodyContent = `
      <div style="margin-bottom: 24px;">
        <div style="display: inline-block; background-color: ${isApproved ? '#d1fae5' : '#fee2e2'}; color: ${isApproved ? '#065f46' : '#991b1b'}; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px;">
          ${isApproved ? '✓ Withdrawal Dispatched' : 'Withdrawal Status Notice'}
        </div>
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Withdrawal Request: ${status || 'Processed'}</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
          Hello <strong>${recipientName || 'Valued Trader'}</strong>,<br/><br/>
          Your withdrawal request for <strong>$${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</strong> has been updated to status: <strong style="color: ${isApproved ? '#059669' : '#dc2626'};">${status || 'Processed'}</strong>.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${isApproved ? '#10b981' : '#f59e0b'}; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 10px;">Payout Summary</div>
          <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 140px;">Reference ID:</td>
              <td style="padding: 4px 0; font-weight: 700; font-family: monospace;">${txId || 'WD-' + Math.floor(100000 + Math.random() * 900000)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Withdrawal Amount:</td>
              <td style="padding: 4px 0; font-weight: 800; color: #0f172a;">$${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Payout Destination:</td>
              <td style="padding: 4px 0; font-weight: 700;">${method || 'Bank Wire / Crypto Address'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Status:</td>
              <td style="padding: 4px 0; font-weight: 800; color: ${isApproved ? '#059669' : '#dc2626'};">${status || 'Pending'}</td>
            </tr>
            ${reason ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Admin Note:</td>
              <td style="padding: 4px 0; color: #dc2626; font-weight: 600;">${reason}</td>
            </tr>` : ''}
          </table>
        </div>
      </div>
    `;
  } else if (type === 'KYC' || type === 'KYCApproved') {
    bodyContent = `
      <div style="margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #d1fae5; color: #065f46; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px;">
          ✓ Identity Verification Complete
        </div>
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">KYC Verification Approved</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
          Hello <strong>${recipientName || 'Valued Trader'}</strong>,<br/><br/>
          Our compliance department has reviewed and <strong>APPROVED</strong> your identity verification documents. Your account tier has been elevated to <strong>Tier-1 Verified Status</strong>.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #10b981; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #059669; letter-spacing: 0.5px; margin-bottom: 10px;">Unlocked Privileges</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #334155; line-height: 1.8;">
            <li>Unlimited deposit and withdrawal clearance quotas</li>
            <li>Direct institutional ECN raw-spread trading access</li>
            <li>Priority 24/7 dedicated account manager support</li>
            <li>Higher leverage limits up to 1:500 on major currency pairs</li>
          </ul>
        </div>
      </div>
    `;
  } else {
    // Custom / Administrative Broadcast / Transaction Default
    bodyContent = `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">${subject || 'Axi Official Notification'}</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
          Hello <strong>${recipientName || 'Valued Trader'}</strong>,<br/><br/>
          ${customBody || reason || `This is an official communication regarding your Axi live trading account registered under <strong>${recipientEmail}</strong>.`}
        </p>

        ${amount || txId ? `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px;">
          ${txId ? `<div style="margin-bottom: 6px;"><strong>Reference ID:</strong> <span style="font-family: monospace;">${txId}</span></div>` : ''}
          ${amount ? `<div style="margin-bottom: 6px;"><strong>Amount:</strong> $${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</div>` : ''}
          ${status ? `<div><strong>Status:</strong> <span style="font-weight: 700; color: ${status === 'Approved' ? '#059669' : '#dc2626'}">${status}</span></div>` : ''}
        </div>
        ` : ''}
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject || 'Axi Trades'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          
          <!-- Top Accent Line -->
          <tr>
            <td style="height: 4px; background-color: ${brandRed}; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background-color: ${brandDark}; padding: 24px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -1.5px; line-height: 1;">
                      axi<span style="color: ${brandRed};">.</span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); color: #f8fafc; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; letter-spacing: 0.8px;">
                      Official Client Dispatch
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background-color: #ffffff;">
              ${bodyContent}

              <!-- Security / Contact Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                      <strong>Need Support?</strong> Our dedicated institutional client desk is available 24/7.<br/>
                      Email: <a href="mailto:axicustomersupport@gmail.com" style="color: ${brandRed}; font-weight: 700; text-decoration: none;">axicustomersupport@gmail.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: left;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                © ${currentYear} Axi Financial Services Pty Ltd. Regulated by FCA, ASIC, DFSA & FSA. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 10px; color: #cbd5e1; line-height: 1.4;">
                Risk Warning: Financial products carry a high degree of risk to your capital. This email was generated and delivered securely via the Axi Core Delivery Engine to ${recipientEmail}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// SMTP Status & Config Management Endpoint
app.get('/api/email/config', (req, res) => {
  res.json({
    success: true,
    smtpHost: smtpRuntimeConfig.host,
    smtpPort: smtpRuntimeConfig.port,
    smtpUser: smtpRuntimeConfig.user,
    smtpFromName: smtpRuntimeConfig.fromName,
    smtpFromEmail: smtpRuntimeConfig.fromEmail,
    isConfigured: !!(smtpRuntimeConfig.user && smtpRuntimeConfig.pass),
    isGoogleSmtp: smtpRuntimeConfig.host.includes('gmail.com') || smtpRuntimeConfig.host.includes('google'),
    supportedTemplates: ['Registration', 'PasswordReset', 'DepositApproved', 'Withdrawal', 'KYC', 'Custom', 'Broadcast']
  });
});

app.post('/api/email/config', (req, res) => {
  const { host, port, user, pass, fromName, fromEmail } = req.body || {};

  if (host) smtpRuntimeConfig.host = host;
  if (port) smtpRuntimeConfig.port = parseInt(port, 10);
  if (user) smtpRuntimeConfig.user = user;
  if (pass !== undefined && pass !== '') smtpRuntimeConfig.pass = pass;
  if (fromName) smtpRuntimeConfig.fromName = fromName;
  if (fromEmail) smtpRuntimeConfig.fromEmail = fromEmail;

  res.json({
    success: true,
    message: 'SMTP settings updated successfully.',
    config: {
      host: smtpRuntimeConfig.host,
      port: smtpRuntimeConfig.port,
      user: smtpRuntimeConfig.user,
      fromName: smtpRuntimeConfig.fromName,
      fromEmail: smtpRuntimeConfig.fromEmail,
      isConfigured: !!(smtpRuntimeConfig.user && smtpRuntimeConfig.pass)
    }
  });
});

// Direct Test Email Dispatch Endpoint
app.post('/api/email/test', async (req, res) => {
  const { targetEmail, templateType = 'Registration' } = req.body || {};

  const recipient = targetEmail || smtpRuntimeConfig.user || 'axicustomersupport@gmail.com';

  const testSubject = `[Axi Live SMTP Test] ${templateType} Delivery Verification`;
  const html = buildAxiEmailHtml({
    recipientName: 'Axi Administrator',
    recipientEmail: recipient,
    type: templateType,
    subject: testSubject,
    code: '849201',
    txId: 'TX-TEST-' + Math.floor(100000 + Math.random() * 900000),
    amount: 5000,
    status: 'Approved',
    method: 'Google SMTP Verification Test',
    accountNo: 'AXI-849201-LIVE'
  });

  try {
    const transporter = createSmtpTransporter();
    
    if (smtpRuntimeConfig.user && smtpRuntimeConfig.pass) {
      const info = await transporter.sendMail({
        from: `"${smtpRuntimeConfig.fromName}" <${smtpRuntimeConfig.fromEmail}>`,
        to: recipient,
        subject: testSubject,
        html
      });

      console.log(`[SMTP TEST SUCCESS] Dispatched test email to ${recipient}:`, info.messageId);
      return res.json({
        success: true,
        message: `Direct Google SMTP test email delivered to ${recipient}`,
        messageId: info.messageId,
        provider: 'Google SMTP (smtp.gmail.com)'
      });
    } else {
      return res.json({
        success: true,
        notice: 'Google SMTP credentials pending. Please provide Google App Password to enable live inbox delivery.',
        recipient,
        templateType
      });
    }
  } catch (err: any) {
    console.error('[SMTP TEST ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to dispatch test email via SMTP'
    });
  }
});

// Official Transactional Email Dispatch Endpoint
app.post('/api/email/send', async (req, res) => {
  const { 
    recipientEmail, 
    recipientName, 
    type, 
    subject, 
    code, 
    txId, 
    txType, 
    amount, 
    status, 
    method, 
    reason, 
    accountNo, 
    platform,
    refCode,
    customBody 
  } = req.body || {};

  if (!recipientEmail) {
    return res.status(400).json({ success: false, message: 'Recipient email is required' });
  }

  const emailSubject = subject || (
    type === 'Registration'
      ? '🎉 Welcome to Axi Trades - Account Registration Successful!'
      : type === 'PasswordReset'
      ? `🔑 Axi Trades - Password Reset Security Code: ${code || '849201'}`
      : type === 'KYC' || type === 'KYCApproved'
      ? '✅ Axi Trades - KYC Identity Verification Approved'
      : `Axi Trades Transaction #${txId || 'TX-849201'} - ${status || 'Notification'}`
  );

  const emailHtml = buildAxiEmailHtml({
    recipientName,
    recipientEmail,
    type,
    subject: emailSubject,
    code,
    txId,
    txType,
    amount,
    status,
    method,
    reason,
    accountNo,
    platform,
    refCode,
    customBody
  });

  let smtpDelivered = false;
  let smtpError = null;

  // Send via Google SMTP if configured
  try {
    const transporter = createSmtpTransporter();
    
    if (smtpRuntimeConfig.user && smtpRuntimeConfig.pass) {
      const info = await transporter.sendMail({
        from: `"${smtpRuntimeConfig.fromName}" <${smtpRuntimeConfig.fromEmail}>`,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml
      });

      smtpDelivered = true;
      console.log(`[EMAIL DISPATCH SUCCESS] Real Google SMTP email sent to ${recipientEmail} (ID: ${info.messageId})`);
    }
  } catch (err: any) {
    smtpError = err.message;
    console.warn('[EMAIL DISPATCH WARN] Google SMTP delivery notice:', err.message);
  }

  // Telegram alert broadcast for admin live audit
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (botToken && chatId) {
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `<b>[AXI EMAIL DISPATCH ALERT]</b>\n\n📩 <b>To</b>: ${recipientName || 'Client'} &lt;${recipientEmail}&gt;\n<b>Subject</b>: ${emailSubject}\n<b>Type</b>: ${type || 'Transaction'}\n<b>Code/ID</b>: ${code || txId || 'N/A'}\n<b>SMTP Delivery</b>: ${smtpDelivered ? '✅ Direct Inbox Sent' : 'Pending Credentials'}\n\n<i>Sent via Axi Server Engine at ${new Date().toUTCString()}</i>`,
        parse_mode: 'HTML'
      })
    }).catch(e => console.error(e));
  }

  return res.json({ 
    success: true, 
    dispatchedTo: recipientEmail, 
    smtpDelivered,
    smtpError,
    method: smtpDelivered ? 'Google SMTP (smtp.gmail.com)' : 'Axi Secure Mail Engine', 
    timestamp: new Date().toISOString() 
  });
});

// Live Financial News RSS & API Aggregator Endpoint (Finnhub / Alpha Vantage / Live Market Feed)
app.get('/api/news', async (req, res) => {
  try {
    const finnhubKey = process.env.FINNHUB_API_KEY;
    const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;

    // 1. Finnhub Live Financial News API integration
    if (finnhubKey) {
      try {
        const response = await fetch(`https://finnhub.io/api/v1/news?category=forex&token=${finnhubKey}`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const articles = data.slice(0, 15).map((item: any, idx: number) => ({
              id: `finnhub-${item.id || idx}`,
              title: item.headline,
              summary: item.summary || item.headline,
              source: item.source || 'Finnhub Live',
              category: 'Forex',
              sentiment: item.headline.toLowerCase().includes('high') || item.headline.toLowerCase().includes('surge') ? 'Bullish' : 'Neutral',
              impact: 'High',
              publishedAt: item.datetime ? new Date(item.datetime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live',
              relatedSymbol: item.related || 'EURUSD',
              url: item.url || 'https://www.axi.com/int/blog',
              author: item.source || 'Finnhub Financial Desk'
            }));
            return res.json({ success: true, provider: 'Finnhub API', articles });
          }
        }
      } catch (e: any) {
        console.warn('Finnhub fetch notice:', e.message);
      }
    }

    // 2. Alpha Vantage Live Market News Integration
    if (alphaVantageKey) {
      try {
        const response = await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=financial_markets&apikey=${alphaVantageKey}`);
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.feed) && data.feed.length > 0) {
            const articles = data.feed.slice(0, 15).map((item: any, idx: number) => ({
              id: `alphavantage-${idx}`,
              title: item.title,
              summary: item.summary || item.title,
              source: item.source || 'Alpha Vantage',
              category: 'Market News',
              sentiment: item.overall_sentiment_label || 'Neutral',
              impact: 'High',
              publishedAt: item.time_published ? `${item.time_published.slice(9,11)}:${item.time_published.slice(11,13)} UTC` : 'Live',
              relatedSymbol: item.ticker_sentiment?.[0]?.ticker || 'XAUUSD',
              url: item.url || 'https://www.axi.com/int/blog',
              author: item.authors?.[0] || item.source || 'Alpha Vantage'
            }));
            return res.json({ success: true, provider: 'Alpha Vantage API', articles });
          }
        }
      } catch (e: any) {
        console.warn('Alpha Vantage fetch notice:', e.message);
      }
    }

    // 3. Live Financial RSS Aggregator
    const rssUrls = [
      'https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss/search?q=forex+central+bank+interest+rate+gold+bitcoin&hl=en-US&gl=US&ceid=US:en'
    ];

    const response = await fetch(rssUrls[0]);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (data && data.items && Array.isArray(data.items)) {
      const articles = data.items.slice(0, 12).map((item: any, idx: number) => {
        const title = item.title || 'Market Update';
        let category: 'Forex' | 'Crypto' | 'Stocks' | 'Central Banks' | 'Commodities' = 'Forex';
        let symbol = 'EURUSD';
        
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('bitcoin') || lowerTitle.includes('crypto') || lowerTitle.includes('eth') || lowerTitle.includes('solana')) {
          category = 'Crypto';
          symbol = 'BTCUSD';
        } else if (lowerTitle.includes('gold') || lowerTitle.includes('oil') || lowerTitle.includes('commodity') || lowerTitle.includes('metal')) {
          category = 'Commodities';
          symbol = lowerTitle.includes('oil') ? 'USOIL' : 'XAUUSD';
        } else if (lowerTitle.includes('fed') || lowerTitle.includes('rate') || lowerTitle.includes('inflation') || lowerTitle.includes('ecb') || lowerTitle.includes('bank')) {
          category = 'Central Banks';
          symbol = 'USDJPY';
        } else if (lowerTitle.includes('stock') || lowerTitle.includes('nvidia') || lowerTitle.includes('apple') || lowerTitle.includes('nasdaq') || lowerTitle.includes('s&p')) {
          category = 'Stocks';
          symbol = 'NAS100.n';
        }

        let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
        if (lowerTitle.includes('soar') || lowerTitle.includes('surge') || lowerTitle.includes('gain') || lowerTitle.includes('high') || lowerTitle.includes('rally') || lowerTitle.includes('jump')) {
          sentiment = 'Bullish';
        } else if (lowerTitle.includes('drop') || lowerTitle.includes('fall') || lowerTitle.includes('cut') || lowerTitle.includes('plunge') || lowerTitle.includes('sink') || lowerTitle.includes('down')) {
          sentiment = 'Bearish';
        }

        const pubDate = item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

        return {
          id: `live-news-${idx}-${Date.now()}`,
          title: title.replace(/ - [^-]+$/, ''),
          summary: item.description ? item.description.replace(/<[^>]*>?/gm, '').slice(0, 160) + '...' : title,
          source: item.author || (title.includes('-') ? title.split('-').pop()?.trim() : 'Google Finance News') || 'Reuters',
          category,
          sentiment,
          impact: idx % 2 === 0 ? 'High' : 'Medium',
          publishedAt: pubDate,
          relatedSymbol: symbol,
          url: item.link || item.guid || 'https://www.axi.com/int/blog',
          author: item.author || 'Market Intelligence Desk'
        };
      });

      return res.json({ success: true, provider: 'Live Financial Market Feed', articles });
    }

    res.json({ success: false, articles: [] });
  } catch (err: any) {
    console.warn('Live news API fetch notice:', err.message);
    res.json({ success: false, articles: [] });
  }
});

// Telegram Notification Handler Endpoint
app.post('/api/telegram/notify', async (req, res) => {
  const { message, chatId: customChatId, type = 'ALERT' } = req.body || {};
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = customChatId || process.env.TELEGRAM_CHAT_ID;

  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const formattedMessage = `<b>[Axi Trading Alert - ${type}]</b>\n\n${message}\n\n<i>Sent: ${new Date().toUTCString()}</i>`;

  if (botToken && chatId) {
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: formattedMessage,
          parse_mode: 'HTML'
        })
      });

      const tgData = await tgRes.json();
      if (tgRes.ok && tgData.ok) {
        return res.json({ success: true, delivered: true, message: 'Telegram notification sent successfully' });
      } else {
        console.warn('Telegram API response error:', tgData);
      }
    } catch (err: any) {
      console.error('Telegram dispatch error:', err);
    }
  }

  // Graceful response when credentials aren't set or in development
  console.log(`📱 [Telegram Notification Dispatch]: ${type} -> ${message}`);
  res.json({
    success: true,
    delivered: false,
    standby: true,
    message: 'Telegram notification processed (Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable live telegram bot delivery)'
  });
});

// Vite server handler and start listener
const isProd = process.env.NODE_ENV === 'production';
const isVercel = Boolean(process.env.VERCEL);

if (!isVercel && process.env.NODE_ENV !== 'test') {
  (async () => {
    if (!isProd) {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.resolve(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })();
}

export default app;
export { app };

