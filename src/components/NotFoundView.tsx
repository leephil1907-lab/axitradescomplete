import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, AlertCircle, Home, Compass, BarChart3, Globe, ShieldCheck,
  DollarSign, Clock, PhoneCall, Mail, MapPin
} from 'lucide-react';
import { ViewType } from '../types';
import AxiLogo from './AxiLogo';

export default function NotFoundView({ setView }: { setView: (view: ViewType) => void }) {
  return (
    <div className="min-h-screen bg-[#FAF6EE] text-slate-900 flex flex-col">
      {/* Header with Axi branding */}
      <header className="w-full bg-[#C8102E] sticky top-0 z-50 shadow-lg border-b border-red-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AxiLogo variant="white" size="md" className="drop-shadow-sm" />
            <span className="text-white font-black text-sm sm:text-base tracking-tight hidden sm:inline">AXI</span>
          </div>
          <div className="hidden lg:flex items-center gap-6 text-white font-medium text-sm">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setView('home'); }}
              className="text-white/90 hover:text-[#F5CE47] transition cursor-pointer"
            >
              Home
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setView('markets'); }}
              className="text-white/90 hover:text-[#F5CE47] transition cursor-pointer"
            >
              Markets
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full text-center space-y-8"
        >
          {/* 404 Brand Mark */}
          <div className="relative inline-flex items-center justify-center w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-[#C8102E]/10 animate-pulse" />
            <div className="relative z-10 w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center">
              <AlertCircle className="w-14 h-14 text-[#C8102E]" />
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-2">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-black text-slate-700 mb-4">Page Not Found</h2>
          <p className="text-lg text-slate-600 max-w-md mx-auto mb-8 leading-relaxed">
            The page you're looking for doesn't exist or has been moved. You can return to the homepage
            or explore the Axi Trading Platform from below.
          </p>

          {/* Quick action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-2 bg-[#C8102E] text-white px-8 py-4 rounded-xl font-black text-lg shadow-lg hover:bg-[#9B0018] hover:shadow-xl transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Home className="w-5 h-5" /> Return to Home
            </button>
            <button
              onClick={() => setView('markets')}
              className="flex items-center gap-2 bg-white border border-[#C8102E] text-[#C8102E] px-8 py-4 rounded-xl font-black text-lg hover:bg-[#C8102E]/10 transition-all cursor-pointer"
            >
              <Compass className="w-5 h-5" /> Explore Markets
            </button>
          </div>

          {/* Support options */}
          <div className="mt-10 p-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
            <h3 className="font-black text-slate-900 text-xl mb-6 flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#C8102E]" /> Need Help?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
              <div className="flex items-start gap-3">
                <Globe className="w-4 h-4 text-[#C8102E] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">Help Centre</div>
                  <div className="text-xs text-slate-500">FAQs, guides, and troubleshooting</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#C8102E] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">Email Support</div>
                  <div className="text-xs text-slate-500">axicustomersupport@gmail.com</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PhoneCall className="w-4 h-4 text-[#C8102E] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">Client Services</div>
                  <div className="text-xs text-slate-500">24/7 multilingual support</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick market links */}
          <div className="mt-8">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider mb-4 text-center">
              Popular Markets
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { symbol: 'BTCUSD', name: 'Bitcoin', color: '#F7931A' },
                { symbol: 'ETHUSD', name: 'Ethereum', color: '#627EEA' },
                { symbol: 'EURUSD', name: 'EUR/USD', color: '#003399' },
                { symbol: 'GBPUSD', name: 'GBP/USD', color: '#012169' },
                { symbol: 'XAUUSD', name: 'Gold', color: '#eab308' },
                { symbol: 'US30', name: 'US 30', color: '#f59e0b' },
              ].map((m) => (
                <button
                  key={m.symbol}
                  onClick={() => setView('markets')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    m.color === '#F7931A'
                      ? 'bg-[#F7931A]/10 text-[#F7931A] border-[#F7931A]/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black shrink-0 ${
                      m.color === '#F7931A' ? 'bg-[#F7931A]/20 text-[#F7931A]' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {m.symbol === 'BTCUSD' ? '₿' : m.symbol === 'ETHUSD' ? 'Ξ' : m.symbol.slice(0, 1)}
                  </span>
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-slate-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <AxiLogo variant="red" size="sm" className="shrink-0" />
            <span className="font-black">AXI</span>
          </div>
          <div className="flex items-center gap-4 text-center sm:text-left">
            <span>© {new Date().getFullYear()} Axi. All rights reserved.</span>
            <span className="hidden sm:inline">|</span>
            <span>Regulated CFD &amp; Forex Broker</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
