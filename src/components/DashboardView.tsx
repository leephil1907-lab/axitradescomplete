import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Wallet, 
  CreditCard, ShieldCheck, CheckCircle2, Clock, AlertCircle, RefreshCw, 
  Search, Filter, Plus, X, ChevronDown, ChevronRight, Lock, ExternalLink,
  Layers, BarChart2, Activity, Zap, Check, ArrowRight, Award, Users,
  Maximize2, Play, Sliders, AlertTriangle, Bell, Info, Compass, ShieldAlert,
  ChevronUp, Settings, Eye, HelpCircle, Terminal, Radio, Sparkles
} from 'lucide-react';
import { TradeOrder, ClosedPosition, ViewType, DisplayCurrency, PriceAlert } from '../types';
import CurrencySelector from './CurrencySelector';
import BalanceHistoryChart from './BalanceHistoryChart';
import TradingViewWidget from './TradingViewWidget';
import RechartsCandlestickChart from './RechartsCandlestickChart';
import AssetBrandLogo from './AssetBrandLogo';
import CopyTradeSection from './CopyTradeSection';
import IdentityVerificationModal from './IdentityVerificationModal';
import { DEFAULT_MARKET_QUOTES } from '../data';

interface DashboardViewProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  liveBalance: number;
  setLiveBalance: React.Dispatch<React.SetStateAction<number>>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openPositions: TradeOrder[];
  setOpenPositions?: React.Dispatch<React.SetStateAction<TradeOrder[]>>;
  addOpenPosition?: (position: TradeOrder) => void;
  closedPositions: ClosedPosition[];
  transactions?: any[];
  user?: any;
  quotes?: Record<string, any>;
  setView: (view: ViewType) => void;
  openReferModal?: () => void;
  openVoiceModal?: () => void;
  openOnboardingTour?: () => void;
  displayCurrency?: DisplayCurrency;
  setDisplayCurrency?: (curr: DisplayCurrency) => void;
  formatCurrency?: (usdAmount: number, targetCurrency?: DisplayCurrency, decimals?: number) => string;
  convertFromUSD?: (usdAmount: number, targetCurrency?: DisplayCurrency) => number;
}

interface PendingOrder {
  id: string;
  symbol: string;
  type: 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP';
  volume: number;
  targetPrice: number;
  currentPrice: number;
  timestamp: string;
  sl?: number;
  tp?: number;
}

const INSTRUMENTS = [
  { symbol: 'EURUSD', name: 'EUR / USD', full: 'Euro / US Dollar', cat: 'Forex', baseSpread: 0.2, digits: 5, leverage: 500 },
  { symbol: 'GBPUSD', name: 'GBP / USD', full: 'British Pound / US Dollar', cat: 'Forex', baseSpread: 0.4, digits: 5, leverage: 500 },
  { symbol: 'USDJPY', name: 'USD / JPY', full: 'US Dollar / Japanese Yen', cat: 'Forex', baseSpread: 0.3, digits: 3, leverage: 500 },
  { symbol: 'AUDUSD', name: 'AUD / USD', full: 'Australian Dollar / US Dollar', cat: 'Forex', baseSpread: 0.4, digits: 5, leverage: 500 },
  { symbol: 'USDCAD', name: 'USD / CAD', full: 'US Dollar / Canadian Dollar', cat: 'Forex', baseSpread: 0.5, digits: 5, leverage: 500 },
  { symbol: 'USDCHF', name: 'USD / CHF', full: 'US Dollar / Swiss Franc', cat: 'Forex', baseSpread: 0.6, digits: 5, leverage: 500 },
  { symbol: 'BTCUSD', name: 'BTC / USD', full: 'Bitcoin / US Dollar', cat: 'Crypto', baseSpread: 2.5, digits: 2, leverage: 100 },
  { symbol: 'ETHUSD', name: 'ETH / USD', full: 'Ethereum / US Dollar', cat: 'Crypto', baseSpread: 1.2, digits: 2, leverage: 100 },
  { symbol: 'SOLUSD', name: 'SOL / USD', full: 'Solana / US Dollar', cat: 'Crypto', baseSpread: 0.8, digits: 2, leverage: 50 },
  { symbol: 'XAUUSD', name: 'XAU / USD (Gold)', full: 'Spot Gold / US Dollar', cat: 'Commodities', baseSpread: 1.2, digits: 2, leverage: 200 },
  { symbol: 'USOIL', name: 'WTI Crude Oil', full: 'US West Texas Intermediate', cat: 'Commodities', baseSpread: 0.8, digits: 2, leverage: 100 },
  { symbol: 'SPX500', name: 'S&P 500 Index', full: 'US Wall Street 500 Index', cat: 'Indices', baseSpread: 0.6, digits: 1, leverage: 200 },
  { symbol: 'NAS100', name: 'Nasdaq 100', full: 'US Tech 100 Index', cat: 'Indices', baseSpread: 1.0, digits: 1, leverage: 200 },
  { symbol: 'NVDA', name: 'Nvidia Corp', full: 'Nvidia Corporation CFD', cat: 'Shares', baseSpread: 0.3, digits: 2, leverage: 20 },
  { symbol: 'AAPL', name: 'Apple Inc', full: 'Apple Inc CFD', cat: 'Shares', baseSpread: 0.2, digits: 2, leverage: 20 },
  { symbol: 'TSLA', name: 'Tesla Inc', full: 'Tesla Motors CFD', cat: 'Shares', baseSpread: 0.4, digits: 2, leverage: 20 }
];

export default function DashboardView({
  balance,
  setBalance,
  liveBalance,
  setLiveBalance,
  showToast,
  openPositions,
  setOpenPositions,
  addOpenPosition,
  closedPositions,
  transactions = [],
  user,
  quotes = {},
  setView,
  openReferModal,
  openVoiceModal,
  openOnboardingTour,
  displayCurrency = 'USD',
  setDisplayCurrency,
  formatCurrency = (amt) => `$${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  convertFromUSD = (amt) => amt
}: DashboardViewProps) {
  const [accountMode, setAccountMode] = useState<'live' | 'demo'>('live');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('EURUSD');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Terminal Bottom Tab
  const [activeTab, setActiveTab] = useState<'positions' | 'pending' | 'history' | 'alerts' | 'copy_trade' | 'equity_chart'>('positions');
  
  // Chart Configuration
  const [chartType, setChartType] = useState<'tradingview' | 'candlestick'>('tradingview');
  const [timeframe, setTimeframe] = useState<string>('1H');
  
  // Order Ticket State
  const [orderMode, setOrderMode] = useState<'market' | 'pending'>('market');
  const [pendingType, setPendingType] = useState<'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP'>('BUY_LIMIT');
  const [pendingPrice, setPendingPrice] = useState<string>('');
  const [tradeVolume, setTradeVolume] = useState<number>(0.10);
  const [isExecutingTrade, setIsExecutingTrade] = useState<boolean>(false);
  const [oneClickTrading, setOneClickTrading] = useState<boolean>(false);
  
  // Risk Parameters
  const [enableStopLoss, setEnableStopLoss] = useState<boolean>(false);
  const [stopLossPrice, setStopLossPrice] = useState<string>('');
  const [enableTakeProfit, setEnableTakeProfit] = useState<boolean>(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('');
  
  // Pending Orders State
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>('');

  // Position Modification Modal State
  const [editingPosition, setEditingPosition] = useState<TradeOrder | null>(null);
  const [editSl, setEditSl] = useState<string>('');
  const [editTp, setEditTp] = useState<string>('');

  // Find active instrument definition
  const activeInstrument = useMemo(() => {
    return INSTRUMENTS.find(i => i.symbol === selectedSymbol) || INSTRUMENTS[0];
  }, [selectedSymbol]);

  // Live Quote for selected symbol
  const activeQuote = useMemo(() => {
    const raw = quotes[selectedSymbol];
    if (raw && raw.price) {
      const spreadVal = (raw.askDiff || activeInstrument.baseSpread * 0.0001);
      const bid = raw.bid || (raw.price - spreadVal / 2);
      const ask = raw.ask || (raw.price + spreadVal / 2);
      return {
        price: raw.price,
        bid,
        ask,
        spreadPips: Number(((ask - bid) * (selectedSymbol.includes('JPY') ? 100 : selectedSymbol.includes('BTC') ? 1 : 10000)).toFixed(1)),
        change: raw.change || 0.15,
        high: raw.high || (raw.price * 1.004),
        low: raw.low || (raw.price * 0.996)
      };
    }
    // Default fallback quote
    const fallbackPrice = DEFAULT_MARKET_QUOTES[selectedSymbol]?.price || (selectedSymbol === 'EURUSD' ? 1.0482 : selectedSymbol === 'BTCUSD' ? 96450 : selectedSymbol === 'XAUUSD' ? 2915.40 : 154.60);
    return {
      price: fallbackPrice,
      bid: fallbackPrice - 0.0002,
      ask: fallbackPrice + 0.0002,
      spreadPips: activeInstrument.baseSpread,
      change: DEFAULT_MARKET_QUOTES[selectedSymbol]?.change ?? 0.24,
      high: fallbackPrice * 1.005,
      low: fallbackPrice * 0.995
    };
  }, [quotes, selectedSymbol, activeInstrument]);

  // Filtered Instruments List
  const filteredInstruments = useMemo(() => {
    return INSTRUMENTS.filter(inst => {
      const matchCat = categoryFilter === 'All' || inst.cat === categoryFilter;
      const matchSearch = inst.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inst.full.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [categoryFilter, searchQuery]);

  // Calculated Real-Time Metrics
  const currentFloatingProfit = useMemo(() => {
    return openPositions.reduce((acc, pos) => {
      const currentQ = quotes[pos.symbol];
      const curPrice = currentQ?.price || pos.currentPrice || pos.entryPrice;
      const mult = pos.symbol.includes('BTC') ? 1 : pos.symbol.includes('XAU') ? 100 : pos.symbol.includes('JPY') ? 1000 : 100000;
      const diff = pos.type === 'BUY' ? (curPrice - pos.entryPrice) : (pos.entryPrice - curPrice);
      return acc + (diff * pos.volume * mult);
    }, 0);
  }, [openPositions, quotes]);

  const activeEquity = Math.max(0, liveBalance + currentFloatingProfit);
  const usedMargin = openPositions.reduce((acc, pos) => {
    const inst = INSTRUMENTS.find(i => i.symbol === pos.symbol) || { leverage: 500 };
    return acc + ((pos.volume * 100000) / inst.leverage);
  }, 0);
  const freeMargin = Math.max(0, activeEquity - usedMargin);
  const marginLevel = usedMargin > 0 ? ((activeEquity / usedMargin) * 100).toFixed(1) : '999.9';

  // Contract Value & Margin Calculator for current order ticket
  const calculatedMarginRequired = useMemo(() => {
    const notional = tradeVolume * (selectedSymbol.includes('BTC') ? activeQuote.price : 100000);
    return notional / activeInstrument.leverage;
  }, [tradeVolume, selectedSymbol, activeQuote.price, activeInstrument.leverage]);

  const pipValueEst = useMemo(() => {
    if (selectedSymbol.includes('BTC')) return tradeVolume * 1;
    if (selectedSymbol.includes('XAU')) return tradeVolume * 10;
    return tradeVolume * 10;
  }, [tradeVolume, selectedSymbol]);

  // Execute Market Order
  const handleExecuteMarketOrder = (type: 'BUY' | 'SELL') => {
    const execPrice = type === 'BUY' ? activeQuote.ask : activeQuote.bid;

    if (calculatedMarginRequired > freeMargin) {
      showToast('Insufficient free margin to execute this position size. Please deposit funds or reduce lot volume.', 'error');
      return;
    }

    setIsExecutingTrade(true);

    setTimeout(() => {
      const slNum = enableStopLoss && stopLossPrice ? parseFloat(stopLossPrice) : undefined;
      const tpNum = enableTakeProfit && takeProfitPrice ? parseFloat(takeProfitPrice) : undefined;

      const newOrder: TradeOrder = {
        id: `AXI-${Math.floor(100000 + Math.random() * 900000)}`,
        symbol: selectedSymbol,
        type,
        volume: Number(tradeVolume),
        entryPrice: execPrice,
        currentPrice: execPrice,
        profit: 0,
        sl: slNum,
        tp: tpNum,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      if (addOpenPosition) {
        addOpenPosition(newOrder);
      } else if (setOpenPositions) {
        setOpenPositions(prev => [newOrder, ...prev]);
      }

      setIsExecutingTrade(false);
      showToast(`🎯 EXECUTION FILLED: ${type} ${tradeVolume} Lot(s) of ${selectedSymbol} at ${execPrice.toFixed(activeInstrument.digits)} (Ticket #${newOrder.id})`, 'success');
      
      // Reset SL/TP fields
      setStopLossPrice('');
      setTakeProfitPrice('');
      setEnableStopLoss(false);
      setEnableTakeProfit(false);
    }, 280);
  };

  // Place Pending Order
  const handlePlacePendingOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const targetP = parseFloat(pendingPrice);
    if (!targetP || targetP <= 0) {
      showToast('Please specify a valid pending trigger price.', 'error');
      return;
    }

    const order: PendingOrder = {
      id: `PEND-${Math.floor(100000 + Math.random() * 900000)}`,
      symbol: selectedSymbol,
      type: pendingType,
      volume: tradeVolume,
      targetPrice: targetP,
      currentPrice: activeQuote.price,
      timestamp: new Date().toLocaleTimeString(),
      sl: enableStopLoss && stopLossPrice ? parseFloat(stopLossPrice) : undefined,
      tp: enableTakeProfit && takeProfitPrice ? parseFloat(takeProfitPrice) : undefined
    };

    setPendingOrders(prev => [order, ...prev]);
    setPendingPrice('');
    showToast(`Pending Order placed: ${pendingType.replace('_', ' ')} ${tradeVolume} Lot ${selectedSymbol} @ ${targetP}`, 'success');
    setActiveTab('pending');
  };

  // Cancel Pending Order
  const handleCancelPendingOrder = (id: string) => {
    setPendingOrders(prev => prev.filter(p => p.id !== id));
    showToast(`Pending order #${id} cancelled.`, 'info');
  };

  // Close Open Position
  const handleClosePosition = (posId: string) => {
    if (!setOpenPositions) return;
    const pos = openPositions.find(p => p.id === posId);
    if (!pos) return;

    const curQ = quotes[pos.symbol];
    const curP = curQ?.price || pos.currentPrice || pos.entryPrice;
    const mult = pos.symbol.includes('BTC') ? 1 : pos.symbol.includes('XAU') ? 100 : pos.symbol.includes('JPY') ? 1000 : 100000;
    const diff = pos.type === 'BUY' ? (curP - pos.entryPrice) : (pos.entryPrice - curP);
    const finalProfit = diff * pos.volume * mult;

    setOpenPositions(prev => prev.filter(p => p.id !== posId));
    setLiveBalance(prev => prev + finalProfit);
    setBalance(prev => prev + finalProfit);

    showToast(`Position #${pos.id} (${pos.symbol}) closed. Realized P/L: ${finalProfit >= 0 ? '+' : ''}$${finalProfit.toFixed(2)}`, 'info');
  };

  // Bulk Close All Positions
  const handleCloseAllPositions = () => {
    if (!setOpenPositions || openPositions.length === 0) return;
    
    let totalRealized = 0;
    openPositions.forEach(pos => {
      const curQ = quotes[pos.symbol];
      const curP = curQ?.price || pos.currentPrice || pos.entryPrice;
      const mult = pos.symbol.includes('BTC') ? 1 : pos.symbol.includes('XAU') ? 100 : pos.symbol.includes('JPY') ? 1000 : 100000;
      const diff = pos.type === 'BUY' ? (curP - pos.entryPrice) : (pos.entryPrice - curP);
      totalRealized += (diff * pos.volume * mult);
    });

    setOpenPositions([]);
    setLiveBalance(prev => prev + totalRealized);
    setBalance(prev => prev + totalRealized);

    showToast(`Closed all ${openPositions.length} active positions. Total P/L: ${totalRealized >= 0 ? '+' : ''}$${totalRealized.toFixed(2)}`, 'info');
  };

  // Save Position SL/TP Modification
  const handleSavePositionEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPosition || !setOpenPositions) return;

    const newSl = editSl ? parseFloat(editSl) : undefined;
    const newTp = editTp ? parseFloat(editTp) : undefined;

    setOpenPositions(prev => prev.map(p => {
      if (p.id === editingPosition.id) {
        return { ...p, sl: newSl, tp: newTp };
      }
      return p;
    }));

    setEditingPosition(null);
    showToast(`Updated Stop Loss & Take Profit limits for position #${editingPosition.id}`, 'success');
  };

  // Create Price Alert
  const handleCreatePriceAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(alertTargetPrice);
    if (!target || target <= 0) {
      showToast('Please specify target alert price.', 'error');
      return;
    }

    const dir = target >= activeQuote.price ? 'ABOVE' : 'BELOW';
    const newAlert: PriceAlert = {
      id: `ALT-${Math.floor(100000 + Math.random() * 900000)}`,
      symbol: selectedSymbol,
      targetPrice: target,
      condition: dir,
      direction: dir,
      createdAt: new Date().toLocaleTimeString(),
      isTriggered: false,
      active: true
    };

    setPriceAlerts(prev => [newAlert, ...prev]);
    setAlertTargetPrice('');
    showToast(`Price Alert set for ${selectedSymbol} when price crosses ${target}`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#0E131B] text-slate-100 flex flex-col font-sans select-none">
      
      {/* 1. TOP INSTITUTIONAL RIBBON / SERVER HEADER */}
      <header className="bg-[#141B26] border-b border-slate-800 px-4 py-2.5 shrink-0">
        <div className="max-w-[1920px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Left: Server Connection & Account Selector */}
          <div className="flex items-center gap-3.5 flex-wrap">
            <div className="flex items-center gap-2 pr-3.5 border-r border-slate-700/60">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="text-[11px] font-mono">
                <span className="text-slate-300 font-bold">AxiCorp-Live MT5</span>
                <span className="text-slate-500 ml-1.5">(12ms • STP)</span>
              </div>
            </div>

            {/* Account Selector & Mode Switch */}
            <div className="flex items-center bg-[#0B0F17] rounded-lg p-0.5 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setAccountMode('live')}
                className={`px-3 py-1 rounded font-black uppercase text-[10px] tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                  accountMode === 'live'
                    ? 'bg-[#E3000F] text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                Live ECN (#8849201)
              </button>
              <button
                type="button"
                onClick={() => setAccountMode('demo')}
                className={`px-3 py-1 rounded font-black uppercase text-[10px] tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                  accountMode === 'demo'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Demo Practice
              </button>
            </div>

            <div className="hidden sm:flex items-center text-[11px] text-slate-400 gap-2 pl-2">
              <span>Leverage: <strong className="text-slate-200 font-mono">1:500</strong></span>
              <span>•</span>
              <span>Currency: <strong className="text-slate-200 font-mono">{displayCurrency}</strong></span>
            </div>
          </div>

          {/* Center/Right: Account Financial Ledger Ribbon */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1 text-xs">
            
            <div className="bg-[#182232] px-3 py-1.5 rounded-lg border border-slate-700/60 shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Balance</div>
              <div className="font-mono font-black text-white text-sm">
                {formatCurrency(liveBalance)}
              </div>
            </div>

            <div className="bg-[#182232] px-3 py-1.5 rounded-lg border border-slate-700/60 shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Equity</div>
              <div className="font-mono font-black text-slate-100 text-sm">
                {formatCurrency(activeEquity)}
              </div>
            </div>

            <div className="bg-[#182232] px-3 py-1.5 rounded-lg border border-slate-700/60 shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Floating P/L</div>
              <div className={`font-mono font-black text-sm flex items-center gap-1 ${
                currentFloatingProfit >= 0 ? 'text-emerald-400' : 'text-[#FF4D5A]'
              }`}>
                {currentFloatingProfit >= 0 ? '+' : ''}${currentFloatingProfit.toFixed(2)}
              </div>
            </div>

            <div className="hidden md:block bg-[#182232] px-3 py-1.5 rounded-lg border border-slate-700/60 shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Free Margin</div>
              <div className="font-mono font-black text-slate-200 text-sm">
                {formatCurrency(freeMargin)}
              </div>
            </div>

            <div className="hidden lg:block bg-[#182232] px-3 py-1.5 rounded-lg border border-slate-700/60 shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Margin Level</div>
              <div className="font-mono font-black text-emerald-400 text-sm">
                {marginLevel}%
              </div>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-2 shrink-0 ml-1">
              <button
                type="button"
                onClick={() => setView('funds')}
                className="bg-[#E3000F] hover:bg-red-700 active:bg-red-800 text-white font-black text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Deposit</span>
              </button>

              <button
                type="button"
                onClick={() => setView('funds')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs uppercase tracking-wider px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer transition"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Withdraw</span>
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* 2. MAIN 3-COLUMN TRADING TERMINAL WORKSPACE */}
      <div className="flex-1 max-w-[1920px] w-full mx-auto p-2 sm:p-3 grid grid-cols-1 lg:grid-cols-12 gap-2.5">
        
        {/* ================= COLUMN 1: MARKET WATCH (3 Cols) ================= */}
        <div className="lg:col-span-3 bg-[#141B26] rounded-xl border border-slate-800/90 flex flex-col h-[520px] lg:h-[580px] overflow-hidden shadow-lg">
          
          {/* Search & Header */}
          <div className="p-3 border-b border-slate-800 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#E3000F]" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">Market Watch</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{filteredInstruments.length} Pairs</span>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol (e.g. EUR, BTC, Gold)..."
                className="w-full bg-[#0E131B] border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-[#E3000F]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[10px]">
              {['All', 'Forex', 'Crypto', 'Commodities', 'Indices', 'Shares'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md font-bold uppercase tracking-wider shrink-0 transition cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#E3000F] text-white'
                      : 'bg-[#0E131B] text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quotes Table Header */}
          <div className="grid grid-cols-12 px-3 py-2 bg-[#0E131B]/70 border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
            <div className="col-span-5">Symbol</div>
            <div className="col-span-3 text-right">Bid</div>
            <div className="col-span-3 text-right">Ask</div>
            <div className="col-span-1 text-right">Spread</div>
          </div>

          {/* Quotes Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {filteredInstruments.map((inst) => {
              const raw = quotes[inst.symbol];
              const price = raw?.price || DEFAULT_MARKET_QUOTES[inst.symbol]?.price || (inst.symbol === 'EURUSD' ? 1.0482 : inst.symbol === 'BTCUSD' ? 96450 : 2915.40);
              const spreadVal = raw?.askDiff || inst.baseSpread * 0.0001;
              const bid = raw?.bid || (price - spreadVal / 2);
              const ask = raw?.ask || (price + spreadVal / 2);
              const change = raw?.change ?? DEFAULT_MARKET_QUOTES[inst.symbol]?.change ?? 0.12;
              const isSelected = selectedSymbol === inst.symbol;

              return (
                <div
                  key={inst.symbol}
                  onClick={() => setSelectedSymbol(inst.symbol)}
                  className={`grid grid-cols-12 px-3 py-2.5 items-center text-xs transition cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#E3000F]/10 border-l-2 border-[#E3000F]'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="col-span-5 flex items-center gap-2">
                    <AssetBrandLogo symbol={inst.symbol} size="sm" />
                    <div>
                      <div className="font-extrabold text-slate-200">{inst.symbol}</div>
                      <div className="text-[9px] text-slate-400 truncate max-w-[90px]">{inst.cat}</div>
                    </div>
                  </div>

                  <div className="col-span-3 text-right font-mono font-bold text-slate-200">
                    {bid.toFixed(inst.digits)}
                  </div>

                  <div className="col-span-3 text-right font-mono font-bold text-slate-200">
                    {ask.toFixed(inst.digits)}
                  </div>

                  <div className="col-span-1 text-right">
                    <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">
                      {inst.baseSpread}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* ================= COLUMN 2: CHARTING STATION (6 Cols) ================= */}
        <div className="lg:col-span-6 bg-[#141B26] rounded-xl border border-slate-800/90 flex flex-col h-[520px] lg:h-[580px] overflow-hidden shadow-lg">
          
          {/* Chart Top Header Toolbar */}
          <div className="p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-[#111722]">
            
            {/* Symbol Title & Live Info */}
            <div className="flex items-center gap-3">
              <AssetBrandLogo symbol={selectedSymbol} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-white">{selectedSymbol}</h2>
                  <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {activeInstrument.cat}
                  </span>
                  <span className={`text-xs font-mono font-black ${
                    activeQuote.change >= 0 ? 'text-emerald-400' : 'text-[#FF4D5A]'
                  }`}>
                    {activeQuote.change >= 0 ? '+' : ''}{activeQuote.change.toFixed(2)}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {activeInstrument.full} • 24h High: <strong className="text-slate-300 font-mono">{activeQuote.high.toFixed(activeInstrument.digits)}</strong> • Low: <strong className="text-slate-300 font-mono">{activeQuote.low.toFixed(activeInstrument.digits)}</strong>
                </div>
              </div>
            </div>

            {/* Timeframe & Chart Style Switcher */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-[#0E131B] rounded-lg p-0.5 border border-slate-800 text-[10px] font-bold">
                {['1M', '5M', '15M', '1H', '4H', '1D'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2 py-1 rounded transition cursor-pointer ${
                      timeframe === tf
                        ? 'bg-[#E3000F] text-white font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <div className="flex items-center bg-[#0E131B] rounded-lg p-0.5 border border-slate-800 text-[10px]">
                <button
                  onClick={() => setChartType('tradingview')}
                  className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                    chartType === 'tradingview' ? 'bg-slate-700 text-white font-black' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  TradingView
                </button>
                <button
                  onClick={() => setChartType('candlestick')}
                  className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                    chartType === 'candlestick' ? 'bg-slate-700 text-white font-black' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Candles
                </button>
              </div>
            </div>

          </div>

          {/* Active Chart Viewport */}
          <div className="flex-1 w-full relative bg-[#0B0F17]">
            {chartType === 'tradingview' ? (
              <TradingViewWidget 
                symbol={selectedSymbol} 
                theme="dark" 
                height="100%" 
                autosize 
              />
            ) : (
              <div className="h-full p-2">
                <RechartsCandlestickChart 
                  symbol={selectedSymbol} 
                  data={[]}
                  currentPrice={activeQuote.price}
                  height={500}
                />
              </div>
            )}

            {/* Active Floating Position Pill on Chart */}
            {openPositions.filter(p => p.symbol === selectedSymbol).length > 0 && (
              <div className="absolute top-3 left-3 bg-[#141B26]/90 border border-slate-700 rounded-lg px-3 py-1.5 backdrop-blur-md text-[11px] shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-slate-200">Active Trade Open:</span>
                <span className="font-mono text-emerald-400 font-black">
                  {openPositions.filter(p => p.symbol === selectedSymbol).reduce((acc, p) => acc + p.volume, 0).toFixed(2)} Lot(s)
                </span>
              </div>
            )}
          </div>

        </div>

        {/* ================= COLUMN 3: ORDER EXECUTION TICKET (3 Cols) ================= */}
        <div className="lg:col-span-3 bg-[#141B26] rounded-xl border border-slate-800/90 flex flex-col h-[520px] lg:h-[580px] overflow-hidden shadow-lg p-3.5 justify-between">
          
          <div className="space-y-3">
            
            {/* Header with 1-Click Toggle */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#E3000F]" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">Order Ticket</span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-slate-400">1-Click</span>
                <button
                  type="button"
                  onClick={() => setOneClickTrading(!oneClickTrading)}
                  className={`w-7 h-4 rounded-full transition relative cursor-pointer ${
                    oneClickTrading ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white transition absolute top-0.5 ${
                    oneClickTrading ? 'left-3.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {/* Market vs Pending Order Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-[#0E131B] p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setOrderMode('market')}
                className={`py-1.5 rounded font-bold uppercase tracking-wider text-[11px] transition cursor-pointer ${
                  orderMode === 'market' ? 'bg-slate-700 text-white font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Market Exec
              </button>
              <button
                type="button"
                onClick={() => setOrderMode('pending')}
                className={`py-1.5 rounded font-bold uppercase tracking-wider text-[11px] transition cursor-pointer ${
                  orderMode === 'pending' ? 'bg-slate-700 text-white font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pending Order
              </button>
            </div>

            {/* DUAL BUY / SELL BOX (Market Mode) */}
            {orderMode === 'market' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  
                  {/* SELL BUTTON */}
                  <button
                    type="button"
                    disabled={isExecutingTrade}
                    onClick={() => handleExecuteMarketOrder('SELL')}
                    className="bg-[#FF4D5A]/15 hover:bg-[#FF4D5A]/25 border-2 border-[#FF4D5A] active:scale-98 rounded-xl p-3 text-left transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#FF4D5A]">
                      <span>SELL</span>
                      <TrendingDown className="w-3.5 h-3.5" />
                    </div>
                    <div className="font-mono font-black text-lg text-white mt-1 group-hover:text-[#FF4D5A] transition">
                      {activeQuote.bid.toFixed(activeInstrument.digits)}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">Bid Execution</div>
                  </button>

                  {/* BUY BUTTON */}
                  <button
                    type="button"
                    disabled={isExecutingTrade}
                    onClick={() => handleExecuteMarketOrder('BUY')}
                    className="bg-emerald-500/15 hover:bg-emerald-500/25 border-2 border-emerald-500 active:scale-98 rounded-xl p-3 text-left transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-emerald-400">
                      <span>BUY</span>
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div className="font-mono font-black text-lg text-white mt-1 group-hover:text-emerald-400 transition">
                      {activeQuote.ask.toFixed(activeInstrument.digits)}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">Ask Execution</div>
                  </button>

                </div>

                {/* Central Spread Badge */}
                <div className="text-center">
                  <span className="text-[10px] font-mono text-slate-400 bg-[#0E131B] border border-slate-800 px-2.5 py-0.5 rounded-full">
                    Spread: <strong className="text-amber-400">{activeQuote.spreadPips} pips</strong>
                  </span>
                </div>
              </div>
            ) : (
              /* PENDING ORDER FORM */
              <div className="space-y-2 bg-[#0E131B] p-2.5 rounded-xl border border-slate-800">
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  {(['BUY_LIMIT', 'SELL_LIMIT', 'BUY_STOP', 'SELL_STOP'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPendingType(t)}
                      className={`py-1 rounded font-bold uppercase transition cursor-pointer ${
                        pendingType === t ? 'bg-[#E3000F] text-white' : 'bg-[#182232] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Trigger Price:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={pendingPrice}
                    onChange={(e) => setPendingPrice(e.target.value)}
                    placeholder={`Current: ${activeQuote.price}`}
                    className="w-full bg-[#182232] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-[#E3000F]"
                  />
                </div>
              </div>
            )}

            {/* LOT SIZE / VOLUME SIZER */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>Volume (Lots):</span>
                <span className="font-mono text-slate-400">{tradeVolume.toFixed(2)} Lot ({tradeVolume * 100000} Units)</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTradeVolume(prev => Math.max(0.01, Number((prev - 0.05).toFixed(2))))}
                  className="bg-[#0E131B] hover:bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer"
                >
                  -0.05
                </button>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="50"
                  value={tradeVolume}
                  onChange={(e) => setTradeVolume(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                  className="flex-1 bg-[#0E131B] border border-slate-700 rounded-lg py-1.5 text-center font-mono font-black text-sm text-white outline-none focus:border-[#E3000F]"
                />
                <button
                  type="button"
                  onClick={() => setTradeVolume(prev => Number((prev + 0.05).toFixed(2)))}
                  className="bg-[#0E131B] hover:bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer"
                >
                  +0.05
                </button>
              </div>

              {/* Quick Volume Preset Pills */}
              <div className="flex items-center gap-1 mt-1.5 text-[10px] font-mono">
                {[0.01, 0.05, 0.10, 0.50, 1.00].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTradeVolume(v)}
                    className={`flex-1 py-1 rounded bg-[#0E131B] hover:bg-slate-800 border transition cursor-pointer ${
                      tradeVolume === v ? 'border-[#E3000F] text-[#E3000F] font-black' : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    {v.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            {/* STOP LOSS & TAKE PROFIT TOGGLES */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              
              {/* SL */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-300 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableStopLoss}
                    onChange={(e) => setEnableStopLoss(e.target.checked)}
                    className="accent-[#FF4D5A]"
                  />
                  <span>Stop Loss (SL)</span>
                </label>
                {enableStopLoss && (
                  <input
                    type="number"
                    step="0.0001"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(e.target.value)}
                    placeholder="Rate"
                    className="w-24 bg-[#0E131B] border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-mono outline-none"
                  />
                )}
              </div>

              {/* TP */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-300 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableTakeProfit}
                    onChange={(e) => setEnableTakeProfit(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span>Take Profit (TP)</span>
                </label>
                {enableTakeProfit && (
                  <input
                    type="number"
                    step="0.0001"
                    value={takeProfitPrice}
                    onChange={(e) => setTakeProfitPrice(e.target.value)}
                    placeholder="Rate"
                    className="w-24 bg-[#0E131B] border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-mono outline-none"
                  />
                )}
              </div>

            </div>

          </div>

          {/* Bottom Execution Breakdown & Pending Button */}
          <div className="pt-2 border-t border-slate-800 space-y-2 text-[10px]">
            <div className="bg-[#0E131B] p-2 rounded-lg border border-slate-800 space-y-1 text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>Req. Margin:</span>
                <span className="text-slate-200 font-bold">${calculatedMarginRequired.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span>Pip Value:</span>
                <span className="text-slate-200 font-bold">${pipValueEst.toFixed(2)} / pip</span>
              </div>
            </div>

            {orderMode === 'pending' && (
              <button
                type="button"
                onClick={handlePlacePendingOrder}
                className="w-full bg-[#E3000F] hover:bg-red-700 active:bg-red-800 text-white font-black py-2.5 rounded-lg text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
              >
                Place Pending Order
              </button>
            )}
          </div>

        </div>

      </div>

      {/* 3. BOTTOM FULL-WIDTH TERMINAL WORKSPACE (LEDGER & ANALYTICS) */}
      <div className="max-w-[1920px] w-full mx-auto p-2 sm:p-3 flex-1 flex flex-col">
        <div className="bg-[#141B26] rounded-xl border border-slate-800/90 flex-1 flex flex-col overflow-hidden shadow-lg min-h-[340px]">
          
          {/* Terminal Tabs Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#111722] px-3 pt-2 overflow-x-auto gap-2">
            <div className="flex items-center gap-1">
              
              <button
                type="button"
                onClick={() => setActiveTab('positions')}
                className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'positions'
                    ? 'border-[#E3000F] text-[#E3000F]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Open Positions ({openPositions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'pending'
                    ? 'border-[#E3000F] text-[#E3000F]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Orders ({pendingOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'history'
                    ? 'border-[#E3000F] text-[#E3000F]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Trade History ({closedPositions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('alerts')}
                className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'alerts'
                    ? 'border-[#E3000F] text-[#E3000F]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Price Alerts ({priceAlerts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('copy_trade')}
                className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'copy_trade'
                    ? 'border-[#E3000F] text-[#E3000F]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Copy Trading</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('equity_chart')}
                className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'equity_chart'
                    ? 'border-[#E3000F] text-[#E3000F]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Equity Growth</span>
              </button>

            </div>

            {/* Action for Positions Tab */}
            {activeTab === 'positions' && openPositions.length > 0 && (
              <button
                type="button"
                onClick={handleCloseAllPositions}
                className="mb-2 bg-[#FF4D5A]/20 hover:bg-[#FF4D5A]/30 text-[#FF4D5A] border border-[#FF4D5A]/40 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg transition cursor-pointer"
              >
                Close All ({openPositions.length})
              </button>
            )}
          </div>

          {/* TAB 1: OPEN POSITIONS TABLE */}
          {activeTab === 'positions' && (
            <div className="flex-1 overflow-x-auto">
              {openPositions.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <Activity className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-300">No Active Positions</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Select an instrument from Market Watch and click BUY or SELL in the Order Ticket to open a live position.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0E131B] text-slate-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Ticket</th>
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Volume</th>
                      <th className="py-2.5 px-3">Open Price</th>
                      <th className="py-2.5 px-3">Current Price</th>
                      <th className="py-2.5 px-3">S/L</th>
                      <th className="py-2.5 px-3">T/P</th>
                      <th className="py-2.5 px-3">Swap</th>
                      <th className="py-2.5 px-3">Floating P/L ($)</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {openPositions.map((pos) => {
                      const curQuote = quotes[pos.symbol];
                      const curPrice = curQuote?.price || pos.currentPrice || pos.entryPrice;
                      const mult = pos.symbol.includes('BTC') ? 1 : pos.symbol.includes('XAU') ? 100 : pos.symbol.includes('JPY') ? 1000 : 100000;
                      const diff = pos.type === 'BUY' ? (curPrice - pos.entryPrice) : (pos.entryPrice - curPrice);
                      const pnl = diff * pos.volume * mult;

                      return (
                        <tr key={pos.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-2.5 px-3 font-mono text-slate-400">{pos.id}</td>
                          <td className="py-2.5 px-3 font-extrabold text-white flex items-center gap-1.5">
                            <AssetBrandLogo symbol={pos.symbol} size="sm" />
                            <span>{pos.symbol}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              pos.type === 'BUY' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#FF4D5A]/15 text-[#FF4D5A]'
                            }`}>
                              {pos.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-200">{pos.volume.toFixed(2)} Lot</td>
                          <td className="py-2.5 px-3 font-mono text-slate-300">{pos.entryPrice.toFixed(4)}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-200 font-bold">{curPrice.toFixed(4)}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">{pos.sl ? pos.sl.toFixed(4) : '-'}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">{pos.tp ? pos.tp.toFixed(4) : '-'}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">$0.00</td>
                          <td className={`py-2.5 px-3 font-mono font-black text-sm ${
                            pnl >= 0 ? 'text-emerald-400' : 'text-[#FF4D5A]'
                          }`}>
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPosition(pos);
                                setEditSl(pos.sl ? String(pos.sl) : '');
                                setEditTp(pos.tp ? String(pos.tp) : '');
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                            >
                              Modify
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClosePosition(pos.id)}
                              className="bg-[#FF4D5A]/20 hover:bg-[#FF4D5A]/30 text-[#FF4D5A] px-2.5 py-1 rounded text-[10px] font-black uppercase transition cursor-pointer"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 2: PENDING ORDERS TABLE */}
          {activeTab === 'pending' && (
            <div className="flex-1 overflow-x-auto">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-300">No Pending Orders</h4>
                  <p className="text-xs text-slate-500 mt-1">Use the Pending Order mode in the Order Ticket to set limit or stop triggers.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0E131B] text-slate-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Order #</th>
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Volume</th>
                      <th className="py-2.5 px-3">Trigger Price</th>
                      <th className="py-2.5 px-3">Market Price</th>
                      <th className="py-2.5 px-3">Placed Time</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {pendingOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{ord.id}</td>
                        <td className="py-2.5 px-3 font-bold text-white">{ord.symbol}</td>
                        <td className="py-2.5 px-3 font-bold text-amber-400">{ord.type.replace('_', ' ')}</td>
                        <td className="py-2.5 px-3 font-mono">{ord.volume.toFixed(2)} Lot</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-white">{ord.targetPrice.toFixed(4)}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{activeQuote.price.toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-slate-400">{ord.timestamp}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleCancelPendingOrder(ord.id)}
                            className="bg-slate-800 hover:bg-[#FF4D5A]/20 hover:text-[#FF4D5A] text-slate-300 px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 3: CLOSED HISTORY */}
          {activeTab === 'history' && (
            <div className="flex-1 overflow-x-auto">
              {closedPositions.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-300">No Closed Trades Yet</h4>
                  <p className="text-xs text-slate-500 mt-1">Closed positions and settlement history will be recorded here.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0E131B] text-slate-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Ticket</th>
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Volume</th>
                      <th className="py-2.5 px-3">Open Price</th>
                      <th className="py-2.5 px-3">Close Price</th>
                      <th className="py-2.5 px-3">Closed Time</th>
                      <th className="py-2.5 px-3 text-right">Realized Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {closedPositions.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{item.id || `CLO-${idx}`}</td>
                        <td className="py-2.5 px-3 font-bold text-white">{item.symbol}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            item.type === 'BUY' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#FF4D5A]/15 text-[#FF4D5A]'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{item.volume.toFixed(2)} Lot</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{item.openPrice ? item.openPrice.toFixed(4) : '-'}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-200">{item.closePrice ? item.closePrice.toFixed(4) : '-'}</td>
                        <td className="py-2.5 px-3 text-slate-400">{item.closeTime || 'Today'}</td>
                        <td className={`py-2.5 px-3 font-mono font-black text-right ${
                          item.profit >= 0 ? 'text-emerald-400' : 'text-[#FF4D5A]'
                        }`}>
                          {item.profit >= 0 ? '+' : ''}${item.profit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 4: PRICE ALERTS */}
          {activeTab === 'alerts' && (
            <div className="p-4 flex-1">
              <form onSubmit={handleCreatePriceAlert} className="flex items-center gap-3 bg-[#0E131B] p-3 rounded-xl border border-slate-800 max-w-xl mb-4">
                <span className="text-xs font-bold text-slate-300">Set Alert for {selectedSymbol}:</span>
                <input
                  type="number"
                  step="0.0001"
                  value={alertTargetPrice}
                  onChange={(e) => setAlertTargetPrice(e.target.value)}
                  placeholder={`Current: ${activeQuote.price}`}
                  className="bg-[#182232] border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white font-mono flex-1 outline-none"
                />
                <button
                  type="submit"
                  className="bg-[#E3000F] hover:bg-red-700 text-white text-xs font-black uppercase px-4 py-1.5 rounded-lg cursor-pointer transition"
                >
                  Add Alert
                </button>
              </form>

              {priceAlerts.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  No active price alerts set.
                </div>
              ) : (
                <div className="space-y-2">
                  {priceAlerts.map(alt => (
                    <div key={alt.id} className="flex items-center justify-between bg-[#0E131B] p-3 rounded-lg border border-slate-800 text-xs">
                      <div>
                        <strong className="text-white">{alt.symbol}</strong> triggers when price goes <span className="font-bold text-amber-400">{alt.direction}</span> <strong className="font-mono text-slate-200">{alt.targetPrice}</strong>
                      </div>
                      <button
                        onClick={() => setPriceAlerts(prev => prev.filter(a => a.id !== alt.id))}
                        className="text-slate-400 hover:text-[#FF4D5A] text-[10px] uppercase font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COPY TRADING */}
          {activeTab === 'copy_trade' && (
            <div className="p-4 flex-1 overflow-y-auto">
              <CopyTradeSection 
                activeBalance={liveBalance}
                accountMode={accountMode}
                openPositions={openPositions}
                addOpenPosition={addOpenPosition}
                setOpenPositions={setOpenPositions}
                showToast={showToast}
                quotes={quotes}
                formatCurrency={formatCurrency}
                userEmail={user?.email || 'trader@axi.com'}
              />
            </div>
          )}

          {/* TAB 6: EQUITY GROWTH CHART */}
          {activeTab === 'equity_chart' && (
            <div className="p-4 flex-1 h-[280px]">
              <BalanceHistoryChart 
                activeBalance={liveBalance}
                closedPositions={closedPositions}
                transactions={transactions}
                user={user}
                accountMode={accountMode}
              />
            </div>
          )}

          {/* Terminal Bottom Status Bar */}
          <div className="bg-[#0E131B] border-t border-slate-800 px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono shrink-0">
            <div className="flex items-center gap-3">
              <span>Status: <strong className="text-emerald-400">Connected</strong></span>
              <span>•</span>
              <span>Open Lots: <strong className="text-slate-200">{openPositions.reduce((acc, p) => acc + p.volume, 0).toFixed(2)}</strong></span>
            </div>
            <div>
              <span>Platform Time: {new Date().toUTCString().substring(17, 25)} UTC</span>
            </div>
          </div>

        </div>
      </div>

      {/* POSITION MODIFY MODAL (SL / TP) */}
      <AnimatePresence>
        {editingPosition && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141B26] border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl text-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="text-sm font-black uppercase text-white">
                  Modify Position #{editingPosition.id}
                </h3>
                <button onClick={() => setEditingPosition(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs space-y-1 bg-[#0E131B] p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Symbol / Type:</span>
                  <span className="font-bold text-white">{editingPosition.symbol} ({editingPosition.type})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Entry Price:</span>
                  <span className="font-mono text-slate-200">{editingPosition.entryPrice.toFixed(4)}</span>
                </div>
              </div>

              <form onSubmit={handleSavePositionEdit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Stop Loss Price (SL):</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editSl}
                    onChange={(e) => setEditSl(e.target.value)}
                    placeholder="e.g. 1.0800"
                    className="w-full bg-[#0E131B] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-[#E3000F]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Take Profit Price (TP):</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editTp}
                    onChange={(e) => setEditTp(e.target.value)}
                    placeholder="e.g. 1.0950"
                    className="w-full bg-[#0E131B] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingPosition(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#E3000F] hover:bg-red-700 text-white font-black py-2 rounded-xl text-xs uppercase cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
