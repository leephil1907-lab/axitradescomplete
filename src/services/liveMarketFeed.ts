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

class LiveMarketFeedService {
  private listeners: Set<LiveQuoteListener> = new Set();
  private currentQuotes: Record<string, MarketQuote> = {};
  private ws: WebSocket | null = null;
  private isRunning: boolean = false;
  private pollTimer: any = null;
  private lastUpdateTimes: Record<string, number> = {};
  private flashStates: Record<string, 'up' | 'down' | null> = {};

  public init(initialQuotes: Record<string, MarketQuote>) {
    this.currentQuotes = { ...initialQuotes };
    if (!this.isRunning) {
      this.start();
    }
  }

  public subscribe(listener: LiveQuoteListener): () => void {
    this.listeners.add(listener);
    if (Object.keys(this.currentQuotes).length > 0) {
      listener(this.currentQuotes);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getQuotes(): Record<string, MarketQuote> {
    return this.currentQuotes;
  }

  public getFlash(symbol: string): 'up' | 'down' | null {
    return this.flashStates[symbol] || null;
  }

  private start() {
    this.isRunning = true;
    this.fetchServerQuotes();
    this.fetchClientForexRates();
    this.startCryptoWebSocket();
    this.pollTimer = setInterval(() => {
      this.fetchServerQuotes();
    }, 1800);
    setInterval(() => {
      this.fetchClientForexRates();
    }, 10000);
  }

  private async fetchClientForexRates() {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (res.ok) {
        const data = await res.json();
        const rates = data?.rates;
        if (rates) {
          const eurusd = rates.EUR ? Number((1 / rates.EUR).toFixed(5)) : null;
          const gbpusd = rates.GBP ? Number((1 / rates.GBP).toFixed(5)) : null;
          const usdjpy = rates.JPY ? Number(rates.JPY.toFixed(3)) : null;
          const audusd = rates.AUD ? Number((1 / rates.AUD).toFixed(5)) : null;
          const usdcad = rates.CAD ? Number(rates.CAD.toFixed(5)) : null;
          const usdchf = rates.CHF ? Number(rates.CHF.toFixed(5)) : null;
          const nzdusd = rates.NZD ? Number((1 / rates.NZD).toFixed(5)) : null;

          const updateSymbol = (sym: string, newPrice: number | null) => {
            if (newPrice && this.currentQuotes[sym]) {
              const oldPrice = this.currentQuotes[sym].price;
              if (Math.abs(oldPrice - newPrice) > 0.00001) {
                this.currentQuotes[sym] = {
                  ...this.currentQuotes[sym],
                  price: newPrice,
                  lastUpdated: Date.now(),
                  stale: false,
                  status: 'live'
                };
              }
            }
          };

          updateSymbol('EURUSD', eurusd);
          updateSymbol('GBPUSD', gbpusd);
          updateSymbol('USDJPY', usdjpy);
          updateSymbol('AUDUSD', audusd);
          updateSymbol('USDCAD', usdcad);
          updateSymbol('USDCHF', usdchf);
          updateSymbol('NZDUSD', nzdusd);
          this.notify();
        }
      }
    } catch (e) {
      // ignore
    }
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ ...this.currentQuotes });
    }
  }

  public async fetchServerQuotes() {
    try {
      const res = await fetch('/api/markets/quotes');
      if (res.ok) {
        const liveData = await res.json();
        let changed = false;
        const now = Date.now();

        for (const sym in liveData) {
          const item = liveData[sym];
          if (item && item.price > 0 && this.currentQuotes[sym]) {
            const oldPrice = this.currentQuotes[sym].price;
            const newPrice = item.price;

            if (Math.abs(oldPrice - newPrice) > 0.000001 || !this.currentQuotes[sym].lastUpdated) {
              if (oldPrice > 0 && newPrice !== oldPrice) {
                this.flashStates[sym] = newPrice > oldPrice ? 'up' : 'down';
                setTimeout(() => {
                  this.flashStates[sym] = null;
                }, 1000);
              }

              const history = [...(this.currentQuotes[sym].history || [])];
              if (history.length > 20) history.shift();
              history.push(newPrice);

              this.currentQuotes[sym] = {
                ...this.currentQuotes[sym],
                price: newPrice,
                change: item.change ?? this.currentQuotes[sym].change,
                bidDiff: item.bidDiff ?? this.currentQuotes[sym].bidDiff,
                askDiff: item.askDiff ?? this.currentQuotes[sym].askDiff,
                spread: item.spread ?? this.currentQuotes[sym].spread,
                stale: item.stale ?? false,
                status: item.status || 'live',
                lastUpdated: now,
                history
              };
              changed = true;
            }
          }
        }

        if (changed) {
          this.notify();
        }
      }
    } catch (e) {
      // Keep running with direct client ticker
    }
  }

  private startCryptoWebSocket() {
    try {
      // Connect to Coinbase Exchange WebSocket for zero-latency live crypto pricing.
      // Binance WS is geo-restricted in many hosting regions; Coinbase is globally
      // accessible and returns accurate real-time last-price ticks.
      const wsUrl = `wss://ws-feed.exchange.coinbase.com`;
      this.ws = new WebSocket(wsUrl);

      const subProducts = [
        'BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'DOGE-USD', 'ADA-USD',
        'BNB-USD', 'AVAX-USD', 'DOT-USD', 'LINK-USD', 'LTC-USD', 'TRX-USD',
        'TON-USD', 'NEAR-USD', 'SUI-USD', 'SHIB-USD', 'PEPE-USD'
      ];

      this.ws.onopen = () => {
        try {
          this.ws?.send(JSON.stringify({
            type: 'subscribe',
            product_ids: subProducts,
            channels: ['ticker']
          }));
        } catch (e) { /* ignore */ }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Coinbase ticker channel emits { type:'ticker', product_id:'BTC-USD', price:'...', ... }
          if (data && data.type === 'ticker' && data.product_id && data.price) {
            const rawSym = data.product_id; // e.g. BTC-USD
            const appSym = rawSym.replace('-', '').replace('USD', 'USD'); // BTCUSD
            const price = parseFloat(data.price);
            // Coinbase ticker includes 24h open via 'open_24h' when available
            const open24 = parseFloat(data.open_24h || '0');
            const changePercent = open24 > 0 ? Number((((price - open24) / open24) * 100).toFixed(2)) : 0;

            if (price > 0 && this.currentQuotes[appSym]) {
              const oldPrice = this.currentQuotes[appSym].price;
              if (Math.abs(oldPrice - price) > 0.0000001) {
                this.flashStates[appSym] = price > oldPrice ? 'up' : 'down';
                setTimeout(() => {
                  this.flashStates[appSym] = null;
                }, 1000);

                const history = [...(this.currentQuotes[appSym].history || [])];
                if (history.length > 20) history.shift();
                history.push(price);

                this.currentQuotes[appSym] = {
                  ...this.currentQuotes[appSym],
                  price,
                  change: changePercent,
                  lastUpdated: Date.now(),
                  stale: false,
                  status: 'live',
                  history
                };
                this.notify();
              }
            }
          }
        } catch (err) {
          // ignore stream parse error
        }
      };

      this.ws.onerror = () => {
        // Fall back gracefully to REST polling (server Kraken/Coinbase endpoint)
      };

      this.ws.onclose = () => {
        // Reconnect after 5 seconds
        if (this.isRunning) {
          setTimeout(() => this.startCryptoWebSocket(), 5000);
        }
      };
    } catch (e) {
      // WS not available in environment, fallback to fast REST
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const liveMarketFeed = new LiveMarketFeedService();
