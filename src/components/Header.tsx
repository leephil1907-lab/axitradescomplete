import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronDown, Globe, ShieldCheck, User, Zap, Search, Lock, Sun, Moon, LayoutDashboard, Wallet, LogOut, ArrowRight, Award, TrendingUp, Cpu, BookOpen, Users, Building2, Sparkles, CheckCircle2, ChevronRight, Gift, Mic, Coins } from 'lucide-react';
import { ViewType, DisplayCurrency } from '../types';
import CurrencySelector from './CurrencySelector';

interface HeaderProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  openSignUp: () => void;
  tickerQuoteText: string;
  user?: any;
  login?: () => void;
  logout?: () => void;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  openQuickDeposit?: () => void;
  openReferModal?: () => void;
  openVoiceModal?: () => void;
  displayCurrency?: DisplayCurrency;
  setDisplayCurrency?: (curr: DisplayCurrency) => void;
  formatCurrency?: (usdAmount: number, targetCurrency?: DisplayCurrency, decimals?: number) => string;
  liveBalance?: number;
  balance?: number;
}

export default function Header({ 
  currentView, 
  setView, 
  openSignUp, 
  tickerQuoteText, 
  user, 
  login, 
  logout, 
  isDarkMode = false, 
  toggleDarkMode, 
  showToast, 
  openQuickDeposit, 
  openReferModal, 
  openVoiceModal,
  displayCurrency = 'USD',
  setDisplayCurrency,
  formatCurrency,
  liveBalance = 12450.00,
  balance = 10000.00
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState<string | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English international');
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
    { 
      label: 'Our Edge', 
      id: 'about' as ViewType, 
      sub: 'Why Choose Axi', 
      desc: 'Top-tier global regulation, ultra-fast NY4 execution & capital allocation',
      banner: {
        title: 'Axi Select Capital Program',
        subtitle: 'Get funded up to $1,000,000 USD',
        desc: 'Zero registration fees, keep up to 90% of profits with institutional backing.',
        badge: 'FEATURED',
        target: 'axi_select' as ViewType
      },
      children: [
        { name: 'Axi Select', desc: 'Capital allocation program up to $1,000,000 USD', target: 'axi_select' as ViewType, badge: 'Hot' },
        { name: 'Why Axi', desc: 'Raw spreads from 0.0 pips with 0% deposit fees', target: 'about' as ViewType },
        { name: 'Regulation & Security', desc: 'FCA, ASIC, DFSA & FSC regulated globally', target: 'about' as ViewType },
        { name: 'Awards & Trust', desc: 'Voted Most Trusted Global CFD Broker', target: 'about' as ViewType }
      ] 
    },
    { 
      label: 'Markets', 
      id: 'markets' as ViewType, 
      sub: 'Trade 220+ Global CFD Instruments', 
      desc: 'Institutional spreads, 0% commission on share CFDs & 24/7 crypto',
      banner: {
        title: 'Forex & Gold Spreads',
        subtitle: 'Raw ECN Spreads from 0.0 Pips',
        desc: 'Deep institutional liquidity pools with average execution latency under 1.5ms.',
        badge: 'POPULAR',
        target: 'markets' as ViewType
      },
      children: [
        { name: 'Forex Trading', desc: '70+ Major, Minor & Exotic Currency Pairs', target: 'markets' as ViewType },
        { name: 'Share CFDs', desc: 'Apple, Nvidia, Tesla & 500+ US/UK stocks', target: 'markets' as ViewType, badge: '0% Fee' },
        { name: 'Indices CFDs', desc: 'US500, UK100, GER40 & Global Indices', target: 'markets' as ViewType },
        { name: 'Commodities', desc: 'Gold, Silver, Crude Oil & Natural Gas', target: 'markets' as ViewType },
        { name: 'Cryptocurrencies', desc: 'Bitcoin, Ethereum, Solana & Altcoins 24/7', target: 'markets' as ViewType }
      ] 
    },
    { 
      label: 'Trading Platforms', 
      id: 'platforms' as ViewType, 
      sub: 'MetaTrader 5 & Advanced Tools', 
      desc: 'High-speed desktop, web & mobile trading terminals',
      banner: {
        title: 'MetaTrader 5 High-Fidelity',
        subtitle: 'Pro L2 Depth of Market Terminal',
        desc: 'Integrated DOM ladder, 21 timeframes, and MQL5 automated algorithmic trading.',
        badge: 'NEW MT5',
        target: 'platforms' as ViewType
      },
      children: [
        { name: 'Axi MT5 Terminal', desc: 'Next-gen platform with L2 Depth of Market', target: 'platforms' as ViewType, badge: 'New' },
        { name: 'MT5 WebTrader', desc: 'Instant browser access without downloading', target: 'platforms' as ViewType },
        { name: 'Copy Trading App', desc: 'Automatically replicate top performing traders', target: 'platforms' as ViewType, badge: 'Popular' },
        { name: 'MetaTrader 4', desc: 'The gold standard algorithmic FX trading client', target: 'platforms' as ViewType },
        { name: 'AI Market Analyst', desc: 'Next-gen AI assistant for technical forecasting', target: 'platforms' as ViewType, badge: 'Beta' },
        { name: 'Trading Calculators', desc: 'Pip value, margin requirement & swap rate tools', target: 'platforms' as ViewType }
      ] 
    },
    { 
      label: 'Learn to Trade', 
      id: 'academy' as ViewType, 
      sub: 'Axi Trading Academy', 
      desc: 'Free educational resources, expert market analysis & structured courses',
      banner: {
        title: 'Master CFD & Forex Trading',
        subtitle: 'Free Beginner to Pro Academy',
        desc: 'Step-by-step video courses, daily market breakdowns and risk strategy guides.',
        badge: 'ACADEMY',
        target: 'academy' as ViewType
      },
      children: [
        { name: 'Basics of CFD Trading', desc: 'Understand leverage, pips, bid-ask & orders', target: 'academy' as ViewType },
        { name: 'Technical Analysis', desc: 'Chart patterns, RSI, MACD & Fibonacci strategy', target: 'academy' as ViewType },
        { name: 'Risk Management', desc: 'Position sizing, stop loss & capital preservation', target: 'academy' as ViewType },
        { name: 'Daily Market News', desc: 'Real-time analysis from senior FX strategists', target: 'academy' as ViewType }
      ] 
    },
    { 
      label: 'Partnerships', 
      id: 'about' as ViewType, 
      sub: 'Partner with a Global Leader', 
      desc: 'High-paying CPA affiliate structures, IB rebates & institutional solutions',
      banner: {
        title: 'Introducing Broker (IB)',
        subtitle: 'Earn Competitive Volume Rebates',
        desc: 'Tier-1 tracking portal, multi-currency reporting and dedicated account manager.',
        badge: 'PARTNERS',
        target: 'about' as ViewType
      },
      children: [
        { name: 'Affiliate Program', desc: 'High CPA payouts up to $1,000 USD per trader', target: 'about' as ViewType },
        { name: 'Introducing Broker (IB)', desc: 'Flexible rebate structures & live client stats', target: 'about' as ViewType },
        { name: 'Institutional Solutions', desc: 'Turnkey prime brokerage liquidity and white label', target: 'about' as ViewType }
      ] 
    },
    { 
      label: 'Company', 
      id: 'about' as ViewType, 
      sub: 'About Axi Group', 
      desc: 'Founded in 2007, serving traders in over 100 countries worldwide',
      banner: {
        title: 'Man City Official Partner',
        subtitle: 'Global Sports Partnership',
        desc: 'Proud official online trading partner of Manchester City Football Club.',
        badge: 'GLOBAL',
        target: 'about' as ViewType
      },
      children: [
        { name: 'About Us', desc: 'Our mission, heritage and leadership team', target: 'about' as ViewType },
        { name: 'Contact Us', desc: '24/5 dedicated multi-lingual customer support', target: 'about' as ViewType },
        { name: 'Careers at Axi', desc: 'Join our fast-growing financial technology firm', target: 'about' as ViewType }
      ] 
    },
  ];

  const userDropdownItems: { label: string; id: ViewType | 'logout' | 'refer_friend' | 'voice_notes' }[] = [
    { label: 'Dashboard', id: 'dashboard' },
    { label: '🛡️ Verification (KYC)', id: 'dashboard' },
    { label: '🎁 Refer & Earn $100', id: 'refer_friend' as any },
    { label: '🎙️ Voice Note Studio', id: 'voice_notes' as any },
    { label: 'Deposit', id: 'funds' },
    { label: 'Quick Deposit', id: 'quick_deposit' as ViewType },
    { label: 'Withdraw', id: 'funds' },
    { label: 'History', id: 'dashboard' },
    { label: 'Profile', id: 'settings' },
    { label: 'Settings', id: 'settings' },
    { label: 'Log Out', id: 'logout' },
  ];

  const [scrolled, setScrolled] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (view: ViewType) => {
    setView(view);
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    setActiveMobileDropdown(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const languages = [
    { name: 'العربية', flagUrl: 'https://flagcdn.com/w40/ae.png', alt: 'UAE' },
    { name: '中文', flagUrl: 'https://flagcdn.com/w40/cn.png', alt: 'China' },
    { name: 'Español internacional', flagUrl: 'https://flagcdn.com/w40/mx.png', alt: 'Mexico' },
    { name: 'Français international', flagUrl: 'https://flagcdn.com/w40/fr.png', alt: 'France', badge: 'FR' },
    { name: 'Bahasa Indonesia', flagUrl: 'https://flagcdn.com/w40/id.png', alt: 'Indonesia' },
    { name: 'Italiano internazionale', flagUrl: 'https://flagcdn.com/w40/it.png', alt: 'Italy' },
    { name: '日本', flagUrl: 'https://flagcdn.com/w40/jp.png', alt: 'Japan' },
    { name: '한국어', flagUrl: 'https://flagcdn.com/w40/kr.png', alt: 'South Korea' },
    { name: 'Português internacional', flagUrl: 'https://flagcdn.com/w40/pt.png', alt: 'Portugal', badge: 'PT' },
    { name: 'ภาษาไทย', flagUrl: 'https://flagcdn.com/w40/th.png', alt: 'Thailand' },
    { name: '中文繁體', flagUrl: 'https://flagcdn.com/w40/tw.png', alt: 'Taiwan' },
    { name: 'Tiếng Việt', flagUrl: 'https://flagcdn.com/w40/vn.png', alt: 'Vietnam' },
  ];

  return (
    <header className={`w-full bg-[#E3000F] sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-md shadow-black/20' : ''}`}>
      
      
      {/* Top Utility Bar */}
      <div className="hidden xl:block w-full bg-[#1C1C1C] border-b border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-10">
          <div className="flex items-center gap-6 text-[11px] font-bold text-slate-300 tracking-wider uppercase">
            <button className="text-white cursor-default">Personal</button>
            <button onClick={() => handleNav('about')} className="hover:text-white transition-colors cursor-pointer">Professional</button>
            <button onClick={() => handleNav('about')} className="hover:text-white transition-colors cursor-pointer">Partners</button>
            <button onClick={() => { if (showToast) showToast('Institutional Prime Brokerage desk requested.', 'info'); handleNav('about'); }} className="hover:text-white transition-colors cursor-pointer">Institutions</button>
          </div>
          <div className="flex items-center gap-6 text-[11px] font-bold text-slate-300 tracking-wider uppercase">
            <a href="mailto:axicustomersupport@gmail.com" className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer normal-case"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> axicustomersupport@gmail.com</a>
            <div className="h-3 w-px bg-slate-700"></div>
            <button onClick={openReferModal} className="text-[#FFD250] hover:text-yellow-300 font-extrabold transition-colors flex items-center gap-1 cursor-pointer animate-pulse">
              <Gift className="w-3.5 h-3.5" /> Refer & Earn $100
            </button>
            <button onClick={openVoiceModal} className="text-emerald-400 hover:text-emerald-300 font-extrabold transition-colors flex items-center gap-1 cursor-pointer">
              <Mic className="w-3.5 h-3.5" /> Voice Dictation
            </button>
            <button onClick={() => handleNav('settings')} className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer">Help Centre</button>
            <button onClick={() => { if(user) handleNav('dashboard'); else handleNav('login'); }} className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"><User className="w-3 h-3" /> Client Login</button>
            <button onClick={() => setShowLanguageModal(true)} className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"><Globe className="w-3 h-3 text-[#FFD250]" /> {selectedLang}</button>
          </div>
        </div>
      </div>
      
      {/* Main Header Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => handleNav('home')} 
          onDoubleClick={(e) => {
            e.preventDefault();
            const pwd = window.prompt("Enter Admin Access Code:");
            if (pwd === "axitrading2026") {
              setView('admin');
            } else if (pwd !== null && showToast) {
              showToast("Invalid admin credentials", "error");
            }
          }}
          className="flex items-center cursor-pointer select-none group shrink-0 gap-2"
          id="logo-brand"
        >
          <img 
            src="https://d2tpnh780x5es.cloudfront.net/rebrand-prod/hqwjus4e/logo-light1.svg" 
            alt="Axi" 
            className="h-8 md:h-10 object-contain" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
            referrerPolicy="no-referrer"
          />
          <span className="hidden text-3xl md:text-4xl font-black tracking-tighter text-white font-sans flex items-center gap-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
            axi<span className="text-[#FFD250] font-black">.</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-6 relative overflow-visible flex-1 justify-center">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <div 
                key={item.label}
                className="relative py-4 group"
                onMouseEnter={() => setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => handleNav(item.id)}
                  aria-haspopup="true" aria-expanded={activeDropdown === item.label} className={`text-[15px] font-medium transition-colors duration-200 flex items-center gap-1 cursor-pointer ${
                    isActive 
                      ? 'text-[#FFD250]' 
                      : 'text-white hover:text-[#FFD250]'
                  }`}
                >
                  {item.label}
                  <ChevronDown className="w-4 h-4 opacity-70 group-hover:rotate-180 transition-transform duration-200" />
                </button>

                {/* Axi High-Fidelity Mega Dropdown */}
                <AnimatePresence>
                  {activeDropdown === item.label && (
                    <motion.div 
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute top-full -left-20 mt-0 w-[680px] bg-white dark:bg-slate-900 shadow-2xl z-50 text-slate-800 dark:text-slate-100 border-t-4 border-[#E3000F] rounded-b-2xl overflow-hidden border-x border-b border-slate-200 dark:border-slate-800"
                    >
                      <div className="grid grid-cols-12 divide-x divide-slate-100 dark:divide-slate-800">
                        
                        {/* Main Sub-items Column (7 Cols) */}
                        <div className="col-span-7 p-5 space-y-3 bg-white dark:bg-slate-900">
                          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                            <span className="text-xs font-black text-[#E3000F] uppercase tracking-wider block font-mono">
                              {item.sub}
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                              {item.desc}
                            </p>
                          </div>

                          <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1">
                            {item.children.map((child, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleNav(child.target)}
                                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition duration-150 cursor-pointer flex items-start justify-between group/child"
                              >
                                <div className="space-y-0.5 pr-2">
                                  <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 group-hover/child:text-[#E3000F] transition flex items-center gap-1.5">
                                    {child.name}
                                    <ChevronRight className="w-3 h-3 opacity-0 group-hover/child:opacity-100 group-hover/child:translate-x-0.5 transition-all text-[#E3000F]" />
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-tight">
                                    {child.desc}
                                  </div>
                                </div>
                                {child.badge && (
                                  <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider shrink-0 ${
                                    child.badge === 'Hot' ? 'bg-red-500 text-white' :
                                    child.badge === '0% Fee' ? 'bg-emerald-500 text-white' :
                                    child.badge === 'New' ? 'bg-[#40B4B4] text-white' :
                                    child.badge === 'Beta' ? 'bg-purple-600 text-white' :
                                    'bg-[#FFD250] text-slate-950'
                                  }`}>
                                    {child.badge}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Featured Callout Banner Column (5 Cols) */}
                        <div className="col-span-5 bg-slate-950 p-5 flex flex-col justify-between text-white relative overflow-hidden">
                          <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-[#E3000F]/15 blur-2xl pointer-events-none" />
                          
                          <div className="space-y-3 relative z-10">
                            <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded bg-[#E3000F] text-white tracking-widest inline-block shadow-xs">
                              {item.banner.badge}
                            </span>

                            <div className="space-y-1">
                              <h4 className="text-sm font-black text-white leading-snug">
                                {item.banner.title}
                              </h4>
                              <p className="text-[11px] font-bold text-[#FFD250]">
                                {item.banner.subtitle}
                              </p>
                              <p className="text-[11px] text-slate-300 leading-relaxed font-normal pt-1">
                                {item.banner.desc}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleNav(item.banner.target)}
                            className="mt-4 w-full bg-white hover:bg-slate-100 text-slate-950 text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md group/btn"
                          >
                            Explore {item.label} <ArrowRight className="w-3.5 h-3.5 text-[#E3000F] group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 xl:gap-4">

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openSignUp}
            className="bg-[#FFD250] hover:bg-[#FFC518] text-slate-900 text-[14px] font-bold px-6 py-2.5 rounded flex items-center justify-center tracking-wide cursor-pointer font-sans"
          >
            OPEN ACCOUNT
          </motion.button>
          
          <div className="hidden xl:block">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-10 h-10 rounded-full bg-slate-900/20 hover:bg-slate-900/40 border border-white/20 text-white flex items-center justify-center transition cursor-pointer overflow-hidden"
                >
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="User Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </button>
                
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-3 w-48 bg-white dark:bg-slate-900 shadow-xl py-2 z-50 text-slate-800 dark:text-slate-100 border-t-2 border-[#E3000F] rounded-b-xl"
                    >
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                          <Coins className="w-3 h-3 text-[#E3000F]" />
                          <span>Display Currency</span>
                        </div>
                        {setDisplayCurrency && (
                          <CurrencySelector
                            displayCurrency={displayCurrency}
                            setDisplayCurrency={setDisplayCurrency}
                            variant="compact"
                          />
                        )}
                      </div>

                      {userDropdownItems.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setUserDropdownOpen(false);
                            if (item.id === 'logout') {
                              logout?.();
                            } else if (item.id === 'quick_deposit') {
                              openQuickDeposit?.();
                            } else if (item.id === ('refer_friend' as any)) {
                              openReferModal?.();
                            } else if (item.id === ('voice_notes' as any)) {
                              openVoiceModal?.();
                            } else {
                              handleNav(item.id as ViewType);
                            }
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm transition cursor-pointer ${item.id === 'logout' ? 'text-brand-red font-bold hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-slate-600 dark:text-slate-300 hover:text-[#E3000F] hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={() => handleNav('support')} className="text-white hover:text-[#FFD250] text-[14px] font-medium transition cursor-pointer">
                  Help Centre
                </button>
                <button onClick={() => handleNav('login')} className="text-white hover:text-[#FFD250] text-[14px] font-medium transition cursor-pointer">
                  Login
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1 text-white hover:text-[#FFD250] transition focus:outline-none cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-8 h-8 font-light" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {/* Slide-out Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="xl:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50"
            />

            {/* Right Slide-out Drawer Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="xl:hidden fixed top-0 right-0 h-full w-[88%] max-w-sm bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-y-auto flex flex-col font-sans border-l border-slate-200 dark:border-slate-800"
            >
              {/* Drawer Top Header */}
              <div className="p-4 bg-[#1C1C1C] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div 
                  onClick={() => handleNav('home')} 
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    const pwd = window.prompt("Enter Admin Access Code:");
                    if (pwd === "axitrading2026") {
                      setView('admin');
                    } else if (pwd !== null && showToast) {
                      showToast("Invalid admin credentials", "error");
                    }
                  }}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <img 
                    src="https://d2tpnh780x5es.cloudfront.net/rebrand-prod/hqwjus4e/logo-light1.svg" 
                    alt="Axi" 
                    className="h-8 object-contain" 
                  />
                </div>

                <div className="flex items-center gap-2">
                  {toggleDarkMode && (
                    <button
                      onClick={toggleDarkMode}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition cursor-pointer"
                      title="Toggle Theme"
                    >
                      {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
                    </button>
                  )}
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    aria-label="Close menu drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-900">
                {/* Search Bar */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      if (showToast) showToast(`Searching for "${searchQuery}"...`, 'info');
                      handleNav('markets');
                    }
                  }} 
                  className="relative"
                >
                  <input 
                    type="text" 
                    placeholder="Search markets, tools, help..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-500 text-xs font-semibold px-3.5 py-3 rounded-lg pr-9 outline-none border border-slate-200 dark:border-slate-700 focus:border-[#E3000F]"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#E3000F] transition cursor-pointer">
                    <Search className="w-4 h-4" />
                  </button>
                </form>

                {/* User Info / Client Area Card */}
                {user ? (
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 text-white border border-slate-700 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-slate-600 shrink-0 flex items-center justify-center">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="User Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-amber-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs truncate text-white">{user.displayName || user.email || 'Axi Client'}</div>
                        <div className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live MT5 Trading Account
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
                      <button 
                        onClick={() => handleNav('dashboard')}
                        className="bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" /> Dashboard
                      </button>
                      <button 
                        onClick={() => handleNav('funds')}
                        className="bg-brand-red hover:bg-red-700 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5" /> Deposit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#fff9f9] dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 text-center space-y-3">
                    <div className="text-[13px] font-bold text-slate-900 dark:text-slate-100">Start Trading with Axi Today</div>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <button 
                        onClick={() => { setMobileMenuOpen(false); openSignUp(); }}
                        className="w-full bg-[#FFD250] hover:bg-[#FFC518] text-slate-900 text-[13px] font-bold py-2.5 rounded-lg transition cursor-pointer"
                      >
                        OPEN ACCOUNT
                      </button>
                      <button 
                        onClick={() => { setMobileMenuOpen(false); handleNav('login'); }}
                        className="w-full bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 text-[13px] font-medium py-2.5 rounded-lg transition cursor-pointer"
                      >
                        Client Login
                      </button>
                    </div>
                  </div>
                )}

                {/* Primary Navigation Accordion Categories */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-2">
                    NAVIGATION & PRODUCTS
                  </div>
                  {menuItems.map((item) => (
                    <div key={item.label} className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
                      <button 
                        aria-haspopup="true" aria-expanded={activeMobileDropdown === item.label} onClick={() => setActiveMobileDropdown(activeMobileDropdown === item.label ? null : item.label)} 
                        className="w-full text-left px-4 py-3 text-slate-900 dark:text-slate-100 text-[15px] font-bold flex items-center justify-between transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span className="flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E3000F]" />
                          {item.label}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeMobileDropdown === item.label ? 'rotate-180 text-[#E3000F]' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {activeMobileDropdown === item.label && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden bg-white dark:bg-slate-900"
                          >
                            <div className="py-2 px-3 space-y-1 border-t border-slate-100 dark:border-slate-700">
                              <button
                                onClick={() => handleNav(item.id)}
                                className="w-full text-left py-1.5 px-2 text-xs font-bold text-[#E3000F] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition cursor-pointer flex items-center gap-1"
                              >
                                View All {item.label} <ArrowRight className="w-3 h-3" />
                              </button>
                              {item.children.map((child, idx) => (
                                <button 
                                  key={idx}
                                  onClick={() => handleNav(child.target)} 
                                  className="w-full text-left py-2 px-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-[#E3000F] hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition cursor-pointer flex items-center justify-between"
                                >
                                  <div>
                                    <div className="font-bold text-slate-900 dark:text-slate-100">{child.name}</div>
                                    <div className="text-[10px] text-slate-400 font-normal">{child.desc}</div>
                                  </div>
                                  {child.badge && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0 ml-2 ${
                                      child.badge === 'Hot' ? 'bg-red-500 text-white' :
                                      child.badge === '0% Fee' ? 'bg-emerald-500 text-white' :
                                      child.badge === 'New' ? 'bg-[#40B4B4] text-white' :
                                      child.badge === 'Beta' ? 'bg-purple-600 text-white' :
                                      'bg-[#FFD250] text-slate-950'
                                    }`}>
                                      {child.badge}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {/* Quick Shortcuts Section */}
                <div className="space-y-2 pt-4">
                  <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-2">
                    QUICK TOOLS & SUPPORT
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[13px] font-semibold">
                    <button 
                      onClick={() => handleNav('markets')}
                      className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-slate-500 shrink-0" /> Live Markets
                    </button>
                    <button 
                      onClick={() => handleNav('academy')}
                      className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" /> Axi Academy
                    </button>
                    <button 
                      onClick={() => handleNav('support')}
                      className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-slate-500 shrink-0" /> Help Centre
                    </button>
                    <button 
                      onClick={() => { setShowLanguageModal(true); setMobileMenuOpen(false); }}
                      className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-slate-500 shrink-0" /> {selectedLang.split(' ')[0]}
                    </button>
                  </div>
                </div>

                {/* Display Currency Selection in Mobile Drawer */}
                {setDisplayCurrency && (
                  <div className="pt-2">
                    <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-[#E3000F]" />
                      <span>DISPLAY CURRENCY</span>
                    </div>
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Account Currency</span>
                      <CurrencySelector
                        displayCurrency={displayCurrency}
                        setDisplayCurrency={setDisplayCurrency}
                        variant="compact"
                      />
                    </div>
                  </div>
                )}

                {/* Account Actions / Logout */}
                {user && (
                  <div className="pt-2">
                    <button 
                      onClick={() => { setMobileMenuOpen(false); logout?.(); }}
                      className="w-full py-2.5 px-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </header>
  );
}
