import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronDown, Globe, ShieldCheck, User, LayoutDashboard, Wallet, 
  LogOut, TrendingUp, ChevronRight, PhoneCall, FileText, BarChart2, Zap, 
  BookOpen, Award, Layers, Coins, Landmark, HelpCircle, ArrowRight,
  Users, Server, Gift, Calendar, Sparkles, DollarSign
} from 'lucide-react';
import { ViewType, DisplayCurrency } from '../types';
import CurrencySelector from './CurrencySelector';
import AxiHamburgerIcon from './AxiHamburgerIcon';

interface HeaderProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  openSignUp: () => void;
  tickerQuoteText?: string;
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

interface NavItem {
  label: string;
  id: ViewType;
  badge?: string;
  highlightText: string;
  ctaText: string;
  ctaTarget: ViewType;
  children: {
    name: string;
    desc: string;
    icon: React.ElementType;
    tag?: string;
    target: ViewType;
  }[];
}

export default function Header({ 
  setView, 
  openSignUp, 
  user, 
  logout, 
  showToast, 
  displayCurrency = 'USD',
  setDisplayCurrency,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState<string | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Primary navigation categories aligned with www.axi.com
  const navItems: NavItem[] = [
    {
      label: 'Markets',
      id: 'markets',
      badge: '650+ Assets',
      highlightText: 'Ultra-low spreads from 0.0 pips on 650+ CFD instruments',
      ctaText: 'View All Live Spreads',
      ctaTarget: 'markets',
      children: [
        { name: 'Forex Trading', desc: '70+ major, minor & exotic FX pairs', icon: TrendingUp, tag: '0.0 Pips', target: 'markets' },
        { name: 'Share CFDs', desc: 'Apple, Nvidia, Tesla & 500+ global stocks', icon: BarChart2, tag: '0% Comm', target: 'markets' },
        { name: 'Cryptocurrencies', desc: 'Bitcoin, Ethereum & top 50 coins 24/7', icon: Coins, tag: '24/7', target: 'markets' },
        { name: 'Commodities', desc: 'Gold, Silver, US Crude Oil & Natural Gas', icon: Landmark, tag: 'High Liquidity', target: 'markets' },
        { name: 'Global Indices', desc: 'US500, US30, UK100, GER40 & Asian indices', icon: Layers, tag: '1000:1', target: 'markets' },
      ]
    },
    {
      label: 'Trading',
      id: 'accounts',
      badge: 'PRO ECN',
      highlightText: 'Institutional execution speed with up to 1000:1 leverage',
      ctaText: 'Compare Account Tiers',
      ctaTarget: 'accounts',
      children: [
        { name: 'Account Types', desc: 'Standard, Pro ECN and Elite trading accounts', icon: ShieldCheck, tag: 'Tiered', target: 'accounts' },
        { name: 'Axi Select', desc: 'Get funded up to $1,000,000 USD with 0 entry fees', icon: Award, tag: '$1M Allocation', target: 'select' },
        { name: 'Promotions & Contests', desc: '50% Welcome Bonus & $100K Championship', icon: Gift, tag: '$100K Pool', target: 'promotions' },
        { name: 'Copy Trading', desc: 'Mirror trades of verified top global performers', icon: Zap, tag: 'Automated', target: 'tools' },
        { name: 'Spreads & Liquidity', desc: 'Direct Tier-1 liquidity pools and raw spreads', icon: TrendingUp, tag: 'Raw Pricing', target: 'markets' },
      ]
    },
    {
      label: 'Platforms',
      id: 'platforms',
      badge: 'MT4 / MT5',
      highlightText: 'Award-winning desktop, web, and mobile trading terminals',
      ctaText: 'Launch WebTrader',
      ctaTarget: 'platforms',
      children: [
        { name: 'MetaTrader 4 (MT4)', desc: 'The gold standard platform for algorithmic trading', icon: Layers, tag: 'EAs Supported', target: 'platforms' },
        { name: 'MetaTrader 5 (MT5)', desc: 'Next-gen multi-asset platform with Level 2 depth', icon: BarChart2, tag: 'Multi-Asset', target: 'platforms' },
        { name: 'Forex VPS Hosting', desc: 'Ultra-low latency (<0.4ms) dedicated server hosting', icon: Server, tag: '<0.4ms Ping', target: 'forex_vps' },
        { name: 'Autochartist Scanner', desc: 'Automated technical chart pattern recognition', icon: Sparkles, tag: 'Free MT4/5', target: 'forex_vps' },
        { name: 'Axi WebTrader', desc: 'Trade instantly in browser without installation', icon: Zap, tag: 'Zero Install', target: 'platforms' },
      ]
    },
    {
      label: 'Tools & Learn',
      id: 'academy',
      badge: 'Live News',
      highlightText: 'Free comprehensive education and macroeconomic intelligence',
      ctaText: 'Explore Axi Academy',
      ctaTarget: 'academy',
      children: [
        { name: 'Economic Calendar', desc: 'Real-time global macro releases & rate decisions', icon: Calendar, tag: 'Live Catalysts', target: 'economic_calendar' },
        { name: 'Axi Academy', desc: 'Master technical analysis, risk & order types', icon: BookOpen, tag: 'Beginner to Pro', target: 'academy' },
        { name: 'Trading Calculators', desc: 'Pip values, margin calculation & position size', icon: HelpCircle, tag: 'Calculators', target: 'tools' },
        { name: 'Market Blog & Insights', desc: 'Daily market recaps and financial breakdowns', icon: TrendingUp, tag: 'Daily', target: 'blog' },
        { name: 'Free eBooks & PDF Guides', desc: 'Downloadable complete strategy blueprints', icon: FileText, tag: 'PDF Manuals', target: 'academy' },
      ]
    },
    {
      label: 'Partners',
      id: 'partners',
      badge: 'Up to $12/Lot',
      highlightText: 'Industry-leading IB rebates, CPA payouts, and institutional solutions',
      ctaText: 'Become an Axi Partner',
      ctaTarget: 'partners',
      children: [
        { name: 'Introducing Broker (IB)', desc: 'Earn up to $12 per lot with Sub-IB multi-tier overrides', icon: TrendingUp, tag: 'Up to $12/Lot', target: 'partners' },
        { name: 'CPA Affiliate Program', desc: 'High-converting CPA payouts up to $1,000 per client', icon: DollarSign, tag: 'Up to $1,000 CPA', target: 'partners' },
        { name: 'Hybrid Revenue Program', desc: 'Combined upfront CPA + continuous monthly volume share', icon: Sparkles, tag: 'CPA + RevShare', target: 'partners' },
        { name: 'White Label Solutions', desc: 'Turnkey institutional brokerage & liquidity packages', icon: Layers, tag: 'Turnkey Broker', target: 'partners' },
      ]
    },
    {
      label: 'About',
      id: 'about',
      badge: 'Est. 2007',
      highlightText: 'Trusted by 100,000+ traders across 100+ countries since 2007',
      ctaText: 'About Axi Global',
      ctaTarget: 'about',
      children: [
        { name: 'Why Choose Axi', desc: 'Award-winning global CFD and Forex brokerage', icon: Award, tag: 'Since 2007', target: 'about' },
        { name: 'Security & Regulation', desc: 'Strict regulatory compliance & segregated Tier-1 accounts', icon: ShieldCheck, tag: 'Segregated', target: 'about' },
        { name: 'Man City Partnership', desc: 'Official Online Trading Partner of Manchester City FC', icon: Zap, tag: 'Partner', target: 'about' },
        { name: '24/7 Client Support', desc: 'Dedicated multilingual assistance around the clock', icon: PhoneCall, tag: 'Live Desk', target: 'support' },
      ]
    }
  ];

  const handleNav = (view: ViewType) => {
    setView(view);
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    setActiveMobileDropdown(null);
    setUserDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const languages = [
    { name: 'English (Global)', flagUrl: 'https://flagcdn.com/w40/gb.png' },
    { name: 'العربية', flagUrl: 'https://flagcdn.com/w40/ae.png' },
    { name: '中文', flagUrl: 'https://flagcdn.com/w40/cn.png' },
    { name: 'Español', flagUrl: 'https://flagcdn.com/w40/mx.png' },
    { name: 'Français', flagUrl: 'https://flagcdn.com/w40/fr.png' },
    { name: 'Bahasa Indonesia', flagUrl: 'https://flagcdn.com/w40/id.png' },
    { name: 'Italiano', flagUrl: 'https://flagcdn.com/w40/it.png' },
    { name: '日本語', flagUrl: 'https://flagcdn.com/w40/jp.png' },
    { name: '한국어', flagUrl: 'https://flagcdn.com/w40/kr.png' },
    { name: 'Português', flagUrl: 'https://flagcdn.com/w40/pt.png' },
    { name: 'ภาษาไทย', flagUrl: 'https://flagcdn.com/w40/th.png' },
    { name: 'Tiếng Việt', flagUrl: 'https://flagcdn.com/w40/vn.png' },
  ];

  return (
    <header className="w-full bg-[#C8102E] sticky top-0 z-50 shadow-lg select-none border-b border-red-800/40">
      
      {/* Top Main Navigation Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 relative">
        
        {/* ================= LEFT SECTION: Brand Logo & Left Primary Nav Items ================= */}
        <div className="flex items-center gap-6 xl:gap-8 min-w-[140px]">
          {/* Axi Brand Logo */}
          <button 
            type="button"
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
            className="flex items-center cursor-pointer group shrink-0 bg-transparent border-0 p-0 text-left"
            id="logo-brand"
            title="Axi - Return to Home"
            aria-label="Axi Home"
          >
            <div className="flex items-center">
              <svg className="h-8 sm:h-9 w-auto text-white drop-shadow-sm transition-transform group-hover:scale-105" viewBox="0 0 110 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="29" fill="#FFFFFF" fontSize="36" fontWeight="900" fontFamily="'Clash Display', 'General Sans', system-ui, sans-serif" letterSpacing="-1.5">axi</text>
              </svg>
            </div>
          </button>

          {/* Left Desktop Nav Links: Markets, Trading, Platforms */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-white font-medium text-sm">
            {navItems.slice(0, 3).map((item) => (
              <div 
                key={item.label}
                className="relative py-5 group"
                onMouseEnter={() => setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => handleNav(item.id)}
                  className="flex items-center gap-1.5 text-white/95 hover:text-[#F5CE47] transition-all cursor-pointer text-sm font-semibold tracking-wide"
                >
                  <span>{item.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-80 transition-transform duration-200 ${activeDropdown === item.label ? 'rotate-180 text-[#F5CE47]' : 'group-hover:rotate-180'}`} />
                </button>

                {/* Slanted-Style Sophisticated Dropdown Menu */}
                <AnimatePresence>
                  {activeDropdown === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="absolute top-[90%] left-0 w-[420px] bg-[#161616] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      {/* Slanted Axi Brand Accent Header */}
                      <div className="relative bg-[#C8102E] px-4 py-2.5 overflow-hidden">
                        <div 
                          className="absolute inset-0 bg-[#9B0018] opacity-60 pointer-events-none"
                          style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)' }}
                        />
                        <div className="relative flex items-center justify-between text-white text-xs font-bold">
                          <span className="uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                            <span className="w-1.5 h-3.5 bg-[#F5CE47] inline-block -skew-x-12" />
                            {item.label} Overview
                          </span>
                          {item.badge && (
                            <span className="bg-black/30 border border-white/20 text-[#F5CE47] text-[10px] uppercase font-black px-2 py-0.5 rounded -skew-x-6">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dropdown Items List with Slanted Accent Hover */}
                      <div className="p-2.5 flex flex-col gap-1">
                        {item.children.map((sub, idx) => {
                          const IconComp = sub.icon;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleNav(sub.target)}
                              className="group/item relative flex items-start gap-3 p-2.5 rounded-lg hover:bg-neutral-800/90 transition-all text-left w-full cursor-pointer overflow-hidden"
                            >
                              {/* Slanted red left indicator on hover */}
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C8102E] opacity-0 group-hover/item:opacity-100 transition-opacity" />

                              <div className="p-2 rounded-md bg-neutral-900 border border-neutral-800 text-[#F5CE47] group-hover/item:bg-[#C8102E] group-hover/item:text-white transition-colors shrink-0 mt-0.5">
                                <IconComp className="w-4 h-4" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-white text-xs font-bold group-hover/item:text-[#F5CE47] transition-colors">
                                    {sub.name}
                                  </span>
                                  {sub.tag && (
                                    <span className="text-[10px] text-neutral-400 font-mono bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 group-hover/item:border-neutral-700">
                                      {sub.tag}
                                    </span>
                                  )}
                                </div>
                                <p className="text-neutral-400 text-[11px] leading-snug line-clamp-1 mt-0.5">
                                  {sub.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Slanted Bottom CTA Ribbon */}
                      <div className="p-3 bg-neutral-900/90 border-t border-neutral-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-neutral-400 font-medium truncate pr-2">
                          {item.highlightText}
                        </span>
                        <button
                          onClick={() => handleNav(item.ctaTarget)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F5CE47] hover:underline shrink-0 cursor-pointer"
                        >
                          <span>{item.ctaText}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>
        </div>

        {/* ================= DEAD CENTER SECTION: 'OPEN ACCOUNT' CTA BUTTON ================= */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-auto">
          <div className="relative group">
            {/* Slanted subtle background glow on hover */}
            <div className="absolute -inset-1 bg-yellow-400/30 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <button
              onClick={openSignUp}
              className="relative bg-[#F5CE47] hover:bg-[#ECC94B] text-neutral-950 text-xs sm:text-[13px] md:text-sm font-black tracking-wider uppercase px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 rounded-md shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap border border-yellow-300/40 flex items-center gap-1.5"
              id="header-open-account-btn"
            >
              <span>OPEN ACCOUNT</span>
            </button>
          </div>
        </div>

        {/* ================= RIGHT SECTION: Right Primary Nav Items, Sign In & Hamburger ================= */}
        <div className="flex items-center gap-4 sm:gap-6 min-w-[140px] justify-end">
          
          {/* Right Desktop Nav Links: Learn, About */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-white font-medium text-sm">
            {navItems.slice(3, 5).map((item) => (
              <div 
                key={item.label}
                className="relative py-5 group"
                onMouseEnter={() => setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => handleNav(item.id)}
                  className="flex items-center gap-1.5 text-white/95 hover:text-[#F5CE47] transition-all cursor-pointer text-sm font-semibold tracking-wide"
                >
                  <span>{item.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-80 transition-transform duration-200 ${activeDropdown === item.label ? 'rotate-180 text-[#F5CE47]' : 'group-hover:rotate-180'}`} />
                </button>

                {/* Slanted-Style Sophisticated Dropdown Menu */}
                <AnimatePresence>
                  {activeDropdown === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="absolute top-[90%] right-0 w-[400px] bg-[#161616] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      {/* Slanted Axi Brand Accent Header */}
                      <div className="relative bg-[#C8102E] px-4 py-2.5 overflow-hidden">
                        <div 
                          className="absolute inset-0 bg-[#9B0018] opacity-60 pointer-events-none"
                          style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)' }}
                        />
                        <div className="relative flex items-center justify-between text-white text-xs font-bold">
                          <span className="uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                            <span className="w-1.5 h-3.5 bg-[#F5CE47] inline-block -skew-x-12" />
                            {item.label} Resources
                          </span>
                          {item.badge && (
                            <span className="bg-black/30 border border-white/20 text-[#F5CE47] text-[10px] uppercase font-black px-2 py-0.5 rounded -skew-x-6">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dropdown Items List with Slanted Accent Hover */}
                      <div className="p-2.5 flex flex-col gap-1">
                        {item.children.map((sub, idx) => {
                          const IconComp = sub.icon;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleNav(sub.target)}
                              className="group/item relative flex items-start gap-3 p-2.5 rounded-lg hover:bg-neutral-800/90 transition-all text-left w-full cursor-pointer overflow-hidden"
                            >
                              {/* Slanted red left indicator on hover */}
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C8102E] opacity-0 group-hover/item:opacity-100 transition-opacity" />

                              <div className="p-2 rounded-md bg-neutral-900 border border-neutral-800 text-[#F5CE47] group-hover/item:bg-[#C8102E] group-hover/item:text-white transition-colors shrink-0 mt-0.5">
                                <IconComp className="w-4 h-4" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-white text-xs font-bold group-hover/item:text-[#F5CE47] transition-colors">
                                    {sub.name}
                                  </span>
                                  {sub.tag && (
                                    <span className="text-[10px] text-neutral-400 font-mono bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 group-hover/item:border-neutral-700">
                                      {sub.tag}
                                    </span>
                                  )}
                                </div>
                                <p className="text-neutral-400 text-[11px] leading-snug line-clamp-1 mt-0.5">
                                  {sub.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Slanted Bottom CTA Ribbon */}
                      <div className="p-3 bg-neutral-900/90 border-t border-neutral-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-neutral-400 font-medium truncate pr-2">
                          {item.highlightText}
                        </span>
                        <button
                          onClick={() => handleNav(item.ctaTarget)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F5CE47] hover:underline shrink-0 cursor-pointer"
                        >
                          <span>{item.ctaText}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* User Logged in quick status or Sign in link */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 bg-black/25 hover:bg-black/35 border border-white/20 px-3 py-1.5 rounded-md text-white text-xs font-bold transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-[#F5CE47]" />
                <span className="hidden sm:inline">{user.email?.split('@')[0] || 'Client'}</span>
                <ChevronDown className="w-3 h-3 text-white/70" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#161616] border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 text-white text-xs">
                  <div className="p-2 border-b border-neutral-800 mb-1">
                    <p className="font-bold text-white truncate">{user.email}</p>
                    <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">● Live Verified Client</p>
                  </div>
                  <button onClick={() => handleNav('dashboard')} className="w-full text-left p-2 rounded hover:bg-neutral-800 flex items-center gap-2 cursor-pointer">
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#F5CE47]" /> Dashboard
                  </button>
                  <button onClick={() => handleNav('funds')} className="w-full text-left p-2 rounded hover:bg-neutral-800 flex items-center gap-2 cursor-pointer">
                    <Wallet className="w-3.5 h-3.5 text-[#F5CE47]" /> Deposit & Withdraw
                  </button>
                  <button onClick={() => handleNav('settings')} className="w-full text-left p-2 rounded hover:bg-neutral-800 flex items-center gap-2 cursor-pointer">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#F5CE47]" /> Profile & KYC
                  </button>
                  {logout && (
                    <button onClick={() => { logout(); setUserDropdownOpen(false); }} className="w-full text-left p-2 rounded hover:bg-red-500/20 text-red-400 flex items-center gap-2 border-t border-neutral-800 mt-1 cursor-pointer">
                      <LogOut className="w-3.5 h-3.5" /> Log Out
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleNav('login')}
              className="hidden sm:inline-flex items-center text-white hover:text-[#F5CE47] text-xs md:text-sm font-semibold tracking-wide transition cursor-pointer"
            >
              Sign in
            </button>
          )}

          {/* Axi-Style Slanted Hamburger Menu Toggle (3 staggered diagonal lines) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 text-white hover:text-[#F5CE47] transition cursor-pointer flex items-center justify-center"
            aria-label="Open Navigation Menu"
          >
            <AxiHamburgerIcon className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Slide-out Menu Drawer for Tablet / Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-[#141414] text-white h-full overflow-y-auto flex flex-col shadow-2xl z-10"
            >
              {/* Drawer Header with Slanted Brand Geometry */}
              <div className="relative flex items-center justify-between p-5 border-b border-neutral-800 bg-[#C8102E] overflow-hidden">
                <div 
                  className="absolute inset-0 bg-[#9B0018] opacity-60 pointer-events-none"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 100%)' }}
                />
                <div className="relative flex items-center gap-1">
                  <svg className="h-7 w-auto text-white" viewBox="0 0 110 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <text x="0" y="29" fill="#FFFFFF" fontSize="35" fontWeight="900" fontFamily="'Clash Display', 'General Sans', system-ui, sans-serif" letterSpacing="-1.5">axi</text>
                  </svg>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="relative p-1 rounded-full hover:bg-black/20 text-white transition cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Drawer Centered Action CTAs */}
              <div className="p-5 flex flex-col gap-3 border-b border-neutral-800 bg-neutral-900/60">
                <button
                  onClick={() => { setMobileMenuOpen(false); openSignUp(); }}
                  className="w-full py-3 bg-[#F5CE47] hover:bg-[#ECC94B] text-neutral-900 font-black text-sm uppercase tracking-wider rounded-lg shadow-md transition text-center cursor-pointer"
                >
                  OPEN ACCOUNT
                </button>
                {user ? (
                  <button
                    onClick={() => handleNav('dashboard')}
                    className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition text-center border border-neutral-700 cursor-pointer"
                  >
                    GO TO DASHBOARD
                  </button>
                ) : (
                  <button
                    onClick={() => handleNav('login')}
                    className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition text-center border border-neutral-700 cursor-pointer"
                  >
                    CLIENT SIGN IN
                  </button>
                )}
              </div>

              {/* Drawer Navigation Links */}
              <div className="flex-1 p-5 flex flex-col gap-3">
                {navItems.map((group, idx) => (
                  <div key={idx} className="border-b border-neutral-800/80 pb-3">
                    <button
                      onClick={() => setActiveMobileDropdown(activeMobileDropdown === group.label ? null : group.label)}
                      className="w-full flex items-center justify-between text-left py-2 font-bold text-sm text-neutral-200 hover:text-white cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1 h-3.5 bg-[#C8102E] inline-block -skew-x-12" />
                        {group.label}
                      </span>
                      <div className="flex items-center gap-2">
                        {group.badge && (
                          <span className="text-[9px] bg-neutral-800 text-[#F5CE47] px-1.5 py-0.5 rounded font-mono">
                            {group.badge}
                          </span>
                        )}
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${activeMobileDropdown === group.label ? 'rotate-180 text-[#F5CE47]' : ''}`} />
                      </div>
                    </button>
                    {activeMobileDropdown === group.label && (
                      <div className="pl-3 pr-1 pt-2 pb-1 flex flex-col gap-2 bg-neutral-900/40 rounded-lg p-2 mt-1">
                        {group.children.map((child, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => handleNav(child.target)}
                            className="text-left py-1.5 text-xs text-neutral-400 hover:text-[#F5CE47] transition flex items-center justify-between cursor-pointer group"
                          >
                            <span className="group-hover:translate-x-1 transition-transform">{child.name}</span>
                            <ChevronRight className="w-3 h-3 text-neutral-600 group-hover:text-[#F5CE47]" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Direct quick views */}
                <div className="flex flex-col gap-2 pt-2 text-xs text-neutral-400 font-semibold">
                  <button onClick={() => handleNav('markets')} className="text-left py-2 hover:text-white flex items-center gap-2 cursor-pointer">
                    <TrendingUp className="w-4 h-4 text-[#C8102E]" /> Live Markets & Spreads
                  </button>
                  <button onClick={() => handleNav('accounts')} className="text-left py-2 hover:text-white flex items-center gap-2 cursor-pointer">
                    <ShieldCheck className="w-4 h-4 text-[#C8102E]" /> Account Types & Verification
                  </button>
                  <button onClick={() => handleNav('support')} className="text-left py-2 hover:text-white flex items-center gap-2 cursor-pointer">
                    <PhoneCall className="w-4 h-4 text-[#C8102E]" /> 24/7 Client Support
                  </button>
                  <button onClick={() => handleNav('legal')} className="text-left py-2 hover:text-white flex items-center gap-2 cursor-pointer">
                    <FileText className="w-4 h-4 text-[#C8102E]" /> Legal & Regulation
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-5 border-t border-neutral-800 bg-neutral-950 text-neutral-400 text-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <button onClick={() => setShowLanguageModal(true)} className="flex items-center gap-1.5 hover:text-white cursor-pointer">
                    <Globe className="w-3.5 h-3.5 text-[#F5CE47]" /> {selectedLang}
                  </button>
                  {setDisplayCurrency && (
                    <CurrencySelector
                      displayCurrency={displayCurrency}
                      setDisplayCurrency={setDisplayCurrency}
                      variant="compact"
                    />
                  )}
                </div>
                <p className="text-[10px] text-neutral-500 text-center mt-2">
                  &copy; {new Date().getFullYear()} Axi. Regulated CFD & Forex Broker.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Language Selector Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#1C1C1C] border border-neutral-800 rounded-2xl w-full max-w-lg p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#F5CE47]" /> Select Region & Language
              </h3>
              <button onClick={() => setShowLanguageModal(false)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 max-h-80 overflow-y-auto pr-1">
              {languages.map((lang, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedLang(lang.name); setShowLanguageModal(false); }}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border text-left text-xs transition cursor-pointer ${
                    selectedLang === lang.name ? 'border-[#F5CE47] bg-[#F5CE47]/10 text-white font-bold' : 'border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <img src={lang.flagUrl} alt="" className="w-5 h-3.5 rounded object-cover" />
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
