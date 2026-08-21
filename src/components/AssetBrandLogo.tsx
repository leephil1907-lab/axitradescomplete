import React from 'react';

interface AssetBrandLogoProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AssetBrandLogo({ symbol, size = 'md', className = '' }: AssetBrandLogoProps) {
  const cleanSym = (symbol || '').toUpperCase().trim();
  const baseSym = cleanSym
    .replace('/USD', '')
    .replace('USDT', '')
    .replace('USD', '')
    .replace('/EUR', '')
    .replace('/GBP', '')
    .replace('/JPY', '')
    .trim();

  let sizeClasses = 'w-9 h-9 text-xs';
  let iconSize = 'w-5 h-5';
  if (size === 'sm') {
    sizeClasses = 'w-7 h-7 text-[10px]';
    iconSize = 'w-4 h-4';
  } else if (size === 'lg') {
    sizeClasses = 'w-11 h-11 text-sm';
    iconSize = 'w-6 h-6';
  }

  // -------------------------------------------------------------
  // 1. CRYPTOCURRENCIES
  // -------------------------------------------------------------
  if (baseSym === 'BTC' || cleanSym === 'BTCUSD' || cleanSym === 'BTCUSDT' || cleanSym === 'BITCOIN') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#F7931A] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-[#e8850d] ${className}`} title="Bitcoin">
        <svg className={iconSize} viewBox="0 0 32 32" fill="currentColor">
          <path d="M23.188 12.57c.338-2.262-1.385-3.479-3.743-4.292l.765-3.067-1.866-.466-.745 2.986c-.49-.122-.993-.238-1.493-.35l.75-3.007-1.866-.466-.765 3.064c-.407-.093-.812-.185-1.207-.282l.002-.01-2.574-.643-.497 1.993s1.385.318 1.356.338c.756.189.893.69.87.1.088l-.872 3.498c.052.013.12.032.195.061l-.198-.049-1.222 4.9c-.092.228-.328.57-.857.439.019.027-1.356-.339-1.356-.339l-.927 2.138 2.43.606c.452.113.895.231 1.332.342l-.772 3.102 1.865.466.766-3.072c.508.138 1.002.264 1.49.382l-.763 3.057 1.866.466.772-3.094c3.181.602 5.573.359 6.579-2.518.811-2.316-.04-3.652-1.716-4.522 1.221-.282 2.141-1.084 2.387-2.738zm-4.269 5.972c-.577 2.318-4.478 1.065-5.742.75l1.024-4.106c1.265.316 5.312.942 4.718 3.356zm.577-5.992c-.526 2.107-3.774.964-4.827.701l.928-3.722c1.053.263 4.437.755 3.899 3.021z" />
        </svg>
      </div>
    );
  }

  if (baseSym === 'ETH' || cleanSym === 'ETHUSD' || cleanSym === 'ETHUSDT' || cleanSym === 'ETHEREUM') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#627EEA] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-[#4e68d1] ${className}`} title="Ethereum">
        <svg className={iconSize} viewBox="0 0 32 32" fill="currentColor">
          <path opacity=".6" d="M16 4v8.87l7.5 3.35z"/>
          <path d="M16 4L8.5 16.22l7.5-3.35z"/>
          <path opacity=".6" d="M16 21.968v6.027l7.505-10.332z"/>
          <path d="M16 27.995v-6.028L8.5 17.663z"/>
          <path opacity=".2" d="M16 20.573l7.5-4.353L16 12.87z"/>
          <path opacity=".6" d="M8.5 16.22l7.5 4.353V12.87z"/>
        </svg>
      </div>
    );
  }

  if (baseSym === 'SOL' || cleanSym === 'SOLUSD' || cleanSym === 'SOLUSDT' || cleanSym === 'SOLANA') {
    return (
      <div className={`${sizeClasses} rounded-full bg-gradient-to-tr from-[#9945FF] via-[#7000FF] to-[#14F195] text-white font-black flex items-center justify-center shadow-sm shrink-0 ${className}`} title="Solana">
        <svg className={iconSize} viewBox="0 0 32 32" fill="currentColor">
          <path d="M7.2 21.6a.6.6 0 0 1 .42-.18h18.33a.3.3 0 0 1 .21.51l-3.36 3.36a.6.6 0 0 1-.42.18H4.05a.3.3 0 0 1-.21-.51l3.36-3.36zM7.2 6.52a.6.6 0 0 1 .42-.18h18.33a.3.3 0 0 1 .21.51l-3.36 3.36a.6.6 0 0 1-.42.18H4.05a.3.3 0 0 1-.21-.51l3.36-3.36zm17.6 7.54a.6.6 0 0 1-.42.18H6.05a.3.3 0 0 1-.21-.51l3.36-3.36a.6.6 0 0 1 .42-.18h18.33a.3.3 0 0 1 .21.51l-3.36 3.36z" />
        </svg>
      </div>
    );
  }

  if (baseSym === 'XRP' || cleanSym === 'XRPUSD' || cleanSym === 'XRPUSDT' || cleanSym === 'RIPPLE') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#23292F] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-slate-700 ${className}`} title="XRP Ripple">
        <svg className={iconSize} viewBox="0 0 32 32" fill="currentColor">
          <path d="M22.97 7h2.86l-6.85 6.82 2.3 2.31 4.55-4.55v2.86l-2.27 2.27L26 19.16V25h-2.86l-6.83-6.82L9.48 25H6.62l6.83-6.82-2.31-2.31L6.6 20.42V17.56l2.27-2.27L6 12.84V7h2.86l6.83 6.82L22.97 7z" />
        </svg>
      </div>
    );
  }

  if (baseSym === 'DOGE' || cleanSym === 'DOGEUSD' || cleanSym === 'DOGEUSDT' || cleanSym === 'DOGECOIN') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#C2A633] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-[#a88f28] ${className}`} title="Dogecoin">
        <span className="font-black text-sm tracking-tighter">Ð</span>
      </div>
    );
  }

  if (baseSym === 'BNB' || cleanSym === 'BNBUSD' || cleanSym === 'BNBUSDT' || cleanSym === 'BINANCECOIN') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#F3BA2F] text-slate-950 font-black flex items-center justify-center shadow-sm shrink-0 ${className}`} title="BNB">
        <svg className={iconSize} viewBox="0 0 32 32" fill="currentColor">
          <path d="M16 5l4.5 4.5-2.1 2.1L16 9.2l-2.4 2.4-2.1-2.1L16 5zm-8.5 8.5l2.1-2.1 2.4 2.4-2.4 2.4-2.1-2.7zm17 0l-2.1-2.7-2.4 2.4 2.4 2.4 2.1-2.1zM16 13.5l2.4 2.4-2.4 2.4-2.4-2.4 2.4-2.4zm-4.5 4.5l-2.4 2.4-2.1-2.1 4.5-4.5 2.1 2.1-2.1 2.1zm9 0l-2.1-2.1 2.1-2.1 4.5 4.5-2.1 2.1-2.4-2.4zM16 22.5l-2.4-2.4 2.1-2.1 2.4 2.4-2.1 2.1z"/>
        </svg>
      </div>
    );
  }

  if (baseSym === 'ADA' || cleanSym === 'ADAUSD' || cleanSym === 'ADAUSDT' || cleanSym === 'CARDANO') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#0033AD] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-[#002888] ${className}`} title="Cardano">
        <svg className={iconSize} viewBox="0 0 32 32" fill="currentColor">
          <circle cx="16" cy="16" r="3"/>
          <circle cx="16" cy="7" r="1.5"/>
          <circle cx="16" cy="25" r="1.5"/>
          <circle cx="7" cy="16" r="1.5"/>
          <circle cx="25" cy="16" r="1.5"/>
        </svg>
      </div>
    );
  }

  if (baseSym === 'AVAX' || cleanSym === 'AVAXUSD' || cleanSym === 'AVAXUSDT' || cleanSym === 'AVALANCHE') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#E84142] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-[#c93031] ${className}`} title="Avalanche">
        <svg className={iconSize} viewBox="0 0 32 32" fill="currentColor">
          <path d="M19.78 17.06l-2.65-4.57a1.32 1.32 0 00-2.29 0l-2.65 4.57a1.32 1.32 0 000 1.32l2.65 4.57a1.32 1.32 0 002.29 0l2.65-4.57a1.32 1.32 0 000-1.32zM8 24h16l-8-14-8 14z"/>
        </svg>
      </div>
    );
  }

  if (baseSym === 'DOT' || cleanSym === 'DOTUSD' || cleanSym === 'DOTUSDT' || cleanSym === 'POLKADOT') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#E6007A] text-white font-black flex items-center justify-center shadow-sm shrink-0 ${className}`} title="Polkadot">
        <span className="font-mono font-black text-xs">P.</span>
      </div>
    );
  }

  if (baseSym === 'LINK' || cleanSym === 'LINKUSD' || cleanSym === 'LINKUSDT' || cleanSym === 'CHAINLINK') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#375BD2] text-white font-black flex items-center justify-center shadow-sm shrink-0 ${className}`} title="Chainlink">
        <svg className={iconSize} viewBox="0 0 32 32" fill="currentColor">
          <path d="M16 4l-9.5 5.5v11L16 26l9.5-5.5v-11L16 4zm6.5 14.5L16 22.3l-6.5-3.8v-7.5L16 7.2l6.5 3.8v7.5z"/>
        </svg>
      </div>
    );
  }

  if (baseSym === 'LTC' || cleanSym === 'LTCUSD' || cleanSym === 'LTCUSDT' || cleanSym === 'LITECOIN') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#345D9D] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-[#27487e] ${className}`} title="Litecoin">
        <span className="font-serif font-black text-sm">Ł</span>
      </div>
    );
  }

  if (baseSym === 'TRX' || cleanSym === 'TRXUSD' || cleanSym === 'TRON') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#EF0027] text-white font-black flex items-center justify-center shadow-sm shrink-0 ${className}`} title="TRON">
        <span className="font-mono font-black text-xs">TRX</span>
      </div>
    );
  }

  if (baseSym === 'TON' || cleanSym === 'TONUSD' || cleanSym === 'TONCOIN') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#0088CC] text-white font-black flex items-center justify-center shadow-sm shrink-0 ${className}`} title="Toncoin">
        <svg className={iconSize} viewBox="0 0 32 32" fill="currentColor">
          <path d="M11 9.5L18 6l7 3.5-7 11.5L11 9.5zm7 8.5l4.8-8H13.2l4.8 8z"/>
        </svg>
      </div>
    );
  }

  if (baseSym === 'NEAR' || cleanSym === 'NEARUSD') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#000000] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-slate-700 ${className}`} title="NEAR Protocol">
        <span className="font-black text-xs text-emerald-400">N</span>
      </div>
    );
  }

  if (baseSym === 'SUI' || cleanSym === 'SUIUSD') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#4CA3FF] text-white font-black flex items-center justify-center shadow-sm shrink-0 ${className}`} title="Sui">
        <span className="font-black text-xs">SUI</span>
      </div>
    );
  }

  if (baseSym === 'SHIB' || cleanSym === 'SHIBUSD') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#FFA409] text-white font-black flex items-center justify-center shadow-sm shrink-0 ${className}`} title="Shiba Inu">
        <span className="font-black text-xs">SHIB</span>
      </div>
    );
  }

  if (baseSym === 'PEPE' || cleanSym === 'PEPEUSD') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#52B788] text-white font-black flex items-center justify-center shadow-sm shrink-0 ${className}`} title="Pepe">
        <span className="font-black text-xs">🐸</span>
      </div>
    );
  }

  if (baseSym === 'MATIC' || baseSym === 'POL' || cleanSym === 'MATICUSD') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#8247E5] text-white font-black flex items-center justify-center shadow-sm shrink-0 ${className}`} title="Polygon">
        <span className="font-mono font-black text-xs">POL</span>
      </div>
    );
  }

  if (baseSym === 'USDT' || cleanSym.includes('USDT')) {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#26A17B] text-white font-black flex items-center justify-center shadow-sm shrink-0 ${className}`} title="Tether USDT">
        <span className="font-black text-xs tracking-tighter">₮</span>
      </div>
    );
  }

  if (baseSym === 'USDC' || cleanSym.includes('USDC')) {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#2775CA] text-white font-black flex items-center justify-center shadow-sm shrink-0 ${className}`} title="USD Coin">
        <span className="font-mono font-black text-[10px]">USDC</span>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. COMMODITIES & METALS
  // -------------------------------------------------------------
  if (cleanSym.includes('XAU') || cleanSym.includes('GOLD')) {
    return (
      <div className={`${sizeClasses} rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#FFD700] to-[#FFF099] text-slate-950 font-black flex items-center justify-center shadow-sm shrink-0 border border-[#b89524] ${className}`} title="Gold Spot">
        <span className="font-black text-xs tracking-tighter">Au</span>
      </div>
    );
  }

  if (cleanSym.includes('XAG') || cleanSym.includes('SILVER')) {
    return (
      <div className={`${sizeClasses} rounded-full bg-gradient-to-tr from-[#9EA3A8] via-[#E2E8F0] to-[#FFFFFF] text-slate-900 font-black flex items-center justify-center shadow-sm shrink-0 border border-[#94a3b8] ${className}`} title="Silver Spot">
        <span className="font-black text-xs tracking-tighter">Ag</span>
      </div>
    );
  }

  if (cleanSym.includes('OIL') || cleanSym.includes('USO') || cleanSym.includes('WTI') || cleanSym.includes('BRENT')) {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#18181B] text-amber-400 font-black flex items-center justify-center shadow-sm shrink-0 border border-slate-700 ${className}`} title="Crude Oil">
        <span className="font-black text-xs">🛢️</span>
      </div>
    );
  }

  if (cleanSym.includes('GAS') || cleanSym.includes('NATGAS')) {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#0284C7] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-sky-400 ${className}`} title="Natural Gas">
        <span className="font-black text-xs">🔥</span>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. FOREX PAIRS
  // -------------------------------------------------------------
  if (cleanSym === 'EURUSD' || cleanSym === 'EUR/USD') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#003399] text-[#FFCC00] font-black flex items-center justify-center shadow-sm shrink-0 border border-[#002266] ${className}`} title="EUR/USD">
        <span className="font-black text-[11px] tracking-tight">€$</span>
      </div>
    );
  }
  if (cleanSym === 'GBPUSD' || cleanSym === 'GBP/USD') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#012169] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-[#001440] ${className}`} title="GBP/USD">
        <span className="font-black text-[11px] text-[#C8102E] tracking-tight">£$</span>
      </div>
    );
  }
  if (cleanSym === 'USDJPY' || cleanSym === 'USD/JPY') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#BC002D] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-[#990024] ${className}`} title="USD/JPY">
        <span className="font-black text-[11px] tracking-tight">$¥</span>
      </div>
    );
  }
  if (cleanSym === 'AUDUSD' || cleanSym === 'AUD/USD') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#00008B] text-[#FFD700] font-black flex items-center justify-center shadow-sm shrink-0 border border-[#000066] ${className}`} title="AUD/USD">
        <span className="font-black text-[10px] tracking-tight">A$</span>
      </div>
    );
  }
  if (cleanSym === 'USDCAD' || cleanSym === 'USD/CAD') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#D80027] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-[#b0001f] ${className}`} title="USD/CAD">
        <span className="font-black text-[10px] tracking-tight">C$</span>
      </div>
    );
  }
  if (cleanSym === 'USDCHF' || cleanSym === 'USD/CHF') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#D52B1E] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-[#ab1a0f] ${className}`} title="USD/CHF">
        <span className="font-black text-[10px] tracking-tight">₣$</span>
      </div>
    );
  }
  if (cleanSym === 'NZDUSD' || cleanSym === 'NZD/USD') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#00247D] text-[#CC142B] font-black flex items-center justify-center shadow-sm shrink-0 border border-[#001750] ${className}`} title="NZD/USD">
        <span className="font-black text-[10px] tracking-tight">NZ</span>
      </div>
    );
  }
  if (cleanSym === 'EURGBP' || cleanSym === 'EUR/GBP') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#1e293b] text-[#38bdf8] font-black flex items-center justify-center shadow-sm shrink-0 border border-slate-700 ${className}`} title="EUR/GBP">
        <span className="font-black text-[10px] tracking-tight">€£</span>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. INDICES
  // -------------------------------------------------------------
  if (cleanSym === 'US30' || cleanSym === 'DOW' || cleanSym === 'DJI') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#0F172A] text-brand-yellow font-black flex items-center justify-center shadow-sm shrink-0 border border-slate-700 ${className}`} title="Dow Jones 30">
        <span className="font-mono font-black text-[10px]">US30</span>
      </div>
    );
  }
  if (cleanSym === 'SPX500' || cleanSym === 'SP500' || cleanSym === 'US500') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#1E293B] text-emerald-400 font-black flex items-center justify-center shadow-sm shrink-0 border border-slate-700 ${className}`} title="S&P 500">
        <span className="font-mono font-black text-[9px]">SP500</span>
      </div>
    );
  }
  if (cleanSym === 'NAS100' || cleanSym === 'USTEC' || cleanSym === 'NASDAQ') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#0284C7] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-[#0369a1] ${className}`} title="Nasdaq 100">
        <span className="font-mono font-black text-[9px]">NAS10</span>
      </div>
    );
  }
  if (cleanSym === 'UK100' || cleanSym === 'FTSE100' || cleanSym === 'FTSE') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#1e1b4b] text-[#38bdf8] font-black flex items-center justify-center shadow-sm shrink-0 border border-slate-700 ${className}`} title="UK FTSE 100">
        <span className="font-mono font-black text-[9px]">UK100</span>
      </div>
    );
  }
  if (cleanSym === 'GER40' || cleanSym === 'DAX40' || cleanSym === 'DAX') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#18181B] text-amber-400 font-black flex items-center justify-center shadow-sm shrink-0 border border-slate-700 ${className}`} title="DAX 40">
        <span className="font-mono font-black text-[9px]">GER40</span>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 5. GLOBAL EQUITIES / SHARES
  // -------------------------------------------------------------
  if (cleanSym === 'AAPL') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#1C1C1E] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-slate-700 ${className}`} title="Apple Inc">
        <svg className={iconSize} viewBox="0 0 32 32" fill="currentColor">
          <path d="M21.5 16.5c0-3.1 2.5-4.6 2.6-4.7-1.4-2.1-3.7-2.4-4.5-2.4-1.9-.2-3.7 1.1-4.7 1.1-.9 0-2.4-1.1-4-1.1-2 0-3.9 1.2-5 3.1-2.1 3.7-.5 9.2 1.5 12.2 1 1.5 2.2 3.1 3.8 3 1.6-.1 2.2-1 4.1-1s2.5 1 4.1 1c1.7 0 2.7-1.5 3.7-3 1.2-1.7 1.7-3.4 1.7-3.5-.1 0-3.3-1.3-3.3-4.8zM18.8 8.2c.8-1 1.4-2.4 1.2-3.8-1.2.1-2.7.8-3.5 1.8-.8.9-1.4 2.3-1.2 3.7 1.3.1 2.7-.7 3.5-1.7z" />
        </svg>
      </div>
    );
  }

  if (cleanSym === 'TSLA') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#E82127] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-[#c4141a] ${className}`} title="Tesla Inc">
        <svg className={iconSize} viewBox="0 0 32 32" fill="currentColor">
          <path d="M16 11.2c-3.1 0-6.1.6-8.5 1.7l-.8-2.2c3.1-1.4 6.1-2 9.3-2 3.2 0 6.2.6 9.3 2l-.8 2.2c-2.4-1.1-5.4-1.7-8.5-1.7zm8.7-4.6c-2.7-.7-5.7-1.1-8.7-1.1-3 0-6 .4-8.7 1.1L6.5 4c2.9-.9 6.2-1.3 9.5-1.3s6.6.4 9.5 1.3l-.8 2.6zM16 13.5l1.6 12.5h-3.2L16 13.5z"/>
        </svg>
      </div>
    );
  }

  if (cleanSym === 'NVDA') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#1A1A1A] text-[#76B900] font-black flex items-center justify-center shadow-sm shrink-0 border border-[#76B900]/40 ${className}`} title="NVIDIA Corp">
        <svg className={iconSize} viewBox="0 0 32 32" fill="currentColor">
          <path d="M22.5 13.2c-2.1-1.3-5-1.8-8.2-1.5-2.2.2-4.1.9-5.6 2-1.1.8-1.8 1.8-2 2.8-.2 1.2.3 2.3 1.3 3.1 1.5 1.2 3.8 1.8 6.5 1.8 3.5 0 6.5-1 8.5-2.8l1.8 2.2c-2.6 2.3-6.2 3.6-10.3 3.6-3.8 0-7.1-1-9.3-2.8-1.8-1.4-2.7-3.2-2.5-5.2.3-2.1 1.6-3.9 3.6-5.2 2.3-1.5 5.3-2.3 8.7-2.5 4.3-.2 8.1.5 11 2l-2.5 2.5z"/>
        </svg>
      </div>
    );
  }

  if (cleanSym === 'MSFT') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#111827] text-white font-black flex items-center justify-center p-1 shadow-sm shrink-0 border border-slate-700 ${className}`} title="Microsoft">
        <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
          <div className="bg-[#F25022] rounded-[1px]"></div>
          <div className="bg-[#7FBA00] rounded-[1px]"></div>
          <div className="bg-[#00A4EF] rounded-[1px]"></div>
          <div className="bg-[#FFB900] rounded-[1px]"></div>
        </div>
      </div>
    );
  }

  if (cleanSym === 'AMZN') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#141923] text-[#FF9900] font-black flex items-center justify-center shadow-sm shrink-0 border border-slate-700 ${className}`} title="Amazon">
        <span className="font-serif font-black text-xs text-white">a<span className="text-[#FF9900]">z</span></span>
      </div>
    );
  }

  if (cleanSym === 'GOOGL' || cleanSym === 'GOOG') {
    return (
      <div className={`${sizeClasses} rounded-full bg-white text-slate-900 font-black flex items-center justify-center shadow-sm shrink-0 border border-slate-200 ${className}`} title="Google">
        <span className="font-sans font-black text-sm text-[#4285F4]">G</span>
      </div>
    );
  }

  if (cleanSym === 'META') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#0668E1] text-white font-black flex items-center justify-center shadow-sm shrink-0 ${className}`} title="Meta">
        <svg className={iconSize} viewBox="0 0 32 32" fill="currentColor">
          <path d="M22.5 9c-2.3 0-4.3 1.2-5.7 3.1C15.4 10.2 13.4 9 11.1 9 7.2 9 4 12.1 4 16s3.2 7 7.1 7c2.3 0 4.3-1.2 5.7-3.1 1.4 1.9 3.4 3.1 5.7 3.1 3.9 0 7.1-3.1 7.1-7s-3.2-7-7.1-7zm-11.4 11c-2.3 0-4.1-1.8-4.1-4s1.8-4 4.1-4c1.7 0 3.2 1 3.8 2.5-.2.5-.4 1-.4 1.5s.2 1 .4 1.5c-.6 1.5-2.1 2.5-3.8 2.5zm11.4 0c-1.7 0-3.2-1-3.8-2.5.2-.5.4-1 .4-1.5s-.2-1-.4-1.5c.6-1.5 2.1-2.5 3.8-2.5 2.3 0 4.1 1.8 4.1 4s-1.8 4-4.1 4z"/>
        </svg>
      </div>
    );
  }

  if (cleanSym === 'AMD') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#000000] text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-slate-700 ${className}`} title="AMD">
        <span className="font-mono font-black text-[10px] tracking-tighter">AMD</span>
      </div>
    );
  }

  if (cleanSym === 'NFLX') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#000000] text-[#E50914] font-black flex items-center justify-center shadow-sm shrink-0 border border-slate-700 ${className}`} title="Netflix">
        <span className="font-black text-sm">N</span>
      </div>
    );
  }

  if (cleanSym === 'COIN') {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#0052FF] text-white font-black flex items-center justify-center shadow-sm shrink-0 ${className}`} title="Coinbase">
        <span className="font-sans font-black text-xs">C</span>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DEFAULT SMART LOGO FALLBACK
  // -------------------------------------------------------------
  const displayLetters = baseSym.length >= 3 ? baseSym.substring(0, 3) : baseSym;
  const hash = cleanSym.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorSchemes = [
    'bg-slate-900 border-slate-700 text-white',
    'bg-indigo-950 border-indigo-700 text-indigo-200',
    'bg-sky-950 border-sky-700 text-sky-200',
    'bg-emerald-950 border-emerald-700 text-emerald-200',
    'bg-amber-950 border-amber-700 text-amber-200',
    'bg-rose-950 border-rose-700 text-rose-200'
  ];
  const chosenColor = colorSchemes[hash % colorSchemes.length];

  return (
    <div className={`${sizeClasses} rounded-full font-black flex items-center justify-center shadow-sm shrink-0 border ${chosenColor} ${className}`}>
      <span className="font-mono text-[10px] tracking-tighter uppercase">{displayLetters}</span>
    </div>
  );
}
