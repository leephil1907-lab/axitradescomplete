import { MarketQuote } from '../types';

export interface LiveTickerUpdate {
  symbol: string;
  price: number;
  change: number;
  bidDiff?: number;
  askDiff?: number;
  spread?: number;
  source: string;
  timestamp: number;
}

type LiveQuoteListener = (quotes: Record<string, MarketQuote>) => void;

/** Production market-data client: never treats bootstrap/demo values as live. */
class LiveMarketFeedService {
  private listeners: Set<LiveQuoteListener> = new Set();
  private currentQuotes: Record<string, MarketQuote> = {};
  private ws: WebSocket | null = null;
  private isRunning = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private fxTimer: ReturnType<typeof setInterval> | null = null;
  private flashStates: Record<string, 'up' | 'down' | null> = {};
  private readonly maxQuoteAgeMs = 15_000;

  public init(initialQuotes: Record<string, MarketQuote>) {
    // Metadata may be bootstrapped; price-bearing values may not.
    this.currentQuotes = Object.fromEntries(
      Object.entries(initialQuotes).map(([symbol, quote]) => [symbol, {
        ...quote,
        price: 0,
        change: 0,
        bidDiff: undefined,
        askDiff: undefined,
        spread: 0,
        history: [],
        lastUpdated: 0,
        stale: true,
        status: 'unavailable'
      }])
    );
    this.notify();
    if (!this.isRunning) this.start();
  }

  public subscribe(listener: LiveQuoteListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.currentQuotes });
    return () => this.listeners.delete(listener);
  }

  public getQuotes(): Record<string, MarketQuote> { return { ...this.currentQuotes }; }
  public getFlash(symbol: string): 'up' | 'down' | null { return this.flashStates[symbol] || null; }

  private start() {
    this.isRunning = true;
    void this.fetchServerQuotes();
    void this.fetchClientForexRates();
    this.startCryptoWebSocket();
    this.pollTimer = setInterval(() => void this.fetchServerQuotes(), 1800);
    this.fxTimer = setInterval(() => void this.fetchClientForexRates(), 10_000);
  }

  private applyLiveQuote(symbol: string, item: any, timestamp: number) {
    const existing = this.currentQuotes[symbol];
    if (!existing || typeof item?.price !== 'number' || !Number.isFinite(item.price) || item.price <= 0) return false;
    if (!Number.isFinite(timestamp) || Date.now() - timestamp > this.maxQuoteAgeMs) return false;

    const oldPrice = existing.price;
    const history = [...(existing.history || [])];
    if (oldPrice > 0 && oldPrice !== item.price) {
      this.flashStates[symbol] = item.price > oldPrice ? 'up' : 'down';
      setTimeout(() => { this.flashStates[symbol] = null; }, 1000);
    }
    history.push(item.price);
    while (history.length > 20) history.shift();

    this.currentQuotes[symbol] = {
      ...existing,
      price: item.price,
      change: typeof item.change === 'number' ? item.change : existing.change,
      bidDiff: typeof item.bidDiff === 'number' ? item.bidDiff : existing.bidDiff,
      askDiff: typeof item.askDiff === 'number' ? item.askDiff : existing.askDiff,
      spread: typeof item.spread === 'number' ? item.spread : existing.spread,
      history,
      lastUpdated: timestamp,
      stale: false,
      status: 'live',
      ...(item.source ? { source: item.source } : {})
    } as MarketQuote;
    return true;
  }

  private async fetchClientForexRates() {
    try {
      const requestStarted = Date.now();
      const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
      if (!res.ok) return;
      const rates = (await res.json())?.rates;
      if (!rates) return;

      const values: Record<string, number | null> = {
        EURUSD: rates.EUR ? Number((1 / rates.EUR).toFixed(5)) : null,
        GBPUSD: rates.GBP ? Number((1 / rates.GBP).toFixed(5)) : null,
        USDJPY: rates.JPY ? Number(rates.JPY.toFixed(3)) : null,
        AUDUSD: rates.AUD ? Number((1 / rates.AUD).toFixed(5)) : null,
        USDCAD: rates.CAD ? Number(rates.CAD.toFixed(5)) : null,
        USDCHF: rates.CHF ? Number(rates.CHF.toFixed(5)) : null,
        NZDUSD: rates.NZD ? Number((1 / rates.NZD).toFixed(5)) : null
      };

      let changed = false;
      for (const [symbol, price] of Object.entries(values)) {
        if (price && this.currentQuotes[symbol]) {
          changed = this.applyLiveQuote(symbol, { price, source: 'ExchangeRate API reference feed' }, requestStarted) || changed;
        }
      }
      if (changed) this.notify();
    } catch {
      // Provider failure never produces replacement/synthetic prices.
    }
  }

  private notify() {
    for (const listener of this.listeners) listener({ ...this.currentQuotes });
  }

  public async fetchServerQuotes() {
    try {
      const requestStarted = Date.now();
      const res = await fetch('/api/markets/quotes', { cache: 'no-store' });
      if (!res.ok) return;
      const liveData = await res.json();
      let changed = false;

      for (const sym of Object.keys(this.currentQuotes)) {
        const item = liveData?.[sym];
        const providerTimestamp = Number(item?.lastUpdated || item?.timestamp || 0);
        // The backend historically seeded a static baseline. Reject it unless a
        // provider update is recent enough to prove the quote is genuinely fresh.
        if (!item || !providerTimestamp || providerTimestamp < requestStarted - 1000 || Date.now() - providerTimestamp > this.maxQuoteAgeMs) continue;
        changed = this.applyLiveQuote(sym, item, providerTimestamp) || changed;
      }
      if (changed) this.notify();
    } catch {
      // No synthetic fallback.
    }
  }

  private startCryptoWebSocket() {
    try {
      this.ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      const productIds = [
        'BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'DOGE-USD', 'ADA-USD',
        'BNB-USD', 'AVAX-USD', 'DOT-USD', 'LINK-USD', 'LTC-USD', 'TRX-USD',
        'TON-USD', 'NEAR-USD', 'SUI-USD', 'SHIB-USD', 'PEPE-USD'
      ];

      this.ws.onopen = () => {
        this.ws?.send(JSON.stringify({ type: 'subscribe', product_ids: productIds, channels: ['ticker'] }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.type !== 'ticker' || !data.product_id || !data.price) return;
          const symbol = String(data.product_id).replace('-', '');
          const price = Number(data.price);
          const open24 = Number(data.open_24h || 0);
          const change = open24 > 0 ? Number((((price - open24) / open24) * 100).toFixed(2)) : 0;
          if (this.applyLiveQuote(symbol, { price, change, source: 'Coinbase Exchange WebSocket' }, Date.now())) this.notify();
        } catch {
          // Ignore malformed provider messages.
        }
      };
      this.ws.onerror = () => { /* REST remains available. */ };
      this.ws.onclose = () => { if (this.isRunning) setTimeout(() => this.startCryptoWebSocket(), 5000); };
    } catch {
      // WebSocket unavailable; server REST remains available.
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.fxTimer) clearInterval(this.fxTimer);
    this.pollTimer = null;
    this.fxTimer = null;
    if (this.ws) this.ws.close();
    this.ws = null;
  }
}

export const liveMarketFeed = new LiveMarketFeedService();
