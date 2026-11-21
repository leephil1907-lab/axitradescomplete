import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, ChevronDown, Clock, Coins, DollarSign, Globe, Landmark, ShieldCheck,
  TrendingUp, TrendingDown, Wallet, Zap, X, CheckCircle2, AlertCircle, RefreshCw,
  Search, Filter, List, BarChart3
} from 'lucide-react';
import { MarketQuote, ViewType } from '../types';
import AssetBrandLogo from './AssetBrandLogo';

export interface SpotInstrument {
  symbol: string;
  name: string;
  category: 'crypto' | 'forex' | 'commodity' | 'index' | 'stock';
  color: string;
  minOrder: number;
  icon?: string;
}

const SPOT_CRYPTO_INSTRUMENTS: SpotInstrument[] = [
  { symbol: 'BTCUSD', name: 'Bitcoin', category: 'crypto', color: '#F7931A', minOrder: 0.0001, icon: '₿' },
  { symbol: 'ETHUSD', name: 'Ethereum', category: 'crypto', color: '#627EEA', minOrder: 0.001, icon: 'Ξ' },
  { symbol: 'SOLUSD', name: 'Solana', category: 'crypto', color: '#00FF87', minOrder: 0.01, icon: '◎' },
  { symbol: 'XRPUSD', name: 'XRP', category: 'crypto', color: '#23292F', minOrder: 1, icon: '✦' },
  { symbol: 'DOGEUSD', name: 'Dogecoin', category: 'crypto', color: '#C2A633', minOrder: 10, icon: 'Ð' },
  { symbol: 'ADAUSD', name: 'Cardano', category: 'crypto', color: '#0033AD', minOrder: 1, icon: '◈' },
  { symbol: 'AVAXUSD', name: 'Avalanche', category: 'crypto', color: '#EB6925', minOrder: 0.01, icon: '🏔️' },
  { symbol: 'LINKUSD', name: 'Chainlink', category: 'crypto', color: '#24292E', minOrder: 0.1, icon: '🔗' },
  { symbol: 'BNBUSD', name: 'BNB', category: 'crypto', color: '#F3BA2F', minOrder: 0.01, icon: 'bnb' },
  { symbol: 'DOTUSD', name: 'Polkadot', category: 'crypto', color: '#E6007A', minOrder: 0.1, icon: '•' },
  { symbol: 'LTCUSD', name: 'Litecoin', category: 'crypto', color: '#B6B7BC', minOrder: 0.01, icon: 'Ł' },
  { symbol: 'TRXUSD', name: 'TRON', category: 'crypto', color: '#23292F', minOrder: 10, icon: '✦' },
  { symbol: 'TONUSD', name: 'Toncoin', category: 'crypto', color: '#0088CC', minOrder: 0.1, icon: '💎' },
  { symbol: 'NEARUSD', name: 'NEAR Protocol', category: 'crypto', color: '#FFFFFF', minOrder: 1, icon: '⧗' },
  { symbol: 'SUIUSD', name: 'Sui', category: 'crypto', color: '#000000', minOrder: 1, icon: '👁️' },
  { symbol: 'SHIBUSD', name: 'Shiba Inu', category: 'crypto', color: '#F39C12', minOrder: 100000, icon: '🐕' },
  { symbol: 'PEPEUSD', name: 'Pepe', category: 'crypto', color: '#3A3A3A', minOrder: 1000000, icon: '🐸' },
  { symbol: 'MATICUSD', name: 'Polygon', category: 'crypto', color: '#8247E5', minOrder: 1, icon: '△' },
];

const SPOT_FOREX_INSTRUMENTS: SpotInstrument[] = [
  { symbol: 'EURUSD', name: 'EUR / USD', category: 'forex', color: '#003399', minOrder: 0.01 },
  { symbol: 'GBPUSD', name: 'GBP / USD', category: 'forex', color: '#012169', minOrder: 0.01 },
  { symbol: 'USDJPY', name: 'USD / JPY', category: 'forex', color: '#BC002D', minOrder: 0.01 },
  { symbol: 'AUDUSD', name: 'AUD / USD', category: 'forex', color: '#00008B', minOrder: 0.01 },
  { symbol: 'USDCAD', name: 'USD / CAD', category: 'forex', color: '#D80027', minOrder: 0.01 },
  { symbol: 'USDCHF', name: 'USD / CHF', category: 'forex', color: '#D52B1E', minOrder: 0.01 },
  { symbol: 'NZDUSD', name: 'NZD / USD', category: 'forex', color: '#00247D', minOrder: 0.01 },
  { symbol: 'EURGBP', name: 'EUR / GBP', category: 'forex', color: '#1e293b', minOrder: 0.01 },
  { symbol: 'EURJPY', name: 'EUR / JPY', category: 'forex', color: '#003399', minOrder: 0.01 },
  { symbol: 'GBPJPY', name: 'GBP / JPY', category: 'forex', color: '#012169', minOrder: 0.01 },
];

const SPOT_COMMODITY_INSTRUMENTS: SpotInstrument[] = [
  { symbol: 'XAUUSD', name: 'Gold', category: 'commodity', color: '#eab308', minOrder: 0.01 },
  { symbol: 'XAGUSD', name: 'Silver', category: 'commodity', color: '#a1a1aa', minOrder: 0.1 },
  { symbol: 'USOUSD', name: 'WTI Crude Oil', category: 'commodity', color: '#713f12', minOrder: 0.1 },
  { symbol: 'BRENTUSD', name: 'Brent Crude Oil', category: 'commodity', color: '#713f12', minOrder: 0.1 },
  { symbol: 'NATGAS', name: 'Natural Gas', category: 'commodity', color: '#87CEEB', minOrder: 0.1 },
];

const SPOT_INDEX_INSTRUMENTS: SpotInstrument[] = [
  { symbol: 'US30', name: 'US 30', category: 'index', color: '#f59e0b', minOrder: 0.1 },
  { symbol: 'SPX500', name: 'S&P 500', category: 'index', color: '#f59e0b', minOrder: 0.1 },
  { symbol: 'NAS100', name: 'Nasdaq 100', category: 'index', color: '#f59e0b', minOrder: 0.1 },
  { symbol: 'UK100', name: 'UK 100', category: 'index', color: '#f59e0b', minOrder: 0.1 },
  { symbol: 'GER40', name: 'Germany 40', category: 'index', color: '#f59e0b', minOrder: 0.1 },
];

const SPOT_STOCK_INSTRUMENTS: SpotInstrument[] = [
  { symbol: 'AAPL', name: 'Apple Inc', category: 'stock', color: '#6366f1', minOrder: 0.01 },
  { symbol: 'TSLA', name: 'Tesla Inc', category: 'stock', color: '#ea0000', minOrder: 0.01 },
  { symbol: 'NVDA', name: 'NVIDIA Corp', category: 'stock', color: '#76b900', minOrder: 0.01 },
  { symbol: 'MSFT', name: 'Microsoft Corp', category: 'stock', color: '#00a4ef', minOrder: 0.01 },
  { symbol: 'AMZN', name: 'Amazon.com Inc', category: 'stock', color: '#ff9900', minOrder: 0.01 },
  { symbol: 'GOOGL', name: 'Alphabet Inc', category: 'stock', color: '#4285f4', minOrder: 0.01 },
  { symbol: 'META', name: 'Meta Platforms', category: 'stock', color: '#1877f2', minOrder: 0.01 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', category: 'stock', color: '#ed3833', minOrder: 0.01 },
  { symbol: 'NFLX', name: 'Netflix Inc', category: 'stock', color: '#e50914', minOrder: 0.01 },
  { symbol: 'COIN', name: 'Coinbase Global', category: 'stock', color: '#00a4ef', minOrder: 0.01 },
];

const ALL_SPOT_INSTRUMENTS = [
  ...SPOT_CRYPTO_INSTRUMENTS,
  ...SPOT_FOREX_INSTRUMENTS,
  ...SPOT_COMMODITY_INSTRUMENTS,
  ...SPOT_INDEX_INSTRUMENTS,
  ...SPOT_STOCK_INSTRUMENTS,
];

const CATEGORY_COLORS: Record<string, string> = {
  crypto: '#F7931A',
  forex: '#003399',
  commodity: '#eab308',
  index: '#f59e0b',
  stock: '#6366f1',
};

export default function SpotCryptoView({ quotes, setView, user }: { quotes: Record<string, MarketQuote>; setView: (view: ViewType) => void; user?: any }) {
  const [category, setCategory] = useState<'all' | 'crypto' | 'forex' | 'commodity' | 'index' | 'stock'>('all');
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD');
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<{ symbol: string; type: string; amount: number; price: number; total: number; txId: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const instruments = useMemo(() => {
    let filtered = ALL_SPOT_INSTRUMENTS;
    if (category !== 'all') {
      filtered = filtered.filter(i => i.category === category);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toUpperCase().trim();
      filtered = filtered.filter(i =>
        i.symbol.includes(q) ||
        i.name.toUpperCase().includes(q)
      );
    }
    return filtered;
  }, [category, searchQuery]);

  const quote = quotes[selectedSymbol];
  const price = quote?.price || 0;
  const inst = instruments.find(i => i.symbol === selectedSymbol) || SPOT_CRYPTO_INSTRUMENTS[0];

  useEffect(() => {
    if (amount && price > 0) {
      setCryptoAmount((parseFloat(amount) / price).toFixed(8));
    } else {
      setCryptoAmount('');
    }
  }, [amount, price]);

  useEffect(() => {
    if (cryptoAmount && price > 0) {
      setAmount((parseFloat(cryptoAmount) * price).toFixed(2));
    } else {
      setAmount('');
    }
  }, [cryptoAmount, price]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    const cryptoAmt = parseFloat(cryptoAmount);
    if (!amt || amt <= 0 || !price || price <= 0) return;
    setOrderProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    const txId = `SPOT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrderConfirmed({
      symbol: selectedSymbol,
      type: action.toUpperCase(),
      amount: cryptoAmt,
      price,
      total: amt,
      txId
    });
    setOrderProcessing(false);
  };

  const formatPrice = (symbol: string, p: number) => {
    if (symbol === 'BTCUSD') return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (symbol === 'JPY' || symbol === 'USDJPY' || symbol === 'EURJPY' || symbol === 'GBPJPY') return p.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    if (symbol === 'SHIBUSD' || symbol === 'PEPEUSD') return p.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 });
    if (symbol === 'XAUUSD' || symbol === 'XAGUSD') return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1000) return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return p.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  };

  const categoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      crypto: 'Cryptocurrencies',
      forex: 'Forex Pairs',
      commodity: 'Commodities',
      index: 'Global Indices',
      stock: 'Stocks & ETFs',
    };
    return labels[cat] || cat;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-[#F7931A] to-[#E8B93A] rounded-3xl p-8 sm:p-12 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-[#F7931A]" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Spot Markets</h2>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-100 text-xs font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Spot Prices
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Trade 650+ Spot Instruments</h1>
            <p className="text-lg text-orange-100 max-w-xl">
              Buy and sell cryptocurrencies, forex, commodities, indices, and stocks at live market prices.
              All quotes stream directly from Kraken, Coinbase, Yahoo Finance, and interbank FX feeds — no synthetic prices.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => setView('funds')}
                className="bg-white text-[#F7931A] font-black px-8 py-4 rounded-xl text-lg uppercase tracking-wider shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer flex items-center gap-2"
              >
                <DollarSign className="w-5 h-5" /> Fund Your Account
              </button>
              <button
                onClick={() => setView('accounts')}
                className="bg-white/10 border border-white/20 text-white font-black px-8 py-4 rounded-xl text-lg uppercase tracking-wider hover:bg-white/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <Wallet className="w-5 h-5" /> Open Spot Account
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter + Search */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { key: 'all', label: 'All Markets' },
              { key: 'crypto', label: 'Crypto' },
              { key: 'forex', label: 'Forex' },
              { key: 'commodity', label: 'Commodities' },
              { key: 'index', label: 'Indices' },
              { key: 'stock', label: 'Stocks' },
            ].map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key as any)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                  category === c.key
                    ? 'bg-[#F7931A] text-white border-[#F7931A] shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {categoryLabel(c.key)}
              </button>
            ))}
          </div>

          <div className="relative flex-1 lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symbol or instrument…"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-slate-900 focus:border-[#F7931A] focus:ring-2 focus:ring-[#F7931A]/20 outline-none text-sm"
            />
          </div>

          <button
            onClick={() => setView('perpetual_futures')}
            className="bg-[#0f172a] text-white font-black px-6 py-3 rounded-xl text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition cursor-pointer flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" /> Trade Perpetual Futures
          </button>
        </div>

        {/* Market Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Live Instruments', value: instruments.length.toLocaleString() },
            { label: 'Asset Classes', value: '5' },
            { label: 'Price Sources', value: '4' },
            { label: 'Market Status', value: 'Open' },
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">{stat.label}</div>
              <div className="text-2xl font-black text-slate-900">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Order Panel + Market List */}
        <div className="grid gap-8 lg:grid-cols-12">

          {/* LEFT: Order Entry Panel */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-900 text-lg">{action === 'buy' ? 'Buy' : 'Sell'} {inst.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAction('buy')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      action === 'buy' ? 'bg-[#F7931A] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >Buy</button>
                  <button
                    onClick={() => setAction('sell')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      action === 'sell' ? 'bg-[#F7931A] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >Sell</button>
                </div>
              </div>

              <div className="space-y-5">
                {/* Asset Selector - compact list */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">Instrument</label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {instruments.slice(0, 12).map((c) => {
                      const q = quotes[c.symbol];
                      const p = q?.price || 0;
                      const change = q?.change || 0;
                      const isPositive = change >= 0;
                      return (
                        <button
                          key={c.symbol}
                          onClick={() => { setSelectedSymbol(c.symbol); setCategory(c.category as any); }}
                          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${
                            selectedSymbol === c.symbol
                              ? 'bg-[#F7931A]/10 text-[#F7931A] border-[#F7931A] shadow-md'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <AssetBrandLogo symbol={c.symbol} size="sm" className="shrink-0" />
                            <span className="truncate min-w-[60px]">{c.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">{c.symbol}</span>
                          </div>
                          <div className="text-right">
                            <div className={`font-mono font-bold text-xs ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {p > 0 ? formatPrice(c.symbol, p) : '—'}
                            </div>
                            <div className={`text-[10px] ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {p > 0 ? (isPositive ? '+' : '') + change.toFixed(2) + '%' : '—'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Display */}
                <div className="flex items-end justify-between bg-slate-50 rounded-xl p-4">
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase">Market Price</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 font-mono">{price > 0 ? formatPrice(selectedSymbol, price) : '...'}</span>
                      <span className="text-[#F7931A] font-black text-xs">USD</span>
                    </div>
                  </div>
                  <span className={`text-xs font-black ${price > 0 ? (quote?.change || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600' : 'text-slate-400'}`}>
                    {price > 0 ? ((quote?.change || 0) >= 0 ? '▲' : '▼') : '–'} Live
                  </span>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">
                    {action === 'buy' ? 'Amount to Spend (USD)' : 'Amount to Sell'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount || cryptoAmount || ''}
                    onChange={(e) => {
                      if (action === 'buy') setAmount(e.target.value);
                      else setCryptoAmount(e.target.value);
                    }}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-mono text-slate-900 focus:border-[#F7931A] focus:ring-2 focus:ring-[#F7931A]/20 outline-none"
                  />
                </div>

                {/* Estimated Receive */}
                {amount && price > 0 && (
                  <div className="flex items-end justify-between bg-[#F7931A]/10 border border-[#F7931A]/20 rounded-xl p-4">
                    <div>
                      <span className="text-xs font-black text-[#F7931A]/70 uppercase">You Will Receive</span>
                      <div className="text-2xl font-black text-slate-900 font-mono mt-1">{cryptoAmount || 0} {inst.symbol}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-[#F7931A]/70 uppercase">Effective Rate</span>
                      <div className="text-lg font-bold text-[#F7931A] font-mono mt-1">${price.toFixed(2)}</div>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePlaceOrder} className="pt-2">
                  <button
                    type="submit"
                    disabled={orderProcessing || !amount || parseFloat(amount) <= 0 || !price}
                    className={`w-full py-4 rounded-xl text-lg font-black uppercase tracking-wider transition-all disabled:opacity-50 ${
                      orderProcessing
                        ? 'bg-slate-400 text-white cursor-not-allowed'
                        : 'bg-[#F7931A] text-white shadow-lg hover:bg-[#E89B2F] hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer'
                    }`}
                  >
                    {orderProcessing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Executing Order…
                      </>
                    ) : action === 'buy' ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" /> Buy Now
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-5 h-5 mr-2" /> Sell Now
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#F7931A]" /> How Spot Trading Works
              </h3>
              <ol className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">1</span> Select your instrument from any asset class.</li>
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">2</span> Choose Buy or Sell and enter your amount.</li>
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">3</span> Confirm — your order executes at live market prices.</li>
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">4</span> Your position appears in the trading dashboard.</li>
              </ol>
            </div>
          </div>

          {/* RIGHT: Market List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-lg">{categoryLabel(category)} — Live Spot Prices</h3>
                <p className="text-xs text-slate-500">All prices stream from live market providers</p>
              </div>
              <button onClick={() => setView('markets')} className="text-xs font-black text-[#F7931A] hover:text-orange-600 transition">Full Markets Terminal →</button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Instrument</th>
                    <th className="px-6 py-4 text-right">Price (USD)</th>
                    <th className="px-6 py-4 text-right">24h Change</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {instruments.map((c) => {
                    const q = quotes[c.symbol];
                    const p = q?.price || 0;
                    const change = q?.change || 0;
                    const isPositive = change >= 0;
                    const isStale = q?.stale !== false;
                    return (
                      <motion.tr
                        key={c.symbol}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => { setSelectedSymbol(c.symbol); setCategory(c.category as any); }}
                        className={`cursor-pointer transition hover:bg-slate-50 border-b border-slate-50/50 last:border-0 ${
                          selectedSymbol === c.symbol ? 'bg-[#F7931A]/5' : ''
                        } ${isStale ? 'opacity-50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <AssetBrandLogo symbol={c.symbol} size="sm" className="shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                              <div className="text-xs text-slate-500 font-mono">{c.symbol}</div>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                isStale ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {isStale ? 'Stale' : 'Live'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          {p > 0 ? formatPrice(c.symbol, p) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {isPositive ? '+' : ''}{change.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => { setSelectedSymbol(c.symbol); setCategory(c.category as any); setAction('buy'); }}
                            className="text-xs font-black text-[#F7931A] hover:text-orange-600 transition"
                          >Trade</button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Risk Disclosure */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-sm text-amber-900 mb-1">Risk Warning</h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Spot trading prices can be extremely volatile. You may lose some or all of your invested capital.
                    All prices are sourced from live market data providers and may vary slightly from execution prices.
                    Past performance is not indicative of future results.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Confirmation Modal */}
        {orderConfirmed && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl max-w-md w-full border border-slate-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-slate-900 text-lg">Order Confirmed ✓</h3>
                  <button onClick={() => setOrderConfirmed(null)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Transaction ID</span>
                    <span className="text-xs font-mono text-slate-900">{orderConfirmed.txId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Instrument</span>
                    <span className="text-sm font-bold text-slate-900">{orderConfirmed.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Side</span>
                    <span className={`text-sm font-bold ${orderConfirmed.type === 'BUY' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {orderConfirmed.type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Amount</span>
                    <span className="text-sm font-bold text-slate-900">{orderConfirmed.amount.toFixed(6)} {orderConfirmed.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Price</span>
                    <span className="text-sm font-bold text-slate-900">${orderConfirmed.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Total Value</span>
                    <span className="text-sm font-black text-slate-900">${orderConfirmed.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setOrderConfirmed(null);
                    setView('dashboard');
                  }}
                  className="w-full py-3.5 rounded-xl bg-[#F7931A] text-white font-black uppercase tracking-wider shadow-lg hover:bg-[#E89B2F] transition cursor-pointer"
                >
                  View in Dashboard
                </button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
