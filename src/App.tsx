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
import EmailActionPage from './components/EmailActionPage';
import InactivityTimerModal from './components/InactivityTimerModal';
import OnboardingTourModal from './components/OnboardingTourModal';

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
import PartnersView from './components/PartnersView';
import PromotionsView from './components/PromotionsView';
import ForexVpsView from './components/ForexVpsView';
import EconomicCalendar from './components/EconomicCalendar';
import TawkToWidget from './components/TawkToWidget';
import { ASSET_METADATA } from './data';
import { liveMarketFeed } from './services/liveMarketFeed';

// Price shells contain metadata only. liveMarketFeed supplies all prices.
const INITIAL_QUOTES: Record<string, MarketQuote> = Object.entries(ASSET_METADATA).reduce((acc, [symbol, meta]) => {
  acc[symbol] = { symbol, name: meta.name, category: meta.category, price: 0, change: 0, bidDiff: undefined, askDiff: undefined, spread: 0, history: [], lastUpdated: 0, stale: true, status: 'unavailable' };
  return acc;
}, {} as Record<string, MarketQuote>);

const DEFAULT_CLOSED_POSITIONS: ClosedPosition[] = [];
const DEFAULT_REFERRAL_INVITES: ReferralInvite[] = [];

export default function App() {
  // AXI_EMAIL_ACTION_ROUTING_V1
  const ep=new URLSearchParams(window.location.search); const em=ep.get('mode'); const ec=ep.get('oobCode');
  if((window.location.pathname==='/reset-password'||window.location.pathname==='/verify-email')&&em&&ec)return <EmailActionPage />;
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isQuickDepositOpen, setIsQuickDepositOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag) || (e.target as HTMLElement)?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandMenuOpen(true);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setView('admin');
        return;
      }

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

  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>(() => {
    const saved = safeStorage.getItem('axi_display_currency') as DisplayCurrency;
    return (saved === 'EUR' || saved === 'GBP' || saved === 'USD') ? saved : 'USD';
  });

  const handleSetDisplayCurrency = (newCurrency: DisplayCurrency) => {
    setDisplayCurrency(newCurrency);
    safeStorage.setItem('axi_display_currency', newCurrency);
    showToast(`💱 Account & Portfolio display currency changed to ${newCurrency} (${newCurrency === 'EUR' ? '€' : newCurrency === 'GBP' ? '£' : '$'})`, 'success');
  };

  const eurusdRate = quotes['EURUSD']?.price || 0;
  const gbpusdRate = quotes['GBPUSD']?.price || 0;

  const currencyRates: Record<DisplayCurrency, number> = useMemo(() => ({
    USD: 1.0,
    EUR: eurusdRate > 0 ? 1 / eurusdRate : 0,
    GBP: gbpusdRate > 0 ? 1 / gbpusdRate : 0,
  }), [eurusdRate, gbpusdRate]);

  const currencySymbols: Record<DisplayCurrency, string> = { USD: '$', EUR: '€', GBP: '£' };
  const convertFromUSD = (usdAmount: number, targetCurrency: DisplayCurrency = displayCurrency): number => {
    const rate = currencyRates[targetCurrency];
    if (!Number.isFinite(rate) || rate <= 0) return usdAmount;
    return usdAmount * rate;
  };
  const formatCurrency = (usdAmount: number, targetCurrency: DisplayCurrency = displayCurrency, decimals: number = 2): string => {
    const converted = convertFromUSD(usdAmount, targetCurrency);
    const symbol = currencySymbols[targetCurrency] || '$';
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  const { user, loading, balance, setBalance, liveBalance, setLiveBalance, openPositions, addOpenPosition, removeOpenPosition, updateOpenPositionFirebase, setOpenPositions, closedPositions, addClosedPosition, transactions, addTransaction, updateTransactionStatus, priceAlerts, addPriceAlert, removePriceAlert, updatePriceAlertFirebase, loginWithGoogle, loginWithFacebook, loginWithEmail, logout } = useFirebaseData();

  const isAdminUser = !!user?.email && ['leephil1907@gmail.com', 'admin@axi.com', 'axicustomersupport@gmail.com'].includes(user.email.toLowerCase());

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (currentView === 'admin' && !isAdminUser) {
          setView('dashboard');
          return;
        }
        if (currentView === 'home' || currentView === 'login') setView('dashboard');
      } else if (currentView !== 'home' && currentView !== 'markets' && currentView !== 'login' && currentView !== 'about' && currentView !== 'support' && currentView !== 'legal') {
        setView('login');
      }
    }
  }, [loading, user, currentView, isAdminUser]);

  // Remaining application logic is preserved below.
