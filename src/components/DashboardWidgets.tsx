import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, TrendingUp, Wallet, History, ChevronDown, ChevronUp, BarChart2, PieChart as PieIcon, Calendar, DollarSign, Building2, CheckCircle2, Sparkles, Clock, ExternalLink, Filter, Coins } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { TradeOrder, ClosedPosition, ViewType, DisplayCurrency } from '../types';
import RechartsCandlestickChart from './RechartsCandlestickChart';
import CurrencySelector from './CurrencySelector';

interface WidgetWrapperProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accountMode: 'demo' | 'live';
  className?: string;
  isCompact?: boolean;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ id, title, icon, children, accountMode, className = '', isCompact = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
  };

  const bgClass = accountMode === 'demo' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900';
  const headerBgClass = accountMode === 'demo' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200';

  const minHeightClass = isCompact ? 'min-h-[200px]' : 'min-h-[300px]';
  const headerPadding = isCompact ? 'p-2' : 'p-3';
  const bodyPadding = isCompact ? 'p-2.5' : 'p-4';

  return (
    <div ref={setNodeRef} style={style} className={`rounded-xl border shadow-sm flex flex-col w-full h-full ${minHeightClass} overflow-hidden ${bgClass} ${isDragging ? 'shadow-2xl ring-2 ring-[#E3000F] opacity-80 z-20' : ''} ${className}`}>
      <div className={`flex items-center justify-between ${headerPadding} border-b ${headerBgClass}`}>
        <div className="flex items-center gap-1.5">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing hover:text-[#E3000F] text-slate-400 p-0.5 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition" title="Drag to reorder workspace widget">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
            {icon} {title}
          </div>
        </div>
        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
          {isCompact ? 'Compact' : 'Draggable'}
        </div>
      </div>
      <div className={`${bodyPadding} w-full h-full overflow-auto`}>
        {children}
      </div>
    </div>
  );
}

export function AccountSummaryWidget({ 
  accountMode, 
  activeBalance, 
  setView, 
  setIsDepositModalOpen, 
  isLoading, 
  displayCurrency = 'USD', 
  setDisplayCurrency, 
  formatCurrency = (amt: number) => `$${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
}: any) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[1, 2].map(i => (
          <div key={i} className={`rounded-lg border p-4 flex flex-col gap-3 ${accountMode === "demo" ? "bg-slate-700/30 border-slate-600" : "bg-slate-50/60 border-slate-200"}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-4">
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Currency Switcher Bar */}
      {setDisplayCurrency && (
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-[#E3000F]" />
            <span>Display Currency Toggle:</span>
          </span>
          <CurrencySelector
            displayCurrency={displayCurrency}
            setDisplayCurrency={setDisplayCurrency}
            variant="compact"
          />
        </div>
      )}

      {/* Account 1 */}
      <div className={`rounded-lg border p-4 flex flex-col gap-3 ${accountMode === "demo" ? "bg-slate-700/50 border-slate-600" : "bg-slate-50 border-slate-200"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-[#2b2b2b] text-white text-[10px] font-black uppercase px-2 py-1 rounded-sm tracking-wider">AXI SELECT</span>
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 text-white text-[10px] font-black uppercase px-2 py-1 rounded-sm tracking-wider">MT4</span>
            <span className="font-bold text-sm">Standard</span>
          </div>
          <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(activeBalance)}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex flex-col">
              <span className="opacity-70 mb-0.5">Log in</span>
              <span className="font-bold">60332183</span>
            </div>
            <div className="flex flex-col">
              <span className="opacity-70 mb-0.5">Server</span>
              <span className="font-bold">{accountMode === 'demo' ? 'Axi-Demo-MT4' : 'Axi-US51-Live'}</span>
            </div>
            <div className="flex flex-col">
              <span className="opacity-70 mb-0.5">Leverage</span>
              <span className="font-bold">1:1000</span>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <button onClick={() => setIsDepositModalOpen(true)} className="flex-1 sm:flex-none bg-[#E3000F] hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded transition-colors text-center shadow-sm">
              Quick Deposit
            </button>
            <button onClick={() => setView('markets')} className="flex-1 sm:flex-none border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-4 py-2 rounded transition-colors text-center">
              Trade
            </button>
          </div>
        </div>
      </div>
      
      {/* Account 2 */}
      <div className={`rounded-lg border p-4 flex flex-col gap-3 ${accountMode === "demo" ? "bg-slate-700/50 border-slate-600" : "bg-slate-50 border-slate-200"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-[#E3000F] to-[#f59e0b] text-white text-[10px] font-black uppercase px-2 py-1 rounded-sm tracking-wider">MT5</span>
            <span className="font-bold text-sm">Standard</span>
          </div>
          <span className="font-black text-sm text-slate-500 font-mono">
            {formatCurrency(0)}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex flex-col">
              <span className="opacity-70 mb-0.5">Log in</span>
              <span className="font-bold">60332182</span>
            </div>
            <div className="flex flex-col">
              <span className="opacity-70 mb-0.5">Server</span>
              <span className="font-bold">{accountMode === 'demo' ? 'Axi-Demo-MT5-2' : 'Axi-us52-live'}</span>
            </div>
            <div className="flex flex-col">
              <span className="opacity-70 mb-0.5">Leverage</span>
              <span className="font-bold">1:1000</span>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <button onClick={() => setIsDepositModalOpen(true)} className="flex-1 sm:flex-none bg-[#E3000F] hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded transition-colors text-center shadow-sm">
              Quick Deposit
            </button>
            <button onClick={() => setView('markets')} className="flex-1 sm:flex-none border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-4 py-2 rounded transition-colors text-center">
              Trade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OpenPositionsWidget({ openPositions, accountMode, isLoading }: any) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2.5 animate-pulse">
        <div className="h-6 w-full bg-slate-200 dark:bg-slate-700/60 rounded mb-1" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-10 w-full rounded-lg flex items-center justify-between px-3 border ${accountMode === 'demo' ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-10 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded font-mono" />
          </div>
        ))}
      </div>
    );
  }

  if (!openPositions || openPositions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center opacity-70">
        <History className="w-10 h-10 mb-3 opacity-50" />
        <h4 className="font-bold mb-1">No Open Positions</h4>
        <p className="text-xs">You currently don't have any active trades.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Mobile-first collapsible list */}
      <div className="block sm:hidden flex flex-col gap-2">
        {openPositions.map((pos: any) => (
          <div key={pos.id} className={`rounded-lg border p-3 ${accountMode === 'demo' ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedRowId(expandedRowId === pos.id ? null : pos.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${pos.type === 'BUY' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <div>
                  <div className="font-bold text-sm">{pos.symbol}</div>
                  <div className="text-xs opacity-70">{pos.type} • {pos.volume} Lots</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`font-bold text-sm ${pos.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {pos.profit >= 0 ? '+' : ''}${pos.profit.toFixed(2)}
                </div>
                {expandedRowId === pos.id ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
              </div>
            </div>
            {expandedRowId === pos.id && (
              <div className={`mt-3 pt-3 border-t text-xs flex flex-col gap-2 ${accountMode === 'demo' ? 'border-slate-600' : 'border-slate-200'}`}>
                <div className="flex justify-between">
                  <span className="opacity-70">Trade ID</span>
                  <span className="font-mono">{pos.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Entry Price</span>
                  <span className="font-mono">{pos.entryPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Current Price</span>
                  <span className="font-mono">{pos.currentPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Open Time</span>
                  <span className="opacity-70">{pos.timestamp}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className={`border-b uppercase tracking-wider font-extrabold text-[10px] ${accountMode === "demo" ? "text-slate-400 border-slate-700" : "text-slate-500 border-slate-200"}`}>
              <th className="p-2">Symbol</th>
              <th className="p-2">Type</th>
              <th className="p-2">Volume</th>
              <th className="p-2">Entry</th>
              <th className="p-2">Current</th>
              <th className="p-2 text-right">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/20 font-semibold">
            {openPositions.map((pos: any, idx: number) => (
              <motion.tr 
                key={pos.id} 
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                whileHover={{ scale: 1.01, backgroundColor: accountMode === "demo" ? "rgba(51, 65, 85, 0.5)" : "rgba(241, 245, 249, 0.9)" }}
                className={`${accountMode === "demo" ? "hover:bg-slate-750" : "hover:bg-slate-50"} transition-colors cursor-pointer`}
              >
                <td className="p-2 font-black">{pos.symbol}</td>
                <td className="p-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${pos.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {pos.type}
                  </span>
                </td>
                <td className="p-2 font-mono">{pos.volume}</td>
                <td className="p-2 font-mono">{pos.entryPrice}</td>
                <td className="p-2 font-mono">{pos.currentPrice}</td>
                <td className="p-2 text-right font-mono font-bold">
                  <span className={pos.profit >= 0 ? "text-emerald-500" : "text-rose-500"}>
                    {pos.profit >= 0 ? '+' : ''}${pos.profit.toFixed(2)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MarketWatchWidget({ accountMode, isLoading }: any) {
  const [liveWatchlist, setLiveWatchlist] = useState<Array<{ symbol: string; price: string; change: string; isPositive: boolean }>>([
    { symbol: 'EURUSD', price: '1.08450', change: '+0.12%', isPositive: true },
    { symbol: 'GBPUSD', price: '1.26840', change: '-0.08%', isPositive: false },
    { symbol: 'USDJPY', price: '151.62', change: '+0.35%', isPositive: true },
    { symbol: 'XAUUSD', price: '2342.80', change: '+1.15%', isPositive: true },
    { symbol: 'BTCUSD', price: '67845.00', change: '+2.45%', isPositive: true },
  ]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const res = await fetch('/api/markets/quotes');
        if (res.ok) {
          const live = await res.json();
          const watchlistKeys = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD', 'US30', 'AAPL', 'NVDA'];
          const items = watchlistKeys.map(sym => {
            const q = live[sym] || {};
            const priceVal = q.price ? (sym.includes('JPY') ? q.price.toFixed(2) : sym.includes('USD') && !sym.includes('BTC') && !sym.includes('XAU') ? q.price.toFixed(5) : q.price.toFixed(2)) : '---';
            const changeNum = q.change !== undefined ? q.change : 0;
            const changeStr = `${changeNum >= 0 ? '+' : ''}${changeNum.toFixed(2)}%`;
            return {
              symbol: sym,
              price: priceVal,
              change: changeStr,
              isPositive: changeNum >= 0
            };
          });
          setLiveWatchlist(items);
        }
      } catch (e) {
        // Keep last verified quotes
      }
    };

    fetchWatchlist();
    const timer = setInterval(fetchWatchlist, 2500);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 animate-pulse">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`flex items-center justify-between p-2.5 rounded border ${accountMode === 'demo' ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="flex items-center gap-3">
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {liveWatchlist.map((item, idx) => (
        <motion.div 
          key={item.symbol} 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22, delay: idx * 0.03 }}
          whileHover={{ scale: 1.015, x: 2 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center justify-between p-2.5 rounded-lg border ${
            accountMode === 'demo' 
              ? 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/70 hover:border-slate-500 shadow-xs' 
              : 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-300 shadow-xs'
          } transition-all cursor-pointer`}
        >
          <div className="font-bold text-xs tracking-wider flex items-center gap-2">
            <span>{item.symbol}</span>
          </div>
          <div className="flex items-center gap-3">
            <motion.div 
              key={item.price}
              initial={{ scale: 1.08, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="font-mono text-xs font-bold"
            >
              {item.price}
            </motion.div>
            <div className={`text-xs font-bold w-14 text-right px-1.5 py-0.5 rounded ${
              item.isPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'
            }`}>
              {item.change}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function LiveChartWidget({ accountMode, isLoading, selectedSymbol: externalSymbol, setSelectedSymbol: externalSetSymbol }: any) {
  const [internalSymbol, setInternalSymbol] = useState('EURUSD');
  const selectedSymbol = externalSymbol || internalSymbol;
  const setSelectedSymbol = externalSetSymbol || setInternalSymbol;
  const [livePrice, setLivePrice] = useState<number>(1.0845);

  useEffect(() => {
    const fetchWidgetPrice = async () => {
      try {
        const res = await fetch('/api/markets/quotes');
        if (res.ok) {
          const live = await res.json();
          if (live[selectedSymbol]?.price) {
            setLivePrice(live[selectedSymbol].price);
          }
        }
      } catch (e) {
        // Keep current price
      }
    };

    fetchWidgetPrice();
    const timer = setInterval(fetchWidgetPrice, 2500);
    return () => clearInterval(timer);
  }, [selectedSymbol]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-6 w-14 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="h-[280px] w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl p-4 flex items-end gap-2 border border-slate-200/50 dark:border-slate-700/50">
          {[40, 65, 30, 85, 50, 70, 95, 45, 60, 80, 55, 75, 90, 35, 65].map((h, i) => (
            <div key={i} className="flex-1 bg-slate-200 dark:bg-slate-700/80 rounded-t transition-all duration-500" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    );
  }

  const [selectedCategory, setSelectedCategory] = useState<'Crypto' | 'Forex' | 'Commodities' | 'All'>('Crypto');

  const ALL_SYMBOLS = [
    { code: 'BTCUSD', name: 'Bitcoin', category: 'Crypto', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=025' },
    { code: 'ETHUSD', name: 'Ethereum', category: 'Crypto', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=025' },
    { code: 'SOLUSD', name: 'Solana', category: 'Crypto', icon: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=025' },
    { code: 'XRPUSD', name: 'XRP', category: 'Crypto', icon: 'https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=025' },
    { code: 'EURUSD', name: 'Euro / USD', category: 'Forex', icon: '€' },
    { code: 'GBPUSD', name: 'Pound / USD', category: 'Forex', icon: '£' },
    { code: 'USDJPY', name: 'USD / Yen', category: 'Forex', icon: '¥' },
    { code: 'XAUUSD', name: 'Gold Spot', category: 'Commodities', icon: '🪙' },
    { code: 'US30', name: 'Dow Jones Index', category: 'Indices', icon: 'https://cdn-icons-png.flaticon.com/512/555/555543.png' },
    { code: 'SPX500', name: 'S&P 500', category: 'Indices', icon: 'https://cdn-icons-png.flaticon.com/512/555/555543.png' },
  ];

  const filteredSymbols = selectedCategory === 'All' 
    ? ALL_SYMBOLS 
    : ALL_SYMBOLS.filter(s => s.category === selectedCategory);

  const activeSymbolObj = ALL_SYMBOLS.find(s => s.code === selectedSymbol);
  const isCryptoActive = activeSymbolObj?.category === 'Crypto';

  return (
    <div className="flex flex-col gap-3">
      {/* Category Tabs & Live Stream Badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Assets:</span>
          {(['Crypto', 'Forex', 'Commodities', 'All'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                selectedCategory === cat
                  ? 'bg-brand-red text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'Crypto' && '⚡ '}
              {cat}
            </button>
          ))}
        </div>

        {/* Live Stream Indicator */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold">{isCryptoActive ? 'Binance 24/7 Live Feed' : 'STP Liquidity Feed'}</span>
        </div>
      </div>

      {/* Asset Selector Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filteredSymbols.map(sym => (
          <button
            key={sym.code}
            onClick={() => setSelectedSymbol(sym.code)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 border ${
              selectedSymbol === sym.code
                ? 'bg-slate-900 text-white border-slate-700 shadow-md ring-2 ring-brand-red/50 dark:bg-white dark:text-slate-900 dark:border-slate-200'
                : accountMode === 'demo'
                ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {sym.icon.startsWith('http') ? (
              <img src={sym.icon} alt={sym.code} className="w-4 h-4 object-contain" />
            ) : (
              <span className="text-amber-500 font-bold">{sym.icon}</span>
            )}
            <span>{sym.code}</span>
          </button>
        ))}
      </div>

      <div className="w-full">
        <RechartsCandlestickChart
          symbol={selectedSymbol}
          data={[]}
          currentPrice={livePrice}
          height={280}
        />
      </div>
    </div>
  );
}

export function PortfolioDonutWidget({ openPositions = [], accountMode, isLoading }: any) {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full justify-between gap-3 animate-pulse">
        <div className="h-44 w-full flex items-center justify-center">
          <div className="w-28 h-28 rounded-full border-[10px] border-slate-200 dark:border-slate-700/80 border-t-[#E3000F] animate-spin" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-7 bg-slate-200 dark:bg-slate-700/60 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const data = React.useMemo(() => {
    let forex = 0;
    let crypto = 0;
    let shares = 0;
    let indices = 0;

    if (openPositions && openPositions.length > 0) {
      openPositions.forEach((pos: any) => {
        const sym = (pos.symbol || '').toUpperCase();
        const estValue = (pos.volume || 1) * (pos.currentPrice || pos.entryPrice || 100) * 1000;
        if (sym.includes('BTC') || sym.includes('ETH') || sym.includes('SOL') || sym.includes('XRP') || sym.includes('CRYPTO')) {
          crypto += estValue;
        } else if (sym.includes('AAPL') || sym.includes('TSLA') || sym.includes('NVDA') || sym.includes('AMZN') || sym.includes('MSFT')) {
          shares += estValue;
        } else if (sym.includes('500') || sym.includes('NAS') || sym.includes('30') || sym.includes('GOLD') || sym.includes('OIL') || sym.includes('XAU')) {
          indices += estValue;
        } else {
          forex += estValue;
        }
      });
    }

    const total = forex + crypto + shares + indices;
    if (total === 0) {
      return [
        { name: 'Forex Pairs', value: 45, color: '#E3000F' },
        { name: 'Crypto', value: 30, color: '#F59E0B' },
        { name: 'Shares', value: 25, color: '#3B82F6' }
      ];
    }

    const list = [
      { name: 'Forex Pairs', value: Number(((forex / total) * 100).toFixed(1)), color: '#E3000F' },
      { name: 'Crypto', value: Number(((crypto / total) * 100).toFixed(1)), color: '#F59E0B' },
      { name: 'Shares', value: Number(((shares / total) * 100).toFixed(1)), color: '#3B82F6' },
      { name: 'Indices', value: Number(((indices / total) * 100).toFixed(1)), color: '#10B981' }
    ];

    return list.filter(item => item.value > 0);
  }, [openPositions]);

  const totalPositions = openPositions ? openPositions.length : 0;

  return (
    <div className="flex flex-col h-full justify-between gap-3">
      <div className="h-44 w-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={62}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`donut-cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: any) => [`${val}%`, 'Allocation']}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Open</span>
          <span className="text-xs font-black text-slate-900 dark:text-white">{totalPositions > 0 ? `${totalPositions} Trades` : 'Portfolio'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs font-bold p-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="truncate text-slate-700 dark:text-slate-300 text-[11px]">{item.name}</span>
            </div>
            <span className="font-mono text-[11px] text-slate-900 dark:text-white font-extrabold">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DividendCalendarWidget({ openPositions, accountMode, isLoading, setView }: any) {
  const [filterMode, setFilterMode] = useState<'all' | 'held'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Upcoming corporate dividend calendar events for major stock CFDs
  const UPCOMING_DIVIDENDS = [
    {
      id: 'div-aapl',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      exDate: '2026-08-07',
      payDate: '2026-08-21',
      dividendPerShare: 0.25,
      yieldPercent: 0.52,
      frequency: 'Quarterly',
      sharesPerLot: 100,
      category: 'Tech',
      color: '#000000'
    },
    {
      id: 'div-nvda',
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      exDate: '2026-08-12',
      payDate: '2026-08-28',
      dividendPerShare: 0.10,
      yieldPercent: 0.08,
      frequency: 'Quarterly',
      sharesPerLot: 100,
      category: 'Tech',
      color: '#76B900'
    },
    {
      id: 'div-msft',
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      exDate: '2026-08-19',
      payDate: '2026-09-10',
      dividendPerShare: 0.75,
      yieldPercent: 0.71,
      frequency: 'Quarterly',
      sharesPerLot: 100,
      category: 'Tech',
      color: '#00A4EF'
    },
    {
      id: 'div-jnj',
      symbol: 'JNJ',
      name: 'Johnson & Johnson',
      exDate: '2026-08-25',
      payDate: '2026-09-15',
      dividendPerShare: 1.24,
      yieldPercent: 3.10,
      frequency: 'Quarterly',
      sharesPerLot: 100,
      category: 'Healthcare',
      color: '#D51900'
    },
    {
      id: 'div-jpm',
      symbol: 'JPM',
      name: 'JPMorgan Chase',
      exDate: '2026-09-02',
      payDate: '2026-09-22',
      dividendPerShare: 1.15,
      yieldPercent: 2.35,
      frequency: 'Quarterly',
      sharesPerLot: 100,
      category: 'Finance',
      color: '#117ACA'
    },
    {
      id: 'div-xom',
      symbol: 'XOM',
      name: 'Exxon Mobil',
      exDate: '2026-09-08',
      payDate: '2026-09-28',
      dividendPerShare: 0.95,
      yieldPercent: 3.40,
      frequency: 'Quarterly',
      sharesPerLot: 100,
      category: 'Energy',
      color: '#EE1C25'
    }
  ];

  // Match user's open positions to calculate projected payouts
  const matchedDividends = UPCOMING_DIVIDENDS.map(item => {
    const positions = (openPositions || []).filter((p: TradeOrder) =>
      p.symbol.toUpperCase().includes(item.symbol) || item.symbol.includes(p.symbol.toUpperCase())
    );

    const totalVolume = positions.reduce((acc: number, p: TradeOrder) => acc + (p.volume || 0), 0);
    const estimatedShares = totalVolume * item.sharesPerLot;
    const projectedPayout = estimatedShares * item.dividendPerShare;

    return {
      ...item,
      isHeld: totalVolume > 0,
      heldLots: totalVolume,
      estimatedShares,
      projectedPayout
    };
  });

  const totalProjectedIncome = matchedDividends.reduce((acc, d) => acc + d.projectedPayout, 0);
  const heldCount = matchedDividends.filter(d => d.isHeld).length;

  const filteredEvents = matchedDividends.filter(item => {
    if (filterMode === 'held' && !item.isHeld) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-full" />
        <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg w-full" />
        <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Top Projected Income Summary Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700/80 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Coins className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span>Projected Dividend Payouts</span>
              {heldCount > 0 && <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">{heldCount} Held</span>}
            </div>
            <div className="text-xl font-mono font-black text-emerald-400">
              ${totalProjectedIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Upcoming Ex-Dates</span>
          <span className="text-xs font-mono font-bold text-slate-200">{UPCOMING_DIVIDENDS.length} Stock CFDs</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${filterMode === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            All Events ({UPCOMING_DIVIDENDS.length})
          </button>
          <button
            onClick={() => setFilterMode('held')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${filterMode === 'held' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <span>My Held Stocks</span>
            {heldCount > 0 && <span className="bg-emerald-800/80 text-white text-[10px] px-1.5 rounded-full font-mono font-bold">{heldCount}</span>}
          </button>
        </div>

        <input
          type="text"
          placeholder="Search ticker..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-28 sm:w-36 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E3000F]"
        />
      </div>

      {/* Dividend Events Table / List */}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[260px] pr-1">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col items-center justify-center gap-2">
            <Calendar className="w-8 h-8 opacity-40 text-slate-400" />
            <span>No dividend events match filter ({filterMode === 'held' ? 'No active equity CFD positions held' : 'No result'})</span>
          </div>
        ) : (
          filteredEvents.map(item => {
            return (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  item.isHeld
                    ? 'bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/20 dark:border-emerald-500/40'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                {/* Symbol & Company Name */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color || '#334155' }}
                  >
                    {item.symbol.substring(0, 3)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-wide">{item.symbol}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {item.category}
                      </span>
                      {item.isHeld && (
                        <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Held: {item.heldLots} Lot ({item.estimatedShares} sh)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                      {item.name}
                    </div>
                  </div>
                </div>

                {/* Dates & Dividend Rates */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col text-left sm:text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 sm:justify-end">
                      <Calendar className="w-3 h-3" />
                      Ex-Date: <span className="text-slate-900 dark:text-slate-200 font-mono">{item.exDate}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Pay: <span className="text-slate-600 dark:text-slate-300 font-mono">{item.payDate}</span>
                    </div>
                  </div>

                  <div className="flex flex-col text-right">
                    <div className="text-xs font-black font-mono text-slate-900 dark:text-white">
                      ${item.dividendPerShare.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ sh</span>
                    </div>
                    <div className="text-[10px] font-bold text-amber-500 dark:text-amber-400 font-mono">
                      Yield {item.yieldPercent}%
                    </div>
                  </div>

                  {/* Projected Payout Badge */}
                  <div className="pl-2 border-l border-slate-200 dark:border-slate-700 text-right min-w-[75px]">
                    <div className="text-[9px] font-bold uppercase text-slate-400">Payout</div>
                    <div className={`text-xs font-mono font-black ${item.isHeld ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {item.isHeld ? `+$${item.projectedPayout.toFixed(2)}` : '$0.00'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


