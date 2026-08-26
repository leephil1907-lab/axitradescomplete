import React, { useState } from 'react';
import { 
  Server, 
  Zap, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  Activity, 
  Globe, 
  CheckCircle2, 
  ArrowRight, 
  Send, 
  TrendingUp, 
  BarChart2, 
  Download, 
  Sparkles, 
  Sliders,
  Check,
  Clock,
  Layers
} from 'lucide-react';
import { motion } from 'motion/react';
import { ViewType } from '../types';
import { sendTelegramAlert } from '../utils/telegram';
import { safeStorage } from '../utils/storage';

interface ForexVpsViewProps {
  setView: (view: ViewType) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openSignUp?: () => void;
}

export default function ForexVpsView({ setView, showToast, openSignUp }: ForexVpsViewProps) {
  // VPS Request Form State
  const [selectedTier, setSelectedTier] = useState<'Bronze' | 'Silver' | 'Gold'>('Silver');
  const [accountNumber, setAccountNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [serverLocation, setServerLocation] = useState('London LD4 (Equinix)');
  const [platform, setPlatform] = useState('MetaTrader 4 (MT4)');
  const [eaStrategyName, setEaStrategyName] = useState('Automated Scalper EA');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const handleSubmitVpsRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !accountNumber) {
      showToast('Please provide your name, email, and Axi trading account number.', 'error');
      return;
    }

    setIsSubmitting(true);
    const vpsRef = `VPS-AXI-${Math.floor(100000 + Math.random() * 900000)}`;

    const vpsData = {
      vpsRef,
      selectedTier,
      accountNumber,
      clientName,
      clientEmail,
      serverLocation,
      platform,
      eaStrategyName,
      createdAt: new Date().toISOString()
    };

    // Save to storage
    try {
      const existing = JSON.parse(safeStorage.getItem('axi_vps_requests') || '[]');
      existing.unshift(vpsData);
      safeStorage.setItem('axi_vps_requests', JSON.stringify(existing));
    } catch (err) {
      console.warn('Storage save warning:', err);
    }

    // Dispatch real email via Google SMTP
    try {
      fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: clientEmail,
          recipientName: clientName,
          type: 'Custom',
          subject: `⚡ Axi Forex VPS Provisioning Request Logged [Ref: ${vpsRef}]`,
          customBody: `Dear ${clientName},\n\nWe have received your request for an Axi ${selectedTier} Forex VPS hosted at ${serverLocation}.\n\nYour request reference ID is: ${vpsRef}\n\nOur Systems Engineering Desk is preparing your virtual server instance with pre-configured ${platform} and optical cross-connects (<1ms latency to Axi liquidity bridges). RDP login credentials and IP allocation will be dispatched to this email address within 2-4 business hours.\n\nBest regards,\nAxi Server Engineering Team\nwww.axi.com`
        })
      }).catch(e => console.warn('Email notice:', e));
    } catch (e) {}

    // Dispatch real Telegram alert
    sendTelegramAlert('VPS_REQUEST', `⚡ New Forex VPS Provisioning Request [${selectedTier}]`, {
      'VPS Ref': vpsRef,
      'Trader': clientName,
      'Email': clientEmail,
      'Account #': accountNumber,
      'Location': serverLocation,
      'Platform': platform,
      'EA Description': eaStrategyName
    });

    setIsSubmitting(false);
    setSubmittedRef(vpsRef);
    showToast(`✅ VPS Provisioning request logged! Reference: ${vpsRef}`, 'success');
  };

  return (
    <div className="w-full py-8 lg:py-12">
      {/* Hero Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 mb-12 relative overflow-hidden border border-slate-800 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-brand-red/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-red/20 text-brand-red border border-brand-red/30 text-xs font-black uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5" /> High-Frequency Infrastructure
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
            Ultra-Low Latency Forex VPS & Algorithmic Execution
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
            Execute Expert Advisors (EAs) and automated trading algorithms 24 hours a day with sub-millisecond optical cross-connects directly into Axi's Equinix LD4 (London) and NY4 (New York) liquidity hubs.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#vps-form"
              className="bg-brand-red hover:bg-red-700 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg transition cursor-pointer text-sm flex items-center gap-2"
            >
              Request Free Forex VPS <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#autochartist-section"
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3.5 rounded-xl border border-slate-700 transition cursor-pointer text-sm"
            >
              Autochartist Scanner
            </a>
          </div>
        </div>

        {/* Latency Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-800">
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono block">&lt; 0.4 ms</span>
            <span className="text-xs text-slate-400 font-medium">Equinix London LD4</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono block">&lt; 0.6 ms</span>
            <span className="text-xs text-slate-400 font-medium">Equinix New York NY4</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono block">99.99%</span>
            <span className="text-xs text-slate-400 font-medium">Guaranteed Server Uptime</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-brand-yellow font-mono block">100% Free</span>
            <span className="text-xs text-slate-400 font-medium">With 20+ Lots Monthly Volume</span>
          </div>
        </div>
      </div>

      {/* 3 VPS Hardware Tiers */}
      <div className="mb-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
            Dedicated Virtual Server Specifications
          </h2>
          <p className="text-sm text-slate-500">
            Engineered specifically for MT4 and MT5 algorithmic Expert Advisors with optical NVMe storage and dedicated RAM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 1: Bronze */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs hover:border-slate-400 transition flex flex-col justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">Entry Algorithm Tier</span>
              <h3 className="text-xl font-black text-slate-900 mb-2">Bronze VPS</h3>
              <div className="text-3xl font-black text-slate-900 font-mono my-3">
                $25 <span className="text-xs text-slate-400 font-normal">/ month (or FREE*)</span>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Ideal for 1-2 concurrent Expert Advisors or manual traders seeking 24/7 order monitoring.
              </p>

              <ul className="space-y-3 mb-8 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2.5"><Cpu className="w-4 h-4 text-slate-500" /> 1 vCPU (2.5 GHz Xeon)</li>
                <li className="flex items-center gap-2.5"><Activity className="w-4 h-4 text-slate-500" /> 2 GB Dedicated DDR4 RAM</li>
                <li className="flex items-center gap-2.5"><HardDrive className="w-4 h-4 text-slate-500" /> 40 GB NVMe SSD Storage</li>
                <li className="flex items-center gap-2.5"><Zap className="w-4 h-4 text-emerald-600" /> 1 Gbps Port Speed (&lt;1ms ping)</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600" /> *Free with 20 lots/month</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setSelectedTier('Bronze');
                document.getElementById('vps-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-900 font-bold py-3 rounded-xl text-xs transition cursor-pointer"
            >
              Select Bronze VPS
            </button>
          </div>

          {/* Tier 2: Silver Pro (Recommended) */}
          <div className="bg-white border-2 border-brand-red rounded-3xl p-6 sm:p-8 shadow-md relative flex flex-col justify-between">
            <span className="absolute -top-3.5 right-6 bg-brand-red text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-xs">
              Most Popular
            </span>

            <div>
              <span className="text-xs font-black uppercase tracking-wider text-brand-red block mb-1">High-Frequency EA Tier</span>
              <h3 className="text-xl font-black text-slate-900 mb-2">Silver Pro VPS</h3>
              <div className="text-3xl font-black text-brand-red font-mono my-3">
                $45 <span className="text-xs text-slate-400 font-normal">/ month (or FREE*)</span>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Recommended for multi-pair grid scalpers, martingale strategies, and latency-sensitive arbitrage.
              </p>

              <ul className="space-y-3 mb-8 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2.5"><Cpu className="w-4 h-4 text-brand-red" /> 2 vCPUs (3.5 GHz High-Frequency)</li>
                <li className="flex items-center gap-2.5"><Activity className="w-4 h-4 text-brand-red" /> 4 GB Dedicated DDR4 RAM</li>
                <li className="flex items-center gap-2.5"><HardDrive className="w-4 h-4 text-brand-red" /> 80 GB NVMe SSD Storage</li>
                <li className="flex items-center gap-2.5"><Zap className="w-4 h-4 text-emerald-600" /> Direct Equinix LD4/NY4 Cross-Connect</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600" /> *Free with 40 lots/month</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setSelectedTier('Silver');
                document.getElementById('vps-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-brand-red hover:bg-red-700 text-white font-extrabold py-3 rounded-xl text-xs transition cursor-pointer shadow-md"
            >
              Select Silver Pro VPS
            </button>
          </div>

          {/* Tier 3: Gold Enterprise */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs hover:border-slate-400 transition flex flex-col justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">Institutional Tier</span>
              <h3 className="text-xl font-black text-slate-900 mb-2">Gold Enterprise VPS</h3>
              <div className="text-3xl font-black text-slate-900 font-mono my-3">
                $75 <span className="text-xs text-slate-400 font-normal">/ month (or FREE*)</span>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Designed for institutional quant funds, portfolio managers, and complex multi-terminal deployments.
              </p>

              <ul className="space-y-3 mb-8 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2.5"><Cpu className="w-4 h-4 text-slate-500" /> 4 vCPUs (4.0 GHz Turbo Xeon)</li>
                <li className="flex items-center gap-2.5"><Activity className="w-4 h-4 text-slate-500" /> 8 GB Dedicated DDR4 RAM</li>
                <li className="flex items-center gap-2.5"><HardDrive className="w-4 h-4 text-slate-500" /> 160 GB Enterprise NVMe SSD</li>
                <li className="flex items-center gap-2.5"><ShieldCheck className="w-4 h-4 text-slate-500" /> Dedicated Static IP Address</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600" /> *Free with 80 lots/month</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setSelectedTier('Gold');
                document.getElementById('vps-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-900 font-bold py-3 rounded-xl text-xs transition cursor-pointer"
            >
              Select Gold Enterprise VPS
            </button>
          </div>
        </div>
      </div>

      {/* Autochartist & AI Analyst Section */}
      <div id="autochartist-section" className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 mb-16 border border-slate-800 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-black uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Automated Market Scanner
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
              Autochartist Technical Scanner & AI Trade Analytics
            </h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Identify high-probability chart patterns, breakout levels, and Fibonacci projections across hundreds of financial instruments automatically inside your MT4 and MT5 charts.
            </p>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-white block font-bold">Continuous Market Pattern Recognition:</strong>
                  Scans 24/7 for Triangles, Head & Shoulders, Wedges, Channels, and Double Tops/Bottoms.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-white block font-bold">PowerStats Volatility Engine:</strong>
                  Provides precise expected pip movement ranges per hour to assist in setting accurate Stop Loss and Take Profit levels.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <strong className="text-white block font-bold">Axi AI Analyst (Beta):</strong>
                  Post-trade behavioral feedback diagnosing holding times, risk-to-reward discipline, and psychological biases.
                </div>
              </div>
            </div>
          </div>

          {/* Autochartist Interactive Setup Panel */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
            <h3 className="font-black text-base text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-brand-red" />
              Install Autochartist on MetaTrader
            </h3>
            <p className="text-xs text-slate-400">
              All live Axi account holders receive complimentary unlimited access to the Autochartist Expert Advisor plugin.
            </p>

            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700 text-xs space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Plugin Compatibility:</span>
                <span className="font-bold text-white">MT4 & MT5 (Windows/macOS)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Licensing Cost:</span>
                <span className="font-bold text-emerald-400">100% Free for Axi Clients</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Setup Duration:</span>
                <span className="font-bold text-white">&lt; 2 Minutes (1-Click Installer)</span>
              </div>
            </div>

            <button
              onClick={() => {
                showToast('🚀 Autochartist plugin package download initiated for MetaTrader!', 'success');
              }}
              className="w-full bg-brand-red hover:bg-red-700 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Autochartist Plugin (.exe)
            </button>
          </div>
        </div>
      </div>

      {/* Real VPS Request Form */}
      <div id="vps-form" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-brand-red flex items-center justify-center mx-auto mb-3">
            <Server className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Provision Your Dedicated Forex VPS</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Submit your server specifications. Your VPS IP address and secure Remote Desktop (RDP) login details will be dispatched to your email.
          </p>
        </div>

        {submittedRef ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-emerald-950">VPS Server Instance Provisioning Initiated!</h3>
            <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
              Your request for a <strong className="text-slate-900">{selectedTier} VPS</strong> has been logged under Reference <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">{submittedRef}</strong>. An email confirmation has been sent to <strong>{clientEmail}</strong>.
            </p>
            <button
              onClick={() => setSubmittedRef(null)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              Submit Another Server Request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitVpsRequest} className="space-y-5">
            {/* VPS Tier Selector */}
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-2">Selected Server Tier</label>
              <div className="grid grid-cols-3 gap-3">
                {(['Bronze', 'Silver', 'Gold'] as const).map(tier => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      selectedTier === tier 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tier} VPS
                  </button>
                ))}
              </div>
            </div>

            {/* Row 1: Account # & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Axi Trading Account Number *</label>
                <input 
                  type="text" 
                  required
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="e.g. 8492018"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Trader Legal Name *</label>
                <input 
                  type="text" 
                  required
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="e.g. Johnathan Miller"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition"
                />
              </div>
            </div>

            {/* Row 2: Email & Datacenter Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Recipient Email for RDP Credentials *</label>
                <input 
                  type="email" 
                  required
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  placeholder="trader@yourdomain.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Target Equinix Datacenter</label>
                <select 
                  value={serverLocation}
                  onChange={e => setServerLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition font-medium"
                >
                  <option value="London LD4 (Equinix)">London LD4 (Equinix) — &lt;0.4ms to Axi Liquidity</option>
                  <option value="New York NY4 (Equinix)">New York NY4 (Equinix) — &lt;0.6ms</option>
                  <option value="Tokyo TY3 (Equinix)">Tokyo TY3 (Equinix) — &lt;1.2ms</option>
                  <option value="Frankfurt FR2 (Equinix)">Frankfurt FR2 (Equinix) — &lt;0.8ms</option>
                </select>
              </div>
            </div>

            {/* Row 3: Platform & EA Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Trading Terminal</label>
                <select 
                  value={platform}
                  onChange={e => setPlatform(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition font-medium"
                >
                  <option value="MetaTrader 4 (MT4)">MetaTrader 4 (MT4) with Pre-Installed EAs</option>
                  <option value="MetaTrader 5 (MT5)">MetaTrader 5 (MT5) Multi-Asset</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Expert Advisor Strategy / Notes</label>
                <input 
                  type="text" 
                  value={eaStrategyName}
                  onChange={e => setEaStrategyName(e.target.value)}
                  placeholder="e.g. M15 Grid Scalper EA"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-red hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>Provisioning Server Instance...</>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Request Axi Dedicated Forex VPS
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
