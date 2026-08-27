import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Filter, 
  Globe, 
  AlertCircle, 
  Bell, 
  BellRing, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewType } from '../types';

export interface EconomicEvent {
  id: string;
  time: string; // e.g. "13:30"
  date: string; // e.g. "2026-08-19"
  dayLabel?: 'Today' | 'Tomorrow' | 'This Week' | 'Next Week' | string;
  currency: string;
  country: string;
  countryFlag: string;
  title: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  actual?: string;
  forecast: string;
  previous: string;
  affectedSymbols: string[];
  description: string;
  historicalTrend?: 'bullish' | 'bearish' | 'neutral';
}

// Country flag emoji + friendly country name lookup keyed by ISO currency.
const CURRENCY_META: Record<string, { flag: string; country: string; symbols: string[] }> = {
  USD: { flag: '🇺🇸', country: 'United States', symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'US500'] },
  EUR: { flag: '🇪🇺', country: 'Eurozone', symbols: ['EURUSD', 'EURGBP', 'EURJPY', 'GER40'] },
  GBP: { flag: '🇬🇧', country: 'United Kingdom', symbols: ['GBPUSD', 'EURGBP', 'GBPJPY', 'UK100'] },
  JPY: { flag: '🇯🇵', country: 'Japan', symbols: ['USDJPY', 'EURJPY', 'GBPJPY', 'JP225'] },
  AUD: { flag: '🇦🇺', country: 'Australia', symbols: ['AUDUSD', 'AUDJPY', 'EURAUD', 'AUS200'] },
  CAD: { flag: '🇨🇦', country: 'Canada', symbols: ['USDCAD', 'CADJPY', 'EURCAD'] },
  CHF: { flag: '🇨🇭', country: 'Switzerland', symbols: ['USDCHF', 'EURCHF', 'GBPCHF'] },
  CNY: { flag: '🇨🇳', country: 'China', symbols: ['USDCNH', 'CN50'] },
  NZD: { flag: '🇳🇿', country: 'New Zealand', symbols: ['NZDUSD', 'NZDJPY', 'EURNZD'] },
};

function deriveDayLabel(dateStr: string): string {
  if (!dateStr) return 'This Week';
  const d = new Date(dateStr + (dateStr.length <= 10 ? 'T00:00:00Z' : ''));
  if (isNaN(d.getTime())) return 'This Week';
  const now = new Date();
  const todayMid = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diffDays = Math.round((d.getTime() - todayMid.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays >= 2 && diffDays <= 6) return 'This Week';
  if (diffDays >= 7 && diffDays <= 13) return 'Next Week';
  return diffDays < 0 ? 'Past' : 'Upcoming';
}

interface EconomicCalendarProps {
  setView?: (view: ViewType) => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  standalone?: boolean;
}

export default function EconomicCalendar({ setView, showToast, standalone = false }: EconomicCalendarProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<'ALL' | 'Today' | 'Tomorrow' | 'This Week' | 'Next Week'>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [selectedImpact, setSelectedImpact] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<Record<string, boolean>>({});

  // Live economic calendar state (no hardcoded/sample data).
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [live, setLive] = useState<boolean>(false);
  const [source, setSource] = useState<string>('');
  const [error, setError] = useState<string>('');

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/economic-calendar');
      if (!r.ok) throw new Error(`Server responded ${r.status}`);
      const j = (await r.json()) as any;
      const raw: any[] = Array.isArray(j?.events) ? j.events : [];
      const normalized: EconomicEvent[] = raw.map((e: any) => {
        const meta = CURRENCY_META[String(e.currency || '').toUpperCase()];
        const dayLabel = deriveDayLabel(e.date);
        return {
          id: e.id || `eco_${Math.random().toString(36).slice(2)}`,
          time: e.time || 'All Day',
          date: e.date || '',
          dayLabel,
          currency: String(e.currency || '').toUpperCase(),
          country: meta?.country || e.country || e.currency || '',
          countryFlag: meta?.flag || e.countryFlag || '🌐',
          title: e.title || 'Economic Release',
          impact: (e.impact as 'HIGH' | 'MEDIUM' | 'LOW') || 'LOW',
          actual: e.actual || undefined,
          forecast: e.forecast || '—',
          previous: e.previous || '—',
          affectedSymbols: Array.isArray(e.affectedSymbols) && e.affectedSymbols.length
            ? e.affectedSymbols
            : (meta?.symbols || []),
          description: e.description || e.title || 'Economic release with potential market impact.',
        };
      });
      setEvents(normalized);
      setLive(Boolean(j?.live));
      setSource(String(j?.source || ''));
    } catch (e) {
      setError('Unable to load the live economic calendar right now.');
      setEvents([]);
      setLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const toggleAlert = (eventId: string, eventTitle: string) => {
    setActiveAlerts(prev => {
      const isSet = !!prev[eventId];
      const next = { ...prev, [eventId]: !isSet };
      if (!isSet) {
        showToast?.(`🔔 Live notification scheduled for "${eventTitle}"! You will be alerted before release.`, 'success');
      } else {
        showToast?.(`Alert removed for "${eventTitle}".`, 'info');
      }
      return next;
    });
  };

  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      if (activeTimeframe !== 'ALL' && evt.dayLabel !== activeTimeframe) return false;
      if (selectedCurrency !== 'ALL' && evt.currency !== selectedCurrency) return false;
      if (selectedImpact !== 'ALL' && evt.impact !== selectedImpact) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = evt.title.toLowerCase().includes(q);
        const matchCountry = evt.country.toLowerCase().includes(q);
        const matchCurrency = evt.currency.toLowerCase().includes(q);
        const matchSymbol = evt.affectedSymbols.some(s => s.toLowerCase().includes(q));
        if (!matchTitle && !matchCountry && !matchCurrency && !matchSymbol) return false;
      }
      return true;
    });
  }, [events, activeTimeframe, selectedCurrency, selectedImpact, searchQuery]);

  const highImpactCount = useMemo(() => {
    return events.filter(e => e.impact === 'HIGH').length;
  }, [events]);

  // Derive the list of currencies actually present in the live data.
  const availableCurrencies = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => e.currency && set.add(e.currency));
    return ['ALL', ...Array.from(set).sort()];
  }, [events]);

  return (
    <div className={`w-full ${standalone ? 'py-8' : ''}`}>
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-brand-red/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-black uppercase tracking-wider mb-3">
              <span className={`w-2 h-2 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
              {live ? 'Live Interbank Macro Calendar' : 'Economic Calendar'}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
              Economic Calendar & Market Catalysts
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Track real-time global macroeconomic releases, central bank interest rate decisions, inflation gauges, and employment numbers driving market liquidity.
            </p>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end gap-3 bg-slate-800/80 backdrop-blur-xs p-4 rounded-2xl border border-slate-700/60 shrink-0">
            <div className="text-left md:text-right">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">High Impact Catalysts</span>
              <span className="text-2xl font-black text-brand-yellow">{loading ? '—' : `${highImpactCount} Event${highImpactCount === 1 ? '' : 's'}`}</span>
            </div>
            <div className="text-[11px] font-bold flex items-center gap-1.5">
              {live ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Feed{source ? ` · ${source}` : ''}
                </span>
              ) : loading ? (
                <span className="text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Feed unavailable
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs flex flex-col gap-4">
        {/* Timeframe Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            {(['ALL', 'Today', 'Tomorrow', 'This Week', 'Next Week'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
                  activeTimeframe === tf 
                    ? 'bg-brand-red text-white shadow-xs' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {tf === 'ALL' ? 'All Dates' : tf}
              </button>
            ))}
          </div>

          {/* Quick Search + Refresh */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search event, currency, symbol..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-red focus:bg-white transition"
              />
            </div>
            <button
              onClick={fetchEvents}
              disabled={loading}
              title="Refresh live events"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Currency & Impact Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Currency Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase text-slate-500 mr-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Currency:
            </span>
            {availableCurrencies.slice(0, 8).map(curr => (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedCurrency === curr
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          {/* Impact Volatility Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold uppercase text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Volatility:
            </span>
            <button
              onClick={() => setSelectedImpact('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${selectedImpact === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedImpact('HIGH')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                selectedImpact === 'HIGH' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current"></span> High
            </button>
            <button
              onClick={() => setSelectedImpact('MEDIUM')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                selectedImpact === 'MEDIUM' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current"></span> Medium
            </button>
          </div>
        </div>
      </div>

      {/* Events Table / List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <Loader2 className="w-8 h-8 mx-auto text-brand-red animate-spin mb-3" />
            <p className="font-bold text-base text-slate-700">Loading live economic events…</p>
            <p className="text-xs text-slate-400 mt-1">Fetching real-time macro releases from the data provider.</p>
          </div>
        ) : error && events.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 mx-auto text-amber-400 mb-3" />
            <p className="font-bold text-base text-slate-700">{error}</p>
            <p className="text-xs text-slate-400 mt-1">The live calendar feed is temporarily unavailable. Tap refresh to retry.</p>
            <button
              onClick={fetchEvents}
              className="mt-4 inline-flex items-center gap-1.5 bg-brand-red hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry now
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-base text-slate-700">No economic events match your filter criteria.</p>
            <p className="text-xs text-slate-400 mt-1">Try selecting "All Dates" or clearing your search term.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEvents.map(evt => {
              const isExpanded = expandedEventId === evt.id;
              const hasAlert = !!activeAlerts[evt.id];

              return (
                <div key={evt.id} className="transition hover:bg-slate-50/80">
                  {/* Row Header */}
                  <div 
                    onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                  >
                    {/* Time & Currency Info */}
                    <div className="flex items-center gap-3.5 min-w-[200px]">
                      <div className="flex flex-col">
                        <span className="text-xs font-black font-mono text-slate-900 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {evt.time}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{evt.date}</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <span className="text-base leading-none">{evt.countryFlag}</span>
                        <span className="text-xs font-black text-slate-800">{evt.currency}</span>
                      </div>

                      {/* Impact Pill */}
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        evt.impact === 'HIGH' 
                          ? 'bg-red-100 text-red-700 border border-red-200' 
                          : evt.impact === 'MEDIUM' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {evt.impact}
                      </span>
                    </div>

                    {/* Event Title */}
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-red transition flex items-center gap-2">
                        {evt.title}
                        {evt.historicalTrend === 'bullish' && (
                          <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" /> Bullish FX
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] text-slate-500">Key Assets:</span>
                        {evt.affectedSymbols.map(sym => (
                          <span key={sym} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                            {sym}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Numeric Figures (Actual / Forecast / Previous) */}
                    <div className="flex items-center gap-6 justify-between md:justify-end shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Actual</span>
                        <span className={`text-sm font-black font-mono ${
                          evt.actual ? 'text-slate-900 bg-slate-100 px-2 py-0.5 rounded' : 'text-slate-300'
                        }`}>
                          {evt.actual || '—'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Forecast</span>
                        <span className="text-sm font-bold font-mono text-slate-700">
                          {evt.forecast}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Previous</span>
                        <span className="text-sm font-medium font-mono text-slate-500">
                          {evt.previous}
                        </span>
                      </div>

                      {/* Reminder & Expand Button */}
                      <div className="flex items-center gap-2 pl-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => toggleAlert(evt.id, evt.title)}
                          className={`p-2 rounded-xl transition cursor-pointer ${
                            hasAlert 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                          }`}
                          title={hasAlert ? 'Alert Scheduled' : 'Set Event Reminder'}
                        >
                          {hasAlert ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                        </button>

                        <button 
                          onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Accordion */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-50 border-t border-slate-200 p-5 sm:p-6"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-2 space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                              <Info className="w-4 h-4 text-brand-red" />
                              Economic Context & Release Overview
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {evt.description}
                            </p>

                            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-4">
                              <span className="text-xs font-bold text-slate-700">Market Volatility Index Expected:</span>
                              <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                                evt.impact === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {evt.impact === 'HIGH' ? '🔥 Extreme (30 - 80+ Pips Intraday)' : '⚡ Moderate (15 - 35 Pips)'}
                              </span>
                            </div>
                          </div>

                          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-2">Impacted Trading Instruments</span>
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                {evt.affectedSymbols.map(s => (
                                  <button
                                    key={s}
                                    onClick={() => setView?.('markets')}
                                    className="bg-slate-100 hover:bg-brand-red hover:text-white text-slate-800 font-mono font-bold text-xs px-2.5 py-1 rounded-lg transition cursor-pointer"
                                  >
                                    {s} ↗
                                  </button>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={() => setView?.('trading')}
                              className="w-full bg-brand-red hover:bg-red-700 text-white font-extrabold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                            >
                              <Zap className="w-3.5 h-3.5" /> Trade News Release on ECN
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
