import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, ArrowDown, ArrowUpDown, CheckCircle2, ShieldCheck, Zap, DollarSign, TrendingUp } from 'lucide-react';
import { DEFAULT_MARKET_QUOTES } from '../data';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotes?: Record<string, any>;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  liveBalance: number;
  setLiveBalance: React.Dispatch<React.SetStateAction<number>>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const ASSET_LIST = [
  { code: 'USD', name: 'US Dollar', type: 'fiat', priceUsd: 1.0 },
  { code: 'EUR', name: 'Euro', type: 'fiat', symbol: 'EURUSD' },
  { code: 'GBP', name: 'British Pound', type: 'fiat', symbol: 'GBPUSD' },
  { code: 'BTC', name: 'Bitcoin', type: 'crypto', symbol: 'BTCUSD' },
  { code: 'ETH', name: 'Ethereum', type: 'crypto', symbol: 'ETHUSD' },
  { code: 'SOL', name: 'Solana', type: 'crypto', symbol: 'SOLUSD' },
  { code: 'XRP', name: 'Ripple XRP', type: 'crypto', symbol: 'XRPUSD' },
  { code: 'XAU', name: 'Gold Spot', type: 'commodity', symbol: 'XAUUSD' },
  { code: 'AAPL', name: 'Apple Inc.', type: 'stock', symbol: 'AAPL' },
  { code: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', symbol: 'NVDA' },
  { code: 'TSLA', name: 'Tesla Inc.', type: 'stock', symbol: 'TSLA' },
];

export default function SwapModal({
  isOpen,
  onClose,
  quotes = {},
  balance,
  setBalance,
  liveBalance,
  setLiveBalance,
  showToast
}: SwapModalProps) {
  const [fromAssetCode, setFromAssetCode] = useState('USD');
  const [toAssetCode, setToAssetCode] = useState('BTC');
  const [fromAmount, setFromAmount] = useState<string>('500');
  const [isSwapping, setIsSwapping] = useState(false);

  // Helper function to get live USD price for any asset
  const getUsdPrice = (code: string): number => {
    if (code === 'USD') return 1.0;
    const item = ASSET_LIST.find(a => a.code === code);
    if (!item) return 1.0;

    if (item.symbol && quotes[item.symbol]?.price) {
      return quotes[item.symbol].price;
    }

    // Fallbacks
    switch (code) {
      case 'EUR': return quotes['EURUSD']?.price || DEFAULT_MARKET_QUOTES['EURUSD']?.price || 1.0482;
      case 'GBP': return quotes['GBPUSD']?.price || DEFAULT_MARKET_QUOTES['GBPUSD']?.price || 1.2590;
      case 'BTC': return quotes['BTCUSD']?.price || DEFAULT_MARKET_QUOTES['BTCUSD']?.price || 96450.00;
      case 'ETH': return quotes['ETHUSD']?.price || DEFAULT_MARKET_QUOTES['ETHUSD']?.price || 2740.50;
      case 'SOL': return quotes['SOLUSD']?.price || DEFAULT_MARKET_QUOTES['SOLUSD']?.price || 188.40;
      case 'XRP': return quotes['XRPUSD']?.price || DEFAULT_MARKET_QUOTES['XRPUSD']?.price || 2.385;
      case 'XAU': return quotes['XAUUSD']?.price || DEFAULT_MARKET_QUOTES['XAUUSD']?.price || 2915.40;
      case 'AAPL': return quotes['AAPL']?.price || DEFAULT_MARKET_QUOTES['AAPL']?.price || 232.40;
      case 'NVDA': return quotes['NVDA']?.price || DEFAULT_MARKET_QUOTES['NVDA']?.price || 138.85;
      case 'TSLA': return quotes['TSLA']?.price || DEFAULT_MARKET_QUOTES['TSLA']?.price || 248.50;
      default: return 1.0;
    }
  };

  const fromPriceUsd = getUsdPrice(fromAssetCode);
  const toPriceUsd = getUsdPrice(toAssetCode);

  // Calculate Exchange Rate: From -> To
  const exchangeRate = useMemo(() => {
    if (!toPriceUsd || toPriceUsd === 0) return 0;
    return fromPriceUsd / toPriceUsd;
  }, [fromPriceUsd, toPriceUsd]);

  // Estimated Received Amount
  const calculatedToAmount = useMemo(() => {
    const num = parseFloat(fromAmount) || 0;
    const result = num * exchangeRate;
    return result;
  }, [fromAmount, exchangeRate]);

  if (!isOpen) return null;

  const handleInvertAssets = () => {
    const temp = fromAssetCode;
    setFromAssetCode(toAssetCode);
    setToAssetCode(temp);
  };

  const handleExecuteSwap = () => {
    const amountVal = parseFloat(fromAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      showToast('Please enter a valid swap amount.', 'error');
      return;
    }

    // If swapping from USD, check balance
    if (fromAssetCode === 'USD' && amountVal > liveBalance) {
      showToast(`Insufficient USD balance. Your live balance is $${liveBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`, 'error');
      return;
    }

    setIsSwapping(true);

    setTimeout(() => {
      setIsSwapping(false);

      // Value in USD converted
      const usdValue = amountVal * fromPriceUsd;

      if (fromAssetCode === 'USD') {
        // Spent USD
        setLiveBalance(prev => Math.max(0, prev - usdValue));
        setBalance(prev => Math.max(0, prev - usdValue));
      } else if (toAssetCode === 'USD') {
        // Received USD
        setLiveBalance(prev => prev + usdValue);
        setBalance(prev => prev + usdValue);
      }

      const receivedFormatted = calculatedToAmount.toLocaleString(undefined, {
        minimumFractionDigits: toAssetCode === 'BTC' || toAssetCode === 'ETH' ? 4 : 2,
        maximumFractionDigits: toAssetCode === 'BTC' || toAssetCode === 'ETH' ? 6 : 4
      });

      showToast(
        `⚡ Instant Swap Executed! Converted ${amountVal} ${fromAssetCode} → ${receivedFormatted} ${toAssetCode} @ Live Market Rate`,
        'success'
      );

      onClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Swap Terminal Box */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#E3000F] to-amber-600 text-white shadow-md">
                <ArrowUpDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-1.5 text-white">
                  Axi Instant Asset Swap <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0.5 rounded uppercase font-mono">0% Fee</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Real-time liquidity converter across Stocks, Forex & Crypto</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4">
            
            {/* FROM ASSET BOX */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-bold">
                <span>YOU PAY</span>
                {fromAssetCode === 'USD' && (
                  <span>Balance: <strong className="text-white font-mono">${liveBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent text-2xl font-black font-mono text-white w-full outline-none placeholder:text-slate-600"
                />

                <select 
                  value={fromAssetCode}
                  onChange={(e) => setFromAssetCode(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white font-black text-xs px-3 py-2.5 rounded-xl outline-none cursor-pointer hover:bg-slate-700 transition"
                >
                  {ASSET_LIST.map(a => (
                    <option key={a.code} value={a.code} className="bg-slate-900 text-white">
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[10px] font-mono text-slate-500 flex justify-between pt-1 border-t border-slate-800/60">
                <span>Live Price: ${(fromPriceUsd).toLocaleString(undefined, { minimumFractionDigits: fromPriceUsd < 10 ? 4 : 2 })}</span>
                <span>Value: ~${((parseFloat(fromAmount) || 0) * fromPriceUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* INVERT SWAP BUTTON */}
            <div className="flex justify-center -my-2 relative z-20">
              <button 
                onClick={handleInvertAssets}
                className="p-2.5 rounded-full bg-slate-800 hover:bg-[#E3000F] text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer shadow-lg active:scale-95"
                title="Swap Direction"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>

            {/* TO ASSET BOX */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-bold">
                <span>YOU RECEIVE (ESTIMATED)</span>
                <span className="text-emerald-400 font-mono text-[11px] font-bold">Best STP Quote</span>
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="text"
                  readOnly
                  value={calculatedToAmount > 0 ? calculatedToAmount.toLocaleString(undefined, {
                    minimumFractionDigits: toAssetCode === 'BTC' || toAssetCode === 'ETH' ? 4 : 2,
                    maximumFractionDigits: toAssetCode === 'BTC' || toAssetCode === 'ETH' ? 6 : 4
                  }) : '0.00'}
                  className="bg-transparent text-2xl font-black font-mono text-emerald-400 w-full outline-none select-all"
                />

                <select 
                  value={toAssetCode}
                  onChange={(e) => setToAssetCode(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white font-black text-xs px-3 py-2.5 rounded-xl outline-none cursor-pointer hover:bg-slate-700 transition"
                >
                  {ASSET_LIST.map(a => (
                    <option key={a.code} value={a.code} className="bg-slate-900 text-white">
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[10px] font-mono text-slate-500 flex justify-between pt-1 border-t border-slate-800/60">
                <span>Live Price: ${(toPriceUsd).toLocaleString(undefined, { minimumFractionDigits: toPriceUsd < 10 ? 4 : 2 })}</span>
                <span>Rate: 1 {fromAssetCode} = {exchangeRate.toFixed(6)} {toAssetCode}</span>
              </div>
            </div>

            {/* QUICK AMOUNT BUTTONS */}
            <div className="flex gap-2">
              {['100', '250', '500', '1000', '2500'].map(val => (
                <button
                  key={val}
                  onClick={() => setFromAmount(val)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                    fromAmount === val 
                      ? 'bg-[#E3000F] text-white border-[#E3000F]' 
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>

            {/* SWAP EXECUTE BUTTON */}
            <button
              onClick={handleExecuteSwap}
              disabled={isSwapping || parseFloat(fromAmount) <= 0}
              className="w-full bg-gradient-to-r from-[#E3000F] to-amber-600 hover:from-red-700 hover:to-amber-700 disabled:opacity-50 text-white font-black text-xs py-4 rounded-xl uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              {isSwapping ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Routing ECN Swap Order...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Execute Swap ({fromAssetCode} → {toAssetCode})</span>
                </>
              )}
            </button>

            {/* FOOTER GUARANTEE */}
            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" /> Guaranteed STP Execution
              </span>
              <span>Network Fee: $0.00</span>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
