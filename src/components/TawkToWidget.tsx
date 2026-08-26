import React, { useEffect, useState } from 'react';
import { MessageSquare, ShieldCheck, ExternalLink, Headset, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getTawkToConfig, 
  loadTawkToScript, 
  setTawkToVisitorAttributes, 
  openTawkToChat, 
  fetchBackendTawkToConfig,
  TawkToConfig 
} from '../utils/tawkto';

interface TawkToWidgetProps {
  currentUser?: {
    name?: string;
    email?: string;
    accountNo?: string;
    balance?: number | string;
    accountType?: string;
    status?: string;
  } | null;
}

export default function TawkToWidget({ currentUser }: TawkToWidgetProps) {
  const [config, setConfig] = useState<TawkToConfig>(() => getTawkToConfig());
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showQuickPopup, setShowQuickPopup] = useState(false);

  // Initialize and listen for config changes
  useEffect(() => {
    // 1. Fetch backend config on mount to guarantee latest credentials
    fetchBackendTawkToConfig().then((fetched) => {
      if (fetched) {
        setConfig(fetched);
        loadTawkToScript(fetched, true);
      }
    });

    const handleConfigUpdate = (e: any) => {
      const updatedConfig = e.detail || getTawkToConfig();
      setConfig(updatedConfig);
      loadTawkToScript(updatedConfig, true);
    };

    window.addEventListener('axi_tawkto_config_updated', handleConfigUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'axi_tawkto_config') {
        const updated = getTawkToConfig();
        setConfig(updated);
        loadTawkToScript(updated, true);
      }
    });

    // 2. Load script immediately
    loadTawkToScript(config, true);

    // 3. Listen for Tawk.to API ready
    const checkInterval = setInterval(() => {
      if ((window as any).Tawk_API && typeof (window as any).Tawk_API.maximize === 'function') {
        setIsScriptLoaded(true);
        clearInterval(checkInterval);
      }
    }, 1000);

    return () => {
      window.removeEventListener('axi_tawkto_config_updated', handleConfigUpdate);
      clearInterval(checkInterval);
    };
  }, []);

  // Update visitor attributes when user changes
  useEffect(() => {
    if (currentUser) {
      setTawkToVisitorAttributes({
        name: currentUser.name,
        email: currentUser.email,
        accountNo: currentUser.accountNo,
        balance: currentUser.balance,
        accountType: currentUser.accountType,
        status: currentUser.status
      });
    }
  }, [currentUser, config]);

  if (!config.enabled) return null;

  const handleLaunchChat = () => {
    const success = openTawkToChat();
    if (!success) {
      // Direct link fallback
      const url = config.directChatUrl || `https://tawk.to/chat/${config.propertyId || '6a877895e687441d49b91140'}/${config.widgetId || 'default'}`;
      window.open(url, 'TawkToChat', 'width=450,height=680,toolbar=no,menubar=no');
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2 pointer-events-auto">
      {/* Floating Prompt Bubble on Hover or First Load */}
      <AnimatePresence>
        {showQuickPopup && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="bg-slate-900 text-white border border-slate-700 shadow-2xl rounded-2xl p-4 max-w-xs mb-1"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-black uppercase text-emerald-400">Axi Live Officer Online</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Need assistance with deposits, withdrawals, or account verification? Click to start live chat.
            </p>
            <button
              onClick={handleLaunchChat}
              className="mt-3 w-full bg-[#E3000F] hover:bg-[#c0000d] text-white text-xs font-black py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Start Live Conversation
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Floating Live Chat Launcher Button */}
      <motion.button
        type="button"
        id="tawkto-floating-launcher-btn"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={handleLaunchChat}
        onMouseEnter={() => setShowQuickPopup(true)}
        onMouseLeave={() => setShowQuickPopup(false)}
        className="bg-slate-950 hover:bg-slate-900 text-white pl-4 pr-5 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-emerald-500/80 cursor-pointer group transition-all"
        style={{ boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 15px 0 rgba(16, 185, 129, 0.4)' }}
        aria-label="Open Axi Live Support Chat"
      >
        <div className="relative flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-[#E3000F] flex items-center justify-center text-white font-black text-xs shadow-md">
            <MessageSquare className="w-4 h-4 fill-white text-white" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-950 rounded-full animate-ping" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
        </div>

        <div className="flex flex-col text-left">
          <span className="text-xs font-black tracking-wide text-white flex items-center gap-1">
            Live Support
          </span>
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 24/7 Live Online
          </span>
        </div>
      </motion.button>
    </div>
  );
}

