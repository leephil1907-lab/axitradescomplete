import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Monitor, TrendingUp, HelpCircle, FileText, Settings, X, CreditCard, ChevronRight, Gift, Mic, Sparkles } from 'lucide-react';
import { ViewType } from '../types';

interface CommandMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setView: (view: ViewType) => void;
  setSelectedSymbol?: (symbol: string) => void;
  openReferModal?: () => void;
  openVoiceModal?: () => void;
  openOnboardingTour?: () => void;
}

export default function CommandMenu({ isOpen, setIsOpen, setView, setSelectedSymbol, openReferModal, openVoiceModal, openOnboardingTour }: CommandMenuProps) {
  const [query, setQuery] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  const ACTIONS = [
    { id: 'onboarding-tour', title: '✨ Take Guided Dashboard Onboarding Tour', icon: Sparkles, action: () => { if (openOnboardingTour) openOnboardingTour(); setIsOpen(false); } },
    { id: 'voice-notes', title: '🎙️ Voice Note Studio & Speech Dictation', icon: Mic, action: () => { if (openVoiceModal) openVoiceModal(); setIsOpen(false); } },
    { id: 'refer-friend', title: '🎁 Refer a Friend (Earn $100)', icon: Gift, action: () => { if (openReferModal) openReferModal(); setIsOpen(false); } },
    { id: 'promotions', title: '🎁 Axi Promotions & $100K Championship', icon: Gift, action: () => { setView('promotions'); setIsOpen(false); } },
    { id: 'economic-calendar', title: '📅 Live Economic Calendar & Events', icon: Monitor, action: () => { setView('economic_calendar'); setIsOpen(false); } },
    { id: 'partners', title: '🤝 Axi Partners & IB Portal (Up to $12/Lot)', icon: TrendingUp, action: () => { setView('partners'); setIsOpen(false); } },
    { id: 'forex-vps', title: '⚡ Forex VPS Hosting & Autochartist', icon: Monitor, action: () => { setView('forex_vps'); setIsOpen(false); } },
    { id: 'axi-select', title: '🏆 Axi Select Capital Allocation ($1M)', icon: Sparkles, action: () => { setView('select'); setIsOpen(false); } },
    { id: 'trade-btc', title: 'Trade Bitcoin (BTCUSD)', icon: TrendingUp, action: () => { setView('markets'); if (setSelectedSymbol) setSelectedSymbol('BTCUSD'); setIsOpen(false); } },
    { id: 'trade-eurusd', title: 'Trade EUR/USD', icon: TrendingUp, action: () => { setView('markets'); if (setSelectedSymbol) setSelectedSymbol('EURUSD'); setIsOpen(false); } },
    { id: 'trade-xauusd', title: 'Trade Gold (XAUUSD)', icon: TrendingUp, action: () => { setView('markets'); if (setSelectedSymbol) setSelectedSymbol('XAUUSD'); setIsOpen(false); } },
    { id: 'funds', title: 'Deposit Funds', icon: CreditCard, action: () => { setView('funds'); setIsOpen(false); } },
    { id: 'tools', title: 'Trading Tools', icon: Monitor, action: () => { setView('tools'); setIsOpen(false); } },
    { id: 'support', title: 'Help & Support', icon: HelpCircle, action: () => { setView('support'); setIsOpen(false); } },
    { id: 'settings', title: 'Account Settings', icon: Settings, action: () => { setView('settings'); setIsOpen(false); } },
    { id: 'blog', title: 'Market News & Blog', icon: FileText, action: () => { setView('blog'); setIsOpen(false); } },
  ];

  const filteredActions = ACTIONS.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden relative z-10 border border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input 
            autoFocus
            type="text" 
            placeholder="Search assets, tools, or pages..." 
            className="flex-1 bg-transparent border-none outline-none text-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredActions.length > 0 ? (
            <div className="flex flex-col gap-1">
              {filteredActions.map((action, idx) => (
                <button 
                  key={action.id}
                  onClick={action.action}
                  className="flex items-center gap-3 w-full p-3 text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-white dark:group-hover:bg-slate-700 transition">
                    <action.icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-brand-red" />
                  </div>
                  <div className="flex-1 text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition">
                    {action.title}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
              No results found for "{query}"
            </div>
          )}
        </div>
        
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><kbd className="bg-slate-200 dark:bg-slate-800 px-1.5 rounded text-[10px] font-sans">↑↓</kbd> to navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-slate-200 dark:bg-slate-800 px-1.5 rounded text-[10px] font-sans">↵</kbd> to select</span>
          </div>
          <span className="flex items-center gap-1"><kbd className="bg-slate-200 dark:bg-slate-800 px-1.5 rounded text-[10px] font-sans">ESC</kbd> to close</span>
        </div>
      </motion.div>
    </div>
  );
}
