import React from 'react';
import { DisplayCurrency } from '../types';
import { Coins, DollarSign, Euro, PoundSterling } from 'lucide-react';

interface CurrencySelectorProps {
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (curr: DisplayCurrency) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'pill' | 'compact' | 'minimal';
  className?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  displayCurrency,
  setDisplayCurrency,
  size = 'md',
  variant = 'pill',
  className = '',
}) => {
  const currencies: { id: DisplayCurrency; label: string; symbol: string; flag: string }[] = [
    { id: 'USD', label: 'USD', symbol: '$', flag: '🇺🇸' },
    { id: 'EUR', label: 'EUR', symbol: '€', flag: '🇪🇺' },
    { id: 'GBP', label: 'GBP', symbol: '£', flag: '🇬🇧' },
  ];

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 ${className}`}>
        {currencies.map((c) => {
          const isActive = displayCurrency === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setDisplayCurrency(c.id)}
              className={`px-2 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                isActive
                  ? 'bg-[#E3000F] text-white shadow-xs scale-102'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
              }`}
              title={`Switch account display currency to ${c.label} (${c.symbol})`}
            >
              <span>{c.flag}</span>
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Coins className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300/80 dark:border-slate-700">
          {currencies.map((c) => (
            <button
              key={c.id}
              onClick={() => setDisplayCurrency(c.id)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase transition cursor-pointer ${
                displayCurrency === c.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {c.symbol} {c.id}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs ${className}`}>
      <div className="flex items-center gap-1 px-1.5 text-slate-400">
        <Coins className="w-3.5 h-3.5 text-brand-red" />
        <span className="text-[10px] font-black tracking-wider uppercase hidden sm:inline text-slate-500 dark:text-slate-400">Currency</span>
      </div>

      <div className="flex items-center gap-1">
        {currencies.map((c) => {
          const isActive = displayCurrency === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setDisplayCurrency(c.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all duration-200 flex items-center gap-1.5 cursor-pointer border ${
                isActive
                  ? 'bg-[#E3000F] text-white border-[#E3000F] shadow-sm scale-102'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-700/60'
              }`}
            >
              <span className="text-sm leading-none">{c.flag}</span>
              <span className="font-bold">{c.id}</span>
              <span className="opacity-80 text-[11px] font-mono">({c.symbol})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CurrencySelector;
