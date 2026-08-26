import React, { useState, useMemo } from 'react';
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
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewType } from '../types';

export interface EconomicEvent {
  id: string;
  time: string; // e.g. "13:30"
  date: string; // e.g. "2026-08-19"
  dayLabel: 'Today' | 'Tomorrow' | 'This Week' | 'Next Week';
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

const SAMPLE_ECONOMIC_EVENTS: EconomicEvent[] = [
  {
    id: 'eco_1',
    time: '13:30 UTC',
    date: '2026-08-18',
    dayLabel: 'Today',
    currency: 'USD',
    country: 'United States',
    countryFlag: '🇺🇸',
    title: 'Core Consumer Price Index (CPI) YoY',
    impact: 'HIGH',
    actual: '2.8%',
    forecast: '2.9%',
    previous: '3.1%',
    affectedSymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'US500'],
    description: 'Measures changes in the price of goods and services purchased by consumers, excluding volatile food and energy. A lower reading indicates cooling inflation, heavily impacting Federal Reserve interest rate policy.',
    historicalTrend: 'bullish'
  },
  {
    id: 'eco_2',
    time: '15:00 UTC',
    date: '2026-08-18',
    dayLabel: 'Today',
    currency: 'USD',
    country: 'United States',
    countryFlag: '🇺🇸',
    title: 'ISM Manufacturing PMI',
    impact: 'HIGH',
    actual: '51.4',
    forecast: '50.2',
    previous: '49.8',
    affectedSymbols: ['US500', 'US30', 'USDJPY', 'XAUUSD'],
    description: 'Purchasing Managers Index surveying supply executives in manufacturing. Readings above 50.0 signal economic expansion and industrial momentum.',
    historicalTrend: 'bullish'
  },
  {
    id: 'eco_3',
    time: '09:00 UTC',
    date: '2026-08-18',
    dayLabel: 'Today',
    currency: 'EUR',
    country: 'Eurozone',
    countryFlag: '🇪🇺',
    title: 'Eurozone Harmonized Index of Consumer Prices (HICP) YoY',
    impact: 'HIGH',
    actual: '2.1%',
    forecast: '2.2%',
    previous: '2.4%',
    affectedSymbols: ['EURUSD', 'EURGBP', 'EURJPY', 'GER40'],
    description: 'Key benchmark of inflation across the 20 Eurozone nations utilized by the European Central Bank (ECB) Governing Council for monetary policy target determination.',
    historicalTrend: 'neutral'
  },
  {
    id: 'eco_4',
    time: '19:00 UTC',
    date: '2026-08-19',
    dayLabel: 'Tomorrow',
    currency: 'USD',
    country: 'United States',
    countryFlag: '🇺🇸',
    title: 'Federal Open Market Committee (FOMC) Rate Decision',
    impact: 'HIGH',
    forecast: '4.75%',
    previous: '5.00%',
    affectedSymbols: ['EURUSD', 'USDJPY', 'GBPUSD', 'XAUUSD', 'BTCUSD', 'US500'],
    description: 'The Federal Reserve sets the primary federal funds target benchmark rate. Significant volatility occurs across Forex, Equities, and Precious Metals upon policy statement and press conference delivery.',
    historicalTrend: 'bearish'
  },
  {
    id: 'eco_5',
    time: '07:00 UTC',
    date: '2026-08-19',
    dayLabel: 'Tomorrow',
    currency: 'GBP',
    country: 'United Kingdom',
    countryFlag: '🇬🇧',
    title: 'UK Gross Domestic Product (GDP) MoM',
    impact: 'HIGH',
    forecast: '0.3%',
    previous: '0.1%',
    affectedSymbols: ['GBPUSD', 'EURGBP', 'GBPJPY', 'UK100'],
    description: 'Total market value of all goods and services produced in the UK. Higher reading reflects economic resilience and strengthens the British Pound.',
    historicalTrend: 'bullish'
  },
  {
    id: 'eco_6',
    time: '01:30 UTC',
    date: '2026-08-19',
    dayLabel: 'Tomorrow',
    currency: 'AUD',
    country: 'Australia',
    countryFlag: '🇦🇺',
    title: 'RBA Employment Change & Unemployment Rate',
    impact: 'HIGH',
    forecast: '3.9%',
    previous: '4.0%',
    affectedSymbols: ['AUDUSD', 'AUDJPY', 'EURAUD', 'AUS200'],
    description: 'Number of employed individuals during the prior month and civilian unemployment percentage. Critical indicator for the Reserve Bank of Australia cash rate trajectory.',
    historicalTrend: 'bullish'
  },
  {
    id: 'eco_7',
    time: '12:30 UTC',
    date: '2026-08-20',
    dayLabel: 'This Week',
    currency: 'USD',
    country: 'United States',
    countryFlag: '🇺🇸',
    title: 'Initial Jobless Claims (Weekly)',
    impact: 'MEDIUM',
    forecast: '215K',
    previous: '223K',
    affectedSymbols: ['EURUSD', 'USDJPY', 'US500'],
    description: 'Weekly measure of individuals filing for first-time state unemployment insurance. Gauges labor market conditions and employment tightness.',
    historicalTrend: 'neutral'
  },
  {
    id: 'eco_8',
    time: '13:30 UTC',
    date: '2026-08-21',
    dayLabel: 'This Week',
    currency: 'CAD',
    country: 'Canada',
    countryFlag: '🇨🇦',
    title: 'Bank of Canada Core Retail Sales MoM',
    impact: 'MEDIUM',
    forecast: '0.4%',
    previous: '-0.2%',
    affectedSymbols: ['USDCAD', 'CADJPY', 'EURCAD'],
    description: 'Excludes volatile automotive sales to assess foundational Canadian retail consumer spending momentum and domestic demand.',
    historicalTrend: 'bullish'
  },
  {
    id: 'eco_9',
    time: '03:00 UTC',
    date: '2026-08-21',
    dayLabel: 'This Week',
    currency: 'JPY',
    country: 'Japan',
    countryFlag: '🇯🇵',
    title: 'Bank of Japan (BoJ) Monetary Policy Statement & Target Rate',
    impact: 'HIGH',
    forecast: '0.25%',
    previous: '0.10%',
    affectedSymbols: ['USDJPY', 'EURJPY', 'GBPJPY', 'JP225'],
    description: 'The Bank of Japan policy statement outlining yield curve control guidelines, quantitative asset purchases, and interbank overnight lending rate adjustments.',
    historicalTrend: 'bullish'
  },
  {
    id: 'eco_10',
    time: '13:30 UTC',
    date: '2026-08-25',
    dayLabel: 'Next Week',
    currency: 'USD',
    country: 'United States',
    countryFlag: '🇺🇸',
    title: 'US Non-Farm Payrolls (NFP) & Average Hourly Earnings',
    impact: 'HIGH',
    forecast: '175K',
    previous: '185K',
    affectedSymbols: ['EURUSD', 'USDJPY', 'GBPUSD', 'XAUUSD', 'US500', 'US30'],
    description: 'The marquee global economic data release measuring change in total non-farm payroll employees during the prior month. Triggers the highest intraday volatility across FX & commodities.',
    historicalTrend: 'neutral'
  }
];

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
    return SAMPLE_ECONOMIC_EVENTS.filter(evt => {
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
  }, [activeTimeframe, selectedCurrency, selectedImpact, searchQuery]);

  const highImpactCount = useMemo(() => {
    return SAMPLE_ECONOMIC_EVENTS.filter(e => e.impact === 'HIGH').length;
  }, []);

  return (
    <div className={`w-full ${standalone ? 'py-8' : ''}`}>
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-brand-red/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-black uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></span>
              Live Interbank Macro Calendar
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
              <span className="text-2xl font-black text-brand-yellow">{highImpactCount} Critical Events</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Real-Time Feed
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

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search event, currency, symbol..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-red focus:bg-white transition"
            />
          </div>
        </div>

        {/* Currency & Impact Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Currency Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase text-slate-500 mr-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Currency:
            </span>
            {['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'].map(curr => (
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
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedImpact === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
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
        {filteredEvents.length === 0 ? (
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
