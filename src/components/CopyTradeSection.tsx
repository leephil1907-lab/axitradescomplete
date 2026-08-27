import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Trophy, TrendingUp, ShieldCheck, ArrowUpRight, CheckCircle2, 
  AlertCircle, DollarSign, Filter, Search, Award, Sparkles, Sliders, 
  RefreshCw, Check, X, ShieldAlert, Play, StopCircle, Eye, Layers, ChevronRight, Loader2
} from 'lucide-react';
import { TradeOrder, DisplayCurrency } from '../types';
import { sendTelegramAlert } from '../utils/telegram';

export interface LeaderboardTrader {
  id: string;
  rank: number;
  name: string;
  handle: string;
  avatarUrl: string;
  country: string;
  countryFlag: string;
  badge: string;
  roiYear: number;
  winRate: number;
  copiers: number;
  riskScore: number; // 1-10
  maxDrawdown: number;
  allocatedCapitalTotal: string;
  strategy: string;
  assetFocus: string;
  monthlyPerformance: number[];
  openPositions: {
    symbol: string;
    type: 'BUY' | 'SELL';
    volume: number; // base lot size
    entryPrice: number;
    floatingPnL: number;
    stopLoss?: number;
    takeProfit?: number;
  }[];
}

export const LEADERBOARD_MASTERS: LeaderboardTrader[] = [];


interface CopiedTraderRecord {
  traderId: string;
  traderName: string;
  allocatedAmount: number;
  lotMultiplier: number;
  copiedAt: string;
  mirroredPositionIds: string[];
}

interface CopyTradeSectionProps {
  activeBalance: number;
  accountMode: 'demo' | 'live';
  openPositions: TradeOrder[];
  addOpenPosition?: (position: TradeOrder) => void;
  setOpenPositions?: React.Dispatch<React.SetStateAction<TradeOrder[]>>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  quotes?: Record<string, any>;
  formatCurrency?: (usdAmount: number, targetCurrency?: DisplayCurrency, decimals?: number) => string;
  userEmail?: string;
}

export default function CopyTradeSection({
  activeBalance,
  accountMode,
  openPositions,
  addOpenPosition,
  setOpenPositions,
  showToast,
  quotes,
  formatCurrency = (amt) => `$${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  userEmail = 'trader@axi.com'
}: CopyTradeSectionProps) {
  const [selectedAssetFilter, setSelectedAssetFilter] = useState<'ALL' | 'Forex' | 'Gold/Commodities' | 'Crypto'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTraderForModal, setSelectedTraderForModal] = useState<LeaderboardTrader | null>(null);

  // Verified master traders — fetched live from the backend leaderboard store.
  // No fabricated/premade traders are ever shown; the list is empty until real
  // verified traders are added by the admin team.
  const [traders, setTraders] = useState<LeaderboardTrader[]>([]);
  const [tradersLoading, setTradersLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    const loadTraders = () => {
      setTradersLoading(true);
      fetch('/api/leaderboard')
        .then(r => r.ok ? r.json() : null)
        .then(j => {
          if (cancelled) return;
          const list: LeaderboardTrader[] = Array.isArray(j?.traders) ? j.traders : [];
          setTraders(list);
          setTradersLoading(false);
        })
        .catch(() => { if (!cancelled) { setTraders([]); setTradersLoading(false); } });
    };
    loadTraders();
    return () => { cancelled = true; };
  }, []);

  // Copy modal settings
  const [allocationAmount, setAllocationAmount] = useState<number>(1000);
  const [lotMultiplier, setLotMultiplier] = useState<number>(1.0);
  const [enableStopLossProtection, setEnableStopLossProtection] = useState<boolean>(true);
  const [maxDrawdownPct, setMaxDrawdownPct] = useState<number>(15);

  // Persistent copied traders state
  const [copiedTraders, setCopiedTraders] = useState<CopiedTraderRecord[]>(() => {
    try {
      const saved = localStorage.getItem('axi_copied_traders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('axi_copied_traders', JSON.stringify(copiedTraders));
    } catch (e) {
      console.error('Error saving copied traders:', e);
    }
  }, [copiedTraders]);

  // Filtered leaderboard
  const filteredTraders = traders.filter(t => {
    if (selectedAssetFilter === 'Forex' && !t.assetFocus.includes('EUR') && !t.assetFocus.includes('GBP') && !t.assetFocus.includes('JPY')) return false;
    if (selectedAssetFilter === 'Gold/Commodities' && !t.assetFocus.includes('XAU') && !t.assetFocus.includes('USO') && !t.assetFocus.includes('Brent')) return false;
    if (selectedAssetFilter === 'Crypto' && !t.assetFocus.includes('BTC') && !t.assetFocus.includes('ETH')) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.handle.toLowerCase().includes(q) || t.country.toLowerCase().includes(q) || t.strategy.toLowerCase().includes(q);
    }
    return true;
  });

  // Check if a trader is currently being copied
  const isTraderCopied = (traderId: string) => copiedTraders.some(c => c.traderId === traderId);

  // Handle Start Copying Trader
  const handleConfirmCopyTrader = () => {
    if (!selectedTraderForModal) return;

    if (allocationAmount > activeBalance && activeBalance > 0) {
      showToast(`Insufficient balance for $${allocationAmount.toLocaleString()} allocation. Your active ${accountMode.toUpperCase()} balance is $${activeBalance.toLocaleString()}.`, 'error');
      return;
    }

    const trader = selectedTraderForModal;
    const newMirroredIds: string[] = [];

    // Create mirrored trades for each open position held by the master trader
    trader.openPositions.forEach(p => {
      const livePrice = quotes?.[p.symbol]?.price || p.entryPrice;
      const scaledVolume = parseFloat((p.volume * lotMultiplier).toFixed(2)) || 0.10;

      const newMirroredTrade: TradeOrder = {
        id: `MIRROR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        symbol: p.symbol,
        type: p.type,
        entryPrice: livePrice,
        currentPrice: livePrice,
        volume: scaledVolume,
        profit: 0.00,
        timestamp: new Date().toISOString(),
      };

      newMirroredIds.push(newMirroredTrade.id);

      if (addOpenPosition) {
        addOpenPosition(newMirroredTrade);
      } else if (setOpenPositions) {
        setOpenPositions(prev => [...prev, newMirroredTrade]);
      }
    });

    const newRecord: CopiedTraderRecord = {
      traderId: trader.id,
      traderName: trader.name,
      allocatedAmount: allocationAmount,
      lotMultiplier: lotMultiplier,
      copiedAt: new Date().toISOString(),
      mirroredPositionIds: newMirroredIds
    };

    setCopiedTraders(prev => [...prev.filter(c => c.traderId !== trader.id), newRecord]);

    // Send Telegram Notification Alert
    sendTelegramAlert('COPY_TRADE_ACTIVATED', `🚀 Copy-Trading Activated: User Mirrored Trader ${trader.name}`, {
      'User Email': userEmail,
      'Copied Master Trader': `${trader.name} (${trader.handle})`,
      'Trader Country': `${trader.countryFlag} ${trader.country}`,
      'Allocated Capital': `$${allocationAmount.toLocaleString()} USD`,
      'Lot Size Multiplier': `${lotMultiplier}x`,
      'Positions Mirrored': `${trader.openPositions.length} active CFD positions`,
      'Account Mode': accountMode.toUpperCase(),
      'Timestamp': new Date().toUTCString()
    });

    showToast(`🚀 Copy-Trading Active! Mirrored ${trader.openPositions.length} positions from ${trader.name} into your active ${accountMode.toUpperCase()} terminal.`, 'success');
    setSelectedTraderForModal(null);
  };

  // Stop Copying Trader
  const handleStopCopying = (traderId: string, traderName: string) => {
    const record = copiedTraders.find(c => c.traderId === traderId);
    if (record && setOpenPositions && record.mirroredPositionIds.length > 0) {
      // Close mirrored open positions
      setOpenPositions(prev => prev.filter(pos => !record.mirroredPositionIds.includes(pos.id)));
    }

    setCopiedTraders(prev => prev.filter(c => c.traderId !== traderId));

    sendTelegramAlert('COPY_TRADE_STOPPED', `⏹️ Copy-Trading Detached: User Stopped Mirroring ${traderName}`, {
      'User Email': userEmail,
      'Stopped Trader': traderName,
      'Account Mode': accountMode.toUpperCase(),
      'Timestamp': new Date().toUTCString()
    });

    showToast(`⏹️ Detached Copy-Trader ${traderName}. Mirrored positions closed.`, 'info');
  };

  // Calculate combined statistics for copied traders
  const totalAllocatedCapital = copiedTraders.reduce((acc, c) => acc + c.allocatedAmount, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Banner: Hero / Summary Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-2xl p-6 text-white border border-slate-700/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E3000F]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E3000F]/20 border border-[#E3000F]/40 text-[#E3000F] text-xs font-black uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 fill-[#E3000F]/20" />
              Standard Institutional Social Copy-Trading
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              Copy Top Demo & Funded Master Traders
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Select verified high-performance traders from the Axi Leaderboard. Mirror their live open CFD positions automatically into your account with custom capital allocation and institutional risk controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 shadow-inner shrink-0">
            <div className="text-center px-3 border-r border-slate-700">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Active Copied</span>
              <span className="text-lg font-black text-emerald-400">{copiedTraders.length} Traders</span>
            </div>
            <div className="text-center px-3 border-r border-slate-700">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Total Allocated</span>
              <span className="text-lg font-black text-amber-400">{formatCurrency(totalAllocatedCapital)}</span>
            </div>
            <div className="text-center px-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Execution Mode</span>
              <span className="text-xs font-black text-sky-400 uppercase bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
                0-Latency Mirror
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Copied Traders Bar (if any) */}
      {copiedTraders.length > 0 && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 text-emerald-900 dark:text-emerald-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Your Active Copy-Trading Portfolio ({copiedTraders.length})
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {copiedTraders.length} Master Trader{copiedTraders.length > 1 ? 's' : ''} currently mirroring
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {copiedTraders.map(record => {
              const master = traders.find(m => m.id === record.traderId);
              return (
                <div key={record.traderId} className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={master?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={record.traderName} className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500" />
                      <span className="absolute -bottom-1 -right-1 text-xs">{master?.countryFlag}</span>
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        {record.traderName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
                        <span>Capital: <strong className="text-slate-800 dark:text-slate-200">${record.allocatedAmount.toLocaleString()}</strong></span>
                        <span>Multi: <strong className="text-emerald-600">{record.lotMultiplier}x</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStopCopying(record.traderId, record.traderName)}
                    className="bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/30 text-[11px] font-black px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                    title="Stop Copying & Detach"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>Stop</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'Forex', 'Gold/Commodities', 'Crypto'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedAssetFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                selectedAssetFilter === cat
                  ? 'bg-[#E3000F] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search master trader name, strategy, country..."
            className="w-full bg-slate-100 dark:bg-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-[#E3000F]"
          />
        </div>
      </div>

      {/* Leaderboard Cards Grid */}
      {tradersLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <Loader2 className="w-8 h-8 mx-auto text-[#E3000F] animate-spin mb-3" />
          <p className="font-bold text-sm text-slate-700 dark:text-slate-200">Loading verified master traders…</p>
          <p className="text-xs text-slate-400 mt-1">Fetching the live Axi copy-trading leaderboard.</p>
        </div>
      ) : filteredTraders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 sm:p-14 text-center shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Trophy className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">
            {traders.length === 0 ? 'No verified master traders available yet' : 'No traders match your filters'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {traders.length === 0
              ? 'The Axi copy-trading leaderboard is populated only with real, compliance-verified master traders. Once verified traders are onboarded and approved by the admin team, they will appear here with their live track records for you to mirror.'
              : 'Try selecting "All" categories or clearing your search term to see all available verified traders.'}
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTraders.map(trader => {
          const copied = isTraderCopied(trader.id);

          return (
            <motion.div
              key={trader.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className={`bg-white dark:bg-slate-900 rounded-2xl border ${
                copied ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/50' : 'border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md'
              } p-5 flex flex-col justify-between relative overflow-hidden group`}
            >
              {/* Rank Tag */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                    trader.rank === 1 ? 'bg-amber-400 text-slate-950' :
                    trader.rank === 2 ? 'bg-slate-300 text-slate-950' :
                    trader.rank === 3 ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    #{trader.rank}
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span>{trader.countryFlag}</span>
                    <span>{trader.country}</span>
                  </span>
                </div>

                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                  {trader.badge}
                </span>
              </div>

              {/* Avatar + Name */}
              <div className="flex items-center gap-3.5 mb-4">
                <img
                  src={trader.avatarUrl}
                  alt={trader.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                    {trader.name}
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  </h3>
                  <p className="text-xs font-mono text-slate-400 truncate">{trader.handle}</p>
                  <p className="text-[11px] font-bold text-[#E3000F] mt-0.5 truncate">{trader.strategy}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-4">
                <div className="text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">1Y ROI</span>
                  <span className="text-sm font-black text-emerald-500 flex items-center justify-center gap-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    +{trader.roiYear}%
                  </span>
                </div>
                <div className="text-center border-x border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Win Rate</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{trader.winRate}%</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Risk Score</span>
                  <span className={`text-sm font-black ${
                    trader.riskScore <= 3 ? 'text-emerald-500' : trader.riskScore <= 6 ? 'text-amber-500' : 'text-rose-500'
                  }`}>
                    {trader.riskScore}/10
                  </span>
                </div>
              </div>

              {/* Open Positions Preview list */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5">
                  <span className="uppercase tracking-wider">Active Open CFD Trades ({trader.openPositions.length})</span>
                  <span className="font-mono text-slate-400">{trader.assetFocus}</span>
                </div>
                <div className="space-y-1.5">
                  {trader.openPositions.map((pos, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                          pos.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'
                        }`}>
                          {pos.type}
                        </span>
                        <strong className="text-slate-800 dark:text-slate-200">{pos.symbol}</strong>
                        <span className="text-slate-400 text-[10px]">({pos.volume} Lot)</span>
                      </div>
                      <span className="text-emerald-500 font-bold">+${pos.floatingPnL.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action Button */}
              {copied ? (
                <div className="flex items-center gap-2">
                  <button
                    disabled
                    className="flex-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>MIRRORING LIVE</span>
                  </button>
                  <button
                    onClick={() => handleStopCopying(trader.id, trader.name)}
                    className="bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/30 text-xs font-black px-3 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Stop
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedTraderForModal(trader)}
                  className="w-full bg-[#E3000F] hover:bg-red-700 text-white text-xs font-black py-3 rounded-xl transition shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Copy Trader ({trader.copiers.toLocaleString()} copiers)</span>
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
      )}

      {/* Copy Trade Modal */}
      <AnimatePresence>
        {selectedTraderForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTraderForModal(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative z-10 space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedTraderForModal.avatarUrl}
                    alt={selectedTraderForModal.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                  />
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      Copy {selectedTraderForModal.name}
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </h3>
                    <p className="text-xs font-mono text-slate-500">{selectedTraderForModal.handle} • {selectedTraderForModal.countryFlag} {selectedTraderForModal.country}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTraderForModal(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Allocation Amount Selector */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  <label className="uppercase tracking-wider">Allocation Capital Amount (USD)</label>
                  <span className="text-slate-400">Available: ${activeBalance.toLocaleString()}</span>
                </div>

                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="number"
                    min="100"
                    max={activeBalance || 100000}
                    value={allocationAmount}
                    onChange={(e) => setAllocationAmount(Number(e.target.value))}
                    className="w-full bg-slate-100 dark:bg-slate-800 pl-9 pr-4 py-2.5 rounded-xl font-mono text-sm font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-[#E3000F]"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-2 pt-1">
                  {[500, 1000, 2500, 5000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAllocationAmount(amt)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        allocationAmount === amt
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      ${amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lot Scale Multiplier */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  <label className="uppercase tracking-wider">Lot Size Multiplier</label>
                  <span className="text-[#E3000F] font-mono font-black">{lotMultiplier}x Scaling</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[0.2, 0.5, 1.0, 2.0].map(mult => (
                    <button
                      key={mult}
                      type="button"
                      onClick={() => setLotMultiplier(mult)}
                      className={`py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                        lotMultiplier === mult
                          ? 'bg-[#E3000F] text-white border-[#E3000F]'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {mult}x {mult === 1.0 ? '(Exact)' : mult < 1.0 ? '(Conservative)' : '(Aggressive)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mirrored Trades Preview Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider block">
                  Positions to mirror immediately ({selectedTraderForModal.openPositions.length}):
                </span>
                <div className="space-y-1.5">
                  {selectedTraderForModal.openPositions.map((pos, idx) => {
                    const scaled = (pos.volume * lotMultiplier).toFixed(2);
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs font-mono bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                            pos.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'
                          }`}>
                            {pos.type}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">{pos.symbol}</span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Master: {pos.volume} Lot → <strong className="text-emerald-500 font-bold">{scaled} Lot</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTraderForModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCopyTrader}
                  className="bg-[#E3000F] hover:bg-red-700 text-white text-xs font-black px-6 py-2.5 rounded-xl transition shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Start Copying Now (${allocationAmount.toLocaleString()})</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
