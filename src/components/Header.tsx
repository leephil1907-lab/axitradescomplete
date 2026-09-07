import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronDown, Globe, ShieldCheck, User, LayoutDashboard, Wallet, 
  LogOut, TrendingUp, ChevronRight, PhoneCall, FileText, BarChart2, Zap, 
  BookOpen, Award, Layers, Coins, Landmark, HelpCircle, ArrowRight,
  Users, Server, Gift, Calendar, Sparkles, DollarSign, Sun, Moon
} from 'lucide-react';
import { ViewType, DisplayCurrency } from '../types';
import CurrencySelector from './CurrencySelector';
import AxiHamburgerIcon from './AxiHamburgerIcon';
import AxiLogo from './AxiLogo';
import { chooseLanguage } from '../services/siteTranslator';

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
  isDarkMode = false,
  toggleDarkMode,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState<string | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  // NOTE: The platform is served in English. Browser auto-translate is disabled
  // site-wide (index.html notranslate meta) because machine-translating this live
  // React app corrupted React's DOM and caused the "NotFoundError … not found
  // here" crash. So the interface always runs in English; the list is retained
  // for display only.
  const [selectedLang, setSelectedLang] = useState(() => { try { return localStorage.getItem('axi_language') || 'English (Global)'; } catch { return 'English (Global)'; } });

  const handleLanguageSelect = (name: string) => {
    setShowLanguageModal(false);
    setSelectedLang(name);
    // Safe in-app translation (text-node only, never restructures React's DOM).
    // Switching languages reloads once with the new language applied.
    chooseLanguage(name);
  };
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  // AXI_HIDDEN_ADMIN_TRIGGER_V3
  const [hiddenAdminClicks,setHiddenAdminClicks]=useState(0);
  const hiddenAdminTimerRef=React.useRef<ReturnType<typeof setTimeout>|null>(null);
  const handleHiddenAdminLogoClick=()=>{const next=hiddenAdminClicks+1;if(hiddenAdminTimerRef.current)clearTimeout(hiddenAdminTimerRef.current);if(next>=7){setHiddenAdminClicks(0);handleNav('admin');return;}setHiddenAdminClicks(next);handleNav('home');hiddenAdminTimerRef.current=setTimeout(()=>setHiddenAdminClicks(0),1800);};

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

  // Axi.com-style layout for the desktop mega drop-down panels: some top-level
  // menus render as a wide row of "tiles" (title + blurb), others as grouped
  // caption columns (child indexes per group).
  const NAV_LAYOUT: Record<string, { mode: 'tiles' | 'columns'; caption?: string; groups?: { heading: string; indices: number[] }[] }> = {
    Markets: { mode: 'tiles', caption: 'CFD Instruments' },
    Trading: { mode: 'columns', groups: [
      { heading: 'Accounts', indices: [0, 1] },
      { heading: 'Features & Funding', indices: [2, 3, 4] },
    ] },
    Platforms: { mode: 'columns', groups: [
      { heading: 'Trading Platforms', indices: [0, 1, 4] },
      { heading: 'Add-on Tools', indices: [2, 3] },
    ] },
    'Tools & Learn': { mode: 'columns', groups: [
      { heading: 'Learn & Insights', indices: [1, 3, 4] },
      { heading: 'Market Tools', indices: [0, 2] },
    ] },
    Partners: { mode: 'tiles' },
    About: { mode: 'tiles' },
  };

  // Hover handling: entering a trigger or the drop-down panel cancels the close
  // timer; leaving both schedules a short grace period so the pointer can move
  // from the top bar into the open panel without closing it.
  const closeTimer = React.useRef<number | null>(null);
  const cancelClose = () => { if (closeTimer.current) { window.clearTimeout(closeTimer.current); closeTimer.current = null; } };
  const scheduleClose = () => { cancelClose(); closeTimer.current = window.setTimeout(() => setActiveDropdown(null), 180); };
  const openDropdown = (label: string) => { cancelClose(); setActiveDropdown(label); };


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
            onClick={handleHiddenAdminLogoClick} className="flex items-center cursor-pointer group shrink-0 bg-transparent border-0 p-0 text-left"
            id="logo-brand"
            title="Axi - Return to Home"
            aria-label="Axi Home"
          >
            <div className="flex items-center">
              <AxiLogo variant="white" size="md" className="drop-shadow-sm transition-transform duration-200 group-hover:scale-105" />
            </div>
          </button>

          {/* Left Desktop Nav Links: Markets, Trading, Platforms */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-white font-medium text-sm">
            {navItems.slice(0, 3).map((item) => (
              <div 
                key={item.label}
                className="relative py-5 group"
                onMouseEnter={() => openDropdown(item.label)}
                onMouseLeave={scheduleClose}
              >
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => handleNav(item.id)}
                    className="flex items-center text-white/95 hover:text-[#F5CE47] transition-all cursor-pointer text-sm font-semibold tracking-wide"
                  >
                    <span>{item.label}</span>
                  </button>
                  <button
                    onClick={() => { if (activeDropdown === item.label) { setActiveDropdown(null); } else { openDropdown(item.label); } }}
                    aria-label={'Toggle ' + item.label + ' submenu'}
                    aria-expanded={activeDropdown === item.label}
                    className="p-0.5 -m-0.5 text-white/80 hover:text-[#F5CE47] transition cursor-pointer"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === item.label ? 'rotate-180 text-[#F5CE47]' : ''}`} />
                  </button>
                </div>


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
          
          {/* Right Desktop Nav Links: Tools & Learn, Partners, About */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-white font-medium text-sm">
            {navItems.slice(3, 6).map((item) => (
              <div 
                key={item.label}
                className="relative py-5 group"
                onMouseEnter={() => openDropdown(item.label)}
                onMouseLeave={scheduleClose}
              >
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => handleNav(item.id)}
                    className="flex items-center text-white/95 hover:text-[#F5CE47] transition-all cursor-pointer text-sm font-semibold tracking-wide"
                  >
                    <span>{item.label}</span>
                  </button>
                  <button
                    onClick={() => { if (activeDropdown === item.label) { setActiveDropdown(null); } else { openDropdown(item.label); } }}
                    aria-label={'Toggle ' + item.label + ' submenu'}
                    aria-expanded={activeDropdown === item.label}
                    className="p-0.5 -m-0.5 text-white/80 hover:text-[#F5CE47] transition cursor-pointer"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === item.label ? 'rotate-180 text-[#F5CE47]' : ''}`} />
                  </button>
                </div>


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
                  {/* Theme toggle inside the account drop-down menu */}
                  {toggleDarkMode && (
                    <div className="p-2 border-t border-neutral-800 mt-1">
                      <p className="text-[10px] uppercase font-black tracking-widest text-neutral-500 mb-1.5">Appearance</p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { if (isDarkMode) toggleDarkMode(); }}
                          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition cursor-pointer ${!isDarkMode ? 'bg-[#C8102E] text-white' : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white'}`}
                        >
                          <Sun className="w-3.5 h-3.5" /> Light
                        </button>
                        <button
                          onClick={() => { if (!isDarkMode) toggleDarkMode(); }}
                          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition cursor-pointer ${isDarkMode ? 'bg-[#C8102E] text-white' : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white'}`}
                        >
                          <Moon className="w-3.5 h-3.5" /> Dark
                        </button>
                      </div>
                    </div>
                  )}
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

      {/* ===== Axi.com-style full-width mega drop-down panel ===== */}
      <AnimatePresence>
        {activeDropdown && (() => {
          const item = navItems.find((n) => n.label === activeDropdown);
          if (!item) return null;
          const layout = NAV_LAYOUT[item.label] || { mode: 'columns' as const, groups: [{ heading: item.label, indices: item.children.map((_, i) => i) }] };
          const dark = !!isDarkMode;
          const tiles = layout.mode === 'tiles';
          const iconBox = dark ? 'bg-[#F5CE47]/15 text-[#F5CE47]' : 'bg-[#C8102E]/10 text-[#C8102E]';
          const hoverBg = dark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100';
          const titleCol = dark ? 'text-slate-100' : 'text-slate-900';
          const titleHover = dark ? 'group-hover/tile:text-[#F5CE47] group-hover/row:text-[#F5CE47]' : 'group-hover/tile:text-[#C8102E] group-hover/row:text-[#C8102E]';
          const descCol = dark ? 'text-slate-400' : 'text-slate-500';
          const capCol = dark ? 'text-slate-500' : 'text-slate-400';
          const pill = dark ? 'border-white/10 bg-white/10 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-500';
          const ctaCol = dark ? 'text-[#F5CE47]' : 'text-[#C8102E]';
          const renderTile = (sub: NavItem['children'][number], idx: number) => {
            const IconComp = sub.icon;
            return (
              <button key={idx} onClick={() => handleNav(sub.target)}
                className={'group/tile flex items-start gap-2.5 rounded-xl p-2.5 text-left transition-colors cursor-pointer ' + hoverBg}>
                <span className={'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ' + iconBox}>
                  <IconComp className="w-4 h-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={'flex items-center gap-1.5 text-[12.5px] font-bold transition-colors ' + titleCol + ' ' + titleHover}>
                    <span className="truncate">{sub.name}</span>
                    {sub.tag && <span className={'shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold ' + pill}>{sub.tag}</span>}
                  </span>
                  <span className={'block text-[11px] leading-snug ' + descCol}>{sub.desc}</span>
                </span>
              </button>
            );
          };
          const renderRow = (sub: NavItem['children'][number], idx: number) => {
            const IconComp = sub.icon;
            return (
              <button key={idx} onClick={() => handleNav(sub.target)}
                className={'group/row flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer ' + hoverBg}>
                <span className={'grid h-7 w-7 shrink-0 place-items-center rounded-md ' + iconBox}>
                  <IconComp className="w-3.5 h-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={'block truncate text-[12.5px] font-bold transition-colors ' + titleCol + ' ' + titleHover}>{sub.name}</span>
                  <span className={'block truncate text-[10.5px] ' + descCol}>{sub.desc}</span>
                </span>
                {sub.tag && <span className={'shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold ' + pill}>{sub.tag}</span>}
                <ChevronRight className={'w-3.5 h-3.5 shrink-0 -translate-x-1 opacity-0 transition-all group-hover/row:translate-x-0 group-hover/row:opacity-100 ' + ctaCol} />
              </button>
            );
          };
          return (
            <motion.div
              key={activeDropdown}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              data-header-dropdown={item.label}
              className={'absolute left-0 right-0 top-full z-50 hidden lg:block ' + (dark ? 'bg-[#0B1220] text-slate-100' : 'bg-white text-slate-900') + ' border-b shadow-[0_26px_50px_-20px_rgba(0,0,0,0.55)] ' + (dark ? 'border-slate-700/60' : 'border-slate-200')}
            >
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-5">
                {tiles ? (
                  <div>
                    {layout.caption && (
                      <p className={'text-[10px] font-black uppercase tracking-[0.18em] pb-2 ' + capCol}>{layout.caption}</p>
                    )}
                    <div className={'grid gap-1 ' + (item.children.length >= 5 ? 'md:grid-cols-3 xl:grid-cols-5' : 'md:grid-cols-2 xl:grid-cols-4')}>
                      {item.children.map(renderTile)}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row gap-5 md:gap-10">
                    {(layout.groups || []).map((g, gi) => (
                      <div key={gi} className="flex-1 min-w-0">
                        <p className={'text-[10px] font-black uppercase tracking-[0.16em] pb-1 ' + capCol}>{g.heading}</p>
                        <div className="flex flex-col">
                          {g.indices.map((ci, si) => renderRow(item.children[ci], si))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className={'mt-4 flex items-center justify-between gap-3 border-t pt-3 ' + (dark ? 'border-white/10' : 'border-slate-200')}>
                  <span className={'truncate pr-2 text-[11px] font-medium ' + descCol}>{item.highlightText}</span>
                  <button onClick={() => handleNav(item.ctaTarget)}
                    className={'inline-flex shrink-0 items-center gap-1 text-[11px] font-black uppercase tracking-wider hover:underline cursor-pointer ' + ctaCol}>
                    {item.ctaText}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className={'mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-2 ' + (dark ? 'border-white/10' : 'border-slate-200')}>
                  <span className={'text-[10px] font-semibold uppercase tracking-[0.16em] ' + capCol}>Axi Trades</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button onClick={() => setShowLanguageModal(true)}
                      className={'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold transition cursor-pointer ' + hoverBg + ' ' + titleCol}>
                      <Globe className={'w-3.5 h-3.5 ' + ctaCol} />
                      <span className="max-w-[130px] truncate">{selectedLang}</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>
                    <span className={'opacity-40 ' + descCol}>|</span>
                    <button onClick={() => handleNav('support')}
                      className={'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold transition cursor-pointer ' + hoverBg + ' ' + titleCol}>
                      <HelpCircle className={'w-3.5 h-3.5 ' + ctaCol} />
                      Help Centre
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

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
                  <AxiLogo variant="white" size="sm" />
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
              <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto">
                {/* Theme toggle inside mobile menu */}
                {toggleDarkMode && (
                  <button
                    onClick={() => { toggleDarkMode(); }}
                    className="w-full flex items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-left transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5 text-xs font-bold text-white">
                      {isDarkMode ? <Sun className="w-4 h-4 text-[#F5CE47]" /> : <Moon className="w-4 h-4 text-[#F5CE47]" />}
                      {isDarkMode ? 'Light Theme' : 'Dark Theme'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-black text-neutral-500">
                      {isDarkMode ? 'Switch to cream' : 'Switch now'}
                    </span>
                  </button>
                )}

                {/* Quick shortcuts */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500 mb-2">Quick Access</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Live Markets', icon: TrendingUp, view: 'markets' as ViewType, active: true },
                      { label: 'Account Types', icon: ShieldCheck, view: 'accounts' as ViewType, active: false },
                      { label: 'Funds & Deposit', icon: Wallet, view: 'funds' as ViewType, active: false },
                      { label: 'Client Support', icon: PhoneCall, view: 'support' as ViewType, active: false },
                    ].map((q) => {
                      const QIcon = q.icon;
                      return (
                        <button
                          key={q.label}
                          onClick={() => handleNav(q.view)}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition cursor-pointer ${
                            q.active
                              ? 'bg-[#C8102E]/15 border-[#C8102E]/40 text-white'
                              : 'bg-neutral-900/70 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                          }`}
                        >
                          <QIcon className="w-4 h-4 shrink-0 text-[#F5CE47]" />
                          {q.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Groups accordion */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500 mb-2">Explore</p>
                  <div className="flex flex-col gap-2.5">
                    {navItems.map((group, idx) => {
                      const open = activeMobileDropdown === group.label;
                      const accent = ['#F5CE47', '#E3000F', '#38bdf8', '#a78bfa', '#34d399', '#fb923c'][idx % 6];
                      return (
                        <div key={group.label} className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 overflow-hidden">
                          <button
                            onClick={() => setActiveMobileDropdown(open ? null : group.label)}
                            aria-expanded={open}
                            className="w-full flex items-center justify-between text-left px-3.5 py-3 font-bold text-sm text-neutral-100 hover:text-white cursor-pointer"
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="w-1.5 h-4 rounded-full -skew-x-12" style={{ background: accent }} />
                              {group.label}
                            </span>
                            <span className="flex items-center gap-2">
                              {group.badge && (
                                <span className="text-[9px] bg-neutral-800 text-[#F5CE47] px-1.5 py-0.5 rounded font-mono">{group.badge}</span>
                              )}
                              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${open ? 'rotate-180 text-[#F5CE47]' : ''}`} />
                            </span>
                          </button>

                          {open && (
                            <div className="px-2.5 pb-2.5 flex flex-col gap-1">
                              {group.children.map((child, cIdx) => {
                                const IconComp = child.icon;
                                return (
                                  <button
                                    key={cIdx}
                                    onClick={() => handleNav(child.target)}
                                    className="group/child flex items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-white/[0.06] transition cursor-pointer"
                                  >
                                    <span className="p-1.5 rounded-md bg-neutral-800 border border-neutral-700/70 text-[#F5CE47] group-hover/child:bg-[#C8102E] group-hover/child:border-[#C8102E] transition-colors shrink-0">
                                      <IconComp className="w-3.5 h-3.5" />
                                    </span>
                                    <span className="flex-1 min-w-0">
                                      <span className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold text-neutral-100 group-hover/child:text-[#F5CE47] transition-colors">
                                          {child.name}
                                        </span>
                                        {child.tag && (
                                          <span className="text-[8px] font-mono text-neutral-500 bg-neutral-800/80 px-1 py-0.5 rounded shrink-0">
                                            {child.tag}
                                          </span>
                                        )}
                                      </span>
                                      <span className="block text-[10px] text-neutral-500 leading-snug truncate">{child.desc}</span>
                                    </span>
                                    <ChevronRight className="w-3.5 h-3.5 text-neutral-600 group-hover/child:text-[#F5CE47] shrink-0" />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Direct utility links */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 text-xs text-neutral-400 font-semibold border-t border-neutral-800/70">
                  <button onClick={() => handleNav('economic_calendar')} className="text-left py-1.5 hover:text-[#F5CE47] flex items-center gap-2 cursor-pointer">
                    <Calendar className="w-3.5 h-3.5 text-[#C8102E]" /> Calendar
                  </button>
                  <button onClick={() => handleNav('promotions')} className="text-left py-1.5 hover:text-[#F5CE47] flex items-center gap-2 cursor-pointer">
                    <Gift className="w-3.5 h-3.5 text-[#C8102E]" /> Promotions
                  </button>
                  <button onClick={() => handleNav('legal')} className="text-left py-1.5 hover:text-[#F5CE47] flex items-center gap-2 cursor-pointer">
                    <FileText className="w-3.5 h-3.5 text-[#C8102E]" /> Legal & Regulation
                  </button>
                  <button onClick={() => handleNav('about')} className="text-left py-1.5 hover:text-[#F5CE47] flex items-center gap-2 cursor-pointer">
                    <Award className="w-3.5 h-3.5 text-[#C8102E]" /> About Axi
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
                  onClick={() => handleLanguageSelect(lang.name)}
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
