import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, Bell, Clock, DollarSign, Globe, Landmark, ShieldCheck, TrendingUp, X,
  CheckCircle2, Mail, Phone, MapPin
} from 'lucide-react';
import { ViewType } from '../types';

export default function PreIPOView({ setView, user }: { setView: (view: ViewType) => void; user?: any }) {
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Hero */}
        <div className="bg-gradient-to-r from-[#F7931A] to-[#E8B93A] rounded-3xl p-8 sm:p-12 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-[#F7931A]" />
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider">
                Coming Soon • Pre-IPO Perpetuals
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Pre-IPO Perpetual Futures</h1>
            <p className="text-lg text-orange-100 max-w-xl">
              Go long or short on premier private company valuations before their stock exchange debut — all with
              perpetual contracts, no expiry, and no rollover fees. Coming soon to the Axi Trading Platform.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={() => setNotifyOpen(true)}
                className="bg-white text-[#F7931A] font-black px-8 py-4 rounded-xl text-lg uppercase tracking-wider shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer flex items-center gap-2"
              >
                <Bell className="w-5 h-5" /> Notify Me When Live
              </button>
              <button
                onClick={() => setView('markets')}
                className="bg-white/10 border border-white/20 text-white font-black px-8 py-4 rounded-xl text-lg uppercase tracking-wider hover:bg-white/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <Globe className="w-5 h-5" /> Explore Live Markets
              </button>
            </div>
          </div>
        </div>

        {/* What is Pre-IPO */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#F7931A]/10 text-[#F7931A] flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 text-xl">Trade Private Valuations Before IPO</h3>
              </div>
              <p className="text-slate-600 leading-relaxed mb-6">
                Pre-IPO perpetuals let you speculate on the future valuation of high-growth private companies — like
                those preparing for their stock exchange debut — without needing to own the underlying shares.
              </p>
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">✓</span> Long or short on upcoming IPOs</li>
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">✓</span> Perpetual contracts — no expiry, no rollover</li>
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">✓</span> Leverage up to 1:50 on select pre-IPO names</li>
                <li className="flex items-start gap-3"><span className="text-[#F7931A] font-black">✓</span> Trade 24/7 from your Axi account</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="font-black text-slate-900 text-xl mb-4">How It Works</h3>
              <ol className="space-y-5">
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#F7931A] text-white flex shrink-0 items-center justify-center text-xs font-black">1</div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">Select a Pre-IPO Asset</h4>
                    <p className="text-xs text-slate-500">Choose from featured private companies preparing for IPO.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#F7931A] text-white flex shrink-0 items-center justify-center text-xs font-black">2</div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">Go Long or Short</h4>
                    <p className="text-xs text-slate-500">Speculate on whether the IPO valuation will rise or fall.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#F7931A] text-white flex shrink-0 items-center justify-center text-xs font-black">3</div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">Trade Perpetually</h4>
                    <p className="text-xs text-slate-500">Hold your position with no expiry — close when you're ready.</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-800/50">
              <h3 className="font-black text-white text-xl mb-6">Be the First to Know</h3>
              <p className="text-slate-400 text-sm mb-6">
                Pre-IPO perpetuals are launching soon. Leave your email and we'll notify you the moment trading goes live.
              </p>
              {notifySubmitted ? (
                <div className="rounded-2xl bg-[#F7931A]/10 border border-[#F7931A]/20 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-[#F7931A]" />
                    <span className="font-black text-[#F7931A]">You're on the list!</span>
                  </div>
                  <p className="text-sm text-slate-300">
                    We'll email <strong className="text-white">{notifyEmail}</strong> as soon as Pre-IPO perpetuals are available to trade.
                  </p>
                  <button
                    onClick={() => { setNotifySubmitted(false); setNotifyEmail(''); }}
                    className="mt-4 text-xs font-black text-[#F7931A] hover:text-orange-300 transition"
                  >
                    Add another email →
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (notifyEmail.trim()) {
                      setNotifySubmitted(true);
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <input
                      type="email"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="you@email.com"
                      required
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-[#F7931A] focus:ring-2 focus:ring-[#F7931A]/20 outline-none placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      className="absolute right-1 top-1 bg-[#F7931A] text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-[#E89B2F] transition"
                    >
                      Notify
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    By subscribing, you agree to receive marketing communications from Axi. You may unsubscribe at any time.
                  </p>
                </form>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-black text-slate-900 text-xl mb-4">Related Markets Available Now</h3>
              <p className="text-sm text-slate-500 mb-6">
                While Pre-IPO perps are launching, you can trade these related instruments today:
              </p>
              <div className="space-y-3">
                {[
                  { name: 'Crypto Perpetual Futures', desc: 'BTC, ETH, SOL and 150+ assets, 24/7', link: 'perpetual_futures' },
                  { name: 'Spot Cryptocurrency', desc: 'Buy, sell and hold real crypto', link: 'spot_crypto' },
                  { name: 'Share CFDs', desc: 'Apple, Nvidia, Tesla and 500+ stocks', link: 'markets' },
                ].map((m) => (
                  <button
                    key={m.link}
                    onClick={() => setView(m.link as ViewType)}
                    className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                      <div className="text-xs text-slate-500">{m.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Risk Warning */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black text-sm text-amber-900 mb-1">Risk Warning</h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Pre-IPO perpetuals are a speculative derivative product. Prices of private company valuations can be
                extremely volatile and may move rapidly based on IPO timing, market conditions and company performance.
                You may lose some or all of your invested capital. Leverage magnifies both gains and losses. Ensure you
                fully understand the risks before trading.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support Section */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm text-center">
          <h3 className="font-black text-slate-900 text-2xl mb-4">Questions About Pre-IPO?</h3>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto">
            Our client support team is available 24/7 to help you understand Pre-IPO perpetuals and get ready for launch.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="flex items-center gap-2 bg-[#F7931A] text-white px-6 py-3 rounded-xl font-black shadow-lg hover:shadow-orange-500/30 transition">
              <Mail className="w-5 h-5" /> Email Support
            </button>
            <button className="flex items-center gap-2 bg-slate-100 text-slate-900 px-6 py-3 rounded-xl font-black hover:bg-slate-200 transition">
              <Phone className="w-5 h-5" /> Call Us
            </button>
            <button className="flex items-center gap-2 bg-slate-100 text-slate-900 px-6 py-3 rounded-xl font-black hover:bg-slate-200 transition">
              <MapPin className="w-5 h-5" /> Help Center
            </button>
          </div>
        </div>

      </div>

      {/* Notify Modal */}
      {notifyOpen && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl max-w-md w-full border border-slate-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-900 text-lg">Notify Me When Live</h3>
                <button onClick={() => setNotifyOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Enter your email and we'll let you know as soon as Pre-IPO perpetuals are available to trade on Axi.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (notifyEmail.trim()) {
                    setNotifySubmitted(true);
                    setNotifyOpen(false);
                  }
                }}
                className="space-y-3"
              >
                <div className="relative">
                  <input
                    type="email"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-[#F7931A] focus:ring-2 focus:ring-[#F7931A]/20 outline-none"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 bg-[#F7931A] text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-[#E89B2F] transition"
                  >
                    Notify
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
