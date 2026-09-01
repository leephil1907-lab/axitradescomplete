import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, BarChart3, Check, Globe2, Laptop, Monitor, Smartphone, Zap } from 'lucide-react';
import { TRADING_PLATFORMS } from '../config/tradingPlatforms';

const platformCards = [
  { key: 'mt4' as const, eyebrow: 'CLASSIC FOREX PLATFORM', title: 'MetaTrader 4', description: 'A familiar multi-device trading terminal with charting, Expert Advisors and browser access through WebTrader.', features: ['Desktop trading terminal', 'Expert Advisors & custom indicators', 'MT4 WebTrader access'], icon: Monitor, image: TRADING_PLATFORMS.mt4.logoUrl, href: TRADING_PLATFORMS.mt4.officialUrl, accent: 'from-[#15191f] to-[#05070a]' },
  { key: 'mt5' as const, eyebrow: 'MULTI-ASSET PLATFORM', title: 'MetaTrader 5', description: 'Advanced multi-asset trading with deeper market tools, automation and professional charting.', features: ['Multi-asset trading', 'Advanced technical tools', 'Expert Advisors & automation'], icon: BarChart3, image: TRADING_PLATFORMS.mt5.logoUrl, href: TRADING_PLATFORMS.mt5.officialUrl, accent: 'from-[#101820] to-[#05070a]' },
  { key: 'webTrader' as const, eyebrow: 'BROWSER TRADING', title: 'Axi Web Trading Platform', description: 'Trade from your browser with a modern web experience designed to keep analysis, positions and account management close at hand.', features: ['No desktop installation', 'Browser-based access', 'TradingView-powered charting on Axi platform'], icon: Globe2, image: TRADING_PLATFORMS.webTrader.logoUrl, href: TRADING_PLATFORMS.webTrader.webTraderUrl, accent: 'from-[#1a1113] to-[#05070a]' }
];

export default function PlatformsView() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#050608] text-slate-950 dark:text-white">
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(227,0,15,.12),transparent_32%),radial-gradient(circle_at_15%_70%,rgba(15,23,42,.08),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }} className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-red/20 bg-brand-red/5 px-3 py-1 text-[10px] font-black tracking-[.18em] text-brand-red"><Zap className="h-3.5 w-3.5" /> TRADING PLATFORMS</span>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-.045em] sm:text-6xl lg:text-7xl">Trade on the platform that fits your edge.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">Access MetaTrader 4, MetaTrader 5 and the Axi web trading experience. Your live trading credentials and account permissions determine which platform is available to you.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 dark:bg-white/5"><Laptop className="h-4 w-4" /> Desktop</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 dark:bg-white/5"><Smartphone className="h-4 w-4" /> Mobile</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 dark:bg-white/5"><Globe2 className="h-4 w-4" /> Web</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {platformCards.map((platform, index) => {
            const Icon = platform.icon;
            return (
              <motion.article key={platform.key} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: index * .08 }} whileHover={{ y: -7 }} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,.08)] dark:border-white/10 dark:bg-[#0b0d11] dark:shadow-none">
                <div className={`relative h-56 overflow-hidden bg-gradient-to-br ${platform.accent}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(227,0,15,.22),transparent_30%)]" />
                  <img src={platform.image} alt={`${platform.title} visual`} loading="lazy" className="absolute inset-0 h-full w-full object-contain p-10 opacity-90 transition duration-500 group-hover:scale-105" />
                  <div className="absolute left-5 top-5 rounded-xl border border-white/10 bg-black/35 p-2.5 text-white backdrop-blur"><Icon className="h-5 w-5" /></div>
                </div>
                <div className="p-7">
                  <div className="text-[10px] font-black tracking-[.18em] text-brand-red">{platform.eyebrow}</div>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">{platform.title}</h2>
                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-600 dark:text-slate-400">{platform.description}</p>
                  <ul className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm dark:border-white/10">{platform.features.map(feature => <li key={feature} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />{feature}</li>)}</ul>
                  <a href={platform.href} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-brand-red dark:bg-white dark:text-slate-950 dark:hover:bg-brand-red dark:hover:text-white">Open official platform page <ArrowUpRight className="h-4 w-4" /></a>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-[28px] bg-[#090b0f] p-8 text-white sm:p-10">
          <div className="max-w-3xl"><span className="text-[10px] font-black tracking-[.18em] text-[#FFD250]">LIVE ACCOUNT ACCESS</span><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Production means no simulated execution.</h2><p className="mt-4 text-sm leading-6 text-slate-300">AxiTrades will only display orders, fills, positions and prices returned by configured production services. Until a real execution integration is connected, this page remains a platform launcher rather than pretending that local orders are live.</p></div>
        </motion.div>
      </section>
    </main>
  );
}
