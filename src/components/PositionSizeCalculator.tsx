import React, { useState } from 'react';
import { Calculator } from 'lucide-react';

export default function PositionSizeCalculator() {
  const [balance, setBalance] = useState<number>(10000);
  const [leverage, setLeverage] = useState<number>(500);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [stopLossPips, setStopLossPips] = useState<number>(50);
  const [asset, setAsset] = useState<string>('EURUSD');
  
  const getPipValue = (sym: string): number => {
    switch(sym) {
      case 'EURUSD': case 'GBPUSD': case 'AUDUSD': case 'NZDUSD': return 10;
      case 'USDJPY': return 1000 / 150; // roughly
      case 'XAUUSD': return 10;
      case 'BTCUSD': return 1;
      default: return 10;
    }
  };
  
  const getAssetPrice = (sym: string): number => {
    switch(sym) {
      case 'EURUSD': return 1.0845;
      case 'GBPUSD': return 1.2684;
      case 'USDJPY': return 151.62;
      case 'XAUUSD': return 2342.80;
      case 'BTCUSD': return 67845.00;
      default: return 1.0;
    }
  };
  
  const getContractMultiplier = (sym: string): number => {
    if (sym === 'BTCUSD') return 1;
    if (sym === 'XAUUSD') return 100;
    return 100000;
  };

  const calculateRecommendedLots = () => {
    const riskAmount = balance * (riskPercent / 100);
    const pipVal = getPipValue(asset);
    if (stopLossPips <= 0 || pipVal <= 0) return 0;
    
    let lots = riskAmount / (stopLossPips * pipVal);
    
    // Leverage check: ensure required margin doesn't exceed balance
    const marginRequiredPerLot = (getAssetPrice(asset) * getContractMultiplier(asset)) / leverage;
    const maxLotsByMargin = balance / marginRequiredPerLot;
    
    if (lots > maxLotsByMargin) {
      lots = maxLotsByMargin;
    }
    
    return Number(lots.toFixed(2));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Calculator className="w-5 h-5 text-brand-red" />
        <h3 className="font-bold text-slate-800">Position Size Calculator</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account Balance (USD)</label>
          <input 
            type="number"
            value={balance}
            onChange={(e) => setBalance(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-brand-red"
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account Leverage (1:X)</label>
          <input 
            type="number"
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-brand-red"
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Risk Percentage (%)</label>
          <input 
            type="number"
            value={riskPercent}
            onChange={(e) => setRiskPercent(Number(e.target.value))}
            step="0.1"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-brand-red"
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stop Loss (Pips)</label>
          <input 
            type="number"
            value={stopLossPips}
            onChange={(e) => setStopLossPips(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-brand-red"
          />
        </div>
        
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Asset</label>
          <select 
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-brand-red"
          >
            <option value="EURUSD">EUR/USD</option>
            <option value="GBPUSD">GBP/USD</option>
            <option value="USDJPY">USD/JPY</option>
            <option value="XAUUSD">GOLD (XAU/USD)</option>
            <option value="BTCUSD">Bitcoin (BTC/USD)</option>
          </select>
        </div>
      </div>
      
      <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Recommended Trade Volume</span>
        <span className="text-3xl font-black text-slate-900 font-mono">{calculateRecommendedLots()} <span className="text-sm font-bold text-slate-500">Lots</span></span>
        <span className="text-xs font-semibold text-emerald-600 mt-2 bg-emerald-50 px-2 py-1 rounded">Risk Amount: ${(balance * (riskPercent / 100)).toFixed(2)}</span>
      </div>
    </div>
  );
}
