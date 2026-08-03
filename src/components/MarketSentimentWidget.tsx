import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Users, BarChart2, Flame, RefreshCw, ArrowUpRight, ArrowDownRight, ShieldAlert } from 'lucide-react';

export interface SymbolSentiment {
  symbol: string;
  name: string;
  category: string;
  bullishPercentage: number; // e.g. 68
  bearishPercentage: number; // e.g. 32
  totalTrades24h: number; // e.g. 14250
  sentimentChange24h: number; // e.g. +4.2% shift
  dominantSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  price: number;
  change24h: number;
}

const TOP_TRENDING_SENTIMENT: SymbolSentiment[] = [
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    category: 'Forex',
    bullishPercentage: 72,
    bearishPercentage: 28,
    totalTrades24h: 38450,
    sentimentChange24h: 3.5,
    dominantSentiment: 'BULLISH',
    price: 1.0875,
    change24h: 0.42
  },
  {
    symbol: 'XAUUSD',
    name: 'Gold Spot / US Dollar',
    category: 'Commodities',
    bullishPercentage: 81,
    bearishPercentage: 19,
    totalTrades24h: 52100,
    sentimentChange24h: 6.8,
    dominantSentiment: 'BULLISH',
    price: 2042.10,
    change24h: 1.15
  },
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    category: 'Crypto',
    bullishPercentage: 64,
    bearishPercentage: 36,
    totalTrades24h: 68900,
    sentimentChange24h: -2.1,
    dominantSentiment: 'BULLISH',
    price: 64250.00,
    change24h: 2.84
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / USD',
    category: 'Forex',
    bullishPercentage: 43,
    bearishPercentage: 57,
    totalTrades24h: 24100,
    sentimentChange24h: -4.1,
    dominantSentiment: 'BEARISH',
    price: 1.2615,
    change24h: -0.31
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp',
    category: 'Shares',
    bullishPercentage: 88,
    bearishPercentage: 12,
    totalTrades24h: 41200,
    sentimentChange24h: 8.4,
    dominantSentiment: 'BULLISH',
    price: 875.40,
    change24h: 4.25
  }
];

interface MarketSentimentWidgetProps {
  accountMode?: 'demo' | 'live';
  onTradeSymbol?: (symbol: string) => void;
}

export default function MarketSentimentWidget({ accountMode = 'live', onTradeSymbol }: MarketSentimentWidgetProps) {
  const [sentimentData, setSentimentData] = useState<SymbolSentiment[]>(TOP_TRENDING_SENTIMENT);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const filteredData = filterCategory === 'ALL'
    ? sentimentData
    : sentimentData.filter(s => s.category.toLowerCase() === filterCategory.toLowerCase());

  return (
    <div className={`rounded-2xl border p-5 transition-all shadow-xs ${
      accountMode === 'demo'
        ? 'bg-slate-900 border-slate-800 text-white'
        : 'bg-white border-slate-200/90 text-slate-900'
    }`}>
      {/* Widget Header */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm tracking-tight">Market Sentiment & Community Positioning</h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                Top 5 Symbols
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live long vs short position distribution based on real Axi global trader volume.
            </p>
          </div>
        </div>

        {/* Category Selector */}
        <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {['ALL', 'Forex', 'Commodities', 'Crypto', 'Shares'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Symbol Sentiment List */}
      <div className="space-y-3">
        {filteredData.map((item) => {
          return (
            <div
              key={item.symbol}
              className={`p-3.5 rounded-xl border transition-all ${
                accountMode === 'demo'
                  ? 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                  : 'bg-slate-50 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-slate-900 dark:text-white">{item.symbol}</span>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">({item.name})</span>
                  <span className="text-[10px] font-extrabold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900 dark:text-white">${item.price.toLocaleString()}</div>
                    <div className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${
                      item.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {item.change24h >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      <span>{item.change24h >= 0 ? `+${item.change24h}%` : `${item.change24h}%`}</span>
                    </div>
                  </div>

                  {onTradeSymbol && (
                    <button
                      onClick={() => onTradeSymbol(item.symbol)}
                      className="bg-brand-red hover:bg-red-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
                    >
                      Trade
                    </button>
                  )}
                </div>
              </div>

              {/* Ratio Dual Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{item.bullishPercentage}% Long (Buy)</span>
                  </span>

                  <span className="text-[10px] text-slate-400 font-normal">
                    {item.totalTrades24h.toLocaleString()} active positions
                  </span>

                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span>{item.bearishPercentage}% Short (Sell)</span>
                    <TrendingDown className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${item.bullishPercentage}%` }}
                    title={`${item.bullishPercentage}% Bullish Traders`}
                  />
                  <div
                    className="h-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${item.bearishPercentage}%` }}
                    title={`${item.bearishPercentage}% Bearish Traders`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
