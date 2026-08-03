import React, { useState, useEffect } from 'react';
import { MarketQuote, TradeOrder, ClosedPosition, PriceAlert, ViewType } from '../types';
import { subscribePaymentConfig } from '../services/paymentConfigService';
import RechartsCandlestickChart from './RechartsCandlestickChart';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bell, AlertTriangle, X, Plus, ShieldAlert, ShieldCheck, CheckCircle2, RefreshCw, Zap, ArrowRight, CreditCard, Lock, Info, AlertOctagon, Send, ArrowLeftRight, Repeat, TrendingUp, TrendingDown, DollarSign, Wallet, PlayCircle, Sparkles } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

const MiniQuoteChart = ({ price, change }: { price: number; change: number; symbol: string }) => {
  const isPositive = change >= 0;
  const factor = isPositive ? 0.0015 : -0.0015;

  const data = [
    { tick: 1, val: price * (1 - factor * 2) },
    { tick: 2, val: price * (1 - factor * 1.3 + (isPositive ? -0.0003 : 0.0003)) },
    { tick: 3, val: price * (1 - factor * 0.8) },
    { tick: 4, val: price * (1 - factor * 0.3 + (isPositive ? 0.0002 : -0.0002)) },
    { tick: 5, val: price }
  ];

  const strokeColor = isPositive ? '#10b981' : '#E3000F';

  return (
    <div className="w-16 h-7 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line
            type="monotone"
            dataKey="val"
            stroke={strokeColor}
            strokeWidth={1.8}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const SentimentGauge = ({ symbol, longPercent }: { symbol: string, longPercent: number }) => {
  const shortPercent = 100 - longPercent;
  const radius = 60;
  const circumference = Math.PI * radius;
  const dashoffset = circumference - (longPercent / 100) * circumference;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-full">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-4 w-full text-left">Market Sentiment</div>
      <div className="flex flex-col items-center">
        <div className="relative w-40 h-20 overflow-hidden mb-2">
          <svg className="w-full h-full" viewBox="0 0 140 70">
            <path
              d="M 10 65 A 60 60 0 0 1 130 65"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 10 65 A 60 60 0 0 1 130 65"
              fill="none"
              stroke="#10b981"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center mb-1">
            <span className="text-2xl font-black text-slate-900">{longPercent}%</span>
          </div>
        </div>
        <div className="w-full flex justify-between mt-2 text-[10px] font-bold">
          <div className="flex flex-col items-start">
            <span className="text-brand-red">{shortPercent}%</span>
            <span className="text-slate-400 uppercase tracking-wider">Short</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-emerald-500">{longPercent}%</span>
            <span className="text-slate-400 uppercase tracking-wider">Long</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getAssetSentiment = (symbol: string, change: number) => {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  const baseLong = 52 + (Math.abs(hash) % 31) - 15 + Math.round((change || 0) * 12);
  const longPercent = Math.min(88, Math.max(18, baseLong));
  const shortPercent = 100 - longPercent;
  return { longPercent, shortPercent };
};

const ManageAlertsModal = ({ 
  isOpen, 
  onClose, 
  symbol, 
  currentPrice 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  symbol: string, 
  currentPrice: number 
}) => {
  const [alerts, setAlerts] = useState([
    { id: '1', price: currentPrice * 1.005, condition: 'Above' },
    { id: '2', price: currentPrice * 0.995, condition: 'Below' }
  ]);
  const [newPrice, setNewPrice] = useState('');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-brand-yellow" />
            Manage Alerts
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition cursor-pointer">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {alerts.map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">{symbol} • {a.condition}</span>
                <div className="font-black text-slate-900">{a.price.toFixed(5)}</div>
              </div>
              <button onClick={() => setAlerts(alerts.filter(x => x.id !== a.id))} className="text-slate-400 hover:text-brand-red p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="text-center p-4 text-sm font-bold text-slate-400">No active alerts for {symbol}</div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Add New Alert</h3>
          <div className="flex gap-2">
            <input 
              type="number" 
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder={`Price`}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-brand-red"
            />
            <button 
              onClick={() => {
                if(newPrice) {
                  setAlerts([...alerts, { id: Math.random().toString(), price: Number(newPrice), condition: Number(newPrice) > currentPrice ? 'Above' : 'Below' }]);
                  setNewPrice('');
                }
              }}
              className="bg-brand-red text-white p-2 rounded-lg hover:bg-red-700 transition cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface PreTradeRiskAlertData {
  isOpen: boolean;
  type: 'EXCEEDS_LIMITS' | 'HIGH_UTILIZATION_WARNING';
  accountType: 'live' | 'demo';
  activeBalance: number;
  availableMargin: number;
  requiredMargin: number;
  shortfall: number;
  maxSafeLot: number;
  symbol: string;
  tradeType: 'BUY' | 'SELL';
  lotSize: number;
  leverage: number;
  notional: number;
  executionPrice: number;
}

const PreTradeRiskAlertModal = ({
  data,
  onClose,
  onApplyMaxLot,
  onConfirmTrade,
  onSwitchAccount,
  onQuickDeposit
}: {
  data: PreTradeRiskAlertData | null;
  onClose: () => void;
  onApplyMaxLot: (lot: number) => void;
  onConfirmTrade: () => void;
  onSwitchAccount: () => void;
  onQuickDeposit: () => void;
}) => {
  if (!data || !data.isOpen) return null;

  const isExceeds = data.type === 'EXCEEDS_LIMITS';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
      >
        {/* Banner Header */}
        <div className={`p-5 flex items-center gap-3 text-white ${
          isExceeds ? 'bg-gradient-to-r from-red-600 via-[#E3000F] to-rose-700' : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700'
        }`}>
          <div className="p-2.5 bg-white/20 rounded-xl shrink-0">
            {isExceeds ? <ShieldAlert className="w-7 h-7 text-white animate-bounce" /> : <AlertTriangle className="w-7 h-7 text-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase bg-black/30 text-white px-2 py-0.5 rounded font-black">
                {isExceeds ? 'PRE-TRADE RISK CHECK BLOCKED' : 'PRE-TRADE MARGIN WARNING'}
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                data.accountType === 'live' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-amber-300'
              }`}>
                {data.accountType === 'live' ? 'LIVE ECN' : 'DEMO PRACTICE'}
              </span>
            </div>
            <h3 className="text-lg font-extrabold leading-tight mt-1">
              {isExceeds ? 'Order Exceeds Available Margin Limits' : 'High Margin Utilization Advisory'}
            </h3>
          </div>
          <button onClick={onClose} className="ml-auto text-white/80 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Order Details Card */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Trade Request</span>
              <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded ${
                data.tradeType === 'BUY' ? 'bg-slate-900 text-emerald-400' : 'bg-brand-red text-white'
              }`}>
                {data.tradeType} {data.lotSize} Lots {data.symbol}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Execution Price</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{data.executionPrice.toFixed(5)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Leverage Applied</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{data.leverage}x</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Required Margin</span>
                <span className="font-black text-[#E3000F] font-mono">${data.requiredMargin.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Available Free Margin</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">${data.availableMargin.toFixed(2)}</span>
              </div>
            </div>

            {/* Shortfall / Deficit Alert Bar */}
            {isExceeds && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg text-xs flex items-center justify-between text-red-700 dark:text-red-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
                  Margin Shortfall Deficit:
                </span>
                <span className="text-sm font-black font-mono text-red-600 dark:text-red-400">
                  -${data.shortfall.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Explanation Text */}
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {isExceeds ? (
              <>
                Axi Risk Engine intercepted this order. The calculated required margin (<strong>${data.requiredMargin.toFixed(2)}</strong>) exceeds your current available free balance (<strong>${data.availableMargin.toFixed(2)}</strong>) on your <strong>{data.accountType.toUpperCase()}</strong> account.
              </>
            ) : (
              <>
                Executing this order will utilize <strong>{((data.requiredMargin / Math.max(1, data.availableMargin)) * 100).toFixed(1)}%</strong> of your remaining free margin. Operating with high margin utilization increases susceptibility to automatic stop-out if price fluctuates.
              </>
            )}
          </p>

          {/* Real-time Resolution Controls */}
          <div className="space-y-2 pt-1">
            {isExceeds ? (
              <div className="flex flex-col gap-2.5">
                {data.maxSafeLot >= 0.01 && (
                  <button
                    onClick={() => onApplyMaxLot(data.maxSafeLot)}
                    className="w-full bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black py-3 px-4 rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                  >
                    <Zap className="w-4 h-4 text-slate-950" />
                    Auto-Set Safe Volume to {data.maxSafeLot} Lots
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={onQuickDeposit}
                    className="bg-[#E3000F] hover:bg-red-700 text-white font-bold py-2.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 text-xs"
                  >
                    <CreditCard className="w-4 h-4" /> Deposit Funds
                  </button>

                  <button
                    onClick={onSwitchAccount}
                    className="border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-2.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 text-xs"
                  >
                    <RefreshCw className="w-4 h-4" /> Switch to {data.accountType === 'live' ? 'Demo' : 'Live'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={onConfirmTrade}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 px-4 rounded-xl transition shadow-md cursor-pointer text-xs uppercase tracking-wider"
                >
                  Confirm & Execute Trade
                </button>
                <button
                  onClick={onClose}
                  className="border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl transition cursor-pointer text-xs uppercase tracking-wider"
                >
                  Adjust Parameters
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* Send Modal Component */
const SendModal = ({
  isOpen,
  onClose,
  showToast,
  liveBalance
}: {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  liveBalance: number;
}) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('USD');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      if (showToast) showToast('Please enter a valid transfer amount.', 'error');
      return;
    }
    if (!recipient.trim()) {
      if (showToast) showToast('Please enter a recipient address or Account ID.', 'error');
      return;
    }

    if (showToast) {
      showToast(`📤 Send Request Initiated: ${val} ${asset} sent to ${recipient}!`, 'success');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">Send & Transfer Funds</h3>
              <p className="text-xs text-slate-400">Transfer crypto or fiat to external wallet or ID</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Select Asset</label>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-brand-red cursor-pointer"
            >
              <option value="USD">USD - Live Account (${liveBalance.toFixed(2)})</option>
              <option value="BTC">BTC - Bitcoin Wallet</option>
              <option value="ETH">ETH - Ethereum Wallet</option>
              <option value="USDT">USDT - Tether (TRC20 / ERC20)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Recipient Address / Account ID</label>
            <input
              type="text"
              placeholder="e.g. 0x71C... or AXI-ACCOUNT-99812"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Transfer Amount</label>
            <div className="relative">
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pr-16 text-sm font-black font-mono text-slate-900 dark:text-white focus:outline-none focus:border-brand-red"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {asset}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
          >
            <Send className="w-4 h-4" /> Confirm Send Request
          </button>
        </form>
      </motion.div>
    </div>
  );
};

/* Swap Modal Component */
const SwapModal = ({
  isOpen,
  onClose,
  quotes,
  showToast
}: {
  isOpen: boolean;
  onClose: () => void;
  quotes: Record<string, MarketQuote>;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}) => {
  const [fromSymbol, setFromSymbol] = useState('BTC');
  const [toSymbol, setToSymbol] = useState('USD');
  const [amount, setAmount] = useState('1');

  if (!isOpen) return null;

  const btcPrice = quotes['BTCUSD']?.price || 67845;
  const ethPrice = quotes['ETHUSD']?.price || 3482.5;

  let rate = 1;
  if (fromSymbol === 'BTC' && toSymbol === 'USD') rate = btcPrice;
  else if (fromSymbol === 'USD' && toSymbol === 'BTC') rate = 1 / btcPrice;
  else if (fromSymbol === 'ETH' && toSymbol === 'USD') rate = ethPrice;
  else if (fromSymbol === 'USD' && toSymbol === 'ETH') rate = 1 / ethPrice;
  else if (fromSymbol === 'BTC' && toSymbol === 'ETH') rate = btcPrice / ethPrice;
  else if (fromSymbol === 'ETH' && toSymbol === 'BTC') rate = ethPrice / btcPrice;

  const outputVal = (parseFloat(amount) || 0) * rate;

  const handleExecuteSwap = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      if (showToast) showToast('Please enter a valid amount to swap.', 'error');
      return;
    }

    if (showToast) {
      showToast(`🔄 Instant Swap Complete! Swapped ${num} ${fromSymbol} for ${outputVal.toFixed(4)} ${toSymbol} at 0% fee!`, 'success');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">Instant 0% Fee Swap</h3>
              <p className="text-xs text-slate-400">Convert crypto & currencies instantly with zero slippage</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Pay With */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>You Pay</span>
              <span>Rate: 1 {fromSymbol} ≈ {rate.toFixed(4)} {toSymbol}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-lg font-black font-mono text-slate-900 dark:text-white focus:outline-none"
              />
              <select
                value={fromSymbol}
                onChange={(e) => setFromSymbol(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer text-slate-900 dark:text-white"
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Swap direction button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={() => {
                const temp = fromSymbol;
                setFromSymbol(toSymbol);
                setToSymbol(temp);
              }}
              className="p-2 bg-purple-600 text-white rounded-full shadow-md hover:bg-purple-500 transition cursor-pointer"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Receive */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-400 mb-1">You Receive (Estimated)</div>
            <div className="flex items-center gap-2">
              <div className="w-full text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                {outputVal.toFixed(4)}
              </div>
              <select
                value={toSymbol}
                onChange={(e) => setToSymbol(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer text-slate-900 dark:text-white"
              >
                <option value="USD">USD</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleExecuteSwap}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
          >
            <Repeat className="w-4 h-4" /> Swap Now
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* Deposit Prompt Modal Component */
const LiveDepositPromptModal = ({
  isOpen,
  onClose,
  onGoToDeposit
}: {
  isOpen: boolean;
  onClose: () => void;
  onGoToDeposit: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 text-center"
      >
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
          <CreditCard className="w-8 h-8" />
        </div>

        <div>
          <div className="bg-red-950/80 text-red-400 text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full inline-block uppercase tracking-wider mb-2 border border-red-800/80">
            LIVE ACCOUNT BALANCE IS $0.00
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Fund Your Live Trading Session</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Your live trading balance is currently <strong>$0.00</strong>. Deposit funds using Visa, Mastercard, Bank Transfer, or Crypto to execute real-market positions on ECN servers.
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={onGoToDeposit}
            className="w-full bg-[#E3000F] hover:bg-red-700 text-white font-black py-3.5 px-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
          >
            <CreditCard className="w-4 h-4" /> Deposit Live Funds Now
          </button>

          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
          >
            Cancel & Return to Market View
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface MarketsViewProps {

  quotes: Record<string, MarketQuote>;
  setQuotes: React.Dispatch<React.SetStateAction<Record<string, MarketQuote>>>;
  openPositions: TradeOrder[];
  setOpenPositions: React.Dispatch<React.SetStateAction<TradeOrder[]>>;
  addOpenPosition?: (pos: TradeOrder) => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  liveBalance: number;
  setLiveBalance: React.Dispatch<React.SetStateAction<number>>;
  closedPositions: ClosedPosition[];
  setClosedPositions: React.Dispatch<React.SetStateAction<ClosedPosition[]>>;
  priceAlerts: PriceAlert[];
  setPriceAlerts: React.Dispatch<React.SetStateAction<PriceAlert[]>>;
  setView: (view: ViewType) => void;
}

export default function MarketsView({
  quotes,
  setQuotes,
  openPositions,
  setOpenPositions,
  addOpenPosition,
  showToast,
  balance,
  setBalance,
  liveBalance,
  setLiveBalance,
  setView
}: MarketsViewProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSD');
  const [marketFilter, setMarketFilter] = useState<'All' | 'Top Gainers' | 'Top Losers' | 'FX' | 'Crypto'>('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);
  
  // Order entry state & Account Type toggle (Defaults to 'live')
  const [accountType, setAccountType] = useState<'live' | 'demo'>('live');
  const [riskAlertData, setRiskAlertData] = useState<PreTradeRiskAlertData | null>(null);
  const [orderTab, setOrderTab] = useState<'Market' | 'Limit' | 'Stop'>('Market');
  const [lotSize, setLotSize] = useState<number>(0.1);
  const [leverage, setLeverage] = useState<number>(100);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [pulsingRow, setPulsingRow] = useState<string | null>(null);
  const [tradeSuccess, setTradeSuccess] = useState<'BUY' | 'SELL' | null>(null);
  const [isSessionMenuOpen, setIsSessionMenuOpen] = useState(false);

  // New action modal states
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isDepositPromptOpen, setIsDepositPromptOpen] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = subscribePaymentConfig((centralConfig) => {
      if (centralConfig.maintenanceMode) {
        setMaintenanceMode(centralConfig.maintenanceMode);
      }
    });
    return () => unsubscribe();
  }, []);

  const currentQuote = quotes[selectedSymbol] || quotes['BTCUSD'];
  const activeBalance = accountType === 'live' ? liveBalance : balance;

  // Real-time market position P&L tracking based on strictly real quotes
  useEffect(() => {
    if (!openPositions || openPositions.length === 0) return;
    setOpenPositions(prev =>
      prev.map(pos => {
        const liveQuote = quotes[pos.symbol];
        if (!liveQuote || !liveQuote.price) return pos;
        
        // Calculate exact real P&L based on contract specifications
        const priceDiff = pos.type === 'BUY' 
          ? (liveQuote.price - pos.openPrice) 
          : (pos.openPrice - liveQuote.price);
        
        const contractMultiplier = pos.symbol.includes('BTC') ? 1 : pos.symbol.includes('XAU') ? 100 : pos.symbol.includes('US30') || pos.symbol.includes('SPX') ? 1 : 100000;
        const realProfit = priceDiff * pos.volume * contractMultiplier;
        
        return {
          ...pos,
          currentPrice: liveQuote.price,
          profit: Number(realProfit.toFixed(2))
        };
      })
    );
  }, [quotes, openPositions.length, setOpenPositions]);
  
  // Update SL/TP defaults when symbol changes
  useEffect(() => {
    if (currentQuote) {
      const isJPY = currentQuote.symbol.includes('JPY');
      const offset = isJPY ? 1.0 : (currentQuote.price > 1000 ? 50 : 0.0050);
      setStopLoss((currentQuote.price - offset).toFixed(isJPY ? 2 : 5));
      setTakeProfit((currentQuote.price + offset).toFixed(isJPY ? 2 : 5));
    }
  }, [selectedSymbol]);

  // Calculate P&L
  const openPnL = openPositions.reduce((acc, pos) => acc + pos.profit, 0);
  const openPnLPercent = activeBalance > 0 ? (openPnL / activeBalance) * 100 : 0;
  
  // Margin Used
  const marginUsed = openPositions.reduce((acc, pos) => {
    const mult = pos.symbol === 'BTCUSD' ? 1 : (pos.symbol === 'XAUUSD' ? 100 : 100000);
    const notional = pos.entryPrice * pos.volume * mult;
    return acc + (notional / 100);
  }, 0);

  // Pre-Trade Check & Trade Execution Handler
  const handleTrade = (type: 'BUY' | 'SELL', forceBypassWarning: boolean = false) => {
    if (!currentQuote) return;

    // Check Maintenance Mode
    if (maintenanceMode?.active && maintenanceMode?.disableTrading !== false) {
      if (showToast) {
        showToast(`⚠️ ${maintenanceMode.message || 'Market order execution is temporarily paused for scheduled maintenance.'}`, 'error');
      }
      return;
    }

    // RULE: If user tries to trade on LIVE session with $0.00 balance -> prompt to deposit & redirect
    if (accountType === 'live' && liveBalance <= 0) {
      setIsDepositPromptOpen(true);
      if (showToast) {
        showToast('🔴 Live account balance is $0.00. Please deposit funds to execute live market trades.', 'error');
      }
      return;
    }

    const isBuy = type === 'BUY';
    const executionPrice = isBuy ? currentQuote.price + currentQuote.askDiff : currentQuote.price + currentQuote.bidDiff;
    
    const mult = currentQuote.symbol === 'BTCUSD' ? 1 : (currentQuote.symbol === 'XAUUSD' ? 100 : 100000);
    const notional = executionPrice * lotSize * mult;
    const requiredMargin = notional / leverage;
    const availableMargin = Math.max(0, activeBalance - marginUsed);

    // Calculate maximum safe lot size based on available free margin
    const rawMaxSafeLot = (availableMargin * leverage) / (executionPrice * mult);
    const maxSafeLot = Math.max(0.01, Math.floor(rawMaxSafeLot * 100) / 100);

    // PRE-TRADE RISK CHECK 1: Exceeds available free margin
    if (requiredMargin > availableMargin) {
      setRiskAlertData({
        isOpen: true,
        type: 'EXCEEDS_LIMITS',
        accountType,
        activeBalance,
        availableMargin,
        requiredMargin,
        shortfall: Math.max(0, requiredMargin - availableMargin),
        maxSafeLot,
        symbol: selectedSymbol,
        tradeType: type,
        lotSize,
        leverage,
        notional,
        executionPrice
      });
      if (showToast) showToast(`🛑 Pre-Trade Risk Check Blocked: Insufficient Margin on ${accountType.toUpperCase()} account`, 'error');
      return;
    }

    // PRE-TRADE RISK CHECK 2: High Margin Utilization (> 75% free margin used)
    if (!forceBypassWarning && requiredMargin > availableMargin * 0.75) {
      setRiskAlertData({
        isOpen: true,
        type: 'HIGH_UTILIZATION_WARNING',
        accountType,
        activeBalance,
        availableMargin,
        requiredMargin,
        shortfall: 0,
        maxSafeLot,
        symbol: selectedSymbol,
        tradeType: type,
        lotSize,
        leverage,
        notional,
        executionPrice
      });
      return;
    }

    // Initial profit based on spread
    const initialProfit = 0 - (currentQuote.spread * lotSize * (currentQuote.symbol.includes('JPY') ? 100 : 10000));

    // Submit order
    const newOrder: TradeOrder = {
      id: Math.random().toString(36).substring(2, 9),
      symbol: selectedSymbol,
      type,
      entryPrice: executionPrice,
      currentPrice: executionPrice,
      volume: lotSize,
      profit: initialProfit,
      timestamp: new Date().toISOString(),
    };

    if (addOpenPosition) addOpenPosition(newOrder);
    else setOpenPositions(prev => [...prev, newOrder]);
    setRiskAlertData(null);
    if (showToast) {
      if (accountType === 'demo') {
        showToast(`🟢 Demo Order Executed! ${type} ${lotSize} ${selectedSymbol}`, 'success');
      } else {
        showToast(`✓ Live Order Executed! ${type} ${lotSize} ${selectedSymbol} [LIVE ECN]`, 'success');
      }
    }
  };

  const filteredMarkets = Object.values(quotes)
    .filter(q => {
      if (marketFilter === 'All') return true;
      if (marketFilter === 'FX') return q.category === 'Forex';
      if (marketFilter === 'Crypto') return q.category === 'Crypto';
      if (marketFilter === 'Top Gainers') return q.change > 0;
      if (marketFilter === 'Top Losers') return q.change < 0;
      return true;
    })
    .sort((a, b) => {
      if (marketFilter === 'Top Gainers') return b.change - a.change;
      if (marketFilter === 'Top Losers') return a.change - b.change;
      return 0;
    });

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen p-4 font-sans text-slate-900 w-full max-w-[1400px] mx-auto pb-20">
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-6">
          <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }} className="h-9 w-44 bg-slate-200 rounded-lg" />
          <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }} className="h-9 w-36 bg-slate-200 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }} className="h-20 bg-slate-200 rounded-xl" />
              <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }} className="h-20 bg-slate-200 rounded-xl" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div 
                  key={i}
                  animate={{ opacity: [0.4, 0.8, 0.4] }} 
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.1 }} 
                  className="h-12 bg-slate-200 rounded-lg w-full flex items-center justify-between px-3"
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-4">
            <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }} className="h-[380px] bg-slate-200 rounded-xl w-full" />
            <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }} className="h-44 bg-slate-200 rounded-xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20 md:pb-10 font-sans text-slate-900 w-full">
      
      {/* Trading Session Navigation - Mobile & Desktop */}
      <div className="flex flex-col md:flex-row border-b border-slate-200 px-4 py-3 justify-between items-center bg-white sticky top-0 z-20 shadow-sm gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="relative">
            <button 
              onClick={() => setIsSessionMenuOpen(!isSessionMenuOpen)}
              className="flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-black shadow-md cursor-pointer hover:bg-slate-800 transition"
            >
              Menu
              <svg className={`w-3.5 h-3.5 transition-transform ${isSessionMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            
            <AnimatePresence>
              {isSessionMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-50 flex flex-col"
                >
                  <button onClick={() => { setIsSessionMenuOpen(false); setView && setView('dashboard'); }} className="text-left px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 border-b border-slate-100 cursor-pointer">Dashboard</button>
                  <button onClick={() => { setIsSessionMenuOpen(false); setView && setView('markets'); }} className="text-left px-4 py-3 text-sm font-bold text-brand-red hover:bg-slate-50 border-b border-slate-100 bg-brand-red/5 cursor-pointer">Trade (Markets)</button>
                  <button onClick={() => { setIsSessionMenuOpen(false); setView && setView('funds'); }} className="text-left px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 border-b border-slate-100 cursor-pointer">Funds & Deposit</button>
                  <button onClick={() => { setIsSessionMenuOpen(false); setView && setView('settings'); }} className="text-left px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 cursor-pointer">Settings</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Session Mode Indicator */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition bg-red-600 text-white shadow-md">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
              Live ({liveBalance.toFixed(2)})
            </div>
          </div>
        </div>

        {/* Action Buttons Bar: Deposit, Sell, Send, Swap */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setView('funds')}
            className="flex items-center gap-1.5 bg-[#E3000F] hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-md transition cursor-pointer whitespace-nowrap"
          >
            <CreditCard className="w-3.5 h-3.5" /> Deposit
          </button>

          <button
            onClick={() => handleTrade('SELL')}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-red-400 px-3 py-2 rounded-xl text-xs font-extrabold border border-red-500/30 transition cursor-pointer whitespace-nowrap"
          >
            <TrendingDown className="w-3.5 h-3.5 text-red-500" /> Quick Sell
          </button>

          <button
            onClick={() => setIsSendModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-md transition cursor-pointer whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>

          <button
            onClick={() => setIsSwapModalOpen(true)}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-md transition cursor-pointer whitespace-nowrap"
          >
            <Repeat className="w-3.5 h-3.5" /> Swap
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Markets List & Dashboard (mobile full width) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Dashboard Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Open P&L</div>
              <div className={`text-xl font-black ${openPnL >= 0 ? 'text-emerald-500' : 'text-brand-red'}`}>
                {openPnL >= 0 ? '+' : ''}{openPnL.toFixed(2)}
              </div>
              <div className={`text-xs font-bold ${openPnL >= 0 ? 'text-emerald-500' : 'text-brand-red'}`}>
                {openPnL >= 0 ? '+' : ''}{openPnLPercent.toFixed(2)}%
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Margin Used</div>
              <div className="text-xl font-black text-slate-900">
                ${marginUsed.toFixed(2)}
              </div>
              <div className="text-xs font-bold text-slate-500">
                {liveBalance > 0 ? ((marginUsed/liveBalance)*100).toFixed(2) : '0.00'}%
              </div>
            </div>
          </div>

          {/* Markets List */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px] lg:h-[calc(100vh-200px)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Markets</h3>
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar text-[10px] font-bold py-1">
                {(['All', 'Top Gainers', 'Top Losers', 'FX', 'Crypto'] as const).map(filter => (
                  <button 
                    key={filter} 
                    onClick={() => setMarketFilter(filter)}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer whitespace-nowrap ${
                      marketFilter === filter 
                        ? filter === 'Top Gainers' ? 'bg-emerald-600 text-white' : filter === 'Top Losers' ? 'bg-rose-600 text-white' : 'bg-brand-red text-white' 
                        : 'text-slate-600 hover:bg-slate-100 bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <button onClick={() => setIsAlertsOpen(true)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ml-4">
                <Bell className="w-4 h-4" />
                Manage Alerts
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredMarkets.map(q => {
                const isSelected = selectedSymbol === q.symbol;
                const isPositive = q.change >= 0;
                const sentiment = getAssetSentiment(q.symbol, q.change);
                return (
                  <motion.div 
                    key={q.symbol}
                    onClick={() => setSelectedSymbol(q.symbol)}
                    animate={pulsingRow === q.symbol ? { backgroundColor: ['#10b981', '#f0fdf4', isSelected ? '#fef2f2' : '#ffffff'] } : {}}
                    transition={{ duration: 0.8 }}
                    className={`flex items-center justify-between p-3 border-b border-slate-50 cursor-pointer transition ${isSelected && pulsingRow !== q.symbol ? 'bg-brand-red/5' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-bold text-sm text-slate-900">{q.symbol.replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2')}</div>
                      <div className="text-xs text-slate-400 truncate">{q.name}</div>
                      
                      {/* Market Sentiment Indicator for each asset */}
                      <div className="mt-1.5 flex items-center gap-1.5 w-full max-w-[140px]">
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${sentiment.longPercent}%` }} />
                          <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${sentiment.shortPercent}%` }} />
                        </div>
                        <span className="text-[9px] font-bold font-mono text-slate-500 shrink-0">
                          <span className="text-emerald-600">{sentiment.longPercent}% B</span>
                        </span>
                      </div>
                    </div>

                    <div className="mx-2 shrink-0 flex items-center justify-center">
                      <MiniQuoteChart price={q.price} change={q.change} symbol={q.symbol} />
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-sm text-slate-900 font-mono">{q.price.toLocaleString(undefined, { minimumFractionDigits: q.symbol.includes('JPY') ? 2 : (q.price > 1000 ? 2 : 5) })}</div>
                      <div className={`text-xs font-bold ${isPositive ? 'text-emerald-500' : 'text-brand-red'}`}>
                        {isPositive ? '+' : ''}{q.change.toFixed(5)}%
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          
          {/* Market Sentiment Gauge for Selected Asset */}
          {currentQuote && (
            <SentimentGauge 
              symbol={selectedSymbol} 
              longPercent={getAssetSentiment(selectedSymbol, currentQuote.change).longPercent} 
            />
          )}
        </div>
        </div>

        {/* RIGHT COLUMN: Chart & Order Entry */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Chart Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-xl font-black text-slate-900">{selectedSymbol.replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2')}</h2>
                  <span className="text-2xl font-black text-slate-900">
                    {currentQuote ? (currentQuote.price > 1000 ? '$' : '') + currentQuote.price.toLocaleString(undefined, { minimumFractionDigits: currentQuote.symbol.includes('JPY') ? 2 : (currentQuote.price > 1000 ? 2 : 5) }) : '...'}
                  </span>
                </div>
                {currentQuote && (
                  <div className={`text-sm font-bold ${currentQuote.change >= 0 ? 'text-emerald-500' : 'text-brand-red'}`}>
                    {currentQuote.change >= 0 ? '+' : ''}{currentQuote.change.toFixed(5)}%
                  </div>
                )}
              </div>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                {['1H', '4H', '1D', '1W'].map(tf => (
                  <button key={tf} className={`px-2 py-1 text-xs font-bold rounded-md cursor-pointer ${tf === '1H' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>
                    {tf}
                  </button>
                ))}
              </div>
              <button onClick={() => setIsAlertsOpen(true)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ml-4">
                <Bell className="w-4 h-4" />
                Manage Alerts
              </button>
            </div>

            <div className="h-[300px] md:h-[400px] w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
              <RechartsCandlestickChart symbol={selectedSymbol} data={[]} height={300} />
            </div>
          </div>

          {/* Order Entry */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Trading Terminal Order Ticket
              </span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                Risk Engine Active
              </span>
            </div>

            <div className="flex w-full border-b border-slate-100">
              {['Market', 'Limit', 'Stop'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setOrderTab(tab as any)}
                  className={`flex-1 py-3 text-sm font-bold transition cursor-pointer relative ${orderTab === tab ? 'text-brand-red' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  {tab}
                  {orderTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-red" />}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Symbol</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900">
                    {selectedSymbol.replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2')}
                  </div>
                  <button 
                    onClick={() => setIsAlertsOpen(true)}
                    className="flex items-center justify-center bg-brand-red text-white rounded-lg px-4 hover:bg-red-700 transition cursor-pointer shadow-sm"
                    title="Manage Price Alerts"
                  >
                    <Bell className="w-4 h-4 mr-1" />
                    <span className="text-xs font-bold uppercase tracking-wider">Alerts</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lot Size</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
                  <button onClick={() => setLotSize(prev => Math.max(0.01, Number((prev - 0.01).toFixed(2))))} className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 font-bold cursor-pointer hover:bg-slate-100">-</button>
                  <div className="flex-1 text-center font-black text-slate-900">{lotSize.toFixed(2)}</div>
                  <button onClick={() => setLotSize(prev => Number((prev + 0.01).toFixed(2)))} className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 font-bold cursor-pointer hover:bg-slate-100">+</button>
                  <div className="pr-3 text-xs font-bold text-slate-400">lots</div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Stop Loss</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <input type="text" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="w-full outline-none font-bold text-slate-900" />
                  <span className="text-xs font-bold text-slate-400">USD</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Take Profit</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <input type="text" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="w-full outline-none font-bold text-slate-900" />
                  <span className="text-xs font-bold text-slate-400">USD</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Leverage</label>
                <div className="flex gap-2">
                  {[1, 5, 10, 100, 500].map(lev => (
                    <button 
                      key={lev}
                      onClick={() => setLeverage(lev)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${leverage === lev ? 'bg-brand-red text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Pre-Trade Risk Indicator Bar */}
              {currentQuote && (() => {
                const mult = currentQuote.symbol === 'BTCUSD' ? 1 : (currentQuote.symbol === 'XAUUSD' ? 100 : 100000);
                const reqMargin = (currentQuote.price * lotSize * mult) / leverage;
                const availMargin = Math.max(0, activeBalance - marginUsed);
                const marginRatio = availMargin > 0 ? (reqMargin / availMargin) * 100 : 100;
                const isOverLimit = reqMargin > availMargin || activeBalance <= 0;
                const isHighRisk = marginRatio > 75 && !isOverLimit;

                return (
                  <div className={`p-3 rounded-xl border text-xs font-semibold space-y-2 ${
                    isOverLimit 
                      ? 'bg-red-50 border-red-300 text-red-900' 
                      : (isHighRisk ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-800')
                  }`}>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1">
                        {isOverLimit ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                        ) : isHighRisk ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        Pre-Trade Risk Status
                      </span>
                      <span className={`font-mono font-black ${isOverLimit ? 'text-red-600' : isHighRisk ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {isOverLimit ? 'LIMIT EXCEEDED 🛑' : isHighRisk ? 'HIGH UTILIZATION ⚠️' : 'PASS ✓'}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          isOverLimit ? 'bg-red-600' : isHighRisk ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, marginRatio)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                      <span>Req: ${reqMargin.toFixed(2)}</span>
                      <span>Free: ${availMargin.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              {maintenanceMode?.active && maintenanceMode?.disableTrading !== false && (
                <div className="bg-amber-500/15 border border-amber-500/40 p-3 rounded-xl text-amber-900 dark:text-amber-200 text-xs font-semibold space-y-1">
                  <div className="font-extrabold uppercase text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Maintenance Mode Active
                  </div>
                  <p className="text-[11px] leading-tight">
                    {maintenanceMode.message || 'Market order execution is temporarily paused for scheduled maintenance.'}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  animate={tradeSuccess === 'BUY' ? { backgroundColor: '#10b981', color: '#ffffff' } : { backgroundColor: '#0f172a', color: '#ffffff' }}
                  onClick={() => handleTrade('BUY')}
                  disabled={maintenanceMode?.active && maintenanceMode?.disableTrading !== false}
                  className="flex-1 font-black py-4 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  animate={tradeSuccess === 'SELL' ? { backgroundColor: '#10b981', color: '#ffffff' } : { backgroundColor: '#ffffff', color: '#0f172a' }}
                  onClick={() => handleTrade('SELL')}
                  disabled={maintenanceMode?.active && maintenanceMode?.disableTrading !== false}
                  className="flex-1 border border-slate-200 font-black py-4 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sell
                </motion.button>
              </div>

              {currentQuote && (
                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Margin Required</span>
                    <strong className="text-slate-900">${((currentQuote.price * lotSize * (currentQuote.symbol === 'BTCUSD' ? 1 : (currentQuote.symbol === 'XAUUSD' ? 100 : 100000))) / leverage).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Spread</span>
                    <strong className="text-slate-900">{currentQuote.spread} pips</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Commission</span>
                    <strong className="text-slate-900">$0.00</strong>
                  </div>
                  <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-50">
                    <span>Total Cost</span>
                    <strong className="text-slate-900">${((currentQuote.price * lotSize * (currentQuote.symbol === 'BTCUSD' ? 1 : (currentQuote.symbol === 'XAUUSD' ? 100 : 100000))) / leverage).toFixed(2)}</strong>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      <AnimatePresence>
        <ManageAlertsModal isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(false)} symbol={selectedSymbol} currentPrice={currentQuote?.price || 0} />
      </AnimatePresence>

      {/* Pre-Trade Risk Check Alert Modal */}
      <AnimatePresence>
        <PreTradeRiskAlertModal
          data={riskAlertData}
          onClose={() => setRiskAlertData(null)}
          onApplyMaxLot={(lot) => {
            setLotSize(lot);
            setRiskAlertData(null);
            if (showToast) showToast(`Volume auto-adjusted to safe limit: ${lot} lots`, 'info');
          }}
          onConfirmTrade={() => {
            if (riskAlertData) handleTrade(riskAlertData.tradeType, true);
          }}
          onSwitchAccount={() => {
            const newMode = accountType === 'live' ? 'demo' : 'live';
            setAccountType(newMode);
            setRiskAlertData(null);
            if (showToast) showToast(`Switched Trading Terminal to ${newMode.toUpperCase()} account`, 'info');
          }}
          onQuickDeposit={() => {
            setRiskAlertData(null);
            if (setView) setView('funds');
          }}
        />
      </AnimatePresence>

      {/* Action Modals */}
      <AnimatePresence>
        <SendModal
          isOpen={isSendModalOpen}
          onClose={() => setIsSendModalOpen(false)}
          showToast={showToast}
          liveBalance={liveBalance}
        />
      </AnimatePresence>

      <AnimatePresence>
        <SwapModal
          isOpen={isSwapModalOpen}
          onClose={() => setIsSwapModalOpen(false)}
          quotes={quotes}
          showToast={showToast}
        />
      </AnimatePresence>

      <AnimatePresence>
        <LiveDepositPromptModal
          isOpen={isDepositPromptOpen}
          onClose={() => setIsDepositPromptOpen(false)}
          onGoToDeposit={() => {
            setIsDepositPromptOpen(false);
            if (setView) setView('funds');
          }}
        />
      </AnimatePresence>
    </div>
  );
}
