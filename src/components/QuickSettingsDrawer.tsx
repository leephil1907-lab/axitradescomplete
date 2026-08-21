import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sliders, Zap, ShieldAlert, CheckCircle2, RotateCcw, Volume2, Bell, Percent, Crosshair, ArrowRight, Save } from 'lucide-react';

interface QuickSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export interface QuickSettingsState {
  oneClickEnabled: boolean;
  confirmBypass: boolean;
  defaultLotSize: number;
  defaultStopLossPips: number;
  defaultTakeProfitPips: number;
  maxSlippagePips: number;
  maxRiskPercent: number;
  autoTrailingStop: boolean;
  audioFeedback: boolean;
  screenFlashAlert: boolean;
}

const DEFAULT_SETTINGS: QuickSettingsState = {
  oneClickEnabled: true,
  confirmBypass: true,
  defaultLotSize: 0.1,
  defaultStopLossPips: 20,
  defaultTakeProfitPips: 40,
  maxSlippagePips: 3,
  maxRiskPercent: 2,
  autoTrailingStop: false,
  audioFeedback: true,
  screenFlashAlert: true
};

export default function QuickSettingsDrawer({ isOpen, onClose, showToast }: QuickSettingsDrawerProps) {
  const [settings, setSettings] = useState<QuickSettingsState>(() => {
    try {
      const saved = localStorage.getItem('axi_quick_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('axi_quick_settings');
        if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch {}
    }
  }, [isOpen]);

  const handleChange = <K extends keyof QuickSettingsState>(key: K, value: QuickSettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('axi_quick_settings', JSON.stringify(settings));
      window.dispatchEvent(new CustomEvent('axi_quick_settings_updated', { detail: settings }));
      if (showToast) showToast('Quick-settings and risk management parameters updated!', 'success');
      setHasChanges(false);
      onClose();
    } catch (e) {
      if (showToast) showToast('Failed to save quick-settings', 'error');
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
    if (showToast) showToast('Reset settings to factory defaults', 'info');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Slide-over Drawer Container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E3000F] flex items-center justify-center text-white shadow-md shadow-red-600/30">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white tracking-tight leading-none">
                      Quick Trading Settings
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      One-Click execution & risk limits
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
                {/* Section 1: One-Click Trading Execution */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          One-Click Trading Mode
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Execute orders immediately without confirmation dialogs
                        </p>
                      </div>
                    </div>
                    {/* Toggle */}
                    <button
                      onClick={() => handleChange('oneClickEnabled', !settings.oneClickEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                        settings.oneClickEnabled ? 'bg-[#E3000F]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.oneClickEnabled ? 24 : 0 }}
                        className="w-4 h-4 rounded-full bg-white shadow-md"
                      />
                    </button>
                  </div>

                  {settings.oneClickEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2.5"
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={settings.confirmBypass}
                          onChange={e => handleChange('confirmBypass', e.target.checked)}
                          className="rounded border-slate-300 text-[#E3000F] focus:ring-[#E3000F] w-4 h-4"
                        />
                        <span>Bypass modal confirmations for keyboard shortcuts (Shift+B / Shift+S)</span>
                      </label>
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Caution: Trades will execute instantly at current market bid/ask upon clicking or using hotkeys.</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Section 2: Default Risk Management Parameters */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-[#E3000F]" />
                    <span>Default Risk Management</span>
                  </h4>

                  {/* Lot Size & Risk % Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Default Trade Lot Size
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="100"
                        value={settings.defaultLotSize}
                        onChange={e => handleChange('defaultLotSize', parseFloat(e.target.value) || 0.01)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#E3000F]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Max Risk Cap (% Balance)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="50"
                          value={settings.maxRiskPercent}
                          onChange={e => handleChange('maxRiskPercent', parseFloat(e.target.value) || 1)}
                          className="w-full h-10 px-3 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#E3000F]"
                        />
                        <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>

                  {/* Stop Loss & Take Profit Pips Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        Default Stop Loss (Pips)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="500"
                        value={settings.defaultStopLossPips}
                        onChange={e => handleChange('defaultStopLossPips', parseInt(e.target.value) || 20)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        Default Take Profit (Pips)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="1000"
                        value={settings.defaultTakeProfitPips}
                        onChange={e => handleChange('defaultTakeProfitPips', parseInt(e.target.value) || 40)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Max Slippage Tolerance */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Max Slippage Tolerance</span>
                      <span className="font-mono text-[#E3000F]">{settings.maxSlippagePips} Pips</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={settings.maxSlippagePips}
                      onChange={e => handleChange('maxSlippagePips', parseInt(e.target.value))}
                      className="w-full accent-[#E3000F] cursor-pointer"
                    />
                  </div>

                  {/* Auto Trailing Stop Toggle */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Auto Trailing Stop Loss</div>
                      <div className="text-[11px] text-slate-500">Automatically trailing SL by default distance</div>
                    </div>
                    <button
                      onClick={() => handleChange('autoTrailingStop', !settings.autoTrailingStop)}
                      className={`w-10 h-5 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
                        settings.autoTrailingStop ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.autoTrailingStop ? 20 : 0 }}
                        className="w-4 h-4 rounded-full bg-white shadow-xs"
                      />
                    </button>
                  </div>
                </div>

                {/* Section 3: Feedback & Visual FX */}
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Bell className="w-4 h-4 text-sky-500" />
                    <span>Feedback & Audio</span>
                  </h4>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-slate-400" /> Sound effect on trade execution
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.audioFeedback}
                        onChange={e => handleChange('audioFeedback', e.target.checked)}
                        className="rounded border-slate-300 text-[#E3000F] focus:ring-[#E3000F] w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" /> HUD banner flash on order execution
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.screenFlashAlert}
                        onChange={e => handleChange('screenFlashAlert', e.target.checked)}
                        className="rounded border-slate-300 text-[#E3000F] focus:ring-[#E3000F] w-4 h-4"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Buttons */}
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center gap-3 shrink-0">
                <button
                  onClick={handleReset}
                  className="px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={handleSave}
                  className="flex-1 h-11 bg-[#E3000F] hover:bg-[#c9000d] text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-md shadow-red-600/20 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Quick Settings</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
