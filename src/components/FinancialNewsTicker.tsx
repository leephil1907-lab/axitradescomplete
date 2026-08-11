import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, TrendingUp, TrendingDown, Clock, RefreshCw, Filter, ExternalLink, Flame, ShieldAlert, Sparkles, X } from 'lucide-react';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: 'Forex' | 'Crypto' | 'Stocks' | 'Central Banks' | 'Commodities';
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  impact: 'High' | 'Medium' | 'Low';
  publishedAt: string;
  relatedSymbol?: string;
  url?: string;
  author?: string;
}

const LIVE_FINANCIAL_NEWS: NewsArticle[] = [
  {
    id: 'news-101',
    title: 'ECB Rate Decision Anticipation Pushes EUR/USD Near 1.0900 Resistance Level',
    summary: 'European Central Bank signals potential monetary pause as Eurozone inflation aligns with central estimates, boosting European market sentiment.',
    source: 'Bloomberg Terminal',
    category: 'Forex',
    sentiment: 'Bullish',
    impact: 'High',
    publishedAt: '2 mins ago',
    relatedSymbol: 'EURUSD',
    author: 'Christine Lagarde Monitor'
  },
  {
    id: 'news-102',
    title: 'Gold Breaks Above $2,040 Spot Price Driven by Geopolitical Safe-Haven Demand',
    summary: 'Bullion traders increase long exposure following renewed central bank reserve accumulation and treasury yield volatility across G7 bonds.',
    source: 'Reuters Finance',
    category: 'Commodities',
    sentiment: 'Bullish',
    impact: 'High',
    publishedAt: '8 mins ago',
    relatedSymbol: 'XAUUSD',
    author: 'Helena Vance'
  },
  {
    id: 'news-103',
    title: 'Bitcoin Consolidates Above $64,000 as Institutional ETF Inflows Hit Weekly Record',
    summary: 'Spot Bitcoin ETF daily net inflows surpass $450 million with heavy accumulation from institutional wealth managers and corporate treasuries.',
    source: 'CoinDesk Pro',
    category: 'Crypto',
    sentiment: 'Bullish',
    impact: 'High',
    publishedAt: '15 mins ago',
    relatedSymbol: 'BTCUSD',
    author: 'Marcus Thorne'
  },
  {
    id: 'news-104',
    title: 'US Federal Reserve Signals Caution On Rate Cuts Amid Sticky Core CPI Data',
    summary: 'FOMC officials stress data-dependency before embarking on monetary easing cycles, causing brief USD dollar index strength.',
    source: 'Financial Times',
    category: 'Central Banks',
    sentiment: 'Bearish',
    impact: 'High',
    publishedAt: '22 mins ago',
    relatedSymbol: 'USDJPY',
    author: 'Colm O\'Shea'
  },
  {
    id: 'news-105',
    title: 'NVIDIA Surges 4.2% Pre-Market Following Next-Gen AI Data Center Chip Demand',
    summary: 'Tech rally accelerates as semiconductor giants report record order backlogs from global cloud infrastructure providers.',
    source: 'Wall Street Journal',
    category: 'Stocks',
    sentiment: 'Bullish',
    impact: 'Medium',
    publishedAt: '35 mins ago',
    relatedSymbol: 'NVDA',
    author: 'David S. Miller'
  },
  {
    id: 'news-106',
    title: 'Crude Oil Holds Near $78/bbl Ahead of OPEC+ Voluntary Production Quota Meeting',
    summary: 'Energy traders monitor supply restrictions and inventory drawdowns in Oklahoma storage facilities.',
    source: 'S&P Global Energy',
    category: 'Commodities',
    sentiment: 'Neutral',
    impact: 'Medium',
    publishedAt: '50 mins ago',
    relatedSymbol: 'USOIL',
    author: 'Sarah Jenkins'
  }
];

interface FinancialNewsTickerProps {
  accountMode?: 'demo' | 'live';
  onSymbolSelect?: (symbol: string) => void;
}

export default function FinancialNewsTicker({ accountMode = 'live', onSymbolSelect }: FinancialNewsTickerProps) {
  const [articles, setArticles] = useState<NewsArticle[]>(LIVE_FINANCIAL_NEWS);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const fetchLiveNews = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.articles) && data.articles.length > 0) {
          setArticles(data.articles);
        }
      }
    } catch (err) {
      console.warn('Live news fetch client notice:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveNews();
  }, []);

  const handleRefresh = () => {
    fetchLiveNews();
  };

  const filteredArticles = activeCategory === 'ALL' 
    ? articles 
    : articles.filter(a => a.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className={`rounded-2xl border p-5 transition-all shadow-xs ${
      accountMode === 'demo'
        ? 'bg-slate-900 border-slate-800 text-white'
        : 'bg-white border-slate-200/90 text-slate-900'
    }`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-red/10 text-brand-red">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm tracking-tight">Real-Time Financial News & Catalyst Feed</h3>
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Feed
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Instant macroeconomic news headlines, central bank signals, and market catalysts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              accountMode === 'demo'
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Fetch latest headline updates"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-red' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Continuous Marquee Ticker Banner */}
      <div className={`overflow-hidden rounded-xl border p-2.5 mb-4 relative ${
        accountMode === 'demo' ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-900 text-white border-slate-800'
      }`}>
        <div className="flex items-center gap-2 text-xs font-bold whitespace-nowrap overflow-x-auto scrollbar-none py-0.5">
          <span className="bg-brand-red text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Flame className="w-3 h-3" /> Flash Ticker
          </span>
          <div className="flex items-center gap-6 animate-none">
            {articles.slice(0, 4).map((art) => (
              <button
                key={art.id}
                onClick={() => setSelectedArticle(art)}
                className="flex items-center gap-2 hover:text-brand-red transition cursor-pointer text-xs font-semibold text-slate-200 shrink-0"
              >
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  art.sentiment === 'Bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                  art.sentiment === 'Bearish' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-300'
                }`}>
                  {art.relatedSymbol || art.category}
                </span>
                <span className="truncate max-w-xs">{art.title}</span>
                <span className="text-[10px] text-slate-400 font-normal">({art.publishedAt})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        {['ALL', 'Forex', 'Crypto', 'Commodities', 'Central Banks', 'Stocks'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeCategory === cat
                ? 'bg-brand-red text-white shadow-xs'
                : accountMode === 'demo'
                  ? 'bg-slate-800 text-slate-400 hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="flex flex-col gap-3">
        {filteredArticles.map((article) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedArticle(article)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group ${
              accountMode === 'demo'
                ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                : 'bg-slate-50 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  article.sentiment === 'Bullish'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : article.sentiment === 'Bearish'
                    ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {article.sentiment}
                </span>

                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-200/60 dark:bg-slate-700 px-2 py-0.5 rounded">
                  {article.category}
                </span>

                {article.impact === 'High' && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> High Impact
                  </span>
                )}

                <span className="text-xs text-slate-400 font-medium ml-auto md:ml-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {article.publishedAt}
                </span>
              </div>

              <h4 className="text-sm font-bold leading-snug group-hover:text-brand-red transition">
                {article.title}
              </h4>

              <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                {article.summary}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-700">
              {article.relatedSymbol && onSymbolSelect && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSymbolSelect(article.relatedSymbol!);
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900 transition flex items-center gap-1 cursor-pointer"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>Trade {article.relatedSymbol}</span>
                </button>
              )}

              {article.url ? (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-bold text-slate-500 hover:text-brand-red dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition px-2 py-1 rounded bg-slate-200/50 dark:bg-slate-800"
                >
                  <span>Read</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-xs font-bold text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 flex items-center gap-0.5">
                  Read <ExternalLink className="w-3 h-3" />
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative flex flex-col gap-4 text-slate-900 dark:text-white"
            >
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="bg-brand-red/10 text-brand-red text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                  {selectedArticle.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">{selectedArticle.source}</span>
              </div>

              <h3 className="text-lg font-extrabold leading-snug">{selectedArticle.title}</h3>

              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium border-y border-slate-100 dark:border-slate-800 py-2.5">
                <span>By {selectedArticle.author || 'Market Intelligence Desk'}</span>
                <span>•</span>
                <span>{selectedArticle.publishedAt}</span>
                <span>•</span>
                <span className={`font-bold ${
                  selectedArticle.sentiment === 'Bullish' ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {selectedArticle.sentiment} Outlook
                </span>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                {selectedArticle.summary}
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between mt-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Impacted Trading Symbol</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedArticle.relatedSymbol || 'Global Markets Index'}</span>
                </div>

                {selectedArticle.relatedSymbol && onSymbolSelect && (
                  <button
                    onClick={() => {
                      onSymbolSelect(selectedArticle.relatedSymbol!);
                      setSelectedArticle(null);
                    }}
                    className="bg-brand-red text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-red-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Open {selectedArticle.relatedSymbol} Order</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
