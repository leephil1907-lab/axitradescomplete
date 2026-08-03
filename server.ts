import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import Stripe from 'stripe';
import YahooFinanceRaw from 'yahoo-finance2';

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

// Force HTTPS and set security headers in production
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// Dedicated raw body handling for Stripe webhook BEFORE express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (stripe && webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Fallback if webhook secret isn't configured yet
      const bodyString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
      event = typeof bodyString === 'string' ? JSON.parse(bodyString) : bodyString;
    }
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

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

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`✅ PaymentIntent for ${paymentIntent.amount} was successful!`);
      notifyTelegram(`💰 <b>PAYMENT RECEIVED</b>\nAmount: $${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}\nStatus: Success\n\nPlease manually update the user balance from the admin dashboard.`);
      break;
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log(`✅ Checkout Session ${session.id} completed successfully!`);
      notifyTelegram(`🛒 <b>CHECKOUT COMPLETED</b>\nAmount Total: $${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase() || 'USD'}\nCustomer Details: ${session.customer_details?.email || 'N/A'}\n\nPlease manually update the user balance from the admin dashboard.`);
      break;
    default:
      console.log(`Received Stripe event type ${event.type}`);
  }

  res.json({ received: true });
});

// General Express JSON middleware for all other API routes
app.use(express.json());

// Generic TradingView / MT4/MT5 / Signal Webhook endpoint
app.post('/api/webhook/trading-signals', (req, res) => {
  const secretHeader = req.headers['x-webhook-secret'] || req.headers['authorization'];
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (expectedSecret && secretHeader !== expectedSecret) {
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
    message: 'Webhook signal received and processed by Axi execution gateway',
    signal: { symbol, action, price, quantity, comment },
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Shared Gemini client setup
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Store live simulated rates

const LIVE_MARKETS: Record<string, { price: number; change: number; bidDiff: number; askDiff: number }> = {
  'EURUSD': { price: 1.0845, change: 0.12, bidDiff: -0.0001, askDiff: 0.0001 },
  'GBPUSD': { price: 1.2684, change: -0.08, bidDiff: -0.0002, askDiff: 0.0002 },
  'USDJPY': { price: 151.62, change: 0.35, bidDiff: -0.02, askDiff: 0.02 },
  'AUDUSD': { price: 0.6542, change: -0.22, bidDiff: -0.0001, askDiff: 0.0001 },
  'BTCUSD': { price: 67845.00, change: 2.45, bidDiff: -5.00, askDiff: 5.00 },
  'ETHUSD': { price: 3482.50, change: 1.84, bidDiff: -0.50, askDiff: 0.50 },
  'SOLUSD': { price: 182.40, change: 4.12, bidDiff: -0.10, askDiff: 0.10 },
  'XRPUSD': { price: 0.6240, change: 0.95, bidDiff: -0.0005, askDiff: 0.0005 },
  'XAUUSD': { price: 2342.80, change: 1.15, bidDiff: -0.30, askDiff: 0.30 },
  'USOUSD': { price: 81.45, change: -0.65, bidDiff: -0.04, askDiff: 0.04 },
  'US30': { price: 39120.00, change: 0.42, bidDiff: -3.00, askDiff: 3.00 },
  'SPX500': { price: 5211.50, change: 0.55, bidDiff: -0.40, askDiff: 0.40 },
  'AAPL': { price: 172.62, change: -0.85, bidDiff: -0.10, askDiff: 0.10 },
  'TSLA': { price: 171.05, change: -2.15, bidDiff: -0.12, askDiff: 0.12 },
  'NVDA': { price: 881.86, change: 4.62, bidDiff: -0.50, askDiff: 0.50 }
};

const SYMBOL_MAP: Record<string, string> = {
  'EURUSD': 'EURUSD=X',
  'GBPUSD': 'GBPUSD=X',
  'USDJPY': 'JPY=X',
  'AUDUSD': 'AUDUSD=X',
  'BTCUSD': 'BTC-USD',
  'ETHUSD': 'ETH-USD',
  'SOLUSD': 'SOL-USD',
  'XRPUSD': 'XRP-USD',
  'XAUUSD': 'GC=F',
  'USOUSD': 'CL=F',
  'US30': '^DJI',
  'SPX500': '^GSPC',
  'AAPL': 'AAPL',
  'TSLA': 'TSLA',
  'NVDA': 'NVDA'
};

async function updateLiveMarkets() {
  // 1. Fetch Crypto live prices from Binance API with timeout & headers
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT","XRPUSDT"]', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const cryptoData: any[] = await res.json();
      for (const item of cryptoData) {
        const sym = item.symbol === 'BTCUSDT' ? 'BTCUSD' 
          : item.symbol === 'ETHUSDT' ? 'ETHUSD' 
          : item.symbol === 'SOLUSDT' ? 'SOLUSD'
          : item.symbol === 'XRPUSDT' ? 'XRPUSD'
          : null;
        if (sym && LIVE_MARKETS[sym]) {
          const price = parseFloat(item.lastPrice);
          const change = parseFloat(item.priceChangePercent);
          LIVE_MARKETS[sym].price = price;
          LIVE_MARKETS[sym].change = change;
          LIVE_MARKETS[sym].bidDiff = - (price * 0.0001);
          LIVE_MARKETS[sym].askDiff = (price * 0.0001);
        }
      }
    }
  } catch (err) {
    // Secondary fallback to Coinbase public exchange rate API if Binance resets or times out
    try {
      const cbRes = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD', {
        headers: { 'User-Agent': 'Axi-Trader-App/1.0' },
        signal: AbortSignal.timeout(3000)
      });
      if (cbRes.ok) {
        const cbJson: any = await cbRes.json();
        const rates = cbJson?.data?.rates;
        if (rates) {
          const btc = parseFloat(rates['BTC']);
          const eth = parseFloat(rates['ETH']);
          const sol = parseFloat(rates['SOL']);
          const xrp = parseFloat(rates['XRP']);
          if (btc > 0) LIVE_MARKETS['BTCUSD'].price = Number((1 / btc).toFixed(2));
          if (eth > 0) LIVE_MARKETS['ETHUSD'].price = Number((1 / eth).toFixed(2));
          if (sol > 0) LIVE_MARKETS['SOLUSD'].price = Number((1 / sol).toFixed(2));
          if (xrp > 0) LIVE_MARKETS['XRPUSD'].price = Number((1 / xrp).toFixed(4));
        }
      }
    } catch (cbErr) {
      // Smooth local drift simulation if both public APIs encounter network dropouts
      ['BTCUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD'].forEach(sym => {
        if (LIVE_MARKETS[sym]) {
          const delta = (Math.random() - 0.49) * (LIVE_MARKETS[sym].price * 0.001);
          LIVE_MARKETS[sym].price = Number((LIVE_MARKETS[sym].price + delta).toFixed(2));
        }
      });
    }
  }

  // 2. Fetch Forex, Commodities, Indices, and Equities from Yahoo Finance
  if (yahooFinance && typeof yahooFinance.quote === 'function') {
    try {
      const yfSymbols = Object.entries(SYMBOL_MAP)
        .filter(([key]) => key !== 'BTCUSD' && key !== 'ETHUSD')
        .map(([, val]) => val);

      const quotes = await yahooFinance.quote(yfSymbols);
      if (Array.isArray(quotes)) {
        for (const quote of quotes) {
          const internalSymbol = Object.keys(SYMBOL_MAP).find(k => SYMBOL_MAP[k] === quote.symbol);
          if (internalSymbol && quote.regularMarketPrice) {
            const asset = LIVE_MARKETS[internalSymbol];
            const oldPrice = asset.price;
            asset.price = quote.regularMarketPrice;
            
            if (quote.regularMarketChangePercent !== undefined && quote.regularMarketChangePercent !== null) {
              asset.change = Number(quote.regularMarketChangePercent.toFixed(2));
            } else if (oldPrice > 0) {
              asset.change = Number((((asset.price - oldPrice) / oldPrice) * 100).toFixed(2));
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch live markets from Yahoo Finance:", err);
    }
  }
}

// Update immediately and then every 3 seconds for real-time live price ticks
updateLiveMarkets();
setInterval(updateLiveMarkets, 3000);


// Endpoint for live real market rates
app.get('/api/markets/quotes', (req, res) => {
  res.json(LIVE_MARKETS);
});


app.get('/api/markets/history', async (req, res) => {
  const symbol = req.query.symbol as string;
  const tf = ((req.query.timeframe as string) || '1H').toUpperCase();
  if (!symbol || !LIVE_MARKETS[symbol]) {
    return res.status(404).json({ error: 'Instrument not found' });
  }
  
  // Map timeframe to Binance interval & limit
  let binanceInterval = '1h';
  let binanceLimit = 48;
  if (tf === '1D') {
    binanceInterval = '1d';
    binanceLimit = 30;
  } else if (tf === '4H') {
    binanceInterval = '4h';
    binanceLimit = 42;
  } else if (tf === '1H') {
    binanceInterval = '1h';
    binanceLimit = 48;
  } else if (tf === '15M') {
    binanceInterval = '15m';
    binanceLimit = 40;
  } else if (tf === '5M') {
    binanceInterval = '5m';
    binanceLimit = 40;
  } else if (tf === '1M') {
    binanceInterval = '1m';
    binanceLimit = 40;
  }

  // For Crypto: Use Binance live kline API
  const isCrypto = symbol === 'BTCUSD' || symbol === 'ETHUSD' || symbol === 'SOLUSD' || symbol === 'XRPUSD';
  if (isCrypto) {
    try {
      const binanceSym = symbol === 'BTCUSD' ? 'BTCUSDT' 
        : symbol === 'ETHUSD' ? 'ETHUSDT' 
        : symbol === 'SOLUSD' ? 'SOLUSDT' 
        : 'XRPUSDT';
      const bRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSym}&interval=${binanceInterval}&limit=${binanceLimit}`);
      if (bRes.ok) {
        const klines: any[] = await bRes.json();
        const formatted = klines.map((k: any) => ({
          time: Math.floor(k[0] / 1000),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5])
        }));
        return res.json(formatted);
      }
    } catch (err) {
      console.error('Binance history fetch error:', err);
    }
  }

  // For Forex/Equities/Indices: Use Yahoo Finance
  const yfSymbol = SYMBOL_MAP[symbol];
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

  // Fallback deterministic structure based on real current price
  const now = Math.floor(Date.now() / 1000);
  const basePrice = LIVE_MARKETS[symbol]?.price || 100;
  const fallback = [];
  const intervalSeconds = tf === '1D' ? 86400 : tf === '4H' ? 14400 : tf === '1H' ? 3600 : 900;
  const step = isCrypto ? basePrice * 0.008 : basePrice * 0.0015;

  for (let i = 40; i >= 0; i--) {
    const time = now - i * intervalSeconds;
    const sinVal = Math.sin(i * 0.4) * step;
    const close = Number((basePrice + sinVal).toFixed(symbol.includes('JPY') ? 2 : 5));
    const open = Number((close - step * 0.2).toFixed(symbol.includes('JPY') ? 2 : 5));
    const high = Number((Math.max(open, close) + step * 0.3).toFixed(symbol.includes('JPY') ? 2 : 5));
    const low = Number((Math.min(open, close) - step * 0.3).toFixed(symbol.includes('JPY') ? 2 : 5));
    fallback.push({ time, open, high, low, close });
  }
  res.json(fallback);
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
    if (!apiKey) {
      return res.json({
        text: "My apologies, but the GEMINI_API_KEY is currently not configured in Secrets. I will function in standard offline simulation mode.\n\nTo trade on Axi, you can explore Forex pairs like EUR/USD (currently at 1.0845), Cryptos like Bitcoin, or indices like the US30. We offer leverage up to 1:500 with zero commission on standard accounts!",
        offline: true
      });
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
    res.json({
      text: "I ran into a connection glitch while consulting the live trading database, but I can tell you that Axi is fully regulated by the FCA, ASIC, and DFSA. Standard accounts offer spreads from 0.9 pips, while Pro accounts offer spreads from 0.0 pips with a low commission. Let me know what questions you have about trading strategies!",
      error: error.message
    });
  }
});


// Stripe configuration
const stripeSecret = process.env.STRIPE_SECRET_KEY;
let stripe = null;
if (stripeSecret) {
  stripe = new Stripe(stripeSecret);
}

// Create Stripe PaymentIntent
app.post('/api/stripe/create-payment-intent', async (req, res) => {
  const { amount, currency = 'usd', depositId, userId } = req.body;
  const numAmount = parseFloat(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }

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

app.post('/api/stripe/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to secrets.' });
  }
  
  try {
    const { amount, currency = 'usd' } = req.body;
    
    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link'], // Support multiple methods
      billing_address_collection: 'required', // Global list of addresses
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'Axi Account Funding',
              description: 'Instant Deposit to Axi Trading Account',
            },
            unit_amount: Math.round(amount * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: req.headers.referer ? req.headers.referer.split('?')[0] + '?deposit_success=true&amount=' + amount : 'http://localhost:3000/?deposit_success=true&amount=' + amount,
      cancel_url: req.headers.referer ? req.headers.referer.split('?')[0] : 'http://localhost:3000/',
    });
    
    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User action handlers with Telegram dispatch

app.get('/api/stripe/status', (req, res) => {
  res.json({
    configured: !!stripe,
    webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
    webhookEndpoint: '/api/stripe/webhook',
    eventsSupported: ['payment_intent.succeeded', 'checkout.session.completed', 'payment_intent.payment_failed'],
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/stripe/payment-intent/:id', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured.' });
  }
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(req.params.id);
    res.json({ status: paymentIntent.status, amount: paymentIntent.amount / 100, currency: paymentIntent.currency });
  } catch (error) {
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
  console.log(`📱 [Telegram Notification Simulated]: ${type} -> ${message}`);
  res.json({
    success: true,
    delivered: false,
    simulated: true,
    message: 'Telegram notification processed in simulation mode (Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to go live)'
  });
});

// Vite server handler and start listener
const isProd = process.env.NODE_ENV === 'production';
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
