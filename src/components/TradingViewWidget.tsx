import React, { useState } from 'react';
import { Maximize2, Minimize2, BarChart2, RefreshCw } from 'lucide-react';

interface TradingViewWidgetProps {
  symbol: string;
  theme?: 'light' | 'dark';
  height?: number | string;
  autosize?: boolean;
}

// Map application symbols to TradingView standardized symbols
export function getTradingViewSymbol(symbol: string): string {
  const clean = symbol.toUpperCase().replace('/', '').replace('-', '').trim();
  
  // Forex Pairs
  if (['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURAUD'].includes(clean)) {
    return `FX:${clean}`;
  }
  
  // Cryptocurrencies
  if (clean.includes('BTC')) return 'BINANCE:BTCUSDT';
  if (clean.includes('ETH')) return 'BINANCE:ETHUSDT';
  if (clean.includes('SOL')) return 'BINANCE:SOLUSDT';
  if (clean.includes('XRP')) return 'BINANCE:XRPUSDT';
  if (clean.includes('DOGE')) return 'BINANCE:DOGEUSDT';
  if (clean.includes('ADA')) return 'BINANCE:ADAUSDT';
  if (clean.includes('AVAX')) return 'BINANCE:AVAXUSDT';
  if (clean.includes('DOT')) return 'BINANCE:DOTUSDT';
  if (clean.includes('LINK')) return 'BINANCE:LINKUSDT';
  if (clean.includes('BNB')) return 'BINANCE:BNBUSDT';
  
  // Shares & Equities
  if (['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'AMD', 'NFLX', 'INTC'].includes(clean)) {
    return `NASDAQ:${clean}`;
  }
  
  // Commodities & Metals
  if (clean.includes('XAU') || clean.includes('GOLD')) return 'OANDA:XAUUSD';
  if (clean.includes('XAG') || clean.includes('SILVER')) return 'OANDA:XAGUSD';
  if (clean.includes('OIL') || clean.includes('WTI') || clean.includes('XTI')) return 'OANDA:WTICOUSD';
  
  // Indices
  if (clean.includes('500') || clean.includes('SPX')) return 'FOREXCOM:SPXUSD';
  if (clean.includes('30') || clean.includes('DJI') || clean.includes('DOW')) return 'FOREXCOM:DJI';
  if (clean.includes('100') || clean.includes('NAS')) return 'FOREXCOM:NAS100';
  if (clean.includes('GER') || clean.includes('DAX')) return 'FOREXCOM:GER40';
  if (clean.includes('UK100') || clean.includes('FTSE')) return 'FOREXCOM:UK100';

  return `FX:${clean}`;
}

export default function TradingViewWidget({
  symbol = 'EURUSD',
  theme = 'dark',
  height = 420
}: TradingViewWidgetProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartTheme, setChartTheme] = useState<'light' | 'dark'>(theme);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const tvSymbol = getTradingViewSymbol(symbol);

  // Safe direct iframe embed URL (does not require cross-origin script injection into host DOM)
  const embedConfig = {
    autosize: true,
    symbol: tvSymbol,
    interval: 'D',
    timezone: 'Etc/UTC',
    theme: chartTheme,
    style: '1',
    locale: 'en',
    enable_publishing: false,
    allow_symbol_change: true,
    calendar: false,
    support_host: 'https://www.tradingview.com',
    hide_side_toolbar: false,
    save_image: true,
    studies: ['STD;SMA', 'STD;RSI']
  };

  const iframeSrc = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(tvSymbol)}&interval=D&symboledit=1&saveimage=1&toolbarbg=${chartTheme === 'dark' ? '131722' : 'f1f3f6'}&theme=${chartTheme}&style=1&timezone=Etc%2FUTC&locale=en&utm_source=tradingview.com#${encodeURIComponent(JSON.stringify(embedConfig))}`;

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#0E131B] shadow-sm flex flex-col ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen p-4 bg-slate-950' : 'h-full'
    }`}>
      {/* TradingView Header Toolbar */}
      <div className={`px-4 py-2 border-b flex items-center justify-between text-xs font-bold shrink-0 ${
        chartTheme === 'dark' ? 'bg-[#141B26] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#E3000F]" />
          <span className="font-extrabold uppercase tracking-wider">TradingView Advanced Chart</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
            {tvSymbol}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Reload / Refresh */}
          <button
            onClick={() => {
              setIsLoading(true);
              setReloadKey(prev => prev + 1);
            }}
            className={`p-1.5 rounded-md border transition cursor-pointer ${
              chartTheme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:text-black'
            }`}
            title="Reload Chart"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => {
              setIsLoading(true);
              setChartTheme(prev => prev === 'light' ? 'dark' : 'light');
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${
              chartTheme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {chartTheme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 rounded-md border transition cursor-pointer ${
              chartTheme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:text-black'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* TradingView Chart Embed Container */}
      <div 
        className="w-full relative flex-1 min-h-[360px]" 
        style={{ height: isFullscreen ? 'calc(100vh - 60px)' : (typeof height === 'number' ? `${height}px` : height) }}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-[#0B0F17] flex flex-col items-center justify-center gap-3 z-10">
            <RefreshCw className="w-6 h-6 text-[#E3000F] animate-spin" />
            <span className="text-xs text-slate-400 font-mono">Loading TradingView feed for {symbol}...</span>
          </div>
        )}

        <iframe
          key={`${tvSymbol}-${chartTheme}-${reloadKey}`}
          src={iframeSrc}
          title={`TradingView Chart - ${tvSymbol}`}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          allow="transparency"
          loading="lazy"
        />
      </div>
    </div>
  );
}
