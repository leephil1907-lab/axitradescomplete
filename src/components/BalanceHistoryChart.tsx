import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, Calendar, ShieldCheck, Filter, Wifi, RefreshCw } from 'lucide-react';
import { ClosedPosition } from '../types';
import { auth, db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface BalanceHistoryChartProps {
  activeBalance: number;
  closedPositions: ClosedPosition[];
  transactions?: any[];
  user?: any;
  accountMode?: 'demo' | 'live';
}

export default function BalanceHistoryChart({
  activeBalance,
  closedPositions,
  transactions = [],
  user,
  accountMode = 'live'
}: BalanceHistoryChartProps) {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | 'ALL'>('1M');
  const [viewMode, setViewMode] = useState<'equity' | 'pnl'>('equity');

  // Real-time Firebase subcollection states
  const [firebaseTransactions, setFirebaseTransactions] = useState<any[]>([]);
  const [firebaseClosedPositions, setFirebaseClosedPositions] = useState<ClosedPosition[]>([]);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  // Subscribe directly to user's Firebase transaction history in real-time
  useEffect(() => {
    const currentUser = user || auth.currentUser;
    if (!currentUser) {
      setIsFirebaseConnected(false);
      return;
    }

    try {
      const transRef = collection(db, `users/${currentUser.uid}/transactions`);
      const unsubTrans = onSnapshot(
        transRef,
        (snapshot) => {
          const trans: any[] = [];
          snapshot.forEach((doc) => trans.push({ id: doc.id, ...doc.data() }));
          setFirebaseTransactions(trans);
          setIsFirebaseConnected(true);
        },
        (err) => {
          console.warn('Firebase transactions real-time stream listener error:', err);
          setIsFirebaseConnected(false);
        }
      );

      const closedPosRef = collection(db, `users/${currentUser.uid}/closedPositions`);
      const unsubClosed = onSnapshot(
        closedPosRef,
        (snapshot) => {
          const positions: ClosedPosition[] = [];
          snapshot.forEach((doc) => positions.push(doc.data() as ClosedPosition));
          setFirebaseClosedPositions(positions);
        },
        (err) => {
          console.warn('Firebase closed positions real-time stream listener error:', err);
        }
      );

      return () => {
        unsubTrans();
        unsubClosed();
      };
    } catch (err) {
      console.warn('Failed to subscribe to Firebase user subcollections:', err);
      setIsFirebaseConnected(false);
    }
  }, [user]);

  // Merge real-time Firebase data with props as fallback
  const effectiveTransactions = useMemo(() => {
    return firebaseTransactions.length > 0 ? firebaseTransactions : (transactions || []);
  }, [firebaseTransactions, transactions]);

  const effectiveClosedPositions = useMemo(() => {
    return firebaseClosedPositions.length > 0 ? firebaseClosedPositions : (closedPositions || []);
  }, [firebaseClosedPositions, closedPositions]);

  // Reconstruct unified timeline of historical balance fluctuations & P&L from Firebase
  const { historyData, totalTradePnL, totalDeposits, totalWithdrawals } = useMemo(() => {
    const events: any[] = [];

    // Parse Firebase transactions
    effectiveTransactions.forEach((tx) => {
      const isApproved = !tx.status || tx.status === 'Approved' || tx.status === 'Completed' || tx.status === 'Success';
      if (!isApproved) return;

      const amt = Number(tx.amount || 0);
      const rawType = (tx.type || '').toLowerCase();
      const isDeposit = rawType.includes('deposit') || rawType.includes('bonus') || rawType.includes('funding');
      const isWithdrawal = rawType.includes('withdraw') || rawType.includes('payout');
      
      let amountChange = 0;
      let eventCategory = 'TRANSACTION';

      if (isDeposit) {
        amountChange = Math.abs(amt);
        eventCategory = 'DEPOSIT';
      } else if (isWithdrawal) {
        amountChange = -Math.abs(amt);
        eventCategory = 'WITHDRAWAL';
      } else {
        amountChange = amt;
      }

      const ts = tx.timestamp || tx.created || tx.createdAt ? new Date(tx.timestamp || tx.created || tx.createdAt).getTime() : Date.now() - 86400000 * 2;
      const dateLabel = new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      events.push({
        id: tx.id || `tx-${Math.random()}`,
        timestamp: isNaN(ts) ? Date.now() - 86400000 : ts,
        dateLabel,
        type: eventCategory,
        title: tx.type || (isDeposit ? 'Deposit' : 'Withdrawal'),
        amountChange,
        tradePnL: 0,
        isWin: amountChange >= 0,
        details: `${tx.method ? `Via ${tx.method} • ` : ''}${tx.refCode || tx.id || ''}`
      });
    });

    // Parse closed positions (Trading activity)
    effectiveClosedPositions.forEach((pos, idx) => {
      const pnl = Number(pos.profit || 0);
      const tsStr = pos.exitTime || pos.entryTime;
      const ts = tsStr ? new Date(tsStr).getTime() : Date.now() - 86400000 * (effectiveClosedPositions.length - idx);
      const dateLabel = !isNaN(ts) ? new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (tsStr || `Trade #${idx + 1}`);

      events.push({
        id: pos.id || `pos-${idx}`,
        timestamp: isNaN(ts) ? Date.now() - 86400000 * (effectiveClosedPositions.length - idx) : ts,
        dateLabel,
        type: 'TRADE',
        title: `Closed ${pos.type} ${pos.volume}L ${pos.symbol}`,
        amountChange: pnl,
        tradePnL: pnl,
        isWin: pnl >= 0,
        details: `Entry @ ${pos.entryPrice} ➔ Exit @ ${pos.exitPrice}`
      });
    });

    // Sort events chronologically (oldest first)
    events.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate totals
    let sumTradePnL = 0;
    let sumDeposits = 0;
    let sumWithdrawals = 0;

    events.forEach(e => {
      sumTradePnL += e.tradePnL;
      if (e.type === 'DEPOSIT') sumDeposits += Math.abs(e.amountChange);
      if (e.type === 'WITHDRAWAL') sumWithdrawals += Math.abs(e.amountChange);
    });

    const netTx = sumDeposits - sumWithdrawals;
    const initialBalance = Math.max(0, activeBalance - sumTradePnL - netTx);

    // Construct step-by-step running equity curve
    let runningBalance = initialBalance;
    let runningTradePnL = 0;

    const points: any[] = [];

    // Baseline point
    const firstTs = events.length > 0 ? events[0].timestamp - 3600000 : Date.now() - 7 * 86400000;
    points.push({
      label: 'Start',
      date: new Date(firstTs).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      balance: Number(initialBalance.toFixed(2)),
      pnl: 0,
      tradePnL: 0,
      cumulativePnL: 0,
      trade: 'Initial Capital Baseline',
      type: 'BASELINE',
      isWin: true,
      timestamp: firstTs
    });

    events.forEach((evt, idx) => {
      runningBalance += evt.amountChange;
      runningTradePnL += evt.tradePnL;

      points.push({
        label: `T${idx + 1}`,
        date: evt.dateLabel,
        balance: Number(runningBalance.toFixed(2)),
        pnl: Number(evt.amountChange.toFixed(2)),
        tradePnL: Number(evt.tradePnL.toFixed(2)),
        cumulativePnL: Number(runningTradePnL.toFixed(2)),
        trade: evt.title,
        type: evt.type,
        isWin: evt.isWin,
        details: evt.details,
        timestamp: evt.timestamp
      });
    });

    // Final mark-to-market live balance point
    if (points.length === 1 || points[points.length - 1].balance !== activeBalance) {
      points.push({
        label: 'Now',
        date: 'Live Mark-to-Market',
        balance: Number(activeBalance.toFixed(2)),
        pnl: 0,
        tradePnL: 0,
        cumulativePnL: Number(runningTradePnL.toFixed(2)),
        trade: 'Live Portfolio Valuation',
        type: 'LIVE',
        isWin: activeBalance >= initialBalance,
        timestamp: Date.now()
      });
    }

    // Filter points according to selected timeframe
    const now = Date.now();
    let timeframeMs = 0;
    if (timeframe === '1D') timeframeMs = 24 * 60 * 60 * 1000;
    if (timeframe === '1W') timeframeMs = 7 * 24 * 60 * 60 * 1000;
    if (timeframe === '1M') timeframeMs = 30 * 24 * 60 * 60 * 1000;
    if (timeframe === '3M') timeframeMs = 90 * 24 * 60 * 60 * 1000;

    let filteredPoints = points;
    if (timeframeMs > 0) {
      const cutoff = now - timeframeMs;
      filteredPoints = points.filter(pt => pt.timestamp >= cutoff || pt.type === 'BASELINE');
      if (filteredPoints.length === 0) filteredPoints = points;
    }

    return {
      historyData: filteredPoints,
      totalTradePnL: sumTradePnL,
      totalDeposits: sumDeposits,
      totalWithdrawals: sumWithdrawals
    };
  }, [effectiveTransactions, effectiveClosedPositions, activeBalance, timeframe]);

  // Compute metric bounds
  const startBalance = historyData[0]?.balance || activeBalance;
  const netChange = activeBalance - startBalance;
  const netPercentage = startBalance > 0 ? (netChange / startBalance) * 100 : 0;

  const peakBalance = useMemo(() => {
    return historyData.reduce((max, pt) => Math.max(max, pt.balance), activeBalance);
  }, [historyData, activeBalance]);

  const lowestBalance = useMemo(() => {
    return historyData.reduce((min, pt) => Math.min(min, pt.balance), activeBalance);
  }, [historyData, activeBalance]);

  // Min and max domain bounds for YAxis
  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    historyData.forEach(d => {
      if (d.balance < min) min = d.balance;
      if (d.balance > max) max = d.balance;
    });
    const pad = (max - min) * 0.15 || 50;
    return {
      minVal: Math.max(0, Math.floor(min - pad)),
      maxVal: Math.ceil(max + pad)
    };
  }, [historyData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (!data) return null;

      const isTrade = data.type === 'TRADE';
      const isDep = data.type === 'DEPOSIT';
      const isWith = data.type === 'WITHDRAWAL';

      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-3.5 rounded-xl shadow-2xl font-mono text-xs text-white z-50 min-w-56 leading-relaxed">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="font-bold text-slate-400 text-[10px] uppercase">{data.date}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
              isDep ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              isWith ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              isTrade ? (data.isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400') :
              'bg-slate-800 text-slate-300'
            }`}>
              {data.type || 'EVENT'}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div>
              <span className="text-slate-400 text-[9px] uppercase font-black block">Net Equity Balance</span>
              <span className="text-base font-extrabold text-white">${data.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            {data.trade && (
              <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Activity:</span>
                <span className="font-bold text-slate-200">{data.trade}</span>
              </div>
            )}

            {data.details && (
              <div className="text-[10px] text-slate-400 italic">
                {data.details}
              </div>
            )}

            {data.pnl !== 0 && (
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                <span className="text-slate-400">Flow / P&L:</span>
                <span className={`font-black ${data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.pnl >= 0 ? '+' : ''}${data.pnl?.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const isDark = accountMode === 'demo';

  return (
    <div className={`rounded-xl border shadow-sm p-6 flex flex-col gap-5 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
      
      {/* Header with Title, Real-Time Firebase Badge, and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#E3000F]/10 text-[#E3000F] border border-[#E3000F]/20">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
              <span>Portfolio Performance Graph</span>
              {isFirebaseConnected && (
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Firebase Sync
                </span>
              )}
            </h3>
          </div>
          <p className={`text-xs font-semibold mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time balance fluctuations & historical trade P&L synced directly from Firebase transaction history.
          </p>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className={`flex items-center p-0.5 rounded-lg border text-[11px] font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            <button
              type="button"
              onClick={() => setViewMode('equity')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${viewMode === 'equity' ? 'bg-[#E3000F] text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Equity Curve
            </button>
            <button
              type="button"
              onClick={() => setViewMode('pnl')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${viewMode === 'pnl' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Trade P&L
            </button>
          </div>

          {/* Timeframe Filter with Framer Motion Layout Animations */}
          <div className={`flex items-center p-0.5 rounded-lg border text-[10px] font-black uppercase relative ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            {(['1D', '1W', '1M', '3M', 'ALL'] as const).map(tf => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`relative px-2.5 py-1 rounded transition cursor-pointer z-10 ${timeframe === tf ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {timeframe === tf && (
                  <motion.div
                    layoutId="activeTimeframePill"
                    className="absolute inset-0 bg-[#E3000F] rounded shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <motion.div layout className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Active Equity Balance</span>
          <div className="text-lg font-black mt-0.5 font-mono text-slate-900 dark:text-white">
            ${activeBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Total Realized P&L</span>
          <div className={`text-base font-black mt-0.5 font-mono flex items-center gap-1 ${totalTradePnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totalTradePnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {totalTradePnL >= 0 ? '+' : ''}${totalTradePnL.toFixed(2)}
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">High Watermark Peak</span>
          <div className="text-base font-black mt-0.5 font-mono text-amber-500">
            ${peakBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Firebase Log Records</span>
          <div className="text-base font-black mt-0.5 font-mono text-cyan-400">
            {effectiveTransactions.length + effectiveClosedPositions.length} Events
          </div>
        </div>
      </motion.div>

      {/* Main Recharts Area with Framer Motion Layout Transitions */}
      <motion.div 
        layout
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className={`w-full rounded-xl p-3 border shadow-inner relative overflow-hidden ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-950 border-slate-900'}`}
      >
        <div className="flex items-center justify-between mb-2 px-2 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            {viewMode === 'equity' ? 'Cumulative Balance Line ($)' : 'Individual Trade & Transaction Distribution ($)'}
          </span>
          <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] flex items-center gap-1">
            <Wifi className="w-3 h-3 text-emerald-400" />
            FIREBASE LIVE STREAM
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={timeframe + '-' + viewMode}
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <ResponsiveContainer width="100%" height={260}>
              {viewMode === 'equity' ? (
                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={netChange >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={netChange >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#1e293b' }}
                  />

                  <YAxis
                    domain={[minVal, maxVal]}
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    orientation="right"
                    axisLine={{ stroke: '#1e293b' }}
                    tickFormatter={(val) => `$${val.toLocaleString()}`}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <ReferenceLine y={startBalance} stroke="#64748b" strokeDasharray="3 3" label={{ value: 'Start', fill: '#64748b', fontSize: 9 }} />

                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke={netChange >= 0 ? '#10b981' : '#f43f5e'}
                    strokeWidth={2.5}
                    fill="url(#balanceGradient)"
                    isAnimationActive={true}
                  />
                </AreaChart>
              ) : (
                <BarChart data={historyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} orientation="right" tickFormatter={(val) => `$${val}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#475569" />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {historyData.map((entry, index) => (
                      <Cell key={`pnl-cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
