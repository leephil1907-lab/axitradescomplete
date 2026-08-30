import React, { useEffect, useState } from 'react';
import { RefreshCw, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import AssetBrandLogo from './AssetBrandLogo';

interface MarketRow {
  symbol: string;
  name: string;
  category: string;
  price: number;
  change24h: number;
  status: 'live' | 'stale' | 'unavailable';
  source?: string;
  lastUpdated?: number;
}

const SYMBOLS: Array<{ symbol: string; name: string; category: string }> = [
  { symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'Forex' },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', category: 'Forex' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'Forex' },
  { symbol: 'XAUUSD', name: 'Gold Spot USD', category: 'Commodities' },
  { symbol: 'USOUSD', name: 'WTI Crude Oil', category: 'Commodities' },
  { symbol: 'BTCUSD', name: 'Bitcoin CFD', category: 'Crypto' },
  { symbol: 'ETHUSD', name: 'Ethereum CFD', category: 'Crypto' },
  { symbol: 'SOLUSD', name: 'Solana CFD', category: 'Crypto' },
  { symbol: 'US30', name: 'Dow Jones Index CFD', category: 'Indices' },
  { symbol: 'NVDA', name: 'NVIDIA Share CFD', category: 'Shares' },
  { symbol: 'TSLA', name: 'Tesla Share CFD', category: 'Shares' },
  { symbol: 'AAPL', name: 'Apple Share CFD', category: 'Shares' }
];

interface Props {
  accountMode?: 'demo' | 'live';
  onTradeSymbol?: (symbol: string) => void;
}

export default function MarketSentimentWidget({ accountMode = 'live', onTradeSymbol }: Props) {
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    try {
      setError(false);
      const res = await fetch('/api/markets/quotes', { cache: 'no-store' });
      if (!res.ok) throw new Error('Market feed unavailable');
      const quotes = await res.json();
      setRows(SYMBOLS.map(meta => {
        const q = quotes?.[meta.symbol];
        const status = q?.status === 'live' ? 'live' : q?.stale ? 'stale' : 'unavailable';
        return {
          ...meta,
          price: typeof q?.price === 'number' ? q.price : 0,
          change24h: typeof q?.change === 'number' ? q.change : 0,
          status,
          source: q?.source,
          lastUpdated: q?.lastUpdated
        };
      }));
    } catch {
      setError(true);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 10_000);
    return () => clearInterval(timer);
  }, []);

  const filtered = filter === 'ALL' ? rows : rows.filter(row => row.category === filter);

  return (
    <div className={`rounded-2xl border p-5 shadow-xs ${accountMode === 'demo' ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold tracking-tight">Market Data</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">Provider-sourced prices only. Client positioning and order counts are not fabricated.</p>
        </div>
        <button type="button" onClick={() => void load()} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Refresh market data">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {['ALL', 'Forex', 'Commodities', 'Crypto', 'Indices', 'Shares'].map(cat => (
          <button key={cat} type="button" onClick={() => setFilter(cat)} className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold ${filter === cat ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>
            {cat}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4" /> Market provider unavailable. No synthetic prices are displayed.
        </div>
      )}

      {loading ? <div className="p-6 text-center text-xs text-slate-500">Loading verified market data…</div> : (
        <div className="space-y-2">
          {filtered.map(row => {
            const live = row.status === 'live' && row.price > 0;
            return (
              <div key={row.symbol} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AssetBrandLogo symbol={row.symbol} size="sm" />
                    <div>
                      <div className="flex items-center gap-2"><span className="text-sm font-black">{row.symbol}</span><span className="text-[10px] font-semibold opacity-60">{row.name}</span></div>
                      <div className="mt-0.5 text-[11px] font-mono">
                        {live ? <><span className="font-bold">${row.price > 10 ? row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : row.price.toFixed(5)}</span><span className={`ml-2 font-bold ${row.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{row.change24h >= 0 ? <ArrowUpRight className="inline h-3 w-3" /> : <ArrowDownRight className="inline h-3 w-3" />}{row.change24h >= 0 ? '+' : ''}{row.change24h.toFixed(2)}%</span></> : <span className="font-bold text-slate-400">Unavailable</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase ${live ? 'text-emerald-600' : 'text-slate-400'}`}>{live ? 'Live' : row.status}</span>
                    {onTradeSymbol && live && <button type="button" onClick={() => onTradeSymbol(row.symbol)} className="rounded-lg bg-[#E3000F] px-3 py-1.5 text-xs font-extrabold text-white">Trade</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
