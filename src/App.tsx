import SettingsView from "./components/SettingsView";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, Info, Sparkles, X } from 'lucide-react';
import { ViewType, DisplayCurrency, MarketQuote, TradeOrder, ClosedPosition, PriceAlert, ReferralInvite } from './types';
import { useFirebaseData } from './hooks/useFirebaseData';
import { useStripePayment } from './hooks/useStripePayment';
import { safeStorage } from './utils/storage';

// Import Views
import NewsTicker from './components/NewsTicker';
import CommandMenu from './components/CommandMenu';
import QuickDepositModal from './components/QuickDepositModal';
import ReferAFriendModal from './components/ReferAFriendModal';
import VoiceNoteRecorderModal, { VoiceNote } from './components/VoiceNoteRecorderModal';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginView from './components/LoginView';
import AcademyView from './components/AcademyView';
import AdminDashboardView from './components/AdminDashboardView';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import InactivityTimerModal from './components/InactivityTimerModal';
import OnboardingTourModal from './components/OnboardingTourModal';
import EmailNotificationModal, { EmailTriggerPayload } from './components/EmailNotificationModal';

import HomeView from './components/HomeView';
import MarketsView from './components/MarketsView';
import PlatformsView from './components/PlatformsView';
import AccountsView from './components/AccountsView';
import ToolsView from './components/ToolsView';
import AboutView from './components/AboutView';
import AxiSelectView from './components/AxiSelectView';
import FundsView from './components/FundsView';
import BlogView from './components/BlogView';
import SupportView from './components/SupportView';
import LegalView from './components/LegalView';
import DashboardView from './components/DashboardView';
import FloatingLiveSupportWidget from './components/FloatingLiveSupportWidget';
// Real-time custom price alert evaluator
const INITIAL_QUOTES: Record<string, MarketQuote> = {
  // Forex
  'EURUSD': { symbol: 'EURUSD', name: 'EUR vs USD', category: 'Forex', price: 1.0845, change: 0.12, bidDiff: -0.0001, askDiff: 0.0001, spread: 0.2, history: [1.0841, 1.0843, 1.0842, 1.0847, 1.0845] },
  'GBPUSD': { symbol: 'GBPUSD', name: 'GBP vs USD', category: 'Forex', price: 1.2684, change: -0.08, bidDiff: -0.0002, askDiff: 0.0002, spread: 0.4, history: [1.2690, 1.2688, 1.2682, 1.2685, 1.2684] },
  'USDJPY': { symbol: 'USDJPY', name: 'USD vs JPY', category: 'Forex', price: 151.62, change: 0.35, bidDiff: -0.02, askDiff: 0.02, spread: 0.4, history: [151.20, 151.45, 151.58, 151.60, 151.62] },
  'AUDUSD': { symbol: 'AUDUSD', name: 'AUD vs USD', category: 'Forex', price: 0.6542, change: -0.22, bidDiff: -0.0001, askDiff: 0.0001, spread: 0.2, history: [0.6558, 0.6550, 0.6545, 0.6540, 0.6542] },
  'USDCAD': { symbol: 'USDCAD', name: 'USD vs CAD', category: 'Forex', price: 1.3560, change: 0.15, bidDiff: -0.0001, askDiff: 0.0001, spread: 0.2, history: [1.3540, 1.3550, 1.3555, 1.3560] },

  // Crypto
  'BTCUSD': { symbol: 'BTCUSD', name: 'Bitcoin CFD', category: 'Crypto', price: 67845.00, change: 2.45, bidDiff: -5.00, askDiff: 5.00, spread: 10.0, history: [66500, 67100, 67450, 67900, 67845] },
  'ETHUSD': { symbol: 'ETHUSD', name: 'Ethereum CFD', category: 'Crypto', price: 3482.50, change: 1.84, bidDiff: -0.50, askDiff: 0.50, spread: 1.0, history: [3420, 3450, 3490, 3475, 3482.50] },
  'SOLUSD': { symbol: 'SOLUSD', name: 'Solana CFD', category: 'Crypto', price: 182.40, change: 4.12, bidDiff: -0.10, askDiff: 0.10, spread: 0.2, history: [175, 178, 180, 182.40] },
  'XRPUSD': { symbol: 'XRPUSD', name: 'XRP Ripple CFD', category: 'Crypto', price: 0.6240, change: 0.95, bidDiff: -0.0005, askDiff: 0.0005, spread: 0.001, history: [0.618, 0.620, 0.622, 0.6240] },
  'DOGEUSD': { symbol: 'DOGEUSD', name: 'Dogecoin CFD', category: 'Crypto', price: 0.1620, change: 3.85, bidDiff: -0.0002, askDiff: 0.0002, spread: 0.0004, history: [0.155, 0.158, 0.160, 0.1620] },
  'ADAUSD': { symbol: 'ADAUSD', name: 'Cardano CFD', category: 'Crypto', price: 0.4850, change: -1.12, bidDiff: -0.0004, askDiff: 0.0004, spread: 0.0008, history: [0.492, 0.490, 0.488, 0.4850] },
  'AVAXUSD': { symbol: 'AVAXUSD', name: 'Avalanche CFD', category: 'Crypto', price: 35.80, change: 2.75, bidDiff: -0.05, askDiff: 0.05, spread: 0.1, history: [34.8, 35.2, 35.5, 35.80] },
  'DOTUSD': { symbol: 'DOTUSD', name: 'Polkadot CFD', category: 'Crypto', price: 7.20, change: 0.82, bidDiff: -0.01, askDiff: 0.01, spread: 0.02, history: [7.12, 7.15, 7.18, 7.20] },
  'LINKUSD': { symbol: 'LINKUSD', name: 'Chainlink CFD', category: 'Crypto', price: 17.50, change: 1.95, bidDiff: -0.02, askDiff: 0.02, spread: 0.04, history: [17.1, 17.3, 17.4, 17.50] },
  'BNBUSD': { symbol: 'BNBUSD', name: 'BNB Binance Coin CFD', category: 'Crypto', price: 588.20, change: 1.40, bidDiff: -0.20, askDiff: 0.20, spread: 0.4, history: [580, 584, 586, 588.20] },

  // Commodities
  'XAUUSD': { symbol: 'XAUUSD', name: 'Gold Spot USD', category: 'Commodities', price: 2342.80, change: 1.15, bidDiff: -0.30, askDiff: 0.30, spread: 0.6, history: [2320, 2335, 2345, 2340, 2342.80] },
  'XAGUSD': { symbol: 'XAGUSD', name: 'Silver Spot USD', category: 'Commodities', price: 28.45, change: 0.92, bidDiff: -0.02, askDiff: 0.02, spread: 0.04, history: [28.1, 28.2, 28.3, 28.45] },
  'USOUSD': { symbol: 'USOUSD', name: 'WTI Crude Oil', category: 'Commodities', price: 81.45, change: -0.65, bidDiff: -0.04, askDiff: 0.04, spread: 0.08, history: [82.10, 81.80, 81.30, 81.50, 81.45] },

  // Indices
  'US30': { symbol: 'US30', name: 'Dow Jones Index', category: 'Indices', price: 39120.00, change: 0.42, bidDiff: -3.00, askDiff: 3.00, spread: 6.0, history: [38980, 39050, 39150, 39100, 39120] },
  'SPX500': { symbol: 'SPX500', name: 'S&P 500 Index', category: 'Indices', price: 5211.50, change: 0.55, bidDiff: -0.40, askDiff: 0.40, spread: 0.8, history: [5185, 5200, 5215, 5208, 5211.50] },
  'NAS100': { symbol: 'NAS100', name: 'Nasdaq 100 Index', category: 'Indices', price: 18150.00, change: 0.88, bidDiff: -1.20, askDiff: 1.20, spread: 2.4, history: [17980, 18050, 18100, 18150] },

  // Shares / Stocks
  'AAPL': { symbol: 'AAPL', name: 'Apple Share CFD', category: 'Shares', price: 172.62, change: -0.85, bidDiff: -0.10, askDiff: 0.10, spread: 0.2, history: [174.10, 173.50, 172.40, 172.80, 172.62] },
  'TSLA': { symbol: 'TSLA', name: 'Tesla Share CFD', category: 'Shares', price: 171.05, change: -2.15, bidDiff: -0.12, askDiff: 0.12, spread: 0.24, history: [175.20, 173.80, 170.50, 171.40, 171.05] },
  'NVDA': { symbol: 'NVDA', name: 'NVIDIA Share CFD', category: 'Shares', price: 881.86, change: 4.62, bidDiff: -0.50, askDiff: 0.50, spread: 1.0, history: [842, 865, 875, 885, 881.86] },
  'MSFT': { symbol: 'MSFT', name: 'Microsoft Share CFD', category: 'Shares', price: 420.50, change: 0.92, bidDiff: -0.20, askDiff: 0.20, spread: 0.4, history: [416, 418, 419, 420.50] },
  'AMZN': { symbol: 'AMZN', name: 'Amazon Share CFD', category: 'Shares', price: 180.20, change: 1.15, bidDiff: -0.15, askDiff: 0.15, spread: 0.3, history: [177, 178.5, 179.8, 180.20] },
  'GOOGL': { symbol: 'GOOGL', name: 'Google Share CFD', category: 'Shares', price: 156.40, change: 0.45, bidDiff: -0.12, askDiff: 0.12, spread: 0.24, history: [155, 155.8, 156.1, 156.40] },
  'META': { symbol: 'META', name: 'Meta Share CFD', category: 'Shares', price: 502.10, change: 2.30, bidDiff: -0.30, askDiff: 0.30, spread: 0.6, history: [490, 495, 499, 502.10] },
  'AMD': { symbol: 'AMD', name: 'AMD Share CFD', category: 'Shares', price: 165.30, change: 1.85, bidDiff: -0.18, askDiff: 0.18, spread: 0.36, history: [162, 163.5, 164.8, 165.30] }
};

// Initial closed positions for trading history tracking
const DEFAULT_CLOSED_POSITIONS: ClosedPosition[] = [];

const DEFAULT_REFERRAL_INVITES: ReferralInvite[] = [];

export default function App() {
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isQuickDepositOpen, setIsQuickDepositOpen] = useState(false);

  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger navigation shortcuts if user is typing in form controls
      const targetTag = (e.target as HTMLElement)?.tagName;
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag) || (e.target as HTMLElement)?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandMenuOpen(true);
        return;
      }
      
      // Admin Panel Secret Access (Ctrl/Cmd + Shift + A)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        const pwd = window.prompt("Enter Admin Access Code:");
        if (pwd === "axitrading2026") {
          setView('admin');
        } else if (pwd !== null) {
          showToast("Invalid admin credentials", "error");
        }
        return;
      }

      // Power User Navigation Shortcuts (Shift + D, Shift + M, Shift + W)
      if (e.shiftKey && !e.metaKey && !e.ctrlKey && !isInputFocused) {
        if (e.key === 'D' || e.key === 'd') {
          e.preventDefault();
          setView('dashboard');
          showToast('⚡ Quick Navigation: Switched to Terminal Dashboard [Shift+D]', 'info');
        } else if (e.key === 'M' || e.key === 'm') {
          e.preventDefault();
          setView('markets');
          showToast('⚡ Quick Navigation: Switched to Live Markets [Shift+M]', 'info');
        } else if (e.key === 'W' || e.key === 'w') {
          e.preventDefault();
          setView('funds');
          showToast('⚡ Quick Navigation: Switched to Wallet & Funds [Shift+W]', 'info');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [currentView, setView] = useState<ViewType>('home');
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>(INITIAL_QUOTES);
  
  // Theme state: dark / light mode toggle
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return safeStorage.getItem('axi_theme') === 'dark';
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      safeStorage.setItem('axi_theme', next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Real-Time Display Currency Toggle State: USD ($), EUR (€), GBP (£)
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>(() => {
    const saved = safeStorage.getItem('axi_display_currency') as DisplayCurrency;
    return (saved === 'EUR' || saved === 'GBP' || saved === 'USD') ? saved : 'USD';
  });

  const handleSetDisplayCurrency = (newCurrency: DisplayCurrency) => {
    setDisplayCurrency(newCurrency);
    safeStorage.setItem('axi_display_currency', newCurrency);
    showToast(`💱 Account & Portfolio display currency changed to ${newCurrency} (${newCurrency === 'EUR' ? '€' : newCurrency === 'GBP' ? '£' : '$'})`, 'success');
  };

  const eurusdRate = quotes['EURUSD']?.price || 1.0845;
  const gbpusdRate = quotes['GBPUSD']?.price || 1.2684;

  const currencyRates: Record<DisplayCurrency, number> = useMemo(() => ({
    USD: 1.0,
    EUR: 1 / eurusdRate,
    GBP: 1 / gbpusdRate,
  }), [eurusdRate, gbpusdRate]);

  const currencySymbols: Record<DisplayCurrency, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const convertFromUSD = (usdAmount: number, targetCurrency: DisplayCurrency = displayCurrency): number => {
    const rate = currencyRates[targetCurrency] || 1.0;
    return usdAmount * rate;
  };

  const formatCurrency = (usdAmount: number, targetCurrency: DisplayCurrency = displayCurrency, decimals: number = 2): string => {
    const converted = convertFromUSD(usdAmount, targetCurrency);
    const symbol = currencySymbols[targetCurrency] || '$';
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };
  
  // Practice Trading Balance and active Demo positions
  const {
    user,
    loading,
    balance,
    setBalance,
    liveBalance,
    setLiveBalance,
    openPositions,
    addOpenPosition,
    removeOpenPosition,
    updateOpenPositionFirebase,
    setOpenPositions,
    closedPositions,
    addClosedPosition,
    transactions,
    addTransaction,
    updateTransactionStatus,
    priceAlerts,
    addPriceAlert,
    removePriceAlert,
    updatePriceAlertFirebase,
    loginWithGoogle,
    loginWithFacebook,
    loginWithEmail,
    logout
  } = useFirebaseData();


  // Auto-route authenticated users away from home/login
  useEffect(() => {
    if (!loading) {
      if (user) {
        if (currentView === 'home' || currentView === 'login') {
          setView('dashboard');
        }
      } else {
        // Not authenticated, protect secure routes
        const secureViews: ViewType[] = ['dashboard', 'settings', 'admin', 'funds'];
        if (secureViews.includes(currentView)) {
          setView('login');
        }
      }
    }
  }, [user, loading, currentView]);

  // For compatibility with components expecting set state functions, we provide wrappers where needed
  const setClosedPositions = (val: any) => {
    // If it's a function or array, handle accordingly. For simplicity, just log or handle add.
    // Ideally components should use addClosedPosition instead.
  };
  const setTransactions = (val: any) => {};

  const setPriceAlerts = (val: any) => {};


  // Real-time custom price alert evaluator
  useEffect(() => {
    priceAlerts.forEach(alert => {
      if (alert.isTriggered) return;
      const currentQuote = quotes[alert.symbol];
      if (!currentQuote) return;

      const price = currentQuote.price;
      let isTriggered = false;

      if (alert.condition === 'ABOVE' && price >= alert.targetPrice) {
        isTriggered = true;
      } else if (alert.condition === 'BELOW' && price <= alert.targetPrice) {
        isTriggered = true;
      }

      if (isTriggered) {
        setPriceAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isTriggered: true } : a));
        showToast(`🔔 Price Alert Triggered: ${alert.symbol} crossed ${alert.condition.toLowerCase()} ${alert.targetPrice.toLocaleString(undefined, { minimumFractionDigits: alert.symbol.includes('JPY') ? 2 : 4 })}! (Live Rate: ${price.toLocaleString(undefined, { minimumFractionDigits: alert.symbol.includes('JPY') ? 2 : 4 })})`, 'success');
      }
    });
  }, [quotes, priceAlerts]);

  // Registration wizard stepper status
  const [signUpStep, setSignUpStep] = useState<number>(1);

  // Floating custom notification toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useStripePayment(showToast);

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isOnboardingTourOpen, setIsOnboardingTourOpen] = useState(false);
  const [activeEmailPayload, setActiveEmailPayload] = useState<EmailTriggerPayload | null>(null);

  useEffect(() => {
    const handleEmailTrigger = (e: any) => {
      if (e.detail) {
        setActiveEmailPayload(e.detail);
        
        // Dispatch real transactional email through backend server
        fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(e.detail)
        }).catch(err => console.warn('Email API dispatch notice:', err));
      }
    };
    window.addEventListener('axi_email_trigger', handleEmailTrigger);
    return () => window.removeEventListener('axi_email_trigger', handleEmailTrigger);
  }, []);

  // Saved Voice Notes State
  const [savedVoiceNotes, setSavedVoiceNotes] = useState<VoiceNote[]>(() => {
    const saved = safeStorage.getItem('axi_voice_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'NOTE-101',
        title: 'XAUUSD Scalping Levels',
        transcript: 'Key resistance for Gold at 2355. Looking to enter long on pullback near 2338 with stop loss at 2325.',
        category: 'Market Analysis',
        createdAt: 'Jul 26, 2026, 10:15 AM',
        durationSeconds: 14
      }
    ];
  });

  useEffect(() => {
    safeStorage.setItem('axi_voice_notes', JSON.stringify(savedVoiceNotes));
  }, [savedVoiceNotes]);

  const handleSaveVoiceNote = (newNote: VoiceNote) => {
    setSavedVoiceNotes(prev => [newNote, ...prev]);
  };

  const handleDeleteVoiceNote = (id: string) => {
    setSavedVoiceNotes(prev => prev.filter(n => n.id !== id));
    showToast('Voice note removed.', 'info');
  };

  // Refer-a-Friend Invites State
  const [referralInvites, setReferralInvites] = useState<ReferralInvite[]>(() => {
    const saved = safeStorage.getItem('axi_referral_invites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_REFERRAL_INVITES;
  });

  useEffect(() => {
    safeStorage.setItem('axi_referral_invites', JSON.stringify(referralInvites));
  }, [referralInvites]);

  const addReferralInvite = (newInvite: ReferralInvite) => {
    setReferralInvites(prev => [newInvite, ...prev]);
  };

  const updateReferralInviteStatus = (id: string, status: 'Invited' | 'Registered' | 'Funded' | 'Claimed') => {
    setReferralInvites(prev => prev.map(inv => inv.id === id ? { ...inv, status, claimed: status === 'Claimed' ? true : inv.claimed } : inv));
  };

  const claimReferralBonus = (amount: number, friendName: string) => {
    setLiveBalance(prev => prev + amount);
    showToast(`🎉 REFERRAL CASH CLAIMED: $${amount.toLocaleString()} credited to your Live Trading balance from ${friendName}'s referral!`, 'success');
  };

  // Session Inactivity Timer & Security Modal
  const [isInactiveWarningOpen, setIsInactiveWarningOpen] = useState(false);
  const [inactivitySeconds, setInactivitySeconds] = useState(30);
  const lastActivityRef = React.useRef<number>(Date.now());

  // Trigger welcome email automatically on new login
  useEffect(() => {
    // Auto trigger onboarding tour modal after first login
    if (user) {
      const tourCompleted = safeStorage.getItem('axi_onboarding_completed');
      if (!tourCompleted) {
        const timer = setTimeout(() => {
          setIsOnboardingTourOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  // Track user activity (mouse, key, touch, scroll)
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(evt => window.addEventListener(evt, updateActivity, { passive: true }));

    return () => {
      events.forEach(evt => window.removeEventListener(evt, updateActivity));
    };
  }, []);

  // Session inactivity monitor loop (checks every 1 second)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      // Only monitor if logged in or active in dashboard
      if (!user && currentView !== 'dashboard') return;

      const idleMs = Date.now() - lastActivityRef.current;
      const idleSeconds = Math.floor(idleMs / 1000);

      // Trigger inactivity warning modal at 120 seconds (2 minutes)
      if (idleSeconds >= 1800 && !isInactiveWarningOpen) {
        setIsInactiveWarningOpen(true);
        setInactivitySeconds(30);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [user, currentView, isInactiveWarningOpen]);

  // Countdown timer when warning modal is displayed
  useEffect(() => {
    if (!isInactiveWarningOpen) return;

    const countdownTimer = setInterval(() => {
      setInactivitySeconds(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          setIsInactiveWarningOpen(false);
          logout();
          setView('home');
          showToast('Logged out automatically due to 2 minutes of inactivity for account security.', 'error');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [isInactiveWarningOpen, logout]);

  const handleExtendSession = () => {
    lastActivityRef.current = Date.now();
    setIsInactiveWarningOpen(false);
    setInactivitySeconds(30);
    showToast('Axi Account Session renewed successfully.', 'success');
  };

  const handleLogoutNow = () => {
    setIsInactiveWarningOpen(false);
    logout();
    setView('home');
    showToast('Logged out of Axi account.', 'info');
  };

  // Poll server live quotes to maintain actual live-updating dashboard rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('/api/markets/quotes');
        if (response.ok) {
          const liveData = await response.json();
          setQuotes(prev => {
            const updated = { ...prev };
            for (const sym in liveData) {
              if (updated[sym]) {
                updated[sym] = {
                  ...updated[sym],
                  price: liveData[sym].price,
                  change: liveData[sym].change,
                  bidDiff: liveData[sym].bidDiff,
                  askDiff: liveData[sym].askDiff
                };
              } else {
                updated[sym] = {
                  symbol: sym,
                  name: sym,
                  category: 'Forex',
                  price: liveData[sym].price,
                  change: liveData[sym].change,
                  high: liveData[sym].price * 1.01,
                  low: liveData[sym].price * 0.99,
                  spread: 0.1,
                  bidDiff: liveData[sym].bidDiff,
                  askDiff: liveData[sym].askDiff
                };
              }
            }
            return updated;
          });
        }
      } catch (err) {
        // Keep verified real market quotes unchanged during transient server reconnects
      }
    };

    fetchRates();
    const rateTimer = setInterval(fetchRates, 2500);
    return () => clearInterval(rateTimer);
  }, []);

  // Live Position P&L tracking cycle
  useEffect(() => {
    const trackingTimer = setInterval(() => {
      setOpenPositions(prev => prev.map(pos => {
        const livePrice = quotes[pos.symbol]?.price || pos.entryPrice;
        
        // Multipliers based on asset contract specifications
        const multiplier = pos.symbol === 'BTCUSD' ? 1 : pos.symbol === 'XAUUSD' ? 100 : 100000;
        let profit = 0;

        if (pos.type === 'BUY') {
          profit = (livePrice - pos.entryPrice) * pos.volume * multiplier;
        } else {
          profit = (pos.entryPrice - livePrice) * pos.volume * multiplier;
        }

        return {
          ...pos,
          currentPrice: livePrice,
          profit: Number(profit.toFixed(2))
        };
      }));
    }, 1500);

    return () => clearInterval(trackingTimer);
  }, [quotes]);

  const openSignUpWizard = () => {
    setView('accounts');
    setSignUpStep(1);
    const elem = document.getElementById('account-creation-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  // Compile a string for the header status bar ticker
  const buildTickerText = () => {
    const pairs = ['EURUSD', 'BTCUSD', 'XAUUSD', 'GBPUSD'];
    return pairs.map(p => {
      const q = quotes[p];
      if (!q) return '';
      return `${p}: ${q.price.toLocaleString(undefined, { minimumFractionDigits: p === 'EURUSD' ? 4 : 2 })} (${q.change >= 0 ? '+' : ''}${q.change.toFixed(2)}%)`;
    }).join('  |  ');
  };

  return (
    <div className={`min-h-screen transition-colors duration-700 ease-in-out ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-brand-light text-slate-850'} flex flex-col font-sans selection:bg-brand-red selection:text-white`}>
      
      {/* Universal Responsive Header */}
      {currentView !== 'login' && <Header 
        currentView={currentView} 
        setView={setView} 
        openSignUp={openSignUpWizard} 
        tickerQuoteText={buildTickerText()} 
        user={user}
        login={loginWithGoogle}
        logout={logout}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        showToast={showToast}
        openQuickDeposit={() => setIsQuickDepositOpen(true)}
        openReferModal={() => setIsReferModalOpen(true)}
        openVoiceModal={() => setIsVoiceModalOpen(true)}
        displayCurrency={displayCurrency}
        setDisplayCurrency={handleSetDisplayCurrency}
        formatCurrency={formatCurrency}
        liveBalance={liveBalance}
        balance={balance}
      />}

      {/* Main Render Section with transitions */}
      <AnimatePresence mode="wait">
        <motion.main
          key={currentView}
          className="flex-grow"
          initial={{ opacity: 0, y: 16, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.995 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
                    {currentView === 'login' && (
            <LoginView 
              setView={setView} 
              login={loginWithGoogle} 
              loginWithFacebook={loginWithFacebook}
              loginWithEmail={loginWithEmail}
              openSignUp={openSignUpWizard} 
              openForgotPassword={() => setIsForgotPasswordOpen(true)}
              showToast={showToast}
            />
          )}
{currentView === 'home' && (
            <HomeView 
              quotes={quotes} 
              setView={setView} 
              openSignUp={openSignUpWizard} 
            />
          )}

          {currentView === 'markets' && (
            <MarketsView 
              quotes={quotes} 
              setQuotes={setQuotes}
              openPositions={openPositions}
              setOpenPositions={setOpenPositions}
              addOpenPosition={addOpenPosition}
              showToast={showToast}
              balance={balance}
              setBalance={setBalance}
              liveBalance={liveBalance}
              setLiveBalance={setLiveBalance}
              closedPositions={closedPositions}
              setClosedPositions={setClosedPositions}
              priceAlerts={priceAlerts}
              setPriceAlerts={setPriceAlerts}
              setView={setView}
            />
          )}

          {currentView === 'platforms' && (
            <PlatformsView />
          )}

          {currentView === 'accounts' && (
            <AccountsView 
              showToast={showToast}
              openSignUp={openSignUpWizard}
              signUpStep={signUpStep}
              setSignUpStep={setSignUpStep}
              setView={setView}
            />
          )}

          {currentView === 'tools' && (
            <ToolsView quotes={quotes} showToast={showToast}  />
          )}

          {currentView === 'about' && (
            <AboutView showToast={showToast}  />
          )}

          {currentView === 'select' && (
            <AxiSelectView showToast={showToast} />
          )}

          {currentView === 'funds' && (
            <FundsView 
              balance={balance} 
              setBalance={setBalance} 
              liveBalance={liveBalance}
              setLiveBalance={setLiveBalance}
              showToast={showToast} 
              transactions={transactions}
              setTransactions={setTransactions}
              addTransaction={addTransaction}
              updateTransactionStatus={updateTransactionStatus}
              setView={setView}
              displayCurrency={displayCurrency}
              setDisplayCurrency={handleSetDisplayCurrency}
              formatCurrency={formatCurrency}
              convertFromUSD={convertFromUSD}
            />
          )}

          {currentView === 'blog' && (
            <BlogView showToast={showToast}  />
          )}

          {currentView === 'support' && (
            <SupportView showToast={showToast} openVoiceModal={() => setIsVoiceModalOpen(true)} />
          )}

          {currentView === 'legal' && (
            <LegalView showToast={showToast}  />
          )}

          {currentView === 'settings' && (
            <SettingsView user={user} showToast={showToast} setView={setView} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
          )}
          {currentView === 'admin' && <AdminDashboardView setView={setView} showToast={showToast} transactions={transactions} updateTransactionStatus={updateTransactionStatus} liveBalance={liveBalance} setLiveBalance={setLiveBalance} formatCurrency={formatCurrency} displayCurrency={displayCurrency} setDisplayCurrency={handleSetDisplayCurrency} />}
          {currentView === 'dashboard' && (
            <DashboardView
              balance={balance}
              setBalance={setBalance}
              liveBalance={liveBalance}
              setLiveBalance={setLiveBalance}
              showToast={showToast}
              openPositions={openPositions}
              setOpenPositions={setOpenPositions}
              addOpenPosition={addOpenPosition}
              closedPositions={closedPositions}
              transactions={transactions}
              user={user}
              quotes={quotes}
              setView={setView}
              openReferModal={() => setIsReferModalOpen(true)}
              openVoiceModal={() => setIsVoiceModalOpen(true)}
              openOnboardingTour={() => setIsOnboardingTourOpen(true)}
              displayCurrency={displayCurrency}
              setDisplayCurrency={handleSetDisplayCurrency}
              formatCurrency={formatCurrency}
              convertFromUSD={convertFromUSD}
            />
          )}
        </motion.main>
      </AnimatePresence>

      {/* Universal Footer Disclosures */}
      {currentView !== 'login' && <Footer setView={setView} />}

      {/* Floating Live Support Assistant Widget */}
      <FloatingLiveSupportWidget setView={setView} showToast={showToast} />

      {/* Floating Toast Notification Box */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 flex items-start gap-3 border-l-4 border-l-brand-red"
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-brand-red" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-brand-yellow fill-brand-yellow/10" />}
            </div>
            
            <div className="flex-grow flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-brand-red tracking-wider">Axi Secure System Alert</span>
              <p className="text-xs text-slate-700 font-bold leading-relaxed pr-6">{toast.message}</p>
            </div>

            <button 
              onClick={() => setToast(null)}
              className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-700 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {isCommandMenuOpen && (
          <CommandMenu 
            isOpen={isCommandMenuOpen} 
            setIsOpen={setIsCommandMenuOpen} 
            setView={setView} 
            openReferModal={() => setIsReferModalOpen(true)}
            openVoiceModal={() => setIsVoiceModalOpen(true)}
            openOnboardingTour={() => setIsOnboardingTourOpen(true)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isQuickDepositOpen && (
          <QuickDepositModal 
            isOpen={isQuickDepositOpen} 
            onClose={() => setIsQuickDepositOpen(false)} 
            showToast={showToast}
            balance={balance}
            setBalance={setBalance}
            liveBalance={liveBalance}
            setLiveBalance={setLiveBalance}
            addTransaction={addTransaction}
            displayCurrency={displayCurrency}
            setDisplayCurrency={handleSetDisplayCurrency}
            formatCurrency={formatCurrency}
          />
        )}
      </AnimatePresence>

      {/* Refer-a-Friend Modal */}
      <AnimatePresence>
        {isReferModalOpen && (
          <ReferAFriendModal
            isOpen={isReferModalOpen}
            onClose={() => setIsReferModalOpen(false)}
            user={user}
            showToast={showToast}
            referralInvites={referralInvites}
            onAddInvite={addReferralInvite}
            onUpdateInviteStatus={updateReferralInviteStatus}
            onClaimBonus={claimReferralBonus}
            liveBalance={liveBalance}
          />
        )}
      </AnimatePresence>

      {/* Voice Note & Speech Dictation Studio Modal */}
      <VoiceNoteRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        showToast={showToast}
        savedNotes={savedVoiceNotes}
        onSaveNote={handleSaveVoiceNote}
        onDeleteNote={handleDeleteVoiceNote}
        onSubmitSupportTicket={(ticket) => {
          showToast(`🎧 Support ticket #${Math.floor(100000 + Math.random() * 900000)} created from voice dictation!`, 'success');
          setView('support');
        }}
      />

      {/* Forgot Password / Account Recovery Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        showToast={showToast}
        onSuccessLogin={() => {
          setIsForgotPasswordOpen(false);
          setView('login');
        }}
      />

      {/* Session Inactivity Timeout Warning Modal */}
      <InactivityTimerModal
        isOpen={isInactiveWarningOpen}
        secondsRemaining={inactivitySeconds}
        totalSeconds={30}
        onExtendSession={handleExtendSession}
        onLogoutNow={handleLogoutNow}
      />

      {/* Light-weight Guided Onboarding Tour Modal */}
      <OnboardingTourModal
        isOpen={isOnboardingTourOpen}
        onClose={() => setIsOnboardingTourOpen(false)}
        setView={setView}
        showToast={showToast}
      />

      {/* Official Dispatch Email Notification Modal */}
      <EmailNotificationModal
        payload={activeEmailPayload}
        onClose={() => setActiveEmailPayload(null)}
        onViewAccount={() => setView('dashboard')}
      />
    </div>
  );
}
