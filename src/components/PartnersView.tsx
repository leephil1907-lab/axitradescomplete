import React, { useState } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Award, 
  ShieldCheck, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles, 
  Globe, 
  Zap, 
  PieChart, 
  Layers, 
  Send, 
  ArrowRight, 
  HelpCircle, 
  PhoneCall, 
  Mail, 
  FileText,
  Sliders,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { ViewType } from '../types';
import { sendTelegramAlert } from '../utils/telegram';
import { safeStorage } from '../utils/storage';

interface PartnersViewProps {
  setView: (view: ViewType) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openSignUp?: () => void;
}

export default function PartnersView({ setView, showToast, openSignUp }: PartnersViewProps) {
  // IB Rebates Calculator State
  const [activeTradersCount, setActiveTradersCount] = useState<number>(25);
  const [avgLotsPerTrader, setAvgLotsPerTrader] = useState<number>(10);
  const [rebatePerLot, setRebatePerLot] = useState<number>(8); // $8 / lot

  const calculatedMonthlyRebate = activeTradersCount * avgLotsPerTrader * rebatePerLot;
  const calculatedAnnualRebate = calculatedMonthlyRebate * 12;

  // Partner Application Form State
  const [partnerType, setPartnerType] = useState<'IB' | 'CPA' | 'Hybrid' | 'WhiteLabel'>('IB');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [companyName, setCompanyName] = useState('');
  const [telegramHandle, setTelegramHandle] = useState('');
  const [estimatedMonthlyLots, setEstimatedMonthlyLots] = useState('100 - 500 Lots');
  const [marketingChannels, setMarketingChannels] = useState('Trading Community / Telegram');
  const [payoutMethod, setPayoutMethod] = useState('Crypto USDT (TRC20/ERC20)');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone) {
      showToast('Please complete your name, email, and phone number.', 'error');
      return;
    }

    setIsSubmitting(true);
    const appId = `IB-AXI-${Math.floor(100000 + Math.random() * 900000)}`;

    const applicationData = {
      appId,
      partnerType,
      fullName,
      email,
      phone,
      country,
      companyName,
      telegramHandle,
      estimatedMonthlyLots,
      marketingChannels,
      payoutMethod,
      additionalNotes,
      createdAt: new Date().toISOString()
    };

    // 1. Save to local storage for administrative dashboard review
    try {
      const existing = JSON.parse(safeStorage.getItem('axi_partner_applications') || '[]');
      existing.unshift(applicationData);
      safeStorage.setItem('axi_partner_applications', JSON.stringify(existing));
    } catch (err) {
      console.warn('Storage save error:', err);
    }

    // 2. Dispatch real transactional notification via Google SMTP server
    try {
      fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: email,
          recipientName: fullName,
          type: 'Custom',
          subject: `🤝 Axi Partner Application Received [Ref: ${appId}]`,
          customBody: `Dear ${fullName},\n\nThank you for applying to the official Axi Partner Program as an ${partnerType === 'IB' ? 'Introducing Broker (IB)' : partnerType === 'CPA' ? 'CPA Affiliate' : partnerType === 'Hybrid' ? 'Hybrid Partner' : 'White Label Institution'}.\n\nYour application reference is: ${appId}\n\nOur Institutional Institutional Partnerships Desk has received your profile. Your dedicated Institutional Account Manager will contact you within 24 hours via email (${email}) or Telegram (${telegramHandle || 'phone'}) to finalize your custom rebate schedule and launch your tracking links.\n\nBest regards,\nAxi Institutional Partnerships Team\nwww.axi.com`
        })
      }).catch(err => console.warn('Email dispatch warning:', err));
    } catch (e) {
      // non-blocking
    }

    // 3. Dispatch real Telegram security alert
    sendTelegramAlert('PARTNER_APPLICATION', `🤝 New Axi Partner Application [${partnerType}]`, {
      'App ID': appId,
      'Partner Name': fullName,
      'Email': email,
      'Phone': phone,
      'Country': country,
      'Telegram': telegramHandle || 'N/A',
      'Expected Volume': estimatedMonthlyLots,
      'Marketing Channels': marketingChannels,
      'Payout Method': payoutMethod
    });

    setIsSubmitting(false);
    setSubmittedRef(appId);
    showToast(`✅ Partner application submitted! Reference ID: ${appId}`, 'success');
  };

  return (
    <div className="w-full py-8 lg:py-12">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 mb-12 relative overflow-hidden border border-slate-800 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-brand-red/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-red/20 text-brand-red border border-brand-red/30 text-xs font-black uppercase tracking-wider mb-4">
            <Award className="w-3.5 h-3.5" /> Official Axi Partner Network
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
            Grow Your Income With An Award-Winning Global Broker
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
            Partner with a regulated market leader trusted by over 50,000 Introducing Brokers and Affiliates worldwide. Enjoy industry-leading rebates, multi-tier Sub-IB rewards, and real-time automated payouts.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#partner-form"
              className="bg-brand-red hover:bg-red-700 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg transition cursor-pointer text-sm flex items-center gap-2"
            >
              Become an Axi Partner <ChevronRight className="w-4 h-4" />
            </a>
            <a
              href="#rebate-calculator"
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3.5 rounded-xl border border-slate-700 transition cursor-pointer text-sm"
            >
              Calculate Projected Rebates
            </a>
          </div>
        </div>

        {/* Hero Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-800">
          <div>
            <span className="text-2xl sm:text-3xl font-black text-brand-yellow block">$12+</span>
            <span className="text-xs text-slate-400 font-medium">Rebate Per Traded Lot</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white block">Up to $1,000</span>
            <span className="text-xs text-slate-400 font-medium">CPA Per Qualified Trader</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">$4.2B+</span>
            <span className="text-xs text-slate-400 font-medium">Monthly Partner Volume</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white block">Daily</span>
            <span className="text-xs text-slate-400 font-medium">Automated Commission Payouts</span>
          </div>
        </div>
      </div>

      {/* 4 Core Partnership Programs */}
      <div className="mb-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
            Flexible Partnership Structures Tailored to Your Business
          </h2>
          <p className="text-sm text-slate-500">
            Choose the model that fits your audience, trading network, or institutional requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: IB */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-brand-red transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-red-50 text-brand-red flex items-center justify-center font-black mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">Introducing Broker (IB)</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Earn recurring, uncapped volume rebates on every single trade placed by your clients for the entire account lifetime.
              </p>
              <ul className="space-y-2 mb-6 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Up to $12 per lot on standard FX</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Multi-tier Sub-IB network commissions</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Real-time portal & reporting tools</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> No minimum client volume caps</li>
              </ul>
            </div>
            <button 
              onClick={() => {
                setPartnerType('IB');
                const el = document.getElementById('partner-form');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-slate-100 hover:bg-brand-red hover:text-white text-slate-900 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              Apply as Introducing Broker
            </button>
          </div>

          {/* Card 2: CPA Affiliate */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-brand-red transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black mb-4">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">CPA Affiliate Program</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                High-converting CPA payouts designed for media buyers, financial portals, SEO creators, and digital influencers.
              </p>
              <ul className="space-y-2 mb-6 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Up to $1,000 CPA per funded trader</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> High-converting multi-language banners</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> 60-day cookie tracking lifespan</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Dedicated affiliate manager support</li>
              </ul>
            </div>
            <button 
              onClick={() => {
                setPartnerType('CPA');
                const el = document.getElementById('partner-form');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-slate-100 hover:bg-brand-red hover:text-white text-slate-900 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              Apply as CPA Affiliate
            </button>
          </div>

          {/* Card 3: Hybrid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-brand-red transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">Hybrid (CPA + RevShare)</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                The ultimate tailored model: receive upfront capital per acquisition plus long-term continuous trading revenue share.
              </p>
              <ul className="space-y-2 mb-6 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Upfront CPA on qualifying first deposit</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Ongoing volume rebate per lot traded</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Maximizes short and long-term yield</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Customized tier plans by region</li>
              </ul>
            </div>
            <button 
              onClick={() => {
                setPartnerType('Hybrid');
                const el = document.getElementById('partner-form');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-slate-100 hover:bg-brand-red hover:text-white text-slate-900 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              Apply for Hybrid Plan
            </button>
          </div>

          {/* Card 4: White Label */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-brand-red transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">White Label Institutional</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Launch your own branded turnkey brokerage backed by Axi's deep institutional liquidity pools and regulatory frameworks.
              </p>
              <ul className="space-y-2 mb-6 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Custom branded MT4/MT5 desktop/mobile</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Full back-office CRM & payment gateways</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Tier-1 aggregated interbank liquidity</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> 24/7 dedicated institutional tech team</li>
              </ul>
            </div>
            <button 
              onClick={() => {
                setPartnerType('WhiteLabel');
                const el = document.getElementById('partner-form');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-slate-100 hover:bg-brand-red hover:text-white text-slate-900 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              Request White Label Pack
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Rebates & Earnings Calculator */}
      <div id="rebate-calculator" className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 mb-16 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-10 items-center justify-between">
          <div className="flex-1 w-full space-y-6">
            <div>
              <span className="text-xs font-black uppercase text-brand-red tracking-wider block mb-1">Interactive Estimation Model</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">IB Rebates & Commission Calculator</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Estimate your monthly and annual revenue based on the trading volume of your referred clients.
              </p>
            </div>

            {/* Slider 1: Active Traders */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Active Referred Clients:</span>
                <span className="text-brand-yellow font-black text-sm">{activeTradersCount} Traders</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="250" 
                step="5"
                value={activeTradersCount}
                onChange={e => setActiveTradersCount(Number(e.target.value))}
                className="w-full accent-brand-red h-2 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider 2: Average Lots Per Trader */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Average Volume Traded Per Client (Lots / Month):</span>
                <span className="text-brand-yellow font-black text-sm">{avgLotsPerTrader} Lots</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="50" 
                step="1"
                value={avgLotsPerTrader}
                onChange={e => setAvgLotsPerTrader(Number(e.target.value))}
                className="w-full accent-brand-red h-2 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider 3: Rebate Tier */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Partner Rebate Tier ($ / Lot):</span>
                <span className="text-brand-yellow font-black text-sm">${rebatePerLot}.00 USD / Lot</span>
              </div>
              <div className="flex gap-2">
                {[6, 8, 10, 12].map(rate => (
                  <button
                    key={rate}
                    onClick={() => setRebatePerLot(rate)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                      rebatePerLot === rate 
                        ? 'bg-brand-red text-white' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    ${rate} / Lot
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Earnings Projection Card */}
          <div className="w-full lg:w-96 bg-slate-800/90 border border-slate-700 rounded-2xl p-6 flex flex-col justify-between text-center shrink-0 shadow-lg">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Projected Monthly Earnings</span>
              <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono my-2">
                ${calculatedMonthlyRebate.toLocaleString()} <span className="text-sm text-slate-400">USD</span>
              </div>
              <p className="text-xs text-slate-400">
                Total monthly trading volume: <strong className="text-white font-mono">{(activeTradersCount * avgLotsPerTrader).toLocaleString()} Lots</strong>
              </p>

              <div className="my-6 p-4 rounded-xl bg-slate-900/80 border border-slate-700 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Projected Annual Payout:</span>
                  <span className="text-brand-yellow font-bold font-mono">${calculatedAnnualRebate.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payout Frequency:</span>
                  <span className="text-white font-bold">Daily Automated</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sub-IB Additional Bonus:</span>
                  <span className="text-emerald-400 font-bold">+10% to +15% Override</span>
                </div>
              </div>
            </div>

            <a
              href="#partner-form"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black py-3 rounded-xl text-xs transition cursor-pointer shadow-md"
            >
              Start Earning as an Axi Partner
            </a>
          </div>
        </div>
      </div>

      {/* CPA Global Tier Matrix */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 mb-16 shadow-xs">
        <div className="max-w-2xl mb-8">
          <span className="text-xs font-black uppercase text-brand-red tracking-wider block mb-1">Global Commission Schedule</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Axi CPA Country Tiers</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Top tier CPA rates for qualified first-time depositors with transparent volume verification requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 border-2 border-brand-red rounded-2xl p-6 relative">
            <span className="absolute -top-3 right-4 bg-brand-red text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
              Highest Payout
            </span>
            <h3 className="text-lg font-black text-slate-900 mb-1">Tier 1 Jurisdictions</h3>
            <div className="text-3xl font-black text-brand-red font-mono my-2">
              Up to $1,000 <span className="text-xs text-slate-500 font-normal">CPA</span>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              United Kingdom, Germany, Australia, United Arab Emirates, Singapore, Switzerland, Netherlands, Norway.
            </p>
            <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-3">
              Min Deposit: $200 | Volume: 2 Standard FX Lots
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h3 className="text-lg font-black text-slate-900 mb-1">Tier 2 Jurisdictions</h3>
            <div className="text-3xl font-black text-slate-900 font-mono my-2">
              Up to $600 <span className="text-xs text-slate-500 font-normal">CPA</span>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Spain, Italy, Poland, Czech Republic, Chile, Brazil, Mexico, Malaysia, Saudi Arabia, Kuwait.
            </p>
            <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-3">
              Min Deposit: $150 | Volume: 1.5 Standard FX Lots
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h3 className="text-lg font-black text-slate-900 mb-1">Tier 3 (Rest of World)</h3>
            <div className="text-3xl font-black text-slate-900 font-mono my-2">
              Up to $400 <span className="text-xs text-slate-500 font-normal">CPA</span>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              South Africa, Thailand, Vietnam, Philippines, Indonesia, Nigeria, Kenya, Colombia, Peru.
            </p>
            <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-3">
              Min Deposit: $100 | Volume: 1.0 Standard FX Lot
            </div>
          </div>
        </div>
      </div>

      {/* Real Partner Registration Form */}
      <div id="partner-form" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-brand-red flex items-center justify-center mx-auto mb-3">
            <Send className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Apply for Axi Institutional Partnership</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete the form below. Your application will be reviewed and assigned to a dedicated Institutional Account Director within 24 hours.
          </p>
        </div>

        {submittedRef ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-emerald-950">Partner Application Successfully Dispatched!</h3>
            <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
              Your application has been logged under Reference ID <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">{submittedRef}</strong>. An email confirmation has been dispatched to <strong>{email}</strong> and our Institutional Desk has been alerted.
            </p>
            <button
              onClick={() => setSubmittedRef(null)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              Submit Another Partner Request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitApplication} className="space-y-5">
            {/* Program Selection Radio Pills */}
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-2">Select Partnership Program</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'IB', title: 'Introducing Broker (IB)' },
                  { id: 'CPA', title: 'CPA Affiliate' },
                  { id: 'Hybrid', title: 'Hybrid (CPA + Rev)' },
                  { id: 'WhiteLabel', title: 'White Label Broker' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPartnerType(item.id as any)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      partnerType === item.id 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 1: Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Full Legal Name *</label>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Alexander Sterling"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Official Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="partner@yourdomain.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition"
                />
              </div>
            </div>

            {/* Row 2: Phone & Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Phone Number (with Country Code) *</label>
                <input 
                  type="tel" 
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+44 7911 123456"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Primary Country of Operation</label>
                <input 
                  type="text" 
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  placeholder="e.g. United Kingdom"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition"
                />
              </div>
            </div>

            {/* Row 3: Telegram / Skype & Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Telegram / Skype Handle (For Fast Onboarding)</label>
                <input 
                  type="text" 
                  value={telegramHandle}
                  onChange={e => setTelegramHandle(e.target.value)}
                  placeholder="@your_telegram_username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Company / Brand / Community Name</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Sterling Trading Group LLC"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition"
                />
              </div>
            </div>

            {/* Row 4: Volume & Channels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Estimated Monthly Client Volume</label>
                <select 
                  value={estimatedMonthlyLots}
                  onChange={e => setEstimatedMonthlyLots(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition"
                >
                  <option value="50 - 100 Lots">50 - 100 Lots / Month</option>
                  <option value="100 - 500 Lots">100 - 500 Lots / Month</option>
                  <option value="500 - 2,000 Lots">500 - 2,000 Lots / Month</option>
                  <option value="2,000+ Lots (VIP Tier)">2,000+ Lots / Month (VIP Institutional Tier)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Preferred Commission Payout Method</label>
                <select 
                  value={payoutMethod}
                  onChange={e => setPayoutMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition"
                >
                  <option value="Crypto USDT (TRC20/ERC20)">Crypto USDT (TRC20 / ERC20 - Instant)</option>
                  <option value="Crypto BTC/ETH">Crypto Bitcoin / Ethereum</option>
                  <option value="International Bank Wire (SWIFT/SEPA)">International Bank Wire (SWIFT / SEPA)</option>
                  <option value="Skrill / Neteller">Skrill / Neteller</option>
                </select>
              </div>
            </div>

            {/* Row 5: Notes */}
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Marketing Channels / Website URL / Additional Notes</label>
              <textarea 
                rows={3}
                value={additionalNotes}
                onChange={e => setAdditionalNotes(e.target.value)}
                placeholder="Share your website URL, Telegram group size, YouTube channel, or specific rebate tier requests..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-red hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>Submitting Official Application...</>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Axi Partner Application
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
