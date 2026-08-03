import React, { useState, useEffect } from 'react';
import { subscribePaymentConfig } from '../services/paymentConfigService';
import { 
  Terminal, 
  Zap, 
  ChevronRight, 
  CheckCircle2, 
  Download, 
  Activity, 
  Maximize2,
  TrendingUp,
  TrendingDown,
  Layers,
  Sliders,
  DollarSign,
  BarChart2,
  Lock,
  RefreshCw,
  Globe,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function PlatformsView() {
  const [selectedSymbol, setSelectedSymbol] = useState<'EURUSD' | 'GBPUSD' | 'BTCUSD' | 'XAUUSD'>('EURUSD');
  const [currentRate, setCurrentRate] = useState<number>(1.0845);
  const [tickHistory, setTickHistory] = useState<Array<{ time: string; rate: number }>>([]);
  const [lotSize, setLotSize] = useState<number>(0.10);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET');
  const [limitPrice, setLimitPrice] = useState<string>('1.08400');
  const [stopLoss, setStopLoss] = useState<string>('1.08100');
  const [takeProfit, setTakeProfit] = useState<string>('1.08900');
  const [logMessages, setLogMessages] = useState<string[]>([
    '[System] Connected to Axi Equinix NY4 MT5 Prime Gateway.',
    '[System] Depth of Market (DOM) L2 feed streaming at 100Hz.',
    '[System] Account ECN-849204 verified. Spreads from 0.0 pips active.'
  ]);
  const [positions, setPositions] = useState<Array<{ id: string; symbol: string; type: 'BUY' | 'SELL'; lots: number; entry: number; pnl: number }>>([
    { id: 'MT5-94812', symbol: 'EURUSD', type: 'BUY', lots: 0.5, entry: 1.08410, pnl: 20.00 },
    { id: 'MT5-94813', symbol: 'XAUUSD', type: 'SELL', lots: 0.1, entry: 2345.50, pnl: -12.50 }
  ]);

  // Dynamic symbol base rates
  const baseRates: Record<string, number> = {
    'EURUSD': 1.08450,
    'GBPUSD': 1.26840,
    'BTCUSD': 67845.00,
    'XAUUSD': 2342.80
  };

  useEffect(() => {
    setCurrentRate(baseRates[selectedSymbol]);
    // Reset history for new symbol
    const initialHistory = Array.from({ length: 20 }, (_, i) => ({
      time: new Date(Date.now() - (20 - i) * 2000).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      rate: Number((baseRates[selectedSymbol] + (Math.random() - 0.5) * (selectedSymbol === 'BTCUSD' ? 50 : selectedSymbol === 'XAUUSD' ? 2 : 0.0006)).toFixed(selectedSymbol === 'EURUSD' || selectedSymbol === 'GBPUSD' ? 5 : 2))
    }));
    setTickHistory(initialHistory);
  }, [selectedSymbol]);

  // Live Real Rate Update Loop
  useEffect(() => {
    const fetchPlatformRate = async () => {
      try {
        const res = await fetch('/api/markets/quotes');
        if (res.ok) {
          const live = await res.json();
          const liveQuote = live[selectedSymbol];
          if (liveQuote && liveQuote.price) {
            const nextRate = liveQuote.price;
            setCurrentRate(nextRate);
            
            setTickHistory(prevHist => {
              const updated = [...prevHist, {
                time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                rate: nextRate
              }];
              if (updated.length > 30) updated.shift();
              return updated;
            });

            // Update open positions real PnL
            setPositions(prevPos => prevPos.map(pos => {
              const quote = live[pos.symbol];
              if (quote && quote.price) {
                const diff = pos.type === 'BUY' ? (quote.price - pos.entry) : (pos.entry - quote.price);
                const multiplier = pos.symbol.includes('BTC') ? 1 : pos.symbol.includes('XAU') ? 100 : 100000;
                return {
                  ...pos,
                  pnl: Number((diff * pos.lots * multiplier).toFixed(2))
                };
              }
              return pos;
            }));
          }
        }
      } catch (e) {
        // Keep current real rate
      }
    };

    fetchPlatformRate();
    const timer = setInterval(fetchPlatformRate, 3000);
    return () => clearInterval(timer);
  }, [selectedSymbol]);

  const [maintenanceMode, setMaintenanceMode] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = subscribePaymentConfig((centralConfig) => {
      if (centralConfig.maintenanceMode) {
        setMaintenanceMode(centralConfig.maintenanceMode);
      }
    });
    return () => unsubscribe();
  }, []);

  // Execute Order Function
  const handleExecuteOrder = (type: 'BUY' | 'SELL') => {
    if (maintenanceMode?.active && maintenanceMode?.disableTrading !== false) {
      const msg = `[REJECTED] Trading is disabled due to Maintenance Mode: ${maintenanceMode.message || 'System maintenance in progress'}`;
      setLogMessages(prev => [msg, ...prev]);
      return;
    }

    const isBuy = type === 'BUY';
    const execPrice = isBuy ? currentRate + (selectedSymbol.includes('USD') && !selectedSymbol.includes('BTC') ? 0.0001 : 0.05) : currentRate;
    const newPos = {
      id: `MT5-${Math.floor(10000 + Math.random() * 90000)}`,
      symbol: selectedSymbol,
      type,
      lots: lotSize,
      entry: Number(execPrice.toFixed(selectedSymbol === 'EURUSD' || selectedSymbol === 'GBPUSD' ? 5 : 2)),
      pnl: 0.00
    };

    setPositions(prev => [newPos, ...prev]);
    const logMsg = `[Order Executed] ${type} ${lotSize} Lots of ${selectedSymbol} @ ${execPrice.toFixed(selectedSymbol === 'EURUSD' || selectedSymbol === 'GBPUSD' ? 5 : 2)} (Latency: 1.2ms). Ticket #${newPos.id}`;
    setLogMessages(prev => [logMsg, ...prev]);
  };

  const isForex = selectedSymbol === 'EURUSD' || selectedSymbol === 'GBPUSD';
  const decimals = isForex ? 5 : 2;
  const spread = isForex ? '0.1' : selectedSymbol === 'XAUUSD' ? '0.08' : '1.5';

  // Generate Depth of Market (DOM) L2 Ladder
  const domBuyLevels = [
    { price: (currentRate - (isForex ? 0.00005 : 0.20)).toFixed(decimals), volume: 14.5, depth: 85 },
    { price: (currentRate - (isForex ? 0.00010 : 0.40)).toFixed(decimals), volume: 22.1, depth: 65 },
    { price: (currentRate - (isForex ? 0.00015 : 0.60)).toFixed(decimals), volume: 38.0, depth: 45 },
    { price: (currentRate - (isForex ? 0.00020 : 0.80)).toFixed(decimals), volume: 55.4, depth: 30 }
  ];

  const domSellLevels = [
    { price: (currentRate + (isForex ? 0.00020 : 0.80)).toFixed(decimals), volume: 48.2, depth: 25 },
    { price: (currentRate + (isForex ? 0.00015 : 0.60)).toFixed(decimals), volume: 31.0, depth: 40 },
    { price: (currentRate + (isForex ? 0.00010 : 0.40)).toFixed(decimals), volume: 18.4, depth: 60 },
    { price: (currentRate + (isForex ? 0.00005 : 0.20)).toFixed(decimals), volume: 12.0, depth: 90 }
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col gap-8 text-slate-900 dark:text-slate-100 font-sans">
      
      {/* Intro Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <span className="text-[#E3000F] text-xs font-black tracking-widest uppercase bg-[#E3000F]/10 border border-[#E3000F]/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-[#E3000F]" /> Axi Professional MetaTrader 5 Terminal
          </span>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
            High-Fidelity MT5 Trading Terminal
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-semibold mt-1 max-w-2xl">
            Integrated Depth-of-Market (DOM) L2 liquidity, instant order routing, and real-time charting powered by Equinix NY4 fiber servers.
          </p>
        </div>

        {/* Client Platform Downloads */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <a 
            href="#"
            onClick={(e) => { e.preventDefault(); alert("Axi MT5 Desktop client setup initializing..."); }}
            className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#FFD250]" /> Download MT5 Client
          </a>
        </div>
      </div>

      {/* Main Single High-Fidelity Terminal Workspace */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200 font-sans">
        
        {/* Terminal Header Bar */}
        <div className="bg-[#121824] border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Symbol Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-[#080b12] p-1 rounded-xl border border-slate-800">
            {(['EURUSD', 'GBPUSD', 'BTCUSD', 'XAUUSD'] as const).map(sym => (
              <button
                key={sym}
                onClick={() => setSelectedSymbol(sym)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${
                  selectedSymbol === sym ? 'bg-[#E3000F] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          {/* Live System Specs */}
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Equinix NY4: <strong className="text-white">1.1ms</strong>
            </span>
            <span className="hidden sm:inline">Spread: <strong className="text-[#FFD250]">{spread} pips</strong></span>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-extrabold">RAW ECN</span>
          </div>

        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* Column 1: Real-Time Chart & Order Stream (Col-Span 7) */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col gap-4 bg-[#080c14]">
            
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black font-mono text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#E3000F]" /> {selectedSymbol} Real-Time Tick Stream
                </span>
                <span className="text-xs font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-bold">1-Sec</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black font-mono text-[#E3000F]">{currentRate.toFixed(decimals)}</span>
                <span className="text-[10px] text-emerald-400 font-bold block">+0.12% Today</span>
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-64 sm:h-72 w-full bg-[#05070c] rounded-xl border border-slate-900 p-2 relative overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tickHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mt5ChartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E3000F" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#E3000F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#334155" fontSize={9} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={9} tickLine={false} domain={['dataMin', 'dataMax']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                    formatter={(val: any) => [Number(val).toFixed(decimals), 'Rate']}
                  />
                  <Area type="monotone" dataKey="rate" stroke="#E3000F" strokeWidth={2} fillOpacity={1} fill="url(#mt5ChartGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Live Positions Table */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono block">
                Active MT5 Open Tickets ({positions.length})
              </span>
              <div className="bg-[#05070c] rounded-xl border border-slate-900 overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase">
                      <th className="p-2.5">Ticket</th>
                      <th className="p-2.5">Symbol</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Lots</th>
                      <th className="p-2.5">Entry Rate</th>
                      <th className="p-2.5 text-right">P&L ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map(pos => (
                      <tr key={pos.id} className="border-b border-slate-900/50 hover:bg-slate-900/30">
                        <td className="p-2.5 font-bold text-slate-400">{pos.id}</td>
                        <td className="p-2.5 font-bold text-white">{pos.symbol}</td>
                        <td className={`p-2.5 font-bold ${pos.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>{pos.type}</td>
                        <td className="p-2.5">{pos.lots}</td>
                        <td className="p-2.5">{pos.entry.toFixed(decimals)}</td>
                        <td className={`p-2.5 text-right font-extrabold ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pos.pnl >= 0 ? `+${pos.pnl.toFixed(2)}` : pos.pnl.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Column 2: Order Entry Panel & Depth of Market (Col-Span 5) */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col gap-5 bg-[#0b0f19]">
            
            {/* Order Panel Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-extrabold uppercase font-mono text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#FFD250]" /> Order Entry Panel
              </span>
              <div className="flex gap-1 bg-[#05070c] p-1 rounded-lg border border-slate-800">
                {(['MARKET', 'LIMIT', 'STOP'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded transition cursor-pointer ${
                      orderType === t ? 'bg-[#E3000F] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs: Lot Size & Risk Parameters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 font-mono block">LOT VOLUME</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  max="10.0" 
                  value={lotSize} 
                  onChange={(e) => setLotSize(Number(e.target.value))}
                  className="w-full bg-[#05070c] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#E3000F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 font-mono block">LEVERAGE</label>
                <select className="w-full bg-[#05070c] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#E3000F]">
                  <option>1:500 (Pro ECN)</option>
                  <option>1:200</option>
                  <option>1:100</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 font-mono block">STOP LOSS (SL)</label>
                <input 
                  type="text" 
                  value={stopLoss} 
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full bg-[#05070c] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 font-mono block">TAKE PROFIT (TP)</label>
                <input 
                  type="text" 
                  value={takeProfit} 
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="w-full bg-[#05070c] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Instant Execution Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExecuteOrder('BUY')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-extrabold uppercase text-xs tracking-wider transition cursor-pointer shadow-md flex flex-col items-center justify-center"
              >
                <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" /> INSTANT BUY</span>
                <span className="text-[10px] opacity-80 font-mono">{(currentRate + (isForex ? 0.0001 : 0.05)).toFixed(decimals)}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExecuteOrder('SELL')}
                className="bg-[#E3000F] hover:bg-red-600 text-white py-3 rounded-xl font-extrabold uppercase text-xs tracking-wider transition cursor-pointer shadow-md flex flex-col items-center justify-center"
              >
                <span className="flex items-center gap-1"><TrendingDown className="w-4 h-4" /> INSTANT SELL</span>
                <span className="text-[10px] opacity-80 font-mono">{currentRate.toFixed(decimals)}</span>
              </motion.button>
            </div>

            {/* Depth of Market (DOM) L2 Ladder */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#FFD250]" /> Depth of Market (L2 Liquidity)
                </span>
                <span className="text-[9px] font-mono text-slate-500">Tier-1 Institutional Pool</span>
              </div>

              <div className="bg-[#05070c] rounded-xl border border-slate-900 p-2.5 space-y-1.5 font-mono text-[10px]">
                {/* Ask / Sell Levels */}
                {domSellLevels.map((lvl, idx) => (
                  <div key={`sell-${idx}`} className="flex items-center justify-between relative overflow-hidden py-0.5 px-2 rounded">
                    <div className="absolute right-0 top-0 bottom-0 bg-rose-950/40" style={{ width: `${lvl.depth}%` }} />
                    <span className="text-rose-400 font-bold relative z-10">{lvl.price}</span>
                    <span className="text-slate-400 relative z-10">{lvl.volume} Lots</span>
                  </div>
                ))}

                {/* Spread Divider */}
                <div className="py-1 bg-slate-900/80 my-1 text-center text-[9px] font-bold text-[#FFD250] uppercase tracking-wider rounded border border-slate-800">
                  --- RAW SPREAD: {spread} PIPS ---
                </div>

                {/* Bid / Buy Levels */}
                {domBuyLevels.map((lvl, idx) => (
                  <div key={`buy-${idx}`} className="flex items-center justify-between relative overflow-hidden py-0.5 px-2 rounded">
                    <div className="absolute left-0 top-0 bottom-0 bg-emerald-950/40" style={{ width: `${lvl.depth}%` }} />
                    <span className="text-emerald-400 font-bold relative z-10">{lvl.price}</span>
                    <span className="text-slate-400 relative z-10">{lvl.volume} Lots</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Logs */}
            <div className="bg-[#05070c] border border-slate-900 rounded-xl p-3 font-mono text-[10px] text-slate-400 h-28 overflow-y-auto space-y-1">
              <span className="text-[9px] font-bold text-slate-500 border-b border-slate-800 pb-1 block mb-1">
                SYSTEM EXECUTION LOGS
              </span>
              {logMessages.map((m, i) => (
                <div key={i} className="leading-relaxed">
                  <span className="text-[#FFD250] font-bold">&gt;&gt;</span> {m}
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
