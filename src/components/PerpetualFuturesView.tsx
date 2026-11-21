import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, ChevronDown, Clock, Coins, DollarSign, Globe, Landmark, ShieldCheck,
  TrendingUp, TrendingDown, Wallet, Zap, X, CheckCircle2, RefreshCw, Percent,
  Monitor, Link, Banknote
} from 'lucide-react';
import { MarketQuote, ViewType } from '../types';
import AssetBrandLogo from './AssetBrandLogo';

const PERP_INSTRUMENTS = [
  { symbol: 'BTCUSD', name: 'Bitcoin Perpetual', leverage: '1:125', fee: '0.035%', color: '#F7931A' },
  { symbol: 'ETHUSD', name: 'Ethereum Perpetual', leverage: '1:100', fee: '0.035%', color: '#627EEA' },
  { symbol: 'SOLUSD', name: 'Solana Perpetual', leverage: '1:50', fee: '0.035%', color: '#00FF87' },
  { symbol: 'XRPUSD', name: 'XRP Perpetual', leverage: '1:50', fee: '0.035%', color: '#23292F' },
  { symbol: 'DOGEUSD', name: 'Dogecoin Perpetual', leverage: '1:50', fee: '0.035%', color: '#C2A633' },
  { symbol: 'ADAUSD', name: 'Cardano Perpetual', leverage: '1:50', fee: '0.035%', color: '#0033AD' },
  { symbol: 'AVAXUSD', name: 'Avalanche Perpetual', leverage: '1:50', fee: '0.035%', color: '#EB6925' },
  { symbol: 'LINKUSD', name: 'Chainlink Perpetual', leverage: '1:50', fee: '0.035%', color: '#24292E' },
  { symbol: 'BNBUSD', name: 'BNB Perpetual', leverage: '1:50', fee: '0.035%', color: '#F3BA2F' },
  { symbol: 'DOTUSD', name: 'Polkadot Perpetual', leverage: '1:50', fee: '0.035%', color: '#E6007A' },
  { symbol: 'LTCUSD', name: 'Litecoin Perpetual', leverage: '1:50', fee: '0.035%', color: '#B6B7BC' },
  { symbol: 'EURUSD', name: 'EUR/USD Perpetual', leverage: '1:100', fee: '0.01%', color: '#10b981' },
  { symbol: 'GBPUSD', name: 'GBP/USD Perpetual', leverage: '1:100', fee: '0.01%', color: '#10b981' },
  { symbol: 'USDJPY', name: 'USD/JPY Perpetual', leverage: '1:100', fee: '0.01%', color: '#BC002D' },
  { symbol: 'AUDUSD', name: 'AUD/USD Perpetual', leverage: '1:100', fee: '0.01%', color: '#00008B' },
  { symbol: 'US30', name: 'US 30 Perpetual', leverage: '1:50', fee: '0.02%', color: '#f59e0b' },
  { symbol: 'SPX500', name: 'S&P 500 Perpetual', leverage: '1:50', fee: '0.02%', color: '#f59e0b' },
  { symbol: 'NAS100', name: 'Nasdaq 100 Perpetual', leverage: '1:50', fee: '0.02%', color: '#f59e0b' },
  { symbol: 'UK100', name: 'UK 100 Perpetual', leverage: '1:50', fee: '0.02%', color: '#f59e0b' },
  { symbol: 'GER40', name: 'Germany 40 Perpetual', leverage: '1:50', fee: '0.02%', color: '#f59e0b' },
  { symbol: 'XAUUSD', name: 'Gold Perpetual', leverage: '1:200', fee: '0.015%', color: '#eab308' },
  { symbol: 'XAGUSD', name: 'Silver Perpetual', leverage: '1:100', fee: '0.015%', color: '#a1a1aa' },
  { symbol: 'USOUSD', name: 'Crude Oil Perpetual', leverage: '1:50', fee: '0.02%', color: '#713f12' },
];

export default function PerpetualFuturesView({ quotes, setView, user }: { quotes: Record<string, MarketQuote>; setView: (view: ViewType) => void; user?: any }) {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD');
  const [positionType, setPositionType] = useState<'long' | 'short'>('long');
  const [leverage, setLeverage] = useState(10);
  const [notional, setNotional] = useState('1000');
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<{ symbol: string; type: string; size: number; leverage: number; entryPrice: number; liquidationPrice: number; margin: number; txId: string } | null>(null);

  const quote = quotes[selectedSymbol];
  const price = quote?.price || 0;
  const inst = PERP_INSTRUMENTS.find(i => i.symbol === selectedSymbol);

  const maxLeverage = useMemo(() => {
    const l = inst?.leverage || '1:50';
    return parseInt(l.split(':')[1] || '50');
  }, [inst]);

  useEffect(() => {
    if (leverage > maxLeverage) setLeverage(maxLeverage);
  }, [leverage, maxLeverage]);

  const marginRequired = useMemo(() => {
    const n = parseFloat(notional) || 0;
    return n / leverage;
  }, [notional, leverage]);

  const liquidationPrice = useMemo(() => {
    if (!price || leverage <= 0) return 0;
    const maintenanceMargin = 0.004; // 0.4% maintenance
    if (positionType === 'long') {
      return price * (1 - (1 / leverage) + maintenanceMargin);
    }
    return price * (1 + (1 / leverage) - maintenanceMargin);
  }, [price, leverage, positionType]);

  const estimatedPnL = useMemo(() => {
    const n = parseFloat(notional) || 0;
    const priceChange = positionType === 'long' ? (quote?.change || 0) / 100 : -(quote?.change || 0) / 100;
    return n * priceChange * leverage;
  }, [notional, leverage, positionType, quote?.change]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(notional);
    if (!n || n <= 0 || !price || price <= 0) return;
    setOrderProcessing(true);
    await new Promise(r => setTimeout(r, 1200));
    const txId = `PERP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrderConfirmed({
      symbol: selectedSymbol,
      type: positionType.toUpperCase(),
      size: n,
      leverage,
      entryPrice: price,
      liquidationPrice: liquidationPrice || 0,
      margin: marginRequired,
      txId
    });
    setOrderProcessing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-[#0f172a] rounded-3xl p-8 sm:p-12 text-white overflow-hidden relative border border-slate-800/50">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-[#F7931A]/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#F7931A]/20 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-[#F7931A]" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Perpetual Futures</h2>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F7931A]/20 text-[#F7931A] text-xs font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F7931A] animate-pulse" /> 24/7 • No Expiry
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Trade Perpetuals on Traditional Markets</h1>
            <p className="text-lg text-slate-300 max-w-xl">
              Go long or short on crypto, forex, indices and commodities with perpetual futures — no expiry date, no rollover fees,
              and up to 1:125 leverage. Use your existing Axi account with taker fees from 0.035%.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => setView('funds')}
                className="bg-[#F7931A] text-white font-black px-8 py-4 rounded-xl text-lg uppercase tracking-wider shadow-lg hover:shadow-orange-500/30 transition-all transform hover:-translate-y-1 cursor-pointer flex items-center gap-2"
              >
                <DollarSign className="w-5 h-5" /> Fund Your Account
              </button>
              <button
                onClick={() => setView('accounts')}
                className="bg-white/10 border border-white/20 text-white font-black px-8 py-4 rounded-xl text-lg uppercase tracking-wider hover:bg-white/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <Wallet className="w-5 h-5" /> Open Futures Account
              </button>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'No Expiry', desc: 'Hold positions indefinitely with no rollover', icon: Clock },
            { label: 'Up to 1:125', desc: 'Leverage on BTC and ETH perps', icon: Percent },
            { label: '0.035% Taker Fee', desc: 'Industry-leading low fees', icon: Banknote },
            { label: '24/7 Markets', desc: 'Trade crypto perps around the clock', icon: Globe },
          ].map((feature, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-[#F7931A]/10 text-[#F7931A] flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900">{feature.label}</h3>
              <p className="text-sm text-slate-500 mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Trading Panel */}
        <div className="grid gap-8 lg:grid-cols-12">

          {/* LEFT: Order Entry */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-900 text-lg">Open Position</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPositionType('long')}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      positionType === 'long' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >Long (Buy)</button>
                  <button
                    onClick={() => setPositionType('short')}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      positionType === 'short' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >Short (Sell)</button>
                </div>
              </div>

              <div className="space-y-5">
                {/* Asset Selector */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">Instrument</label>
                  <div className="flex flex-wrap gap-2">
                    {PERP_INSTRUMENTS.map((c) => (
                      <button
                        key={c.symbol}
                        onClick={() => setSelectedSymbol(c.symbol)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                          selectedSymbol === c.symbol
                            ? 'bg-[#F7931A]/10 text-[#F7931A] border-[#F7931A] shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px]`}>
                          {c.symbol.replace(/USD$/, '').slice(0, 2)}
                        </span>
                        {c.name.replace(' Perpetual', '')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-end justify-between bg-slate-50 rounded-xl p-4">
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase">Mark Price</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 font-mono">{price > 0 ? price.toLocaleString(undefined, { minimumFractionDigits: selectedSymbol.includes('BTC') ? 2 : 4 }) : '...'}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-black ${price > 0 ? (quote?.change || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600' : 'text-slate-400'}`}>
                    {price > 0 ? (quote?.change || 0) >= 0 ? '▲' : '▼' : '–'} Live
                  </span>
                </div>

                {/* Notional Size */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">Position Size (USD)</label>
                  <input
                    type="number"
                    step="100"
                    value={notional}
                    onChange={(e) => setNotional(e.target.value)}
                    placeholder="1,000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-mono text-slate-900 focus:border-[#F7931A] focus:ring-2 focus:ring-[#F7931A]/20 outline-none"
                  />
                </div>

                {/* Leverage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">Leverage</label>
                    <span className="text-xs font-bold text-[#F7931A]">{leverage}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={maxLeverage}
                    value={leverage}
                    onChange={(e) => setLeverage(parseInt(e.target.value))}
                    className="w-full accent-[#F7931A] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Risk Metrics */}
                <div className="grid gap-3">
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                    <span className="text-xs text-slate-500">Margin Required</span>
                    <span className="text-sm font-mono font-bold text-slate-900">${marginRequired.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                    <span className="text-xs text-slate-500">Liquidation Price</span>
                    <span className="text-sm font-mono font-bold text-rose-600">{liquidationPrice > 0 ? liquidationPrice.toFixed(4) : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                    <span className="text-xs text-slate-500">Est. P/L (24h)</span>
                    <span className={`text-sm font-mono font-bold ${estimatedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {estimatedPnL >= 0 ? '+' : ''}$${estimatedPnL.toFixed(2)}
                    </span>
                  </div>
                </div>

                <form onSubmit={handlePlaceOrder} className="pt-2">
                  <button
                    type="submit"
                    disabled={orderProcessing || !notional || parseFloat(notional) <= 0 || !price}
                    className={`w-full py-4 rounded-xl text-lg font-black uppercase tracking-wider transition-all disabled:opacity-50 ${
                      orderProcessing
                        ? 'bg-slate-400 text-white cursor-not-allowed'
                        : positionType === 'long'
                        ? 'bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer'
                        : 'bg-rose-500 text-white shadow-lg hover:bg-rose-600 hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer'
                    }`}
                  >
                    {orderProcessing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Executing…
                      </>
                    ) : positionType === 'long' ? (
                      <>
                        <ArrowRight className="w-5 h-5 mr-2" /> Open Long
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-5 h-5 mr-2" /> Open Short
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                <Link className="w-5 h-5 text-[#F7931A]" /> Perpetual Futures Explained
              </h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">✓</span> No expiry date — hold your position as long as you maintain margin.</li>
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">✓</span> No rollover fees — funding rates settle peer-to-peer.</li>
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">✓</span> Up to 1:125 leverage on BTC and ETH perpetual contracts.</li>
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">✓</span> Taker fees from just 0.035% — among the lowest in the industry.</li>
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">✓</span> 24/7 trading on crypto perpetuals; forex, indices and commodities during market hours.</li>
              </ul>
            </div>
          </div>

          {/* RIGHT: Market List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-lg">Live Perpetual Markets</h3>
              <button onClick={() => setView('markets')} className="text-xs font-black text-[#F7931A] hover:text-orange-600 transition">View All Markets →</button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Instrument</th>
                    <th className="px-6 py-4 text-right">Mark Price</th>
                    <th className="px-6 py-4 text-right">24h Change</th>
                    <th className="px-6 py-4 text-right">Max Leverage</th>
                    <th className="px-6 py-4 text-right">Taker Fee</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PERP_INSTRUMENTS.map((c) => {
                    const q = quotes[c.symbol];
                    const p = q?.price || 0;
                    const change = q?.change || 0;
                    const isPositive = change >= 0;
                    return (
                      <motion.tr
                        key={c.symbol}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setSelectedSymbol(c.symbol)}
                        className={`cursor-pointer transition hover:bg-slate-50 border-b border-slate-50/50 last:border-0 ${
                          selectedSymbol === c.symbol ? 'bg-[#F7931A]/5' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${c.color === '#F7931A' ? 'bg-[#F7931A]/20' : 'bg-slate-100'} flex items-center justify-center text-[11px] font-black`} style={{ color: c.color }}>
                              {c.symbol.replace(/USD$/, '').slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{c.name}</div>
                              <div className="text-xs text-slate-500 font-mono">{c.symbol} Perpetual</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          {p > 0 ? p.toLocaleString(undefined, { minimumFractionDigits: c.symbol.includes('BTC') ? 2 : 4 }) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {isPositive ? '+' : ''}{change.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600">{c.leverage}</td>
                        <td className="px-6 py-4 font-mono text-slate-600">{c.fee}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => { setSelectedSymbol(c.symbol); setPositionType('long'); }}
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
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-sm text-slate-900 mb-1">Leverage Risk Warning</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Perpetual futures are leveraged derivatives. Trading with leverage can magnify both gains and losses.
                    You may lose more than your initial margin if the market moves against your position. Positions may be
                    automatically liquidated if margin falls below maintenance requirements. Ensure you understand the risks
                    before trading perpetual contracts.
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
                  <h3 className="font-black text-slate-900 text-lg">Position Opened ✓</h3>
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
                    <span className={`text-sm font-bold ${orderConfirmed.type === 'LONG' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {orderConfirmed.type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Position Size</span>
                    <span className="text-sm font-bold text-slate-900">${orderConfirmed.size.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Leverage</span>
                    <span className="text-sm font-bold text-slate-900">{orderConfirmed.leverage}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Entry Price</span>
                    <span className="text-sm font-bold text-slate-900">{orderConfirmed.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 4 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Margin Used</span>
                    <span className="text-sm font-bold text-slate-900">${orderConfirmed.margin.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Liquidation Price</span>
                    <span className="text-sm font-bold text-rose-600">{orderConfirmed.liquidationPrice.toFixed(4)}</span>
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
