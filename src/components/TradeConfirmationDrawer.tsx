import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Zap, ShieldCheck, DollarSign, Layers, Percent, Sliders, Users, Loader2 } from 'lucide-react';

export interface TradeOrderSummary {
  symbol: string;
  type: 'BUY' | 'SELL';
  price: number;
  volume: number;
  accountMode: 'demo' | 'live';
}

interface TradeConfirmationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: TradeOrderSummary | null;
  onConfirmTrade: (finalOrder: {
    symbol: string;
    type: 'BUY' | 'SELL';
    price: number;
    volume: number;
    stopLoss?: number;
    takeProfit?: number;
    leverage: string;
  }) => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function TradeConfirmationDrawer({
  isOpen,
  onClose,
  orderData,
  onConfirmTrade,
  showToast
}: TradeConfirmationDrawerProps) {
  const [volume, setVolume] = useState<number>(1.0);
  const [leverage, setLeverage] = useState<string>('1:1000');
  const [enableSL, setEnableSL] = useState<boolean>(false);
  const [stopLossPrice, setStopLossPrice] = useState<string>('');
  const [enableTP, setEnableTP] = useState<boolean>(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Live market sentiment (fetched from backend — no fabricated data)
  const [sentiment, setSentiment] = useState<{
    live: boolean;
    long: number | null;
    short: number | null;
    activePositions?: number | null;
    source?: string;
    note?: string;
    loading: boolean;
  }>({ live: false, long: null, short: null, activePositions: null, source: '', note: '', loading: true });

  useEffect(() => {
    if (!orderData?.symbol) return;
    let cancelled = false;
    setSentiment(s => ({ ...s, loading: true }));
    fetch(`/api/sentiment/${encodeURIComponent(orderData.symbol)}`)
      .then(r => r.json())
      .then(j => {
        if (cancelled) return;
        setSentiment({
          live: !!j?.live,
          long: j?.long ?? null,
          short: j?.short ?? null,
          activePositions: j?.activePositions ?? null,
          source: j?.source || '',
          note: j?.note || '',
          loading: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSentiment({ live: false, long: null, short: null, activePositions: null, source: '', note: '', loading: false });
      });
    return () => { cancelled = true; };
  }, [orderData?.symbol]);

  // Sync state when orderData changes
  useEffect(() => {
    if (orderData) {
      setVolume(orderData.volume || 1.0);
      const isJpy = orderData.symbol.includes('JPY');
      const isForex = !orderData.symbol.includes('BTC') && !orderData.symbol.includes('XAU');
      const pipMultiplier = isJpy ? 0.01 : isForex ? 0.0001 : 1.0;
      
      // Default SL 30 pips away, TP 60 pips away
      if (orderData.type === 'BUY') {
        setStopLossPrice((orderData.price - (30 * pipMultiplier)).toFixed(isJpy ? 2 : isForex ? 5 : 2));
        setTakeProfitPrice((orderData.price + (60 * pipMultiplier)).toFixed(isJpy ? 2 : isForex ? 5 : 2));
      } else {
        setStopLossPrice((orderData.price + (30 * pipMultiplier)).toFixed(isJpy ? 2 : isForex ? 5 : 2));
        setTakeProfitPrice((orderData.price - (60 * pipMultiplier)).toFixed(isJpy ? 2 : isForex ? 5 : 2));
      }
    }
  }, [orderData]);

  if (!isOpen || !orderData) return null;

  const isBuy = orderData.type === 'BUY';
  const priceDigits = orderData.symbol.includes('JPY') ? 2 : orderData.symbol.includes('USD') && !orderData.symbol.includes('BTC') && !orderData.symbol.includes('XAU') ? 5 : 2;
  
  // Calculate estimated required margin
  const levRatio = parseInt(leverage.split(':')[1] || '1000', 10);
  const contractSize = orderData.symbol.includes('BTC') ? 1 : orderData.symbol.includes('XAU') ? 100 : 100000;
  const estimatedNotional = volume * orderData.price * contractSize;
  const requiredMargin = (estimatedNotional / levRatio).toFixed(2);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (volume <= 0) {
      if (showToast) showToast('Please specify a valid trade lot volume.', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmTrade({
        symbol: orderData.symbol,
        type: orderData.type,
        price: orderData.price,
        volume: Number(volume),
        stopLoss: enableSL && stopLossPrice ? parseFloat(stopLossPrice) : undefined,
        takeProfit: enableTP && takeProfitPrice ? parseFloat(takeProfitPrice) : undefined,
        leverage
      });
      setIsSubmitting(false);
      onClose();
    }, 350);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        />

        {/* Slide-in Drawer Container */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl border font-black text-xs flex items-center gap-1 ${
                isBuy 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              }`}>
                {isBuy ? <ArrowUpRight className="w-5 h-5 text-emerald-400" /> : <ArrowDownRight className="w-5 h-5 text-rose-400" />}
                <span>{orderData.type}</span>
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wide text-white flex items-center gap-2">
                  <span>{orderData.symbol} Order Confirmation</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Verify parameters before NY4 ECN matching
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Form */}
          <form onSubmit={handleConfirm} className="flex-1 overflow-y-auto p-5 space-y-5">
            
            {/* Price HUD Banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isBuy 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-300'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 block">
                  Est. Market Entry Price
                </span>
                <span className="text-xl font-mono font-black">
                  {orderData.price.toFixed(priceDigits)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 block">
                  Server Routing
                </span>
                <span className="text-xs font-bold uppercase bg-slate-800 text-white px-2 py-0.5 rounded font-mono">
                  {orderData.accountMode === 'demo' ? 'Axi-Demo-NY4' : 'Axi-Live-ECN'}
                </span>
              </div>
            </div>

            {/* Community Market Sentiment Indicator */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
                  <Users className="w-4 h-4 text-[#E3000F]" />
                  <span>Market Sentiment</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  sentiment.live
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {sentiment.loading ? 'Loading…' : sentiment.live ? (sentiment.source || 'Live') : 'Unavailable'}
                </span>
              </div>

              {sentiment.loading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching live sentiment…
                </div>
              ) : sentiment.live && sentiment.long != null && sentiment.short != null ? (
                <>
                  {/* Long vs Short Percentage Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-extrabold font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" /> {sentiment.long}% LONG
                      </span>
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        {sentiment.short}% SHORT <ArrowDownRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Dual Progress Ratio Bar */}
                    <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${sentiment.long}%` }} 
                        className="bg-emerald-500 transition-all duration-500 rounded-l-full" 
                      />
                      <div 
                        style={{ width: `${sentiment.short}%` }} 
                        className="bg-rose-500 transition-all duration-500 rounded-r-full" 
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>{sentiment.source ? 'Est. directional bias' : 'Platform Trader Positioning'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {sentiment.long >= 60 ? '🔥 Bullish Bias' : sentiment.long <= 40 ? '⚡ Bearish Bias' : '⚖️ Neutral Distribution'}
                    </span>
                  </div>
                  {sentiment.note && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed pt-1">{sentiment.note}</p>
                  )}
                </>
              ) : (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed py-1">
                  Live broker sentiment is currently unavailable. No fabricated positioning data is shown — only real, provider-backed sentiment is displayed when a data feed is connected.
                </div>
              )}
            </div>

            {/* Parameter 1: Volume (Lots) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  Trade Volume (Lots)
                </label>
                <span className="text-slate-500 font-mono text-[11px]">
                  {volume} Lot = {(volume * contractSize).toLocaleString()} Units
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="50"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value) || 0.01)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E3000F]"
                  required
                />

                <div className="flex items-center gap-1">
                  {[0.1, 0.5, 1.0, 2.0].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVolume(v)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                        volume === v 
                          ? 'bg-[#E3000F] text-white border-[#E3000F]' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Parameter 2: Leverage Selection */}
            <div className="space-y-2">
              <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold block">
                Execution Margin Leverage
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['1:100', '1:200', '1:500', '1:1000'].map(lev => (
                  <button
                    key={lev}
                    type="button"
                    onClick={() => setLeverage(lev)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-bold border text-center transition cursor-pointer ${
                      leverage === lev
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {lev}
                  </button>
                ))}
              </div>
            </div>

            {/* Parameter 3 & 4: Optional Stop Loss & Take Profit */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Risk Management (SL & TP)</span>
                <span className="text-[10px] text-slate-400 font-normal">Optional</span>
              </div>

              {/* Stop Loss Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-rose-600 dark:text-rose-400">
                    <input
                      type="checkbox"
                      checked={enableSL}
                      onChange={(e) => setEnableSL(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Stop Loss (SL)</span>
                  </label>
                  {enableSL && (
                    <span className="text-[10px] font-mono text-slate-400">
                      Target Exit Level
                    </span>
                  )}
                </div>

                {enableSL && (
                  <input
                    type="number"
                    step="any"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(e.target.value)}
                    placeholder="Set Stop Loss Price"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                )}
              </div>

              {/* Take Profit Field */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <input
                      type="checkbox"
                      checked={enableTP}
                      onChange={(e) => setEnableTP(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Take Profit (TP)</span>
                  </label>
                  {enableTP && (
                    <span className="text-[10px] font-mono text-slate-400">
                      Target Target Level
                    </span>
                  )}
                </div>

                {enableTP && (
                  <input
                    type="number"
                    step="any"
                    value={takeProfitPrice}
                    onChange={(e) => setTakeProfitPrice(e.target.value)}
                    placeholder="Set Take Profit Price"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                )}
              </div>
            </div>

            {/* Financial Summary Calculation Table */}
            <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Estimated Required Margin:</span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                  ${requiredMargin} USD
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Spread (Raw ECN):</span>
                <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                  0.1 Pips
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Brokerage Commission:</span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                  $0.00 (Zero Fee)
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Execution Speed:</span>
                <span className="font-mono font-bold text-[#E3000F] flex items-center gap-1">
                  <Zap className="w-3 h-3" /> &lt; 1.5ms
                </span>
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 px-4 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
                  isBuy 
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' 
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                }`}
              >
                {isSubmitting ? (
                  <span>Transmitting to ECN...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Execute {orderData.type} {volume} Lot</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold text-xs transition cursor-pointer text-center"
              >
                Discard Order
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
