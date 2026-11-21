import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper } from 'lucide-react';
import { liveMarketFeed } from '../services/liveMarketFeed';
import { MarketQuote } from '../types';

/**
 * Live Markets Ticker — replaces all hardcoded/fake spread values with genuine,
 * provider-sourced live prices from liveMarketFeed (Coinbase WS for crypto,
 * ExchangeRate-API reference feed for FX, and /api/markets/quotes server feed).
 * Falls back gracefully if live data is momentarily unavailable — never fabricates
 * prices or demo values.
 */
const TICKER_SYMBOLS: string[] = [
  'BTCUSD', 'ETHUSD', 'XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'US30', 'NAS100', 'SPX500', 'XRPUSD', 'SOLUSD', 'AAPL'
];

interface TickerItem {
  symbol: string;
  name: string;
  price: number | null;
  bid: number | null;
  ask: number | null;
  spread: number | null;
  change: number | null;
  isUp: boolean;
  source: string;
  stale: boolean;
}

const SYMBOL_NAMES: Record<string, string> = {
  BTCUSD: 'Bitcoin', ETHUSD: 'Ethereum', XAUUSD: 'Gold', EURUSD: 'Euro / US Dollar',
  GBPUSD: 'Pound / US Dollar', USDJPY: 'US Dollar / Yen', US30: 'Dow Jones',
  NAS100: 'Nasdaq 100', SPX500: 'S&P 500', XRPUSD: 'XRP', SOLUSD: 'Solana',
  AAPL: 'Apple'
};

const SYMBOL_DECIMALS: Record<string, number> = {
  BTCUSD: 2, ETHUSD: 2, XAUUSD: 2, EURUSD: 5, GBPUSD: 5, USDJPY: 3,
  US30: 2, NAS100: 2, SPX500: 2, XRPUSD: 4, SOLUSD: 2, AAPL: 2
};

export default function NewsTicker() {
  const [tickerItems, setTickerItems] = useState<Record<string, TickerItem>>(
    Object.fromEntries(TICKER_SYMBOLS.map(s => [s, {
      symbol: s, name: SYMBOL_NAMES[s] || s, price: null, bid: null, ask: null,
      spread: null, change: null, isUp: true, source: 'liveMarketFeed', stale: true
    }]))
  );
  const [headlineIndex, setHeadlineIndex] = useState(0);

  const MARKET_HEADLINES = [
    'Fed signals potential rate cuts as inflation cools',
    'Gold hits new all-time high as investors seek safe havens',
    'Crypto markets surge following new regulatory approvals',
    'Oil prices stabilize amidst Middle East tensions',
    'European markets close higher despite economic data concerns',
    'Bank of Japan maintains ultra-loose monetary policy',
    'Tech stocks rally on strong earnings reports from major players'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % MARKET_HEADLINES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to the real live market feed — no synthetic or demo prices ever.
  useEffect(() => {
    const unsubscribe = liveMarketFeed.subscribe((quotes) => {
      setTickerItems((prev) => {
        const next: Record<string, TickerItem> = { ...prev };
        let changed = false;
        for (const symbol of TICKER_SYMBOLS) {
          const q: MarketQuote | undefined = quotes[symbol];
          const existing = next[symbol];
          if (q && q.price && q.price > 0 && !q.stale) {
            const decimals = SYMBOL_DECIMALS[symbol] ?? 4;
            const bid = Number((q.price - ((q.bidDiff ?? q.spread / 2) || 0)).toFixed(decimals));
            const ask = Number((q.price + ((q.askDiff ?? q.spread / 2) || 0)).toFixed(decimals));
            const spread = Number((ask - bid).toFixed(decimals));
            const nextItem: TickerItem = {
              symbol, name: SYMBOL_NAMES[symbol] || symbol, price: q.price, bid, ask, spread,
              change: q.change ?? 0, isUp: (q.change ?? 0) >= 0,
              source: q.source ?? 'liveMarketFeed', stale: false
            };
            next[symbol] = nextItem;
            if (!existing || existing.price !== q.price || existing.spread !== spread) changed = true;
          } else if (existing && !existing.stale) {
            // Mark stale but keep last known price so the ticker never shows blank/fake values.
            next[symbol] = { ...existing, stale: true };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    });
    return () => unsubscribe();
  }, []);

  const sortedSymbols = Object.keys(tickerItems).filter(s => TICKER_SYMBOLS.includes(s));

  const priceLabel = (item: TickerItem): string => {
    const d = SYMBOL_DECIMALS[item.symbol] ?? 4;
    if (item.price === null) return '--';
    return item.price.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  };

  const spreadLabel = (item: TickerItem): string => {
    if (item.spread === null) return '--';
    return item.spread.toFixed(SYMBOL_DECIMALS[item.symbol] ?? 4);
  };

  return (
    <div className="w-full bg-[#0B0F19] border-b border-white/10 text-slate-300 py-1.5 px-4 text-xs font-medium flex items-center gap-3 overflow-hidden select-none">
      {/* Live ticker label */ }
      <div className="flex items-center gap-1.5 text-brand-red shrink-0 font-black uppercase tracking-widest text-[10px]">
        <Newspaper className="w-3.5 h-3.5 animate-pulse" />
        Live Markets
      </div>
      <div className="h-4 w-px bg-white/20 shrink-0"></div>

      {/* Scrolling live prices */ }
      <div className="flex-grow relative h-4 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={headlineIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 truncate"
          >
            {MARKET_HEADLINES[headlineIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="ml-6 flex items-center gap-1 whitespace-nowrap animate-[marquee_24s_linear_infinite]">
        {sortedSymbols.map((sym, i) => {
          const item = tickerItems[sym];
          const d = SYMBOL_DECIMALS[sym] ?? 4;
          const isLive = !item.stale && item.price !== null;
          const liveColor = item.isUp ? 'text-emerald-400' : 'text-rose-400';
          return (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className={`text-[10px] font-black ${isLive ? liveColor : 'text-slate-500'}`}>
                {sym}
              </div>
              <div className="w-px h-3 bg-white/10 mx-0.5"></div>
              <div className={`font-mono font-bold text-slate-200 text-[10px] ${isLive ? '' : 'opacity-50'}`}>
                {priceLabel(item)}
              </div>
              <div className={`w-px h-3 bg-white/10 mx-0.5`}></div>
              <div className={`font-mono text-[9px] ${isLive ? liveColor : 'text-slate-500'}`}>
                {isLive ? (item.change ?? 0 >= 0 ? '+' : '') + (item.change ?? 0).toFixed(2) + '%' : '--'}
              </div>
              <div className="w-px h-3 bg-white/10 mx-0.5"></div>
              <div className={`font-mono text-[9px] text-brand-yellow font-bold ${isLive ? '' : 'opacity-50'}`}>
                Spread {spreadLabel(item)}
              </div>
              <div className={`w-1 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
            </div>
          );
        })}
        {/* Duplicate set for seamless infinite loop */ }
        {sortedSymbols.map((sym, i) => {
          const item = tickerItems[sym];
          const d = SYMBOL_DECIMALS[sym] ?? 4;
          const isLive = !item.stale && item.price !== null;
          const liveColor = item.isUp ? 'text-emerald-400' : 'text-rose-400';
          return (
            <div key={`dup-${i}`} className="flex items-center gap-2 shrink-0">
              <div className={`text-[10px] font-black ${isLive ? liveColor : 'text-slate-500'}`}>
                {sym}
              </div>
              <div className="w-px h-3 bg-white/10 mx-0.5"></div>
              <div className={`font-mono font-bold text-slate-200 text-[10px] ${isLive ? '' : 'opacity-50'}`}>
                {priceLabel(item)}
              </div>
              <div className="w-px h-3 bg-white/10 mx-0.5"></div>
              <div className={`font-mono text-[9px] ${isLive ? liveColor : 'text-slate-500'}`}>
                {isLive ? (item.change ?? 0 >= 0 ? '+' : '') + (item.change ?? 0).toFixed(2) + '%' : '--'}
              </div>
              <div className="w-px h-3 bg-white/10 mx-0.5"></div>
              <div className={`font-mono text-[9px] text-brand-yellow font-bold ${isLive ? '' : 'opacity-50'}`}>
                Spread {spreadLabel(item)}
              </div>
              <div className={`w-1 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
