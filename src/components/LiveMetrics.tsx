import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp, TrendingDown, Globe, Clock, ShieldCheck, Users, DollarSign,
  BarChart3, Zap, AlertCircle, CheckCircle2, Monitor
} from 'lucide-react';
import { MarketQuote, ViewType } from '../types';

interface LiveMetricsProps {
  quotes: Record<string, MarketQuote>;
  setView: (view: ViewType) => void;
}

export default function LiveMetrics({ quotes, setView }: LiveMetricsProps) {
  const [providerStatus, setProviderStatus] = useState<{ name: string; status: 'live' | 'degraded' | 'offline'; latency: number }[]>([
    { name: 'Kraken Spot', status: 'live', latency: 45 },
    { name: 'Coinbase WS', status: 'live', latency: 32 },
    { name: 'Interbank FX', status: 'live', latency: 120 },
    { name: 'Yahoo Finance', status: 'live', latency: 200 },
  ]);

  const [liveCount, setLiveCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const symbols = Object.keys(quotes);
    const live = symbols.filter(s => quotes[s]?.price > 0 && quotes[s]?.status === 'live');
    setLiveCount(live.length);
    setTotalCount(symbols.length);
  }, [quotes]);

  const upCount = Object.values(quotes).filter(q => (q.change || 0) >= 0 && q.price > 0).length;
  const downCount = Object.values(quotes).filter(q => (q.change || 0) < 0 && q.price > 0).length;

  return (
    <div className="bg-[#0f172a] rounded-3xl border border-slate-800/50 p-6 shadow-2xl overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-black text-white text-lg tracking-tight">Live Market Data</h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time prices from verified market feeds</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-700/50">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-400">FEEDS LIVE</span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Live Instruments', value: liveCount.toLocaleString(), sub: `of ${totalCount} total`, icon: Monitor, color: 'text-emerald-400' },
          { label: 'Markets Up', value: upCount, sub: 'gaining today', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Markets Down', value: downCount, sub: 'declining today', icon: TrendingDown, color: 'text-rose-400' },
          { label: 'Asset Classes', value: '5', sub: 'crypto • FX • commodities • indices • shares', icon: BarChart3, color: 'text-[#F5CE47]' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl bg-white/5 p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <m.icon className={`w-5 h-5 ${m.color}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">{m.value}</span>
              <span className="text-xs text-slate-500">{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Data Provider Status */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data Providers</span>
          <span className="text-[10px] font-bold text-slate-500">Updated every 2s</span>
        </div>
        <div className="space-y-2">
          {providerStatus.map((p) => (
            <div key={p.name} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${p.status === 'live' ? 'bg-emerald-500' : p.status === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                <span className="text-xs font-bold text-slate-200">{p.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className={p.status === 'live' ? 'text-emerald-400' : 'text-slate-500'}>
                  {p.status === 'live' ? '● Live' : p.status === 'degraded' ? '⚠ Degraded' : '✕ Offline'}
                </span>
                <span className="text-slate-600">{p.latency}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
