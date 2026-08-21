import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Globe, Zap, Activity, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface SessionInfo {
  id: string;
  name: string;
  city: string;
  country: string;
  flag: string;
  openUtcHour: number;
  openUtcMin: number;
  closeUtcHour: number;
  closeUtcMin: number;
  timeZone: string;
  liquidityTier: 'Extreme' | 'High' | 'Moderate';
  keyInstruments: string[];
}

const GLOBAL_SESSIONS: SessionInfo[] = [
  {
    id: 'sydney',
    name: 'Sydney',
    city: 'Sydney',
    country: 'Australia (ASX)',
    flag: '🇦🇺',
    openUtcHour: 22,
    openUtcMin: 0,
    closeUtcHour: 7,
    closeUtcMin: 0,
    timeZone: 'Australia/Sydney',
    liquidityTier: 'Moderate',
    keyInstruments: ['AUDUSD', 'NZDUSD', 'AUDJPY']
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    city: 'Tokyo',
    country: 'Japan (TSE)',
    flag: '🇯🇵',
    openUtcHour: 0,
    openUtcMin: 0,
    closeUtcHour: 9,
    closeUtcMin: 0,
    timeZone: 'Asia/Tokyo',
    liquidityTier: 'High',
    keyInstruments: ['USDJPY', 'EURJPY', 'GBPJPY', 'BTCUSD']
  },
  {
    id: 'london',
    name: 'London',
    city: 'London',
    country: 'United Kingdom (LSE)',
    flag: '🇬🇧',
    openUtcHour: 8,
    openUtcMin: 0,
    closeUtcHour: 16,
    closeUtcMin: 30,
    timeZone: 'Europe/London',
    liquidityTier: 'Extreme',
    keyInstruments: ['EURUSD', 'GBPUSD', 'UK100', 'GER40', 'XAUUSD']
  },
  {
    id: 'newyork',
    name: 'New York',
    city: 'New York',
    country: 'United States (NYSE/NASDAQ)',
    flag: '🇺🇸',
    openUtcHour: 13,
    openUtcMin: 30,
    closeUtcHour: 20,
    closeUtcMin: 0,
    timeZone: 'America/New_York',
    liquidityTier: 'Extreme',
    keyInstruments: ['US30', 'SPX500', 'NAS100', 'AAPL', 'NVDA', 'USOUSD']
  }
];

export default function MarketSessionsTracker({ className = '' }: { className?: string }) {
  const [currentUtc, setCurrentUtc] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentUtc(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const utcMinutesNow = currentUtc.getUTCHours() * 60 + currentUtc.getUTCMinutes() + currentUtc.getUTCSeconds() / 60;

  const isSessionOpen = (s: SessionInfo) => {
    const openMin = s.openUtcHour * 60 + s.openUtcMin;
    const closeMin = s.closeUtcHour * 60 + s.closeUtcMin;

    if (openMin < closeMin) {
      return utcMinutesNow >= openMin && utcMinutesNow < closeMin;
    } else {
      // Overnight session (e.g. Sydney 22:00 to 07:00)
      return utcMinutesNow >= openMin || utcMinutesNow < closeMin;
    }
  };

  const getSessionProgress = (s: SessionInfo) => {
    const openMin = s.openUtcHour * 60 + s.openUtcMin;
    const closeMin = s.closeUtcHour * 60 + s.closeUtcMin;
    let duration = 0;
    let elapsed = 0;

    if (openMin < closeMin) {
      duration = closeMin - openMin;
      elapsed = utcMinutesNow - openMin;
    } else {
      duration = (1440 - openMin) + closeMin;
      elapsed = utcMinutesNow >= openMin ? (utcMinutesNow - openMin) : (1440 - openMin + utcMinutesNow);
    }

    if (elapsed < 0) elapsed = 0;
    if (elapsed > duration) elapsed = duration;
    return Math.min(100, Math.max(0, (elapsed / duration) * 100));
  };

  const getSessionTimeRemaining = (s: SessionInfo, isOpen: boolean) => {
    const openMin = s.openUtcHour * 60 + s.openUtcMin;
    const closeMin = s.closeUtcHour * 60 + s.closeUtcMin;
    let diff = 0;

    if (isOpen) {
      if (utcMinutesNow <= closeMin) {
        diff = closeMin - utcMinutesNow;
      } else {
        diff = (1440 - utcMinutesNow) + closeMin;
      }
      const hrs = Math.floor(diff / 60);
      const mins = Math.floor(diff % 60);
      return `Closes in ${hrs}h ${mins}m`;
    } else {
      if (utcMinutesNow < openMin) {
        diff = openMin - utcMinutesNow;
      } else {
        diff = (1440 - utcMinutesNow) + openMin;
      }
      const hrs = Math.floor(diff / 60);
      const mins = Math.floor(diff % 60);
      return `Opens in ${hrs}h ${mins}m`;
    }
  };

  // Check London & New York Overlap (13:30 to 16:30 UTC)
  const isLondonNyOverlap = utcMinutesNow >= (13 * 60 + 30) && utcMinutesNow < (16 * 60 + 30);
  // Check Tokyo & London Overlap (08:00 to 09:00 UTC)
  const isTokyoLondonOverlap = utcMinutesNow >= (8 * 60) && utcMinutesNow < (9 * 60);

  const activeCount = GLOBAL_SESSIONS.filter(isSessionOpen).length;

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <Globe className="w-5 h-5 text-brand-yellow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-base">Global Market Sessions</h3>
              <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-500/20">
                {activeCount} Active Now
              </span>
            </div>
            <p className="text-xs text-slate-500">Live interbank institutional trading clocks & overlap liquidity</p>
          </div>
        </div>

        {/* Live UTC Clock */}
        <div className="flex items-center gap-2 bg-slate-950 text-white px-3.5 py-2 rounded-xl text-xs font-mono font-bold shadow-inner">
          <Clock className="w-3.5 h-3.5 text-brand-yellow animate-spin-slow" />
          <span>UTC: {currentUtc.toUTCString().slice(17, 25)}</span>
        </div>
      </div>

      {/* Active Overlap Alert Banner if applicable */}
      {isLondonNyOverlap && (
        <div className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3 rounded-xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
            <div>
              <div className="font-black text-xs uppercase tracking-wider">London — New York Overlap Active</div>
              <div className="text-[11px] text-emerald-100 font-medium">Peak global liquidity window. Spreads at tightest institutional levels (0.0 – 0.2 pips).</div>
            </div>
          </div>
          <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-1 rounded-lg">MAX VOLUME</span>
        </div>
      )}

      {isTokyoLondonOverlap && (
        <div className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3 rounded-xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-sky-300" />
            <div>
              <div className="font-black text-xs uppercase tracking-wider">Tokyo — London Overlap Active</div>
              <div className="text-[11px] text-sky-100 font-medium">European morning crossover. Increased momentum across EUR, GBP, and JPY crosses.</div>
            </div>
          </div>
          <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-1 rounded-lg">HIGH VOL</span>
        </div>
      )}

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {GLOBAL_SESSIONS.map((session) => {
          const open = isSessionOpen(session);
          const progress = getSessionProgress(session);
          const timeStatus = getSessionTimeRemaining(session, open);

          // Get local time in session city
          let localTimeString = '';
          try {
            localTimeString = new Intl.DateTimeFormat('en-US', {
              timeZone: session.timeZone,
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }).format(currentUtc);
          } catch (e) {
            localTimeString = '--:--';
          }

          return (
            <motion.div
              key={session.id}
              whileHover={{ y: -2 }}
              className={`rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                open
                  ? 'bg-slate-900 border-slate-800 text-white shadow-md'
                  : 'bg-slate-50 border-slate-200/80 text-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{session.flag}</span>
                    <div>
                      <div className="font-black text-sm leading-tight flex items-center gap-1.5">
                        {session.name}
                        {open ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                        )}
                      </div>
                      <div className={`text-[10px] ${open ? 'text-slate-400' : 'text-slate-500'}`}>
                        {session.country}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      open
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {open ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>

                {/* Local Clock & Hours */}
                <div className="flex justify-between items-center text-xs my-2 font-mono">
                  <span className={open ? 'text-slate-300' : 'text-slate-600'}>Local Time:</span>
                  <span className="font-black">{localTimeString}</span>
                </div>

                {/* Progress bar if open */}
                {open && (
                  <div className="my-2">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Session Elapsed</span>
                      <span className="font-bold">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-700/50 mt-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className={open ? 'text-slate-400' : 'text-slate-500'}>{timeStatus}</span>
                  <span className={`font-bold ${session.liquidityTier === 'Extreme' ? 'text-emerald-400' : session.liquidityTier === 'High' ? 'text-sky-400' : 'text-amber-400'}`}>
                    {session.liquidityTier} Liq
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
