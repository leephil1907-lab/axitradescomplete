import PageHero from './axi/PageHero';
import platformArt from '../assets/axi-official/axi_desktop_hero.jpg';
import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, BarChart3, Check, Globe2, Laptop, Monitor, Smartphone } from 'lucide-react';
import { TRADING_PLATFORMS } from '../config/tradingPlatforms';

const platformCards = [
  { key: 'mt4' as const, eyebrow: 'CLASSIC FOREX PLATFORM', title: 'MetaTrader 4', description: 'A familiar multi-device trading terminal with charting, Expert Advisors and browser access through WebTrader.', features: ['Desktop trading terminal', 'Expert Advisors & custom indicators', 'MT4 WebTrader access'], icon: Monitor, image: TRADING_PLATFORMS.mt4.logoUrl, accent: 'from-[#15191f] to-[#05070a]' },
  { key: 'mt5' as const, eyebrow: 'MULTI-ASSET PLATFORM', title: 'MetaTrader 5', description: 'Advanced multi-asset trading with deeper market tools, automation and professional charting.', features: ['Multi-asset trading', 'Advanced technical tools', 'Expert Advisors & automation'], icon: BarChart3, image: TRADING_PLATFORMS.mt5.logoUrl, accent: 'from-[#101820] to-[#05070a]' },
  { key: 'webTrader' as const, eyebrow: 'BROWSER TRADING', title: 'Axi Web Trading Platform', description: 'Trade from your browser with a modern web experience designed to keep analysis, positions and account management close at hand.', features: ['No desktop installation', 'Browser-based access', 'TradingView-powered charting on Axi platform'], icon: Globe2, image: TRADING_PLATFORMS.webTrader.logoUrl, accent: 'from-[#1a1113] to-[#05070a]' }
];

export default function PlatformsView({ onViewMarkets }: { onViewMarkets: () => void }) {
  return (
    <div className="site-editorial-page min-h-screen">
      <PageHero label="Trading platforms" title="Choose your platform." description="Explore MetaTrader 4, MetaTrader 5 and the Axi web trading experience. Availability depends on your account permissions." image={platformArt}>
        <a className="home-button home-button-primary" href="#platform-comparison">Compare platforms</a>
      </PageHero>

      <section id="platform-comparison" tabIndex={-1} className="home-shell scroll-mt-24 py-12 lg:py-16">
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
                  {platform.key === 'webTrader' ? <button type="button" onClick={onViewMarkets} className="home-button home-button-primary mt-7">Open Markets <ArrowUpRight size={17} aria-hidden="true" /></button> : <p className="mt-7 text-sm text-slate-600 dark:text-slate-300">An MT4/MT5 connection is not available from this page.</p>}
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
    </div>
  );
}
