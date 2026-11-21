import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, ArrowUpRight, ChevronDown, Clock, Coins, CreditCard, DollarSign,
  Globe, Landmark, ShieldCheck, TrendingUp, TrendingDown, Wallet, Zap, X,
  CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { MarketQuote, ViewType } from '../types';
import AssetBrandLogo from './AssetBrandLogo';

const SPOT_CRYPTO_INSTRUMENTS = [
  { symbol: 'BTCUSD', name: 'Bitcoin', icon: '₿', color: '#F7931A', minOrder: 0.0001 },
  { symbol: 'ETHUSD', name: 'Ethereum', icon: 'Ξ', color: '#627EEA', minOrder: 0.001 },
  { symbol: 'SOLUSD', name: 'Solana', icon: '◎', color: '#00FF87', minOrder: 0.01 },
  { symbol: 'XRPUSD', name: 'XRP', icon: '✦', color: '#23292F', minOrder: 1 },
  { symbol: 'DOGEUSD', name: 'Dogecoin', icon: 'Ð', color: '#C2A633', minOrder: 10 },
  { symbol: 'ADAUSD', name: 'Cardano', icon: '◈', color: '#0033AD', minOrder: 1 },
  { symbol: 'AVAXUSD', name: 'Avalanche', icon: '🏔️', color: '#EB6925', minOrder: 0.01 },
  { symbol: 'LINKUSD', name: 'Chainlink', icon: '🔗', color: '#24292E', minOrder: 0.1 },
];

export default function SpotCryptoView({ quotes, setView, user }: { quotes: Record<string, MarketQuote>; setView: (view: ViewType) => void; user?: any }) {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD');
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<{ symbol: string; type: string; amount: number; price: number; total: number; txId: string } | null>(null);

  const quote = quotes[selectedSymbol];
  const price = quote?.price || 0;
  const inst = SPOT_CRYPTO_INSTRUMENTS.find(i => i.symbol === selectedSymbol);

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
    // Simulate order execution
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
              <h2 className="text-2xl font-black tracking-tight">Spot Crypto</h2>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-100 text-xs font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 24/7 Market Access
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Buy, Sell &amp; Hold Real Cryptocurrency</h1>
            <p className="text-lg text-orange-100 max-w-xl">
              Trade Bitcoin, Ethereum and 150+ cryptocurrencies directly on the spot market with the Axi Trading Platform.
              No hidden charges, secure custody, and instant execution — all from your existing Axi account.
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
                <Wallet className="w-5 h-5" /> Open Crypto Account
              </button>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Secure Custody', desc: 'Assets held in segregated cold storage', icon: ShieldCheck },
            { label: '24/7 Trading', desc: 'Crypto markets never close', icon: Clock },
            { label: 'Real Prices', desc: 'Live spot prices from Binance', icon: TrendingUp },
            { label: 'Instant Execution', desc: 'Sub-second order fills', icon: Zap },
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
                <h3 className="font-black text-slate-900 text-lg">{action === 'buy' ? 'Buy Crypto' : 'Sell Crypto'}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAction('buy')}
                    className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${action === 'buy' ? 'bg-[#F7931A] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >Buy</button>
                  <button
                    onClick={() => setAction('sell')}
                    className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${action === 'sell' ? 'bg-[#F7931A] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >Sell</button>
                </div>
              </div>

              <div className="space-y-5">
                {/* Asset Selector */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">Cryptocurrency</label>
                  <div className="flex gap-2">
                    {SPOT_CRYPTO_INSTRUMENTS.map((c) => (
                      <button
                        key={c.symbol}
                        onClick={() => setSelectedSymbol(c.symbol)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${
                          selectedSymbol === c.symbol
                            ? 'bg-[#F7931A]/10 text-[#F7931A] border-[#F7931A] shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]`}>{c.icon}</span>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Display */}
                <div className="flex items-end justify-between bg-slate-50 rounded-xl p-4">
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase">Market Price</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 font-mono">{price > 0 ? price.toLocaleString(undefined, { minimumFractionDigits: selectedSymbol.includes('BTC') ? 2 : 4 }) : '...'}</span>
                      <span className="text-[#F7931A] font-black">USD</span>
                    </div>
                  </div>
                  <span className={`text-xs font-black ${price > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {price > 0 ? (quote?.change || 0) >= 0 ? '▲' : '▼' : '–'} Live
                  </span>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">
                    {action === 'buy' ? 'Amount to Spend (USD)' : 'Amount to Sell (Crypto)'}
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
                      <div className="text-2xl font-black text-slate-900 font-mono mt-1">{cryptoAmount || 0} {selectedSymbol.replace(/USD$/, '')}</div>
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
                    onClick={handlePlaceOrder}
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
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">1</span> Select your cryptocurrency and choose Buy or Sell.</li>
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">2</span> Enter the amount — we show you the exact crypto you'll receive.</li>
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">3</span> Confirm the order and it executes instantly at live market prices.</li>
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">4</span> Your assets are secured in segregated custody — viewable in your dashboard.</li>
              </ol>
            </div>
          </div>

          {/* RIGHT: Market List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-lg">Live Crypto Markets</h3>
              <button onClick={() => setView('markets')} className="text-xs font-black text-[#F7931A] hover:text-orange-600 transition">View All Markets →</button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Cryptocurrency</th>
                    <th className="px-6 py-4 text-right">Price (USD)</th>
                    <th className="px-6 py-4 text-right">24h Change</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SPOT_CRYPTO_INSTRUMENTS.map((c) => {
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
                              {c.icon}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{c.name}</div>
                              <div className="text-xs text-slate-500 font-mono">{c.symbol.replace(/USD$/, '')}/USD</div>
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
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => { setSelectedSymbol(c.symbol); setAction('buy'); }}
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
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-sm text-slate-900 mb-1">Risk Warning</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Cryptocurrency prices can be extremely volatile. You may lose some or all of your invested capital.
                    Axi does not provide crypto wallet services — assets are held in secured custody on your behalf.
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
                    <span className="text-sm font-bold text-slate-900">{orderConfirmed.amount.toFixed(6)} {orderConfirmed.symbol.replace(/USD$/, '')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Price</span>
                    <span className="text-sm font-bold text-slate-900">${orderConfirmed.price.toLocaleString()}</span>
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
