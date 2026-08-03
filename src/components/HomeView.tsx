import { useSiteCMS } from '../hooks/useSiteCMS';
import ManCityImage from "../assets/images/man_city_partnership_1784968579657.jpg";
import React, { useState, useEffect } from 'react';
import spacexHeroImg from '../assets/images/spacex_ipo_hero_1784835887334.jpg';
import spreadsHeroImg from '../assets/images/axi_trading_spreads_1784835901617.jpg';
import aiSignalsHeroImg from '../assets/images/axi_ai_signals_1784835914680.jpg';
import cryptoSpotHeroImg from '../assets/images/axi_crypto_spot_1784835927385.jpg';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  DollarSign, 
  Sliders,
  Search,
  Globe,
  Award,
  BookOpen,
  ArrowRight,
  Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { MarketQuote, MasterTrader, ViewType } from '../types';
import HeroSlideshow from './axi/HeroSlideshow';
import { MASTER_TRADERS, ACCOUNT_TYPES } from '../data';

interface HomeViewProps {
  quotes: Record<string, MarketQuote>;
  setView: (view: ViewType) => void;
  openSignUp: () => void;
}

function MobileAppPreview({ onAddFunds }: { onAddFunds: () => void }) {
  const [activeTab, setActiveTab] = useState<'cfds' | 'perps' | 'crypto'>('cfds');
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC/USDT');
  const [equity, setEquity] = useState<number>(5301.23);
  const [pnl, setPnl] = useState<number>(32.11);
  const [prices, setPrices] = useState<Record<string, { val: number; chg: number; isUp: boolean }>>({
    'BTC/USDT': { val: 67245, chg: 2.4, isUp: true },
    'SOL/USDT': { val: 165.42, chg: 1.2, isUp: true },
    'EUR/JPY': { val: 162.341, chg: -0.3, isUp: false },
    'XAU/USD': { val: 2342, chg: 0.8, isUp: true },
    'GBP/USD': { val: 1.2734, chg: -0.15, isUp: false },
  });

  useEffect(() => {
    const fetchHomePrices = async () => {
      try {
        const res = await fetch('/api/markets/quotes');
        if (res.ok) {
          const live = await res.json();
          setPrices({
            'BTC/USDT': { val: live.BTCUSD?.price || 67245, chg: live.BTCUSD?.change || 2.4, isUp: (live.BTCUSD?.change || 0) >= 0 },
            'ETH/USDT': { val: live.ETHUSD?.price || 3482, chg: live.ETHUSD?.change || 1.8, isUp: (live.ETHUSD?.change || 0) >= 0 },
            'USD/JPY': { val: live.USDJPY?.price || 151.62, chg: live.USDJPY?.change || 0.35, isUp: (live.USDJPY?.change || 0) >= 0 },
            'XAU/USD': { val: live.XAUUSD?.price || 2342.80, chg: live.XAUUSD?.change || 1.15, isUp: (live.XAUUSD?.change || 0) >= 0 },
            'GBP/USD': { val: live.GBPUSD?.price || 1.2684, chg: live.GBPUSD?.change || -0.08, isUp: (live.GBPUSD?.change || 0) >= 0 },
          });
        }
      } catch (e) {
        // Keep current real prices
      }
    };

    fetchHomePrices();
    const timer = setInterval(fetchHomePrices, 3000);
    return () => clearInterval(timer);
  }, []);

  const chartPath = React.useMemo(() => {
    const points = [];
    for (let i = 0; i < 9; i++) {
      const sinVal = Math.sin((i / 8) * Math.PI);
      const rand = Math.sin(Date.now() / 5000 + i) * 12 + 10;
      points.push({ x: i * 32.5, y: 80 - sinVal * 40 - rand });
    }
    const d = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const fillD = `${d} L 260 100 L 0 100 Z`;
    return { stroke: d, fill: fillD };
  }, [equity]);

  const assetsList = [
    { name: 'SOL/USDT', desc: 'Solana' },
    { name: 'EUR/JPY', desc: 'Euro / Japanese Yen' },
    { name: 'BTC/USDT', desc: 'Bitcoin' },
    { name: 'XAU/USD', desc: 'Gold Spot' },
    { name: 'GBP/USD', desc: 'Pound / Dollar' },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[285px] bg-slate-950 border-4 border-slate-800 rounded-[44px] p-3 shadow-2xl shadow-brand-red/10 select-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-950 rounded-b-2xl z-20 flex items-center justify-center">
        <div className="w-12 h-1 bg-slate-800 rounded-full mb-1"></div>
      </div>

      <div className="bg-slate-900 text-white rounded-[32px] overflow-hidden flex flex-col h-[460px] relative">
        <div className="flex justify-between items-center px-5 pt-3 pb-1 text-[10px] font-bold text-slate-400 z-10">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px]">5G</span>
            <div className="w-4 h-2 border border-slate-400 rounded-sm p-0.5 flex items-center">
              <div className="bg-emerald-400 h-full w-3/4 rounded-2xs"></div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3">
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex items-center justify-between shadow-md">
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Total Fund Equity</span>
              <span className="text-lg font-mono font-black text-brand-yellow mt-0.5">${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={`text-[9px] font-bold mt-0.5 ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                Unrealised P&L {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onAddFunds}
              className="bg-brand-red hover:bg-brand-red-hover text-white font-black text-[9px] uppercase py-2 px-2.5 rounded-lg shadow-sm shrink-0"
            >
              Add Funds
            </motion.button>
          </div>

          <div className="flex bg-slate-950/80 p-0.5 rounded-xl border border-slate-850">
            {['cfds', 'perps', 'crypto'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase transition-all duration-150 ${
                  activeTab === tab 
                    ? 'bg-slate-800 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-2xl flex flex-col gap-1.5 relative overflow-hidden shadow-inner">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-slate-400 uppercase tracking-wider">{selectedAsset}</span>
              <span className={`font-mono font-black ${prices[selectedAsset]?.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {prices[selectedAsset]?.chg >= 0 ? '+' : ''}{prices[selectedAsset]?.chg.toFixed(2)}%
              </span>
            </div>
            <div className="h-16 w-full relative">
              <svg className="w-full h-full" viewBox="0 0 260 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="phoneGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={chartPath.fill} fill="url(#phoneGrad)" />
                <path d={chartPath.stroke} fill="none" stroke="#10B981" strokeWidth={2} />
              </svg>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Live ECN Watchlist</span>
            <ul className="flex flex-col gap-1">
              {assetsList.map(asset => {
                const isSelected = selectedAsset === asset.name;
                const p = prices[asset.name] || { val: 0, chg: 0, isUp: true };
                return (
                  <motion.li
                    whileHover={{ x: 3 }}
                    key={asset.name}
                    onClick={() => setSelectedAsset(asset.name)}
                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isSelected 
                        ? 'bg-slate-800 border-slate-700/60' 
                        : 'bg-slate-950/40 border-slate-850 hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-black text-white">{asset.name}</div>
                      <div className="text-[8px] font-semibold text-slate-400">{asset.desc}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono font-black text-brand-yellow">
                        ${p.val.toLocaleString(undefined, { minimumFractionDigits: asset.name.includes('JPY') ? 3 : asset.name.includes('USD') && !asset.name.includes('XAU') ? 4 : 2 })}
                      </div>
                      <span className={`text-[8px] font-bold ${p.chg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {p.chg >= 0 ? '+' : ''}{p.chg.toFixed(2)}%
                      </span>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/60 bg-slate-950 py-2 flex justify-around items-center text-[8px] font-black uppercase text-slate-400 shrink-0">
          <div className="flex flex-col items-center gap-0.5 text-brand-red cursor-pointer">
            <span className="text-xs">🏠</span>
            <span>Home</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 cursor-pointer hover:text-white transition">
            <span className="text-xs">📈</span>
            <span>Markets</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 cursor-pointer hover:text-white transition">
            <span className="text-xs">⚡</span>
            <span>Trade</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 cursor-pointer hover:text-white transition">
            <span className="text-xs">💰</span>
            <span>Funds</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomeView({ quotes, setView, openSignUp }: HomeViewProps) {
  const { cmsContent } = useSiteCMS();
  // Real-time market quotes polling for Popular Markets section
  const [liveQuotesMap, setLiveQuotesMap] = useState<Record<string, { price: number; change: number; prevPrice?: number }>>({});

  useEffect(() => {
    const fetchLiveQuotes = async () => {
      try {
        const res = await fetch('/api/markets/quotes');
        if (res.ok) {
          const data = await res.json();
          setLiveQuotesMap(prev => {
            const next: Record<string, { price: number; change: number; prevPrice?: number }> = { ...prev };
            Object.keys(data).forEach(sym => {
              const old = prev[sym];
              next[sym] = {
                price: data[sym].price,
                change: data[sym].change ?? 0,
                prevPrice: old ? old.price : data[sym].price
              };
            });
            return next;
          });
        }
      } catch (e) {
        // Fallback to quotes prop
      }
    };

    fetchLiveQuotes();
    const timer = setInterval(fetchLiveQuotes, 2000);
    return () => clearInterval(timer);
  }, []);

  // Hero Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Search and Live Assets tab state
  const [activeTab, setActiveTab] = useState<'popular' | 'forex' | 'metals' | 'indices' | 'commodities' | 'cryptocurrencies'>('popular');
  const [searchQuery, setSearchQuery] = useState('');

  // Copy Trading Preview State
  const [selectedTraderId, setSelectedTraderId] = useState<string>(MASTER_TRADERS[0].id);
  const [allocation, setAllocation] = useState<number>(2000);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  const selectedTrader = MASTER_TRADERS.find(t => t.id === selectedTraderId) || MASTER_TRADERS[0];

  // Calculations for projected copy results
  const projectedMonthlyReturn = Math.round(allocation * (selectedTrader.roi / 1200));
  const expectedCopierProfit = Math.round(allocation * (selectedTrader.roi / 100));

  // Transform graph data for recharts
  const chartData = selectedTrader.profitGraph.map((val, idx) => ({
    month: `Month ${idx + 1}`,
    equity: Math.round(allocation * (val / 100))
  }));

  const handleCopySubmit = () => {
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 5000);
  };

  // Auto cycle hero slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 5);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const SLIDES = [
    {
      id: 0,
      theme: 'dark',
      bgClass: 'bg-[#030614]',
      textColor: 'text-white',
      subTextColor: 'text-slate-200',
      title: 'SpaceX has landed',
      subhead: 'Trade SPCX after its historic trillion-dollar IPO',
      btnText: 'Trade now',
      btnClass: 'bg-[#FFD250] hover:bg-[#FFC518] text-slate-900', linkText: '',
      image: 'https://aximedia.s3.amazonaws.com/rebrand-prod/huob50z0/launch-slider-new.png',
      imagePosition: 'bottom',
    },
    {
      id: 1,
      theme: 'red',
      bgClass: 'bg-[#FC2B42] bg-gradient-to-br from-[#FC2B42] to-[#E3000F]',
      textColor: 'text-white',
      subTextColor: 'text-[#FFD250]',
      title: 'YOUR EDGE IN THE MARKETS',
      subhead: 'SPREADS ON GOLD $0.16, BTC $15',
      btnText: 'ACCESS TIGHT SPREADS',
      btnClass: 'bg-transparent border border-[#FFD250] hover:bg-[#FFD250]/10 text-[#FFD250]',
      image: 'https://aximedia.s3.amazonaws.com/rebrand-prod/jnnpaysd/mobile-13.png',
      imagePosition: 'bottom',
    },
    {
      id: 2,
      theme: 'teal',
      bgClass: 'bg-[#43B8B8]',
      textColor: 'text-white',
      subTextColor: 'text-white/90',
      title: 'POWER UP YOUR TRADING STRATEGY WITH AI',
      subhead: '',
      btnText: 'LEARN MORE',
      btnClass: 'bg-transparent border border-[#FFD250] hover:bg-[#FFD250]/10 text-[#FFD250]',
      image: 'https://aximedia.s3.amazonaws.com/rebrand-prod/4vejfwwl/webslider-mobile-1.png', 
      imagePosition: 'bottom',
    },
    {
      id: 3,
      theme: 'grey',
      bgClass: 'bg-[#F4F3EF]',
      textColor: 'text-slate-900',
      subTextColor: 'text-[#E3000F]',
      title: 'SPOT IT. BUY IT. OWN IT.',
      subhead: '',
      btnText: 'BUY CRYPTO NOW',
      btnClass: 'bg-[#E3000F] hover:bg-[#CC000D] text-white',
      image: 'https://aximedia.s3.amazonaws.com/rebrand-prod/5xlg22pc/webslider-buy-crypto-1.png',
      imagePosition: 'bottom',
    },
    {
      id: 4,
      theme: 'grey',
      bgClass: 'bg-[#F4F3EF]',
      textColor: 'text-slate-900',
      subTextColor: 'text-slate-700',
      title: '650+ markets. One app.',
      subhead: 'Trade 650+ assets across forex, crypto, commodities, share CFDs, ETFs and global indices without switching apps.',
      btnText: 'Download now',
      btnClass: 'bg-[#FFD250] hover:bg-[#FFC518] text-slate-900', linkText: '',
      secondaryBtnText: 'Learn more',
      secondaryBtnClass: 'bg-transparent border border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900',
      image: 'https://aximedia.s3.amazonaws.com/rebrand-prod/4vejfwwl/webslider-mobile-1.png',
      imagePosition: 'bottom',
    }
  ];

  // Map instrument entries for the dynamic quotes table
  const getFilteredInstruments = () => {
    let list: { symbol: string; name: string; category: string; bidDiff: number; askDiff: number }[] = [];
    
    if (activeTab === 'popular') {
      list = [
        { symbol: 'XAUUSD', name: 'Gold Spot vs US Dollar', category: 'Metals', bidDiff: -0.18, askDiff: 0.18 },
        { symbol: 'EURUSD', name: 'Euro vs US Dollar', category: 'Forex', bidDiff: -0.0001, askDiff: 0.0001 },
        { symbol: 'GBPUSD', name: 'Pound vs US Dollar', category: 'Forex', bidDiff: -0.0002, askDiff: 0.0002 },
        { symbol: 'BTCUSD', name: 'Bitcoin CFD', category: 'Crypto', bidDiff: -0.12, askDiff: 0.15 },
        { symbol: 'US30', name: 'Dow Jones CFD', category: 'Indices', bidDiff: -1.5, askDiff: 1.5 },
        { symbol: 'ETHUSD', name: 'Ethereum CFD', category: 'Crypto', bidDiff: -0.05, askDiff: 0.08 }
      ];
    } else if (activeTab === 'forex') {
      list = [
        { symbol: 'EURUSD', name: 'Euro vs US Dollar', category: 'Forex', bidDiff: -0.0001, askDiff: 0.0001 },
        { symbol: 'GBPUSD', name: 'Pound vs US Dollar', category: 'Forex', bidDiff: -0.0002, askDiff: 0.0002 },
        { symbol: 'USDJPY', name: 'US Dollar vs Yen', category: 'Forex', bidDiff: -0.01, askDiff: 0.01 },
        { symbol: 'AUDUSD', name: 'Aussie vs US Dollar', category: 'Forex', bidDiff: -0.0001, askDiff: 0.0001 }
      ];
    } else if (activeTab === 'metals') {
      list = [
        { symbol: 'XAUUSD', name: 'Gold Spot US Dollar', category: 'Metals', bidDiff: -0.18, askDiff: 0.18 }
      ];
    } else if (activeTab === 'indices') {
      list = [
        { symbol: 'US30', name: 'Dow Jones CFD', category: 'Indices', bidDiff: -1.5, askDiff: 1.5 },
        { symbol: 'SPX500', name: 'S&P 500 CFD', category: 'Indices', bidDiff: -0.25, askDiff: 0.25 }
      ];
    } else if (activeTab === 'commodities') {
      list = [
        { symbol: 'USOUSD', name: 'WTI Crude Oil', category: 'Commodities', bidDiff: -0.02, askDiff: 0.02 }
      ];
    } else { // cryptocurrencies
      list = [
        { symbol: 'BTCUSD', name: 'Bitcoin CFD', category: 'Crypto', bidDiff: -0.12, askDiff: 0.15 },
        { symbol: 'ETHUSD', name: 'Ethereum CFD', category: 'Crypto', bidDiff: -0.05, askDiff: 0.08 }
      ];
    }

    if (searchQuery.trim() !== '') {
      return list.filter(item => 
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return list;
  };

  return (
    <div className="flex flex-col bg-white">
      
      {/* 1. HERO CAROUSEL CONTAINER WITH ACCENT OVERLAPPING STATS STRIP */}
      <div className="w-full relative z-0">
        <HeroSlideshow />
      </div>

      {/* PERSISTENT OVERLAPPING STATS STRIP AS SEEN IN THE VIDEO */}
      <div className="relative z-30 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-10 mb-10">
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 divide-y divide-slate-100 md:divide-y-0 md:divide-x divide-slate-200">
          {[
            { val: '$5', label: 'Starting deposit' },
            { val: '1000+', label: 'Products to trade' },
            { val: '0.7', label: 'Average spreads' },
            { val: '1000:1', label: 'Max leverage' }
          ].map((stat, i) => (
            <div key={i} className="flex items-center justify-between md:justify-center px-4 py-2 gap-4">
              <div className="text-left">
                <span className="text-2xl font-black text-slate-900 tracking-tight block">{stat.val}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">{stat.label}</span>
              </div>
              <span className="text-brand-red font-black text-xl italic select-none">/</span>
            </div>
          ))}
        </div>
      </div>

      



      
      {/* LIVE SPREADS TICKER */}
      <div className="bg-white border-b border-slate-200 overflow-hidden py-2 flex items-center">
        <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite] flex items-center gap-12 px-4">
          {[
            { pair: 'EUR/USD', spread: '0.0', trend: 'up' },
            { pair: 'GBP/USD', spread: '0.1', trend: 'down' },
            { pair: 'XAU/USD', spread: '0.11', trend: 'up' },
            { pair: 'BTC/USD', spread: '15.0', trend: 'up' },
            { pair: 'USD/JPY', spread: '0.1', trend: 'down' },
            { pair: 'AUD/USD', spread: '0.2', trend: 'up' },
            { pair: 'US30', spread: '1.0', trend: 'down' },
            { pair: 'UK100', spread: '0.8', trend: 'up' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">{item.pair}</span>
              <span className="text-slate-500 text-xs">Spread</span>
              <span className="font-mono font-bold text-brand-red text-sm">{item.spread}</span>
              {item.trend === 'up' ? (
                <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
              ) : (
                <svg className="w-3 h-3 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
              )}
            </div>
          ))}
          {/* Duplicate for infinite effect */}
          {[
            { pair: 'EUR/USD', spread: '0.0', trend: 'up' },
            { pair: 'GBP/USD', spread: '0.1', trend: 'down' },
            { pair: 'XAU/USD', spread: '0.11', trend: 'up' },
            { pair: 'BTC/USD', spread: '15.0', trend: 'up' },
            { pair: 'USD/JPY', spread: '0.1', trend: 'down' },
            { pair: 'AUD/USD', spread: '0.2', trend: 'up' },
            { pair: 'US30', spread: '1.0', trend: 'down' },
            { pair: 'UK100', spread: '0.8', trend: 'up' },
          ].map((item, i) => (
            <div key={i + 'dup'} className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">{item.pair}</span>
              <span className="text-slate-500 text-xs">Spread</span>
              <span className="font-mono font-bold text-brand-red text-sm">{item.spread}</span>
              {item.trend === 'up' ? (
                <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
              ) : (
                <svg className="w-3 h-3 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
              )}
            </div>
          ))}
        </div>
      </div>


      {/* 2. THE EDGE FOR THOUSANDS OF TRADERS IN 100+ COUNTRIES */}
      <section className="py-16 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight mb-8">
            The edge for thousands of traders in 100+ countries
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-left max-w-3xl mx-auto mb-10">
            {[
              'Ultra-competitive pricing, unbeatable value',
              'Raw spreads, high liquidity, flexible leverage',
              'High-performance, innovative trading technology',
              'Lightning-fast execution, rock-solid platform',
              'Award-winning 24/7 customer service',
              'Free education to sharpen your skills',
              'Self-service portal + multilingual support',
              'An established global broker since 2007'
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs font-bold text-slate-700">
                {/* Red slash marker as seen in the video checklist */}
                <span className="text-brand-red font-black text-base leading-none italic shrink-0">/</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openSignUp}
            className="bg-brand-yellow hover:bg-brand-yellow-hover text-brand-dark font-black text-xs uppercase tracking-wider px-8 py-4 rounded-lg shadow-md cursor-pointer"
          >
            TRADE WITH A TOP BROKER
          </motion.button>
        </div>
      </section>

      {/* 3. POWERFUL PLATFORMS. YOU AT THE CONTROLS. (RED SECTION) */}
      <section className="bg-brand-red py-16 text-white text-left overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-7 flex flex-col gap-6">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
              Powerful platforms. You at the Controls.
            </h2>
            
            <div className="flex flex-col gap-3 font-bold text-sm">
              <div className="flex items-center gap-2">
                <span className="text-brand-yellow font-black text-lg italic">/</span>
                <span>Industry-standard MT4</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-yellow font-black text-lg italic">/</span>
                <span>A suite of trading resources</span>
              </div>
            </div>

            <div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setView('platforms')}
                className="bg-[#FFD700] hover:bg-yellow-400 text-brand-dark font-black text-xs uppercase tracking-widest px-8 py-4 rounded-lg shadow-xl cursor-pointer"
              >
                GET THE TECHNOLOGY EDGE
              </motion.button>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
            <img 
              src="https://aximedia.s3.amazonaws.com/rebrand-prod/k1mppty1/desktop.png" 
              alt="MT4 Trading platform presentation" 
              className="w-full max-h-[300px] object-contain rounded-xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* 4. A WORLD OF OPPORTUNITY + INTERACTIVE MARKETS TABLE */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto flex flex-col gap-3 mb-10 items-center">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
              Discover popular markets to trade
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm font-semibold leading-relaxed max-w-xl">
              Ultra-competitive pricing and fairer charges, so more of your money is invested in the markets.
            </p>
            <div className="mt-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openSignUp}
                className="bg-brand-yellow hover:bg-brand-yellow-hover text-brand-dark font-black text-xs uppercase tracking-wider px-8 py-4 rounded-lg shadow-md cursor-pointer"
              >
                POWER UP YOUR PORTFOLIO
              </motion.button>
            </div>
          </div>

          {/* Tab Selection Row */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 max-w-5xl mx-auto mb-8 text-sm font-semibold">
            {[
              { id: 'popular', label: 'Trending', icon: 'https://d2tpnh780x5es.cloudfront.net/rebrand-prod/pnhj0btw/indices-trading.svg' },
              { id: 'forex', label: 'Forex', icon: 'https://d2tpnh780x5es.cloudfront.net/rebrand-prod/xe3h1t0y/forex-trading.svg' },
              { id: 'metals', label: 'Metals', icon: 'https://d2tpnh780x5es.cloudfront.net/rebrand-prod/awlbqsrt/commodities-trading.svg' },
              { id: 'indices', label: 'Indices', icon: 'https://d2tpnh780x5es.cloudfront.net/rebrand-prod/pnhj0btw/indices-trading.svg' },
              { id: 'commodities', label: 'Commodities', icon: 'https://d2tpnh780x5es.cloudfront.net/rebrand-prod/awlbqsrt/commodities-trading.svg' },
              { id: 'cryptocurrencies', label: 'Crypto', icon: 'https://d2tpnh780x5es.cloudfront.net/rebrand-prod/wv1ddq5l/crypto-trading.svg' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSearchQuery('');
                }}
                className={`py-4 px-2 rounded-xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer border-2 ${
                  activeTab === tab.id 
                    ? 'border-[#E3000F] bg-white text-slate-900 shadow-md' 
                    : 'border-transparent bg-white text-slate-600 hover:border-slate-200 hover:shadow-sm'
                }`}
              >
                <img src={tab.icon} alt={tab.label} className="w-8 h-8 md:w-10 md:h-10 opacity-80" referrerPolicy="no-referrer" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative max-w-md mx-auto mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search instrument..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-brand-red rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none shadow-inner"
            />
          </div>

          {/* Tabulated Instruments Board */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-md max-w-5xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold text-slate-600">
                <thead className="bg-slate-100 text-[10px] uppercase tracking-wider border-b border-slate-200 text-slate-500 font-mono">
                  <tr>
                    <th className="px-6 py-4">Instrument</th>
                    <th className="px-6 py-4 text-right">Bid</th>
                    <th className="px-6 py-4 text-right">Ask</th>
                    <th className="px-6 py-4 text-right">24h Change</th>
                    <th className="px-6 py-4 text-right">Std Spread</th>
                    <th className="px-6 py-4 text-right">Pro Spread</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {getFilteredInstruments().map((symbolObj) => {
                    const liveData = liveQuotesMap[symbolObj.symbol] || quotes[symbolObj.symbol];
                    const basePrice = liveData?.price ?? (symbolObj.symbol === 'BTCUSD' ? 67845.00 : symbolObj.symbol === 'ETHUSD' ? 3482.50 : 1.0845);
                    const changeNum = liveData?.change ?? (symbolObj.symbol === 'XAUUSD' ? 1.15 : symbolObj.symbol === 'BTCUSD' ? 2.45 : 0.12);
                    const isPositive = changeNum >= 0;

                    const isTickUp = liveData?.prevPrice ? basePrice > liveData.prevPrice : isPositive;
                    const isTickDown = liveData?.prevPrice ? basePrice < liveData.prevPrice : !isPositive;

                    const bidPrice = Number((basePrice + symbolObj.bidDiff).toFixed(symbolObj.symbol.includes('USD') && !symbolObj.symbol.includes('BTC') && !symbolObj.symbol.includes('ETH') && !symbolObj.symbol.includes('XAU') ? 4 : 2));
                    const askPrice = Number((basePrice + symbolObj.askDiff).toFixed(symbolObj.symbol.includes('USD') && !symbolObj.symbol.includes('BTC') && !symbolObj.symbol.includes('ETH') && !symbolObj.symbol.includes('XAU') ? 4 : 2));
                    const stdSpread = symbolObj.symbol === 'BTCUSD' ? '12.5' : symbolObj.symbol === 'ETHUSD' ? '1.25' : '1.2 pips';
                    const proSpread = symbolObj.symbol === 'BTCUSD' ? '2.5' : symbolObj.symbol === 'ETHUSD' ? '0.25' : '0.0 pips';

                    return (
                      <tr key={symbolObj.symbol} className="hover:bg-slate-50/80 transition group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isPositive ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
                              {isPositive ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-rose-600" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900 text-sm tracking-tight">{symbolObj.symbol}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">{symbolObj.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          <span className={`px-2 py-1 rounded transition-colors duration-300 font-bold ${isTickUp ? 'text-emerald-600 bg-emerald-50' : isTickDown ? 'text-rose-600 bg-rose-50' : 'text-slate-800'}`}>
                            {bidPrice.toLocaleString(undefined, { minimumFractionDigits: symbolObj.symbol.includes('USD') && !symbolObj.symbol.includes('BTC') && !symbolObj.symbol.includes('ETH') && !symbolObj.symbol.includes('XAU') ? 4 : 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          <span className={`px-2 py-1 rounded transition-colors duration-300 font-bold ${isTickUp ? 'text-emerald-600 bg-emerald-50' : isTickDown ? 'text-rose-600 bg-rose-50' : 'text-slate-800'}`}>
                            {askPrice.toLocaleString(undefined, { minimumFractionDigits: symbolObj.symbol.includes('USD') && !symbolObj.symbol.includes('BTC') && !symbolObj.symbol.includes('ETH') && !symbolObj.symbol.includes('XAU') ? 4 : 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full border ${isPositive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                            {isPositive ? '+' : ''}{changeNum.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-500">{stdSpread}</td>
                        <td className="px-6 py-4 text-right font-mono text-brand-red font-black">{proSpread}</td>
                        <td className="px-6 py-4 text-center">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setView('markets');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="bg-brand-yellow hover:bg-brand-yellow-hover text-brand-dark text-[10px] font-black uppercase px-4 py-2 rounded shadow-sm cursor-pointer"
                          >
                            TRADE NOW
                          </motion.button>
                        </td>
                      </tr>
                    );
                  })}
                  {getFilteredInstruments().length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 font-semibold">
                        No instruments match your filter search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COMMITTED TO YOUR LONG-TERM SUCCESS */}
      <section className="py-16 bg-slate-50 border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-7 flex flex-col gap-5 text-left">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
              Committed to your long-term success
              <span className="text-brand-red font-black">.</span>
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold leading-relaxed">
              Fundamental tools, training resources, <span className="text-brand-red underline cursor-pointer hover:text-brand-red-hover">trading education</span> and expert coaching to help you continuously improve.
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setView('tools')}
                className="bg-brand-yellow hover:bg-[#E6C200] text-brand-dark font-black text-xs uppercase tracking-wider px-6 py-4 rounded-lg shadow-sm cursor-pointer"
              >
                AXI ACADEMY
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setView('tools')}
                className="bg-brand-yellow hover:bg-[#E6C200] text-brand-dark font-black text-xs uppercase tracking-wider px-6 py-4 rounded-lg shadow-sm cursor-pointer"
              >
                LEARN TO TRADE
              </motion.button>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-brand-red/5 rounded-full blur-2xl pointer-events-none"></div>
            <img 
              src="https://d2tpnh780x5es.cloudfront.net/rebrand-prod/yqeo23co/webpage-thumbnail.jpg" 
              alt="Education webinar workspace" 
              className="w-full max-h-[280px] object-cover rounded-xl shadow-lg border border-slate-200"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* 7. AWARD BADGES GRID */}
      <section className="py-16 bg-white border-t border-slate-100 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[10px] tracking-widest font-extrabold uppercase text-slate-400 block mb-6">
            ** Axi Group of companies
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight mb-4">
            24/5 award-winning service. 100% committed to you.
          </h2>
          <p className="text-slate-500 text-sm font-semibold max-w-2xl mx-auto mb-10">
            Recognised by the industry for our outstanding services, trading platforms, and transparent pricing.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-center max-w-5xl mx-auto">
            <img src="https://d2tpnh780x5es.cloudfront.net/rebrand-prod/jghfw14g/awards-new.png" alt="Award 1" className="w-full max-h-32 object-contain transition-all hover:scale-105" referrerPolicy="no-referrer" />
            <img src="https://d2tpnh780x5es.cloudfront.net/rebrand-prod/rqpp5q0f/awards-new-1.png" alt="Award 2" className="w-full max-h-32 object-contain transition-all hover:scale-105" referrerPolicy="no-referrer" />
            <img src="https://d2tpnh780x5es.cloudfront.net/rebrand-prod/44wdwqkk/awards-new-2.png" alt="Award 3" className="w-full max-h-32 object-contain transition-all hover:scale-105" referrerPolicy="no-referrer" />
            <img src="https://d2tpnh780x5es.cloudfront.net/rebrand-prod/z5vjr5yq/awards-new-4.png" alt="Award 4" className="w-full max-h-32 object-contain transition-all hover:scale-105" referrerPolicy="no-referrer" />
          </div>
        </div>
      </section>

      {/* 8. A WINNING PARTNERSHIP - MANCHESTER CITY FOOTBALL CLUB */}
      <section className="py-24 bg-[#f4f3ef] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">
          
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-5 md:w-1/2 md:pr-10">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              {cmsContent.home.partnershipTitle}
            </h2>
            
            <p className="text-slate-700 text-lg md:text-xl font-medium mb-2">
              {cmsContent.home.partnershipSubtitle}
            </p>

            <div className="mt-2">
              <button
                className="bg-[#FFD250] hover:bg-[#FFC518] text-slate-900 font-black text-xs md:text-sm uppercase tracking-widest px-8 py-4 rounded-sm shadow-sm transition-colors"
              >
                PASSION TO PERFORM
              </button>
            </div>
          </div>

          <div className="md:w-1/2 w-full mt-8 md:mt-0">
            <img 
              src={ManCityImage} 
              alt="Manchester City Players" 
              className="w-full h-auto object-cover rounded-xl shadow-xl transform md:-rotate-2 transition-transform hover:rotate-0 duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
          
        </div>
      </section>

 {/* 9. AXI BLOG POST CARDS */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-10">
            Axi Blog
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto mb-10">
            {[
              {
                category: 'Cryptocurrencies',
                title: 'Bitcoin price predictions 2026-2050: 20 Forecasts, Bull, Base & Bear Cases. Fact-Checked',
                author: 'Alex Mooris',
                desc: 'Learn everything you need to know about Bitcoin (BTC) price predictions and forecasts for 2026, 2027, 2030, 2040, and 2050.',
                img: 'https://d2tpnh780x5es.cloudfront.net/rebrand-prod/20fnyulz/bitcoin-price-predictions.png'
              },
              {
                category: 'Education',
                title: 'What is a stop-loss order and how does it work?',
                author: 'Milan Cutkovic',
                desc: 'What is a stop-loss order, how does it work, and how do you set one? In this guide, you will learn everything you need to know to protect your capital.',
                img: 'https://d2tpnh780x5es.cloudfront.net/rebrand-prod/jbena3p0/stop-loss-orders.jpg'
              },
              {
                category: 'Education',
                title: 'What is proprietary trading and how do prop firms work?',
                author: 'Milan Cutkovic',
                desc: 'Learn what prop trading is and how prop firms work. Discover how traders make money with funded accounts, business models, and how to get started.',
                img: 'https://d2tpnh780x5es.cloudfront.net/rebrand-prod/n3hegh0i/proprietary-trading-firms.png'
              }
            ].map((post, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition flex flex-col justify-between">
                <div>
                  <img src={post.img} alt={post.title} className="w-full h-40 object-cover border-b border-slate-100" />
                  <div className="p-5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">{post.category}</span>
                    <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug line-clamp-2 hover:text-brand-red transition cursor-pointer mb-2">{post.title}</h3>
                    <span className="text-[10px] font-bold text-slate-400 block mb-3">By {post.author}</span>
                    <p className="text-xs text-slate-500 font-semibold line-clamp-3 leading-relaxed">{post.desc}</p>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <span className="text-xs text-brand-red hover:text-brand-red-hover font-black uppercase tracking-wider cursor-pointer inline-flex items-center gap-1">Read Post <ArrowRight className="w-3 h-3" /></span>
                </div>
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('tools')}
            className="bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-lg cursor-pointer"
          >
            READ MORE
          </motion.button>
        </div>
      </section>

      {/* ADDITIONAL VALUE ADD: LIVE COPY TRADING ALLOCATION INTERACTIVE CALCULATOR */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-10 flex flex-col items-center gap-2">
            <span className="text-brand-red text-[11px] font-black tracking-wider uppercase bg-brand-red/5 border border-brand-red/10 px-3 py-1 rounded-md">
              Axi SELECT ALLOCATION
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              PRO ALGO ALLOCATION ENGINE
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold">
              Select verified elite masters on our MT4 live feed, adjust your strategic capital allocation, and see historical performance growth curves instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Controls */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 uppercase tracking-wider border-b border-slate-100 pb-3">
                <Sliders className="w-4 h-4 text-brand-red" /> Configuration Dashboard
              </h3>

              {/* Master Trader Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Select Master Trader</label>
                <div className="grid grid-cols-1 gap-2.5">
                  {MASTER_TRADERS.map((trader) => (
                    <button
                      key={trader.id}
                      onClick={() => {
                        setSelectedTraderId(trader.id);
                        setCopiedSuccess(false);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 relative overflow-hidden cursor-pointer ${
                        selectedTraderId === trader.id 
                          ? 'bg-brand-red/5 border-brand-red text-slate-900 shadow-sm' 
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      {selectedTraderId === trader.id && (
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-brand-red"></div>
                      )}
                      
                      <img src={trader.avatar} alt={trader.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black truncate">{trader.name}</span>
                          <span className="text-xs font-black text-brand-red font-mono">ROI: +{trader.roi}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5 font-bold">
                          <span>{trader.assetClass}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3 text-slate-400" /> {trader.copiers} copiers</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Allocation Slider with Red & Yellow Styling */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  <span>Strategic Capital Allocation</span>
                  <span className="text-brand-red text-xs font-mono font-black bg-brand-red/5 px-2.5 py-1 rounded border border-brand-red/10 shadow-sm">
                    USD ${allocation.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={allocation}
                  onChange={(e) => {
                    setAllocation(Number(e.target.value));
                    setCopiedSuccess(false);
                  }}
                  className="w-full accent-brand-red cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-black">
                  <span>$500 Min</span>
                  <span>$25,000</span>
                  <span>$50,000 Max</span>
                </div>
              </div>

              {/* Interactive Copy Button */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleCopySubmit}
                className="w-full bg-brand-red hover:bg-brand-red-hover text-white text-xs font-black uppercase py-4 rounded-xl transition shadow-lg shadow-brand-red/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4 text-brand-yellow stroke-[3]" /> Start Copying Strategy
              </motion.button>

              {copiedSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-emerald-600 text-xs py-3 px-3 bg-emerald-50 border border-emerald-200 rounded-lg font-bold flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  Successfully deployed direct live copy-allocation parameters for {selectedTrader.name}!
                </motion.div>
              )}
            </div>

            {/* Right: Projections & Recharts */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Historical Equity Growth Projection</h4>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5">Based on audited trading performance statistics from the Axi Live ECN Server.</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] uppercase text-slate-400 font-black block">Risk Level</span>
                  <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border ${
                    selectedTrader.riskScore <= 3 
                      ? 'text-emerald-600 bg-emerald-50 border-emerald-200' 
                      : selectedTrader.riskScore <= 5 
                        ? 'text-amber-600 bg-amber-50 border-amber-200' 
                        : 'text-brand-red bg-brand-red/5 border-brand-red/20'
                  }`}>
                    {selectedTrader.riskScore}/10 ({selectedTrader.riskScore <= 3 ? 'Conservative' : selectedTrader.riskScore <= 5 ? 'Balanced' : 'Aggressive'})
                  </span>
                </div>
              </div>

              {/* numerical outputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400">Est. Average Monthly Return</span>
                    <span className="text-slate-800 text-xl font-mono font-extrabold mt-0.5">+${projectedMonthlyReturn.toLocaleString()}</span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400">Projected Annual Profit Gain</span>
                    <span className="text-brand-red text-xl font-mono font-extrabold mt-0.5">+${expectedCopierProfit.toLocaleString()}</span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-brand-red/5 border border-brand-red/25 text-brand-red flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-64 w-full bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} domain={['dataMin - 100', 'dataMax + 100']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px' }}
                      labelClassName="text-slate-400 font-black text-[10px] uppercase"
                      itemStyle={{ color: '#E31C3A', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="#E31C3A" 
                      strokeWidth={3} 
                      dot={{ r: 5, stroke: '#FFFFFF', strokeWidth: 2, fill: '#FFD700' }} 
                      activeDot={{ r: 7, stroke: '#E31C3A', strokeWidth: 1 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 10. PRE-FOOTER CTA - As seen in Image 5 */}
      <section className="relative overflow-hidden bg-[#f4f3ef] py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto px-4 relative z-10 flex flex-col items-center gap-6">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight text-slate-900">
            {cmsContent.home.preFooterTitle}
          </h2>
          <p className="text-slate-600 text-lg md:text-xl max-w-xl font-normal leading-relaxed mb-4">
            {cmsContent.home.preFooterSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openSignUp}
              className="bg-[#FFD250] hover:bg-[#FFC518] text-slate-900 font-bold text-[13px] px-8 py-3.5 rounded uppercase tracking-wide cursor-pointer w-full sm:w-auto"
            >
              OPEN A LIVE ACCOUNT
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setView('platforms');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-transparent border-2 border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900 font-bold text-[13px] px-8 py-3.5 rounded uppercase tracking-wide cursor-pointer w-full sm:w-auto transition-colors"
            >
              TRY A FREE DEMO
            </motion.button>
          </div>
        </div>
      </section>

    </div>
  );
}
