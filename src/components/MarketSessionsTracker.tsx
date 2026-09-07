import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Globe, Zap, Activity, ArrowUpRight, CalendarClock } from 'lucide-react';

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
  color: string;
  softColor: string;
}

const GLOBAL_SESSIONS: SessionInfo[] = [
  {
    id: 'sydney', name: 'Sydney', city: 'Sydney', country: 'Australia',
    flag: '🇦🇺', openUtcHour: 22, openUtcMin: 0, closeUtcHour: 7, closeUtcMin: 0,
    timeZone: 'Australia/Sydney', liquidityTier: 'Moderate',
    keyInstruments: ['AUDUSD', 'NZDUSD', 'AUDJPY'],
    color: '#38bdf8', softColor: 'rgba(56,189,248,0.14)'
  },
  {
    id: 'tokyo', name: 'Tokyo', city: 'Tokyo', country: 'Japan',
    flag: '🇯🇵', openUtcHour: 0, openUtcMin: 0, closeUtcHour: 9, closeUtcMin: 0,
    timeZone: 'Asia/Tokyo', liquidityTier: 'High',
    keyInstruments: ['USDJPY', 'EURJPY', 'GBPJPY', 'BTCUSD'],
    color: '#a78bfa', softColor: 'rgba(167,139,250,0.14)'
  },
  {
    id: 'london', name: 'London', city: 'London', country: 'United Kingdom',
    flag: '🇬🇧', openUtcHour: 8, openUtcMin: 0, closeUtcHour: 16, closeUtcMin: 30,
    timeZone: 'Europe/London', liquidityTier: 'Extreme',
    keyInstruments: ['EURUSD', 'GBPUSD', 'UK100', 'GER40', 'XAUUSD'],
    color: '#10b981', softColor: 'rgba(16,185,129,0.14)'
  },
  {
    id: 'newyork', name: 'New York', city: 'New York', country: 'United States',
    flag: '🇺🇸', openUtcHour: 13, openUtcMin: 30, closeUtcHour: 20, closeUtcMin: 0,
    timeZone: 'America/New_York', liquidityTier: 'Extreme',
    keyInstruments: ['US30', 'SPX500', 'NAS100', 'AAPL', 'NVDA', 'USOUSD'],
    color: '#f59e0b', softColor: 'rgba(245,158,11,0.14)'
  }
];

const DAY_MINUTES = 24 * 60;

function fmtHHMM(totalMinutes: number) {
  const m = ((totalMinutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const h = Math.floor(m / 60);
  const min = Math.floor(m % 60);
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export default function MarketSessionsTracker({ className = '' }: { className?: string }) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;

  const openOf = (s: SessionInfo) => s.openUtcHour * 60 + s.openUtcMin;
  const closeOf = (s: SessionInfo) => {
    const raw = s.closeUtcHour * 60 + s.closeUtcMin;
    return raw <= openOf(s) ? raw + DAY_MINUTES : raw; // wraps past midnight
  };

  const isOpen = (s: SessionInfo) => {
    const end = closeOf(s);
    return utcMinutes >= openOf(s) && utcMinutes < end;
  };

  const minutesUntilOpen = (s: SessionInfo) => {
    if (isOpen(s)) return 0;
    const o = openOf(s);
    const diff = o > utcMinutes ? o - utcMinutes : DAY_MINUTES - utcMinutes + o;
    return Math.ceil(diff);
  };

  const minutesUntilClose = (s: SessionInfo) => {
    if (!isOpen(s)) return 0;
    return Math.ceil(closeOf(s) - utcMinutes);
  };

  const formatCountdown = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Sessions arranged for a trading day: open ones first (by open time), then the
  // rest ordered by soonest next opening. This is the "rearranged" trading order.
  const ordered = [...GLOBAL_SESSIONS].sort((a, b) => {
    const aOpen = isOpen(a);
    const bOpen = isOpen(b);
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    if (aOpen && bOpen) return openOf(a) - openOf(b);
    return minutesUntilOpen(a) - minutesUntilOpen(b);
  });

  const openSessions = GLOBAL_SESSIONS.filter(isOpen);
  const nextSession = GLOBAL_SESSIONS
    .filter((s) => !isOpen(s))
    .sort((a, b) => minutesUntilOpen(a) - minutesUntilOpen(b))[0];

  const overlapLondonNy = utcMinutes >= (13 * 60 + 30) && utcMinutes < (16 * 60 + 30);
  const overlapTokyoLondon = utcMinutes >= (8 * 60) && utcMinutes < (9 * 60);

  const localTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const nowPct = Math.min(100, (utcMinutes / DAY_MINUTES) * 100);

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm shrink-0">
            <Globe className="w-5 h-5 text-[#F5CE47]" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="font-black text-slate-900 text-base">Global Market Sessions</h3>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${openSessions.length ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {openSessions.length ? `${openSessions.length} Open Now` : 'All Closed'}
              </span>
            </div>
            <p className="text-xs text-slate-500">Session order follows the trading day — open markets first, then the next to open.</p>
          </div>
        </div>

        {/* Live clocks */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-950 text-white px-3.5 py-2 rounded-xl text-xs font-mono font-bold shadow-inner">
            <Clock className="w-3.5 h-3.5 text-[#F5CE47]" />
            <span>UTC {fmtHHMM(utcMinutes)}</span>
          </div>
          <div className="flex items-center gap-2 bg-white text-slate-700 px-3.5 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 shadow-inner">
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            <span>Local {localTime}</span>
          </div>
        </div>
      </div>

      {/* Overlap / status banners */}
      {overlapLondonNy && (
        <div className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3 rounded-xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-yellow-300 animate-pulse shrink-0" />
            <div>
              <div className="font-black text-xs uppercase tracking-wider">London — New York overlap active</div>
              <div className="text-[11px] text-emerald-100 font-medium">Peak liquidity: tightest spreads on EURUSD, GBPUSD, XAUUSD & US indices.</div>
            </div>
          </div>
          <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-1 rounded-lg hidden sm:inline">MAX VOL</span>
        </div>
      )}
      {!overlapLondonNy && overlapTokyoLondon && (
        <div className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3 rounded-xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-sky-300 shrink-0" />
            <div>
              <div className="font-black text-xs uppercase tracking-wider">Tokyo — London overlap active</div>
              <div className="text-[11px] text-sky-100 font-medium">European morning crossover: momentum across EUR, GBP & JPY crosses.</div>
            </div>
          </div>
          <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-1 rounded-lg hidden sm:inline">HIGH VOL</span>
        </div>
      )}

      {/* 24h trading-day timeline */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" /> 24-hour trading day
          </div>
          {nextSession && openSessions.length === 0 && (
            <span className="text-[10px] font-bold text-slate-500">
              Next: <span className="text-slate-900">{nextSession.name}</span> opens in{' '}
              <span className="text-brand-red font-black">{formatCountdown(minutesUntilOpen(nextSession))}</span>
            </span>
          )}
        </div>
        <div className="relative h-9 rounded-lg bg-white border border-slate-100 overflow-hidden">
          {GLOBAL_SESSIONS.map((s) => {
            const start = openOf(s);
            const end = closeOf(s);
            const leftPct = (start / DAY_MINUTES) * 100;
            const widthPct = ((end - start) / DAY_MINUTES) * 100;
            const open = isOpen(s);
            return (
              <div
                key={s.id}
                title={`${s.name}: ${fmtHHMM(start)}–${fmtHHMM(end)} UTC`}
                className="absolute top-0 bottom-0 border-l border-r border-white/70"
                style={{
                  left: `${leftPct}%`,
                  width: `${Math.min(widthPct, 100 - leftPct)}%`,
                  background: open ? `linear-gradient(90deg, ${s.color}dd, ${s.color}99)` : s.softColor,
                  boxShadow: open ? `inset 0 0 0 1px ${s.color}` : undefined,
                  opacity: open ? 1 : 0.75
                }}
              />
            );
          })}
          {/* Now marker */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-[#E3000F] z-10" style={{ left: `${nowPct}%` }}>
            <div className="absolute -top-0.5 -translate-x-1/2 w-2 h-2 rounded-full bg-[#E3000F] shadow" />
          </div>
          {/* Hour ticks */}
          {[0, 6, 12, 18].map((h) => (
            <div key={h} className="absolute top-0 bottom-0 w-px bg-slate-100" style={{ left: `${(h / 24) * 100}%` }} />
          ))}
          {[0, 6, 12, 18].map((h) => (
            <span key={`t${h}`} className="absolute bottom-0.5 -translate-x-1/2 text-[8px] font-mono text-slate-300 bg-white/80 px-0.5 rounded" style={{ left: `${(h / 24) * 100}%` }}>
              {String(h).padStart(2, '0')}
            </span>
          ))}
          {/* Legend */}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {GLOBAL_SESSIONS.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
              <span className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
              {s.name} <span className="text-slate-400 font-mono font-normal">{fmtHHMM(openOf(s))}–{fmtHHMM(closeOf(s))}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Session cards in trading-day order */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
        {ordered.map((session) => {
          const open = isOpen(session);
          const openMin = openOf(session);
          const closeMin = closeOf(session);
          const elapsedPct = open ? Math.min(100, Math.max(0, ((utcMinutes - openMin) / (closeMin - openMin)) * 100)) : 0;
          const countdown = open
            ? `Closes in ${formatCountdown(minutesUntilClose(session))}`
            : `Opens in ${formatCountdown(minutesUntilOpen(session))}`;

          let localOpen = '';
          let localClose = '';
          try {
            const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
            const day = new Date(now);
            day.setUTCHours(0, 0, 0, 0);
            const openDate = new Date(day.getTime() + openMin * 60000);
            const closeDate = new Date(day.getTime() + closeMin * 60000);
            localOpen = new Intl.DateTimeFormat('en-US', { ...opts, timeZone: session.timeZone }).format(openDate);
            localClose = new Intl.DateTimeFormat('en-US', { ...opts, timeZone: session.timeZone }).format(closeDate);
          } catch {
            localOpen = '--:--';
            localClose = '--:--';
          }

          const isNext = !open && nextSession?.id === session.id;

          return (
            <motion.div
              key={session.id}
              whileHover={{ y: -2 }}
              className={`rounded-xl border p-3.5 transition-all flex flex-col justify-between relative overflow-hidden ${
                open
                  ? 'text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-800 shadow-sm'
              }`}
              style={{ background: open ? `linear-gradient(150deg, #0f172a, #1e293b)` : undefined, borderColor: isNext ? session.color : undefined, boxShadow: isNext && !open ? `0 0 0 1px ${session.color}, 0 6px 16px -8px ${session.color}66` : undefined }}
            >
              {open && (
                <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-20" style={{ background: session.color }} />
              )}

              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{session.flag}</span>
                    <div>
                      <div className="font-black text-sm leading-tight flex items-center gap-1.5">
                        {session.name}
                        {open ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-300" />
                        )}
                      </div>
                      <div className={`text-[10px] ${open ? 'text-slate-400' : 'text-slate-400'}`}>{session.country}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        open
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : isNext
                            ? 'text-slate-700 border-slate-300 bg-slate-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {open ? 'OPEN' : isNext ? 'NEXT' : 'CLOSED'}
                    </span>
                  </div>
                </div>

                {/* Session hours */}
                <div className={`rounded-lg px-2.5 py-1.5 mt-1 text-xs font-mono ${open ? 'bg-white/10 text-slate-200' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                  <div className="flex justify-between">
                    <span>Session</span>
                    <span className="font-black">{fmtHHMM(openMin)} – {fmtHHMM(closeMin)} UTC</span>
                  </div>
                  <div className="flex justify-between text-[10px] opacity-80 mt-0.5">
                    <span>Local</span>
                    <span className="font-bold">{localOpen} – {localClose}</span>
                  </div>
                </div>

                {/* Progress when open */}
                {open && (
                  <div className="mt-2.5">
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${elapsedPct}%`, background: `linear-gradient(90deg, ${session.color}, ${session.color}cc)` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer: countdown, liquidity, instruments */}
              <div className={`pt-2 border-t mt-3 ${open ? 'border-white/10' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between text-[10px] mb-2">
                  <span className={open ? 'text-slate-300' : 'text-slate-500'}>
                    {countdown}
                  </span>
                  <span className={`font-black ${session.liquidityTier === 'Extreme' ? 'text-emerald-500' : session.liquidityTier === 'High' ? 'text-sky-500' : 'text-amber-500'}`}>
                    {session.liquidityTier} Liq
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {session.keyInstruments.slice(0, 3).map((inst) => (
                    <span key={inst} className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${open ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                      {inst}
                    </span>
                  ))}
                  {session.keyInstruments.length > 3 && (
                    <span className="text-[8px] font-mono text-slate-400 px-0.5 self-center">+{session.keyInstruments.length - 3}</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer strip */}
      <div className="mt-4 flex items-center justify-between gap-3 text-[10px] text-slate-400 pt-3 border-t border-slate-100">
        <span className="flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
          Trading day order: Sydney → Tokyo → London → New York (24/5 FX markets; crypto trades 24/7).
        </span>
        <span className="shrink-0 font-mono">{new Date().getUTCFullYear()}</span>
      </div>
    </div>
  );
}
