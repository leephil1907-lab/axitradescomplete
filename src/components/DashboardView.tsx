import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, CreditCard, Landmark, Banknote, Wallet, CheckCircle2, TrendingUp, History, Lock, 
  Plus, ArrowRight, ShieldCheck, ChevronDown, MoreVertical, MessageSquare, Download, 
  FileText, Printer, Bell, BellRing, Check, Trash2, AlertTriangle, Gift, Mic, BarChart2,
  LayoutGrid, Search, Filter, ArrowUpDown, Sparkles, TrendingDown, Layers, Calendar, 
  DollarSign, Percent, Award, AlertCircle, RefreshCw, Clock, ExternalLink, RotateCcw, GripVertical,
  Zap, HelpCircle, Maximize2, Minimize2, Sliders, Users
} from 'lucide-react';
import { TradeOrder, ClosedPosition, ViewType, DisplayCurrency } from '../types';
import CurrencySelector from './CurrencySelector';
import IdentityVerificationModal from './IdentityVerificationModal';
import BalanceHistoryChart from './BalanceHistoryChart';
import TradingPerformanceHeatmap from './TradingPerformanceHeatmap';
import PortfolioCompositionChart from './PortfolioCompositionChart';
import FinancialNewsTicker from './FinancialNewsTicker';
import MilestoneProgressBar from './MilestoneProgressBar';
import MarketSentimentWidget from './MarketSentimentWidget';
import QuickSettingsDrawer from './QuickSettingsDrawer';
import CopyTradeSection from './CopyTradeSection';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { WidgetWrapper, AccountSummaryWidget, OpenPositionsWidget, MarketWatchWidget, LiveChartWidget, PortfolioDonutWidget, DividendCalendarWidget } from './DashboardWidgets';
import RiskDisclosureModal from './RiskDisclosureModal';
import TradeConfirmationDrawer, { TradeOrderSummary } from './TradeConfirmationDrawer';
import SwapModal from './SwapModal';

interface DashboardViewProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  liveBalance: number;
  setLiveBalance: React.Dispatch<React.SetStateAction<number>>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openPositions: TradeOrder[];
  setOpenPositions?: React.Dispatch<React.SetStateAction<TradeOrder[]>>;
  addOpenPosition?: (position: TradeOrder) => void;
  closedPositions: ClosedPosition[];
  transactions?: any[];
  user?: any;
  quotes?: Record<string, any>;
  setView: (view: ViewType) => void;
  openReferModal?: () => void;
  openVoiceModal?: () => void;
  openOnboardingTour?: () => void;
  displayCurrency?: DisplayCurrency;
  setDisplayCurrency?: (curr: DisplayCurrency) => void;
  formatCurrency?: (usdAmount: number, targetCurrency?: DisplayCurrency, decimals?: number) => string;
  convertFromUSD?: (usdAmount: number, targetCurrency?: DisplayCurrency) => number;
}

export default function DashboardView({ 
  balance, 
  setBalance, 
  liveBalance, 
  setLiveBalance, 
  showToast, 
  openPositions, 
  setOpenPositions, 
  addOpenPosition, 
  closedPositions, 
  transactions = [],
  user,
  quotes, 
  setView, 
  openReferModal, 
  openVoiceModal, 
  openOnboardingTour,
  displayCurrency = 'USD',
  setDisplayCurrency,
  formatCurrency = (amt) => `$${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  convertFromUSD = (amt) => amt
}: DashboardViewProps) {
  const [accountMode, setAccountMode] = useState<'demo' | 'live'>('live');
  const [activeTab, setActiveTab] = useState<'overview' | 'closed_positions' | 'analytics' | 'copy_trading'>('overview');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Dashboard Layout Density State ('standard' | 'compact')
  const [viewDensity, setViewDensity] = useState<'standard' | 'compact'>('standard');

  // Keyboard Shortcut Trading System State
  const [selectedSymbol, setSelectedSymbol] = useState<string>('EURUSD');
  const [shortcutLotSize, setShortcutLotSize] = useState<number>(1.0);
  const [shortcutsEnabled, setShortcutsEnabled] = useState<boolean>(true);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState<boolean>(false);
  const [lastShortcutOrder, setLastShortcutOrder] = useState<{
    type: 'BUY' | 'SELL';
    symbol: string;
    price: number;
    time: string;
    lot: number;
  } | null>(null);

  // Risk Disclosure & Trade Confirmation Drawer States
  const [isRiskModalOpen, setIsRiskModalOpen] = useState<boolean>(false);
  const [pendingTradeOrder, setPendingTradeOrder] = useState<TradeOrderSummary | null>(null);

  const [isTradeDrawerOpen, setIsTradeDrawerOpen] = useState<boolean>(false);
  const [tradeDrawerData, setTradeDrawerData] = useState<TradeOrderSummary | null>(null);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState<boolean>(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);

  // Initiate Trade (checks Risk Disclosure first, then opens Confirmation Drawer)
  const handleInitiateTrade = React.useCallback((type: 'BUY' | 'SELL', symbolOverride?: string, volumeOverride?: number) => {
    if (!shortcutsEnabled) return;

    const sym = symbolOverride || selectedSymbol;
    const vol = volumeOverride || shortcutLotSize;

    const currentPrice = quotes?.[sym]?.price || (
      sym === 'BTCUSD' ? 67845 : 
      sym === 'XAUUSD' ? 2342.8 : 
      sym === 'USDJPY' ? 151.62 : 
      sym === 'GBPUSD' ? 1.2684 : 1.0845
    );

    const orderSummary: TradeOrderSummary = {
      symbol: sym,
      type,
      price: currentPrice,
      volume: vol,
      accountMode
    };

    const isRiskAcknowledged = localStorage.getItem('axi_risk_disclosure_acknowledged') === 'true';

    if (!isRiskAcknowledged) {
      setPendingTradeOrder(orderSummary);
      setIsRiskModalOpen(true);
    } else {
      setTradeDrawerData(orderSummary);
      setIsTradeDrawerOpen(true);
    }
  }, [shortcutsEnabled, selectedSymbol, shortcutLotSize, quotes, accountMode]);

  // Callback when Risk Disclosure is accepted
  const handleRiskAcknowledged = () => {
    setIsRiskModalOpen(false);
    if (pendingTradeOrder) {
      setTradeDrawerData(pendingTradeOrder);
      setIsTradeDrawerOpen(true);
      setPendingTradeOrder(null);
    }
  };

  // Final Trade Execution after confirmation in drawer
  const handleConfirmFinalTrade = React.useCallback((finalOrder: {
    symbol: string;
    type: 'BUY' | 'SELL';
    price: number;
    volume: number;
    stopLoss?: number;
    takeProfit?: number;
    leverage: string;
  }) => {
    const newOrder: TradeOrder = {
      id: `AXI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      symbol: finalOrder.symbol,
      type: finalOrder.type,
      entryPrice: finalOrder.price,
      currentPrice: finalOrder.price,
      volume: finalOrder.volume,
      profit: 0.00,
      timestamp: new Date().toISOString(),
    };

    if (addOpenPosition) {
      addOpenPosition(newOrder);
    } else if (setOpenPositions) {
      setOpenPositions(prev => [...prev, newOrder]);
    }

    const priceDigits = finalOrder.symbol.includes('JPY') ? 2 : finalOrder.symbol.includes('USD') && !finalOrder.symbol.includes('BTC') && !finalOrder.symbol.includes('XAU') ? 5 : 2;
    const formattedPrice = finalOrder.price.toLocaleString(undefined, { minimumFractionDigits: priceDigits });

    showToast(
      `⚡ Market Order Executed! ${finalOrder.type} ${finalOrder.volume} Lot ${finalOrder.symbol} @ ${formattedPrice} [Lev: ${finalOrder.leverage}]`,
      'success'
    );

    // Log persistent trading activity notification
    const newNotif = {
      id: `notif-trade-${Date.now()}`,
      title: `Trade Executed: ${finalOrder.type} ${finalOrder.volume} Lot ${finalOrder.symbol}`,
      message: `Market order filled at ${formattedPrice} [${accountMode.toUpperCase()}]. Leverage: ${finalOrder.leverage}. SL: ${finalOrder.stopLoss || 'None'}, TP: ${finalOrder.takeProfit || 'None'}. Order ID: ${newOrder.id}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'trading' as const,
      category: 'Trading Activity' as const,
      read: false,
      symbol: finalOrder.symbol,
      price: finalOrder.price
    };
    setNotifications(prev => [newNotif, ...prev]);

    setLastShortcutOrder({
      type: finalOrder.type,
      symbol: finalOrder.symbol,
      price: finalOrder.price,
      time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      lot: finalOrder.volume
    });
  }, [addOpenPosition, setOpenPositions, showToast, accountMode]);

  // Global Keyboard Event Listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in inputs, textareas, contenteditable or select
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        return;
      }

      if (e.shiftKey && (e.key === 'B' || e.key === 'b')) {
        e.preventDefault();
        handleInitiateTrade('BUY');
      } else if (e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        handleInitiateTrade('SELL');
      } else if (e.key === '?' || (e.shiftKey && (e.key === 'H' || e.key === 'h'))) {
        e.preventDefault();
        setIsShortcutHelpOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInitiateTrade]);

  // Closed Positions Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [pnlFilter, setPnlFilter] = useState<'ALL' | 'PROFIT' | 'LOSS'>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'pnl_desc' | 'pnl_asc' | 'symbol'>('date_desc');

  // Unified Closed Positions
  const effectiveClosedPositions = useMemo(() => {
    return closedPositions || [];
  }, [closedPositions]);

  // Filtered and Sorted Positions for the dedicated tab
  const filteredClosedPositions = useMemo(() => {
    return effectiveClosedPositions.filter(pos => {
      // Search term
      const matchesSearch = 
        pos.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pos.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pos.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Type filter
      const matchesType = typeFilter === 'ALL' || pos.type === typeFilter;

      // P&L filter
      const matchesPnl = 
        pnlFilter === 'ALL' || 
        (pnlFilter === 'PROFIT' && pos.profit >= 0) || 
        (pnlFilter === 'LOSS' && pos.profit < 0);

      return matchesSearch && matchesType && matchesPnl;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.exitTime || b.entryTime || 0).getTime() - new Date(a.exitTime || a.entryTime || 0).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.exitTime || a.entryTime || 0).getTime() - new Date(b.exitTime || b.entryTime || 0).getTime();
      }
      if (sortBy === 'pnl_desc') {
        return b.profit - a.profit;
      }
      if (sortBy === 'pnl_asc') {
        return a.profit - b.profit;
      }
      if (sortBy === 'symbol') {
        return a.symbol.localeCompare(b.symbol);
      }
      return 0;
    });
  }, [effectiveClosedPositions, searchTerm, typeFilter, pnlFilter, sortBy]);

  // KPI Statistics
  const closedStats = useMemo(() => {
    const total = effectiveClosedPositions.length;
    const totalPnL = effectiveClosedPositions.reduce((acc, p) => acc + p.profit, 0);
    const wins = effectiveClosedPositions.filter(p => p.profit > 0);
    const losses = effectiveClosedPositions.filter(p => p.profit < 0);
    const winRate = total > 0 ? (wins.length / total) * 100 : 0;
    const avgPnL = total > 0 ? totalPnL / total : 0;

    const bestWin = wins.length > 0 ? Math.max(...wins.map(w => w.profit)) : 0;
    const worstLoss = losses.length > 0 ? Math.min(...losses.map(l => l.profit)) : 0;

    return { total, totalPnL, winCount: wins.length, lossCount: losses.length, winRate, avgPnL, bestWin, worstLoss };
  }, [effectiveClosedPositions]);

  // Activity & Price Alert Notifications State
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'alert' | 'trading' | 'system' | 'info' | 'success';
    category: 'Price Alerts' | 'Trading Activity' | 'System & Account';
    read: boolean;
    symbol?: string;
    price?: number;
  }>>([
    {
      id: 'notif-1',
      title: 'Price Alert: BTCUSD Resistance Breakout',
      message: 'Bitcoin touched $67,500.00 target level. Bullish momentum acceleration detected.',
      time: '10 mins ago',
      type: 'alert',
      category: 'Price Alerts',
      read: false,
      symbol: 'BTCUSD',
      price: 67500
    },
    {
      id: 'notif-2',
      title: 'Trade Executed: BUY 1.0 Lot EURUSD @ 1.0845',
      message: 'Rapid Market Order executed cleanly via Shift+B keyboard shortcut.',
      time: '28 mins ago',
      type: 'trading',
      category: 'Trading Activity',
      read: false,
      symbol: 'EURUSD',
      price: 1.0845
    },
    {
      id: 'notif-3',
      title: 'Deposit Verification Approved',
      message: '$10,000.00 wire transfer credited to Live MT4 Account #8849201.',
      time: '1 hour ago',
      type: 'success',
      category: 'System & Account',
      read: false
    },
    {
      id: 'notif-4',
      title: 'Price Alert: XAUUSD Gold Surge',
      message: 'Spot Gold crossed $2,342.50 target level on inflation data release.',
      time: '2 hours ago',
      type: 'alert',
      category: 'Price Alerts',
      read: true,
      symbol: 'XAUUSD',
      price: 2342.5
    },
    {
      id: 'notif-5',
      title: 'Position Closed: SELL 0.5 Lot GBPUSD',
      message: 'Take Profit filled at 1.2680. Realized Profit: +$142.50.',
      time: '4 hours ago',
      type: 'trading',
      category: 'Trading Activity',
      read: true,
      symbol: 'GBPUSD',
      price: 1.2680
    },
    {
      id: 'notif-6',
      title: 'Identity Document Verification Passed',
      message: 'Compliance documents verified. Account upgraded to Institutional CFD Tier.',
      time: '1 day ago',
      type: 'system',
      category: 'System & Account',
      read: true
    }
  ]);

  // Drawer Notification Controls State
  const [notifCategoryTab, setNotifCategoryTab] = useState<'ALL' | 'Price Alerts' | 'Trading Activity' | 'System & Account'>('ALL');
  const [notifSearch, setNotifSearch] = useState('');
  const [notifUnreadOnly, setNotifUnreadOnly] = useState(false);
  const [isCreateAlertOpen, setIsCreateAlertOpen] = useState(false);
  const [newAlertSymbol, setNewAlertSymbol] = useState('EURUSD');
  const [newAlertTargetPrice, setNewAlertTargetPrice] = useState('1.0880');
  const [newAlertCondition, setNewAlertCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (showToast) showToast('All notifications marked as read', 'info');
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    if (showToast) showToast('Notifications log cleared', 'info');
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (showToast) showToast('Notification removed from log', 'info');
  };

  const handleToggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const handleCreateCustomPriceAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertTargetPrice) return;
    const priceVal = parseFloat(newAlertTargetPrice);
    const newAlert = {
      id: `alert-custom-${Date.now()}`,
      title: `Price Alert Configured: ${newAlertSymbol}`,
      message: `Target alert set for ${newAlertSymbol} when price goes ${newAlertCondition} $${priceVal.toLocaleString()}.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'alert' as const,
      category: 'Price Alerts' as const,
      read: false,
      symbol: newAlertSymbol,
      price: priceVal
    };

    setNotifications(prev => [newAlert, ...prev]);
    setIsCreateAlertOpen(false);
    showToast(`Price Alert set for ${newAlertSymbol} @ $${priceVal}`, 'success');
  };

  const handleTriggerLiveAlert = () => {
    const alertSymbols = ['BTCUSD', 'XAUUSD', 'EURUSD', 'USDJPY', 'NVDA'];
    const randomSymbol = alertSymbols[Math.floor(Math.random() * alertSymbols.length)];
    const simPrice = randomSymbol === 'BTCUSD' ? 68150 : randomSymbol === 'XAUUSD' ? 2355.0 : randomSymbol === 'USDJPY' ? 152.10 : 1.0890;

    const liveAlert = {
      id: `live-alert-${Date.now()}`,
      title: `⚡ Live Alert: ${randomSymbol} Volatility Surge`,
      message: `${randomSymbol} experienced a sudden 0.8% price breakout touching $${simPrice.toLocaleString()}.`,
      time: 'Just now',
      type: 'alert' as const,
      category: 'Price Alerts' as const,
      read: false,
      symbol: randomSymbol,
      price: simPrice
    };

    setNotifications(prev => [liveAlert, ...prev]);
    if (showToast) showToast(`⚡ Live Price Alert Triggered: ${randomSymbol}`, 'info');
  };

  // Filtered Notifications List for Drawer
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (notifCategoryTab !== 'ALL' && n.category !== notifCategoryTab) return false;
      if (notifUnreadOnly && n.read) return false;
      if (notifSearch.trim()) {
        const q = notifSearch.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          (n.symbol && n.symbol.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [notifications, notifCategoryTab, notifUnreadOnly, notifSearch]);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  // KYC Verification Status: 'unverified' | 'pending' | 'verified'
  const [kycStatus, setKycStatus] = useState<'unverified' | 'pending' | 'verified'>(() => {
    return (localStorage.getItem('axi_kyc_status') as 'unverified' | 'pending' | 'verified') || 'unverified';
  });

  React.useEffect(() => {
    const handleKycUpdate = () => {
      const status = (localStorage.getItem('axi_kyc_status') as 'unverified' | 'pending' | 'verified') || 'unverified';
      setKycStatus(status);
    };
    window.addEventListener('axi_kyc_update', handleKycUpdate);
    window.addEventListener('storage', handleKycUpdate);
    return () => {
      window.removeEventListener('axi_kyc_update', handleKycUpdate);
      window.removeEventListener('storage', handleKycUpdate);
    };
  }, []);

  const activeBalance = accountMode === 'demo' ? balance : liveBalance;
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('1000');
  const [paymentMethod, setPaymentMethod] = useState('visa');

  // CSV Export Handler
  
  // Drag and Drop Widgets State with LocalStorage Persistence
  const DEFAULT_WIDGET_CONFIG = useMemo(() => [
    { id: 'trading-terminal', title: 'Trading Terminal & Drawing Overlay', icon: <BarChart2 className="w-4 h-4 text-[#E3000F]" />, span: 'col-span-1 xl:col-span-2' },
    { id: 'account-summary', title: 'Account Summary', icon: <Wallet className="w-4 h-4 text-emerald-500" />, span: 'col-span-1' },
    { id: 'portfolio-donut', title: 'Portfolio Asset Allocation', icon: <Layers className="w-4 h-4 text-amber-500" />, span: 'col-span-1' },
    { id: 'open-positions', title: 'Open Positions', icon: <History className="w-4 h-4 text-blue-500" />, span: 'col-span-1 xl:col-span-2' },
    { id: 'dividend-calendar', title: 'Dividend Calendar & Projected Payouts', icon: <Calendar className="w-4 h-4 text-emerald-500" />, span: 'col-span-1 xl:col-span-2' },
    { id: 'market-watch', title: 'Market Watch', icon: <TrendingUp className="w-4 h-4 text-purple-500" />, span: 'col-span-1' },
  ], []);

  const [widgets, setWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem('axi_dashboard_widgets_order');
      if (saved) {
        const savedIds: string[] = JSON.parse(saved);
        const ordered = savedIds
          .map(id => DEFAULT_WIDGET_CONFIG.find(w => w.id === id))
          .filter(Boolean) as typeof DEFAULT_WIDGET_CONFIG;
        
        DEFAULT_WIDGET_CONFIG.forEach(w => {
          if (!ordered.some(o => o.id === w.id)) ordered.push(w);
        });
        return ordered;
      }
    } catch (err) {
      console.error('Error reading widget preferences:', err);
    }
    return DEFAULT_WIDGET_CONFIG;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const updated = arrayMove(items, oldIndex, newIndex);
        try {
          localStorage.setItem('axi_dashboard_widgets_order', JSON.stringify(updated.map((w: any) => w.id)));
        } catch (e) {
          console.error('Failed to save layout:', e);
        }
        return updated;
      });
    }
  };

  const handleResetLayout = () => {
    setWidgets(DEFAULT_WIDGET_CONFIG);
    try {
      localStorage.removeItem('axi_dashboard_widgets_order');
    } catch (e) {
      console.error(e);
    }
    showToast('Dashboard workspace grid layout reset to default', 'info');
  };

  const handleExportCSV = () => {
    if (!effectiveClosedPositions || effectiveClosedPositions.length === 0) {
      showToast('No closed positions to export.', 'info');
      return;
    }

    const headers = ['ID', 'Symbol', 'Type', 'Volume (Lots)', 'Entry Price', 'Exit Price', 'Realized P&L ($)', 'Entry Time', 'Exit Time'];
    const rows = effectiveClosedPositions.map(pos => [
      pos.id,
      pos.symbol,
      pos.type,
      pos.volume,
      pos.entryPrice,
      pos.exitPrice,
      pos.profit.toFixed(2),
      `"${pos.entryTime || ''}"`,
      `"${pos.exitTime || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Axi_Closed_Positions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Closed positions exported to CSV successfully!', 'success');
  };

  // PDF Performance Statement Export Handler
  const handleExportPDF = () => {
    if (!effectiveClosedPositions || effectiveClosedPositions.length === 0) {
      showToast('No closed positions available for statement generation.', 'info');
      return;
    }

    const totalPnL = effectiveClosedPositions.reduce((acc, p) => acc + p.profit, 0);
    const wins = effectiveClosedPositions.filter(p => p.profit > 0).length;
    const winRate = ((wins / effectiveClosedPositions.length) * 100).toFixed(1);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to generate statement PDF.', 'error');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Axi Trading Performance Statement</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: 900; color: #0f172a; }
          .logo span { color: #e3000f; }
          .title { font-size: 18px; font-weight: 700; color: #e3000f; text-transform: uppercase; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; rounded: 8px; }
          .stat-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .stat-value { font-size: 18px; font-weight: 800; margin-top: 5px; }
          .positive { color: #10b981; }
          .negative { color: #f43f5e; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { background: #f1f5f9; text-align: left; padding: 10px; font-weight: 800; text-transform: uppercase; font-size: 10px; border-bottom: 2px solid #cbd5e1; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-t: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">axi<span>.</span></div>
          <div style="text-align: right;">
            <div class="title">Official Account Performance Statement</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Date: ${new Date().toLocaleDateString()} | Account: 60332183 (${accountMode.toUpperCase()})</div>
          </div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Total Closed Trades</div>
            <div class="stat-value">${effectiveClosedPositions.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Win Rate</div>
            <div class="stat-value">${winRate}%</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Realized Net P&L</div>
            <div class="stat-value ${totalPnL >= 0 ? 'positive' : 'negative'}">$${totalPnL.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Account Balance</div>
            <div class="stat-value">$${activeBalance.toFixed(2)}</div>
          </div>
        </div>

        <h3>Closed Trading Log</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Symbol</th>
              <th>Type</th>
              <th>Volume</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>Time</th>
              <th style="text-align: right;">Profit/Loss</th>
            </tr>
          </thead>
          <tbody>
            ${effectiveClosedPositions.map(pos => `
              <tr>
                <td style="font-family: monospace;">${pos.id}</td>
                <td><strong>${pos.symbol}</strong></td>
                <td style="color: ${pos.type === 'BUY' ? '#10b981' : '#f43f5e'}; font-weight: bold;">${pos.type}</td>
                <td>${pos.volume} Lots</td>
                <td>${pos.entryPrice}</td>
                <td>${pos.exitPrice}</td>
                <td>${pos.exitTime || pos.entryTime}</td>
                <td style="text-align: right; font-weight: bold; color: ${pos.profit >= 0 ? '#10b981' : '#f43f5e'};">
                  ${pos.profit >= 0 ? '+' : ''}$${pos.profit.toFixed(2)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Axi Financial Markets | Regulated by FCA & ASIC | Confidential Electronic Statement
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    showToast('Generated printable PDF statement!', 'success');
  };

  if (isLoading) {
    return (
      <div className={`min-h-[calc(100vh-80px)] p-6 transition-colors ${accountMode === "demo" ? "bg-slate-900" : "bg-[#f4f3ef]"}`}>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Banner Skeleton */}
          <motion.div 
            animate={{ opacity: [0.4, 0.8, 0.4] }} 
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="h-16 bg-slate-300 dark:bg-slate-700 rounded-xl w-full"
          />
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <motion.div 
              animate={{ opacity: [0.4, 0.8, 0.4] }} 
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="h-10 w-48 bg-slate-300 dark:bg-slate-700 rounded-lg"
            />
            <motion.div 
              animate={{ opacity: [0.4, 0.8, 0.4] }} 
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="h-10 w-52 bg-slate-300 dark:bg-slate-700 rounded-lg"
            />
          </div>
          {/* Widgets Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i}
                animate={{ opacity: [0.4, 0.8, 0.4] }} 
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}
                className="h-72 bg-slate-300 dark:bg-slate-800 rounded-xl p-4 flex flex-col justify-between"
              >
                <div className="h-6 w-1/3 bg-slate-400/50 dark:bg-slate-700 rounded" />
                <div className="h-24 w-full bg-slate-400/30 dark:bg-slate-700/50 rounded-lg" />
                <div className="flex gap-2">
                  <div className="h-9 w-1/2 bg-slate-400/50 dark:bg-slate-700 rounded" />
                  <div className="h-9 w-1/2 bg-slate-400/50 dark:bg-slate-700 rounded" />
                </div>
              </motion.div>
            ))}
          </div>
          {/* Chart Skeleton */}
          <motion.div 
            animate={{ opacity: [0.4, 0.8, 0.4] }} 
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="h-80 bg-slate-300 dark:bg-slate-800 rounded-xl w-full p-6"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[calc(100vh-80px)] pb-20 transition-colors ${accountMode === "demo" ? "bg-slate-900" : "bg-[#f4f3ef]"}`}>
      
      {/* Verification Status Indicator Banner */}
      <div className="bg-[#f4f3ef] px-4 py-6 md:py-8 max-w-5xl mx-auto">
        {kycStatus === 'verified' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col md:flex-row items-center justify-between p-4 gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-full">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-emerald-900 text-sm uppercase tracking-wider">Verified Account</span>
                  <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Approved</span>
                </div>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">
                  Your identity verification is fully approved. Unlimited deposits, priority withdrawals, and live trading features are active.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 shrink-0">
              KYC Level 2 Verified
            </span>
          </div>
        )}

        {kycStatus === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl flex flex-col md:flex-row items-center justify-between p-4 gap-4 shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-full">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-amber-950 text-sm uppercase tracking-wider">Verification Pending</span>
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Under Admin Review</span>
                </div>
                <p className="text-xs text-amber-900 font-medium mt-0.5">
                  Your submitted identification documents are currently being audited by our compliance team. Approval usually takes 1-12 hours.
                </p>
              </div>
            </div>
            <button onClick={() => setIsVerifyModalOpen(true)} className="bg-white border border-amber-300 px-4 py-2 rounded-lg text-xs font-bold text-amber-900 whitespace-nowrap hover:bg-amber-100 transition-colors shrink-0">
              View Submission
            </button>
          </div>
        )}

        {kycStatus === 'unverified' && (
          <div className="bg-[#Fdf5e6] border border-[#f3d9b1] rounded-xl flex flex-col md:flex-row items-center justify-between p-4 gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-[#d97706] font-black mt-0.5">⚠</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Unverified Account</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  Unverified accounts can only deposit and withdraw limited amounts using certain payment methods.
                </p>
              </div>
            </div>
            <button onClick={() => setIsVerifyModalOpen(true)} className="bg-white border border-slate-300 px-6 py-2 rounded-lg text-sm font-bold text-slate-800 whitespace-nowrap hover:bg-slate-50 transition-colors">
              Verify ID
            </button>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex flex-col gap-8">
        
        {/* Account & Sub-Navigation Tabs */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center gap-8 border-b border-slate-300 dark:border-slate-700 relative flex-wrap">
            <div className="pb-3 font-bold text-[15px] transition-colors flex items-center gap-2 relative text-slate-900 dark:text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Live Account ({formatCurrency(liveBalance)})
              <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-[#E3000F]"></div>
            </div>
            
            <div className="ml-auto flex items-center gap-3 mb-2 flex-wrap">
              {/* Currency Selector (USD, EUR, GBP) */}
              {setDisplayCurrency && (
                <CurrencySelector
                  displayCurrency={displayCurrency}
                  setDisplayCurrency={setDisplayCurrency}
                  variant="compact"
                />
              )}
              {/* Account Verification Status Tracker */}
              <button
                onClick={() => setIsVerifyModalOpen(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border shadow-xs hover:scale-105 ${
                  kycStatus === 'verified'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : kycStatus === 'pending'
                    ? 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 animate-pulse'
                    : 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                }`}
                title="Click to manage Account Verification & Upload KYC Documents"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${kycStatus === 'verified' ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span className="hidden sm:inline opacity-75">Verification:</span>
                <span className="uppercase font-extrabold underline decoration-dashed underline-offset-2">
                  {kycStatus === 'verified' ? 'Verified 🛡️' : kycStatus === 'pending' ? 'Pending Review ⏳' : 'Unverified ⚠️'}
                </span>
              </button>

              {openOnboardingTour && (
                <button
                  onClick={openOnboardingTour}
                  className="bg-brand-red hover:bg-red-700 text-white text-xs font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs hover:scale-105 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Guided Tour
                </button>
              )}

              {openVoiceModal && (
                <button
                  onClick={openVoiceModal}
                  className="bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs hover:scale-105 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" /> Voice Notes
                </button>
              )}

              {openReferModal && (
                <button
                  onClick={openReferModal}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs hover:scale-105 cursor-pointer"
                >
                  <Gift className="w-3.5 h-3.5" /> Refer & Earn $100
                </button>
              )}

              {/* Notification Bell Icon & Persistent Notification Center Drawer */}
              <div>
                <button
                  onClick={() => setIsNotificationsOpen(true)}
                  className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer flex items-center justify-center"
                  title="Notification Center & Price Alert Log"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-[#E3000F] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <div className="fixed inset-0 z-50 overflow-hidden">
                      {/* Translucent Backdrop */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsNotificationsOpen(false)}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
                      />

                      {/* Sliding Side-Drawer Panel */}
                      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                        <motion.div
                          initial={{ x: '100%' }}
                          animate={{ x: 0 }}
                          exit={{ x: '100%' }}
                          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                          className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between"
                        >
                          {/* Drawer Top Header */}
                          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-[#E3000F]/20 text-[#E3000F] border border-[#E3000F]/30">
                                <BellRing className="w-5 h-5 text-[#E3000F]" />
                              </div>
                              <div>
                                <h2 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                                  <span>Notification Center</span>
                                  {unreadCount > 0 && (
                                    <span className="bg-[#E3000F] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                      {unreadCount} New
                                    </span>
                                  )}
                                </h2>
                                <p className="text-[11px] text-slate-400 font-medium">
                                  Price alerts & trading activity history log
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => setIsNotificationsOpen(false)}
                              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                              title="Close Drawer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Quick Toolbar: Add Custom Alert & Actions */}
                          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
                            <button
                              onClick={() => setIsCreateAlertOpen(!isCreateAlertOpen)}
                              className="bg-[#E3000F] hover:bg-red-700 text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isCreateAlertOpen ? 'Cancel' : 'Set Price Alert'}</span>
                            </button>

                            <div className="flex items-center gap-2">
                              {unreadCount > 0 && (
                                <button
                                  onClick={handleMarkAllRead}
                                  className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                                >
                                  Mark all read
                                </button>
                              )}
                              <button
                                onClick={handleTriggerLiveAlert}
                                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                                title="Trigger test market volatility alert"
                              >
                                <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
                                <span>Live Market Alert</span>
                              </button>
                            </div>
                          </div>

                          {/* Expandable Form: Create Custom Price Alert */}
                          <AnimatePresence>
                            {isCreateAlertOpen && (
                              <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={handleCreateCustomPriceAlert}
                                className="p-3.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 space-y-3 shrink-0"
                              >
                                <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <Bell className="w-3.5 h-3.5 text-[#E3000F]" />
                                  <span>Configure New Target Price Alert</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Symbol</label>
                                    <select
                                      value={newAlertSymbol}
                                      onChange={(e) => setNewAlertSymbol(e.target.value)}
                                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-white"
                                    >
                                      <option value="EURUSD">EURUSD</option>
                                      <option value="GBPUSD">GBPUSD</option>
                                      <option value="USDJPY">USDJPY</option>
                                      <option value="BTCUSD">BTCUSD</option>
                                      <option value="XAUUSD">XAUUSD</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Condition</label>
                                    <select
                                      value={newAlertCondition}
                                      onChange={(e) => setNewAlertCondition(e.target.value as 'ABOVE' | 'BELOW')}
                                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-white"
                                    >
                                      <option value="ABOVE">Crosses Above</option>
                                      <option value="BELOW">Crosses Below</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Target Price</label>
                                    <input
                                      type="number"
                                      step="any"
                                      value={newAlertTargetPrice}
                                      onChange={(e) => setNewAlertTargetPrice(e.target.value)}
                                      placeholder="1.0880"
                                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 dark:text-white"
                                      required
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setIsCreateAlertOpen(false)}
                                    className="px-3 py-1 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer shadow-xs"
                                  >
                                    Save Alert
                                  </button>
                                </div>
                              </motion.form>
                            )}
                          </AnimatePresence>

                          {/* Category Filter Pills & Search Input */}
                          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0 bg-white dark:bg-slate-900">
                            {/* Search box */}
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                              <input
                                type="text"
                                value={notifSearch}
                                onChange={(e) => setNotifSearch(e.target.value)}
                                placeholder="Search log by symbol, keywords or title..."
                                className="w-full bg-slate-100 dark:bg-slate-800 pl-8 pr-3 py-1.5 rounded-xl text-xs font-medium text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#E3000F]"
                              />
                            </div>

                            {/* Categories */}
                            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
                              {(['ALL', 'Price Alerts', 'Trading Activity', 'System & Account'] as const).map(cat => (
                                <button
                                  key={cat}
                                  onClick={() => setNotifCategoryTab(cat)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                                    notifCategoryTab === cat
                                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>

                            {/* Unread toggle */}
                            <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-0.5">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifUnreadOnly}
                                  onChange={(e) => setNotifUnreadOnly(e.target.checked)}
                                  className="rounded text-[#E3000F] focus:ring-0"
                                />
                                <span>Show unread only</span>
                              </label>

                              <span className="text-[10px] font-mono text-slate-400">
                                {filteredNotifications.length} items logged
                              </span>
                            </div>
                          </div>

                          {/* Scrollable Notifications Log Body */}
                          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-1">
                            {filteredNotifications.length === 0 ? (
                              <div className="p-10 text-center space-y-2">
                                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                  No notifications match your current filter.
                                </p>
                              </div>
                            ) : (
                              filteredNotifications.map(notif => {
                                const isPriceAlert = notif.category === 'Price Alerts';
                                const isTrading = notif.category === 'Trading Activity';

                                return (
                                  <div
                                    key={notif.id}
                                    onClick={() => handleToggleRead(notif.id)}
                                    className={`p-3.5 rounded-2xl my-1 transition cursor-pointer relative group ${
                                      !notif.read
                                        ? 'bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      {/* Color-coded Icon Badge */}
                                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                                        isPriceAlert
                                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                          : isTrading
                                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                          : 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                                      }`}>
                                        {isPriceAlert ? (
                                          <TrendingUp className="w-4 h-4" />
                                        ) : isTrading ? (
                                          <Zap className="w-4 h-4" />
                                        ) : (
                                          <ShieldCheck className="w-4 h-4" />
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                          <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                                            {notif.title}
                                          </div>
                                          {!notif.read && (
                                            <span className="w-2 h-2 rounded-full bg-[#E3000F] shrink-0" />
                                          )}
                                        </div>

                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                                          {notif.message}
                                        </p>

                                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono text-slate-400 flex items-center gap-1">
                                              <Clock className="w-3 h-3 text-slate-400" />
                                              {notif.time}
                                            </span>
                                            {notif.symbol && (
                                              <span className="font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                                                {notif.symbol}
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <span className={`px-1.5 py-0.2 rounded font-extrabold uppercase text-[9px] ${
                                              isPriceAlert
                                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                                : isTrading
                                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}>
                                              {notif.category}
                                            </span>

                                            <button
                                              onClick={(e) => handleDeleteNotification(notif.id, e)}
                                              className="p-1 text-slate-400 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                                              title="Delete notification entry"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Footer Controls */}
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
                            <span className="text-slate-400 font-medium text-[11px]">
                              Logged in Local State
                            </span>

                            {notifications.length > 0 && (
                              <button
                                onClick={handleClearNotifications}
                                className="text-[11px] font-bold text-slate-500 hover:text-rose-600 transition cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Clear Entire Log</span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Productivity Tab Selector & Action Buttons Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-200/50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-300/80 dark:border-slate-700/80 shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto p-0.5">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-[#E3000F]" />
                <span>Overview & Terminal</span>
              </button>

              <button
                onClick={() => setActiveTab('closed_positions')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'closed_positions'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <History className="w-4 h-4 text-amber-500" />
                <span>Closed Positions History</span>
                <span className="bg-[#E3000F] text-white text-[10px] font-black px-2 py-0.5 rounded-full ml-0.5">
                  {effectiveClosedPositions.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'analytics'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <BarChart2 className="w-4 h-4 text-emerald-500" />
                <span>Analytics & Heatmap</span>
              </button>

              <button
                onClick={() => setActiveTab('copy_trading')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'copy_trading'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Users className="w-4 h-4 text-blue-500" />
                <span>Copy-Trading & Leaderboard</span>
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full ml-0.5">
                  TOP 6
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={handleExportCSV}
                className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-extrabold px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="bg-[#E3000F] hover:bg-red-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-white" />
                <span>Statement PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & TERMINAL */}
        {activeTab === 'overview' && (
          <>
            {/* Visual Realized Profit Milestone Progression Bar (Only in Standard mode) */}
            {viewDensity === 'standard' && (
              <MilestoneProgressBar
                closedPositions={effectiveClosedPositions}
                accountMode={accountMode}
                onExplorePerks={() => setView('select')}
              />
            )}

            {/* Keyboard Shortcut Rapid Market Order Dock */}
            <div className={`bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl border border-slate-700 shadow-xl mb-3 flex flex-col lg:flex-row items-center justify-between gap-3 ${viewDensity === 'compact' ? 'p-2.5' : 'p-4'}`}>
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className={`rounded-xl bg-[#E3000F]/20 text-[#E3000F] border border-[#E3000F]/30 shrink-0 ${viewDensity === 'compact' ? 'p-1.5' : 'p-2.5'}`}>
                  <Zap className={`${viewDensity === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} text-[#E3000F] animate-pulse`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black tracking-wide flex items-center gap-1.5 uppercase">
                      Keyboard Shortcut Trading
                    </h3>
                    <button
                      onClick={() => setShortcutsEnabled(prev => !prev)}
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border transition cursor-pointer ${shortcutsEnabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}
                    >
                      {shortcutsEnabled ? 'Active [Shift+B / Shift+S]' : 'Disabled'}
                    </button>
                  </div>
                  {viewDensity === 'standard' && (
                    <p className="text-xs text-slate-400 font-medium">
                      Press <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-white font-mono text-[11px]">Shift + B</kbd> to Buy or <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-white font-mono text-[11px]">Shift + S</kbd> to Sell active instrument instantly.
                    </p>
                  )}
                </div>
              </div>

              {/* Active Instrument & Lot Size Controls */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
                {/* Symbol Selector */}
                <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Pair:</span>
                  <select
                    value={selectedSymbol}
                    onChange={e => setSelectedSymbol(e.target.value)}
                    className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="EURUSD" className="bg-slate-800 text-white">EURUSD</option>
                    <option value="GBPUSD" className="bg-slate-800 text-white">GBPUSD</option>
                    <option value="USDJPY" className="bg-slate-800 text-white">USDJPY</option>
                    <option value="XAUUSD" className="bg-slate-800 text-white">XAUUSD (Gold)</option>
                    <option value="BTCUSD" className="bg-slate-800 text-white">BTCUSD (Bitcoin)</option>
                    <option value="ETHUSD" className="bg-slate-800 text-white">ETHUSD (Ethereum)</option>
                  </select>
                </div>

                {/* Lot Size Preset Buttons */}
                <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold px-1 uppercase">Lot:</span>
                  {[0.1, 0.5, 1.0, 2.0, 5.0].map(lot => (
                    <button
                      key={lot}
                      onClick={() => setShortcutLotSize(lot)}
                      className={`px-1.5 py-0.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${shortcutLotSize === lot ? 'bg-[#E3000F] text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    >
                      {lot}
                    </button>
                  ))}
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleInitiateTrade('BUY')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 transition cursor-pointer shadow-md active:scale-95"
                    title="Trigger Market BUY (Shift + B)"
                  >
                    <span className="bg-emerald-800/60 px-1 py-0.2 rounded text-[9px] font-mono">Shift+B</span>
                    <span>BUY</span>
                  </button>

                  <button
                    onClick={() => handleInitiateTrade('SELL')}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 transition cursor-pointer shadow-md active:scale-95"
                    title="Trigger Market SELL (Shift + S)"
                  >
                    <span className="bg-rose-800/60 px-1 py-0.2 rounded text-[9px] font-mono">Shift+S</span>
                    <span>SELL</span>
                  </button>

                  <button
                    onClick={() => {
                      const elem = document.getElementById('open-positions-section') || document.getElementById('widget-open-positions');
                      if (elem) {
                        elem.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        showToast(`Holding ${openPositions.length} active position(s). Total P&L: $${openPositions.reduce((acc, p) => acc + (p.profit || 0), 0).toFixed(2)}`, 'info');
                      }
                    }}
                    className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 transition cursor-pointer shadow-md active:scale-95"
                    title="View & Manage Held Open Positions"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>HOLD ({openPositions.length})</span>
                  </button>

                  <button
                    onClick={() => setIsSwapModalOpen(true)}
                    className="bg-gradient-to-r from-[#E3000F] to-amber-600 hover:from-red-700 hover:to-amber-700 text-white px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 transition cursor-pointer shadow-md active:scale-95 border border-amber-400/30"
                    title="Instant Asset & Crypto Swap Converter"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>SWAP</span>
                  </button>

                  <button
                    onClick={() => setIsQuickSettingsOpen(true)}
                    className="px-2.5 py-1 rounded-xl bg-[#E3000F]/10 hover:bg-[#E3000F]/20 text-[#E3000F] transition cursor-pointer border border-[#E3000F]/30 flex items-center gap-1.5 text-xs font-bold"
                    title="Quick Trading Settings & Risk Limits"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Settings</span>
                  </button>

                  <button
                    onClick={() => setIsShortcutHelpOpen(true)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700"
                    title="Shortcut Cheat Sheet (?)"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Last Order Execution HUD Flash Banner */}
            <AnimatePresence>
              {lastShortcutOrder && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`p-2.5 rounded-xl mb-3 border flex items-center justify-between font-mono text-xs font-bold ${
                    lastShortcutOrder.type === 'BUY' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      INSTANT EXECUTED {lastShortcutOrder.type} {lastShortcutOrder.lot} Lot {lastShortcutOrder.symbol} @ {lastShortcutOrder.price.toFixed(lastShortcutOrder.symbol.includes('JPY') ? 2 : 5)}
                    </span>
                  </div>
                  <span className="text-[11px] opacity-80">{lastShortcutOrder.time}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Draggable Workspace Grid Controls & View Density Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/80 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#E3000F]/10 text-[#E3000F]">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    Custom Workspace Grid
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                    <GripVertical className="w-3 h-3 text-slate-400 inline" />
                    Drag widget handles to customize your personal layout
                  </p>
                </div>
              </div>

              {/* View Density Switcher (Standard vs Compact Scalper) */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <button
                    onClick={() => setViewDensity('standard')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      viewDensity === 'standard'
                        ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Standard</span>
                  </button>
                  <button
                    onClick={() => setViewDensity('compact')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      viewDensity === 'compact'
                        ? 'bg-[#E3000F] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Compact (Scalper)</span>
                  </button>
                </div>

                <button
                  onClick={handleResetLayout}
                  className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Compact Scalper Density Status Indicator */}
            {viewDensity === 'compact' && (
              <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>Scalper Compact View Active: Non-essential UI elements hidden. Maximum screen widget visibility.</span>
                </div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-500/20 px-2 py-0.5 rounded">High Density</span>
              </div>
            )}

            {/* Draggable Widgets Area */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
                <div className={viewDensity === 'compact' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5' : 'grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6'}>
                  {widgets.map(widget => (
                    <WidgetWrapper 
                      key={widget.id} 
                      id={widget.id} 
                      title={widget.title} 
                      icon={widget.icon} 
                      accountMode={accountMode}
                      className={viewDensity === 'compact' ? 'col-span-1' : widget.span}
                      isCompact={viewDensity === 'compact'}
                    >
                      {widget.id === 'trading-terminal' && (
                        <LiveChartWidget 
                          accountMode={accountMode} 
                          isLoading={isLoading}
                          selectedSymbol={selectedSymbol}
                          setSelectedSymbol={setSelectedSymbol}
                        />
                      )}
                      {widget.id === 'account-summary' && (
                        <AccountSummaryWidget 
                          accountMode={accountMode} 
                          activeBalance={activeBalance} 
                          setView={setView} 
                          setIsDepositModalOpen={setIsDepositModalOpen} 
                          isLoading={isLoading}
                          displayCurrency={displayCurrency}
                          setDisplayCurrency={setDisplayCurrency}
                          formatCurrency={formatCurrency}
                        />
                      )}
                      {widget.id === 'portfolio-donut' && (
                        <PortfolioDonutWidget 
                          openPositions={openPositions} 
                          accountMode={accountMode} 
                          isLoading={isLoading}
                        />
                      )}
                      {widget.id === 'open-positions' && (
                        <OpenPositionsWidget 
                          openPositions={openPositions} 
                          accountMode={accountMode} 
                          isLoading={isLoading}
                        />
                      )}
                      {widget.id === 'dividend-calendar' && (
                        <DividendCalendarWidget 
                          openPositions={openPositions} 
                          accountMode={accountMode} 
                          isLoading={isLoading}
                          setView={setView}
                        />
                      )}
                      {widget.id === 'market-watch' && (
                        <MarketWatchWidget 
                          accountMode={accountMode} 
                          isLoading={isLoading}
                        />
                      )}
                    </WidgetWrapper>
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Scrolling Real-Time Financial News Feed */}
            <FinancialNewsTicker
              accountMode={accountMode}
              onSymbolSelect={(sym) => {
                setView('markets');
              }}
            />

            {/* Market Sentiment & Community Positioning Widget */}
            <MarketSentimentWidget
              accountMode={accountMode}
              onTradeSymbol={(sym) => {
                setView('markets');
              }}
            />

            {/* Visual Recharts Summary Graph for Total Balance Changes */}
            <BalanceHistoryChart
              activeBalance={activeBalance}
              closedPositions={effectiveClosedPositions}
              transactions={transactions}
              user={user}
              accountMode={accountMode}
            />

            {/* Trading Performance Heatmap */}
            <TradingPerformanceHeatmap
              closedPositions={effectiveClosedPositions}
              accountMode={accountMode}
            />

            {/* Portfolio Composition Pie Chart */}
            <PortfolioCompositionChart
              openPositions={openPositions}
              closedPositions={effectiveClosedPositions}
              accountMode={accountMode}
            />

            {/* Create Account Box */}
            <div className="bg-[#e9e6df] dark:bg-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-300/60 dark:border-slate-700">
              <div>
                <h3 className="text-slate-800 dark:text-white font-bold text-[15px] mb-1 tracking-tight">Create Additional MT4/MT5 Account</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">You can create additional live or demo accounts once identity verification is approved.</p>
              </div>
              <button 
                onClick={() => {
                  if (kycStatus === 'verified') {
                    showToast('Opening new sub-account application...', 'info');
                  } else {
                    setIsVerifyModalOpen(true);
                  }
                }}
                className={`font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap mt-2 md:mt-0 ${
                  kycStatus === 'verified'
                    ? 'bg-[#E3000F] text-white hover:bg-red-700 shadow-sm'
                    : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                }`}
              >
                {kycStatus === 'verified' ? '+ Create Sub-Account' : 'Verify ID to Add Account'}
              </button>
            </div>

            {/* Axi Select Banner */}
            <div className="bg-black rounded-xl overflow-hidden flex flex-col md:flex-row mt-2 border border-slate-800 shadow-md">
              <div className="p-8 md:p-12 md:w-1/2 flex flex-col items-start justify-center">
                <h2 className="text-white text-3xl font-black mb-3 tracking-tight">Trade with Axi's funds</h2>
                <p className="text-slate-300 text-sm mb-6 max-w-sm leading-relaxed">
                  Introducing our market leading capital allocation program - <span className="font-bold text-white">Axi Select</span>
                </p>
                
                <ul className="text-white text-sm flex flex-col gap-4 mb-8">
                  <li className="flex items-center gap-3">
                    <span className="text-[#E3000F] border border-[#E3000F] rounded-full p-0.5">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                    </span>
                    Receive up to $1M USD in funding
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-[#E3000F] border border-[#E3000F] rounded-full p-0.5">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                    </span>
                    Earn up to 80% of the profits you generate
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-[#E3000F] border border-[#E3000F] rounded-full p-0.5">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                    </span>
                    100% Free to participate
                  </li>
                </ul>

                <button 
                  onClick={() => setView('select')}
                  className="bg-[#E3000F] hover:bg-red-700 transition-colors text-white text-xs font-black px-6 py-3 rounded-lg uppercase tracking-widest mt-2 flex items-center gap-2 cursor-pointer"
                >
                  <span>FIND OUT MORE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="md:w-1/2 bg-[#111] relative min-h-[250px] p-8 flex items-center justify-center">
                <div className="flex items-end gap-2 text-[#E3000F] opacity-80 w-full justify-center">
                  <svg viewBox="0 0 200 150" className="w-full h-auto max-w-[250px] stroke-current" fill="none" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter">
                    <path d="M20 130 L180 130" stroke="#333" strokeWidth="2" />
                    <path d="M40 130 L40 90 M30 100 L40 90 L50 100" />
                    <path d="M80 130 L80 60 M70 70 L80 60 L90 70" />
                    <path d="M120 130 L120 30 M110 40 L120 30 L130 40" strokeWidth="6" />
                    <path d="M160 130 L160 80 M150 90 L160 80 L170 90" />
                    <path d="M20 130 L120 30" strokeWidth="6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Quick Closed Positions Log Preview */}
            <div className={`rounded-2xl border shadow-sm p-6 flex flex-col gap-5 ${accountMode === "demo" ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-700/50 pb-4">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <History className="w-5 h-5 text-[#E3000F]" /> Closed Trading Log ({effectiveClosedPositions.length})
                  </h3>
                  <p className={`text-xs font-semibold mt-0.5 ${accountMode === "demo" ? "text-slate-400" : "text-slate-500"}`}>
                    Recent closed contracts. Switch to the dedicated tab for full search, filters, and analytics.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActiveTab('closed_positions')}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-extrabold px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>View Full Log</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Table Preview */}
              <div className="overflow-x-auto rounded-xl border border-slate-200/40 dark:border-slate-700">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b uppercase tracking-wider font-extrabold text-[10px] ${accountMode === "demo" ? "bg-slate-900 text-slate-400 border-slate-700" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                      <th className="p-3">Trade ID</th>
                      <th className="p-3">Symbol</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Volume</th>
                      <th className="p-3">Entry Price</th>
                      <th className="p-3">Exit Price</th>
                      <th className="p-3">Exit Time</th>
                      <th className="p-3 text-right">Realized P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/20 dark:divide-slate-700/50 font-semibold">
                    {effectiveClosedPositions.slice(0, 5).map(pos => (
                      <tr key={pos.id} className={accountMode === "demo" ? "hover:bg-slate-750" : "hover:bg-slate-50/80"}>
                        <td className="p-3 font-mono text-slate-400 text-[11px]">{pos.id}</td>
                        <td className="p-3 font-black text-slate-800 dark:text-white">{pos.symbol}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${pos.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                            {pos.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{pos.volume} Lots</td>
                        <td className="p-3 font-mono">{pos.entryPrice}</td>
                        <td className="p-3 font-mono">{pos.exitPrice}</td>
                        <td className="p-3 text-slate-400 text-[11px]">{pos.exitTime || pos.entryTime}</td>
                        <td className="p-3 text-right font-mono font-black">
                          <span className={pos.profit >= 0 ? "text-emerald-500" : "text-rose-500"}>
                            {pos.profit >= 0 ? '+' : ''}${pos.profit.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: DEDICATED CLOSED POSITIONS HISTORY */}
        {activeTab === 'closed_positions' && (
          <div className="flex flex-col gap-6">
            
            {/* KPI Stat Cards Banner */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className={`p-4 rounded-2xl border shadow-2xs flex flex-col justify-between ${accountMode === 'demo' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Realized Net P&L</span>
                  <DollarSign className={`w-4 h-4 ${closedStats.totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
                </div>
                <div className={`text-xl font-black mt-2 ${closedStats.totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {closedStats.totalPnL >= 0 ? '+' : ''}${closedStats.totalPnL.toFixed(2)}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 mt-1">Total closed profit</div>
              </div>

              <div className={`p-4 rounded-2xl border shadow-2xs flex flex-col justify-between ${accountMode === 'demo' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Closed Trades</span>
                  <Layers className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-xl font-black mt-2">
                  {closedStats.total}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 mt-1">
                  {closedStats.winCount} Wins / {closedStats.lossCount} Losses
                </div>
              </div>

              <div className={`p-4 rounded-2xl border shadow-2xs flex flex-col justify-between ${accountMode === 'demo' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Win Rate</span>
                  <Percent className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl font-black text-emerald-500 mt-2">
                  {closedStats.winRate.toFixed(1)}%
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${closedStats.winRate}%` }} />
                </div>
              </div>

              <div className={`p-4 rounded-2xl border shadow-2xs flex flex-col justify-between ${accountMode === 'demo' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Avg P&L / Trade</span>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
                <div className={`text-xl font-black mt-2 ${closedStats.avgPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  ${closedStats.avgPnL.toFixed(2)}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 mt-1">Expectancy index</div>
              </div>

              <div className={`p-4 rounded-2xl border shadow-2xs flex flex-col justify-between ${accountMode === 'demo' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Best Win</span>
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-xl font-black text-emerald-500 mt-2">
                  +${closedStats.bestWin.toFixed(2)}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 mt-1">Single top payout</div>
              </div>

              <div className={`p-4 rounded-2xl border shadow-2xs flex flex-col justify-between ${accountMode === 'demo' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Worst Loss</span>
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-xl font-black text-rose-500 mt-2">
                  ${closedStats.worstLoss.toFixed(2)}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 mt-1">Risk tolerance cap</div>
              </div>
            </div>

            {/* Filter, Search & Productivity Control Bar */}
            <div className={`p-5 rounded-2xl border shadow-sm flex flex-col gap-4 ${accountMode === 'demo' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                
                {/* Search Input */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Symbol (EURUSD, BTCUSD), Trade ID, or Type..."
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#E3000F] transition ${
                      accountMode === 'demo' 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  
                  {/* Order Direction Filter */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setTypeFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${typeFilter === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      All Types
                    </button>
                    <button
                      onClick={() => setTypeFilter('BUY')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${typeFilter === 'BUY' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-emerald-500'}`}
                    >
                      BUY
                    </button>
                    <button
                      onClick={() => setTypeFilter('SELL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${typeFilter === 'SELL' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500 hover:text-rose-500'}`}
                    >
                      SELL
                    </button>
                  </div>

                  {/* P&L Filter */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setPnlFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${pnlFilter === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      All Outcomes
                    </button>
                    <button
                      onClick={() => setPnlFilter('PROFIT')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${pnlFilter === 'PROFIT' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-emerald-600'}`}
                    >
                      Profits Only
                    </button>
                    <button
                      onClick={() => setPnlFilter('LOSS')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${pnlFilter === 'LOSS' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-rose-600'}`}
                    >
                      Losses Only
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className={`px-3.5 py-2.5 rounded-xl border text-xs font-extrabold focus:outline-none cursor-pointer ${
                        accountMode === 'demo'
                          ? 'bg-slate-900 border-slate-700 text-slate-200'
                          : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="date_desc">Sort: Exit Time (Newest)</option>
                      <option value="date_asc">Sort: Exit Time (Oldest)</option>
                      <option value="pnl_desc">Sort: Profit (Highest First)</option>
                      <option value="pnl_asc">Sort: Profit (Lowest First)</option>
                      <option value="symbol">Sort: Symbol (A-Z)</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Status Indicator & Alignment Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Filter className="w-3.5 h-3.5 text-[#E3000F]" />
                  <span>Showing <strong className="text-slate-900 dark:text-white">{filteredClosedPositions.length}</strong> of <strong className="text-slate-900 dark:text-white">{effectiveClosedPositions.length}</strong> closed positions</span>
                  {(searchTerm || typeFilter !== 'ALL' || pnlFilter !== 'ALL') && (
                    <button 
                      onClick={() => { setSearchTerm(''); setTypeFilter('ALL'); setPnlFilter('ALL'); }}
                      className="text-[#E3000F] font-bold hover:underline ml-2 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Reset Filters
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleExportCSV}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-extrabold px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" /> Export CSV Data
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="bg-[#E3000F] hover:bg-red-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-white" /> Generate PDF Statement
                  </button>
                  <button
                    onClick={() => setIsDepositModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Deposit Funds
                  </button>
                </div>
              </div>
            </div>

            {/* Comprehensive Closed Positions Table */}
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${accountMode === 'demo' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b uppercase tracking-wider font-black text-[10px] ${accountMode === 'demo' ? 'bg-slate-900/90 text-slate-400 border-slate-700' : 'bg-slate-100/80 text-slate-600 border-slate-200'}`}>
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Symbol</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Volume</th>
                      <th className="p-4">Entry Price</th>
                      <th className="p-4">Exit Price</th>
                      <th className="p-4">Entry Time</th>
                      <th className="p-4">Exit Time</th>
                      <th className="p-4 text-right">Realized P&L ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/30 dark:divide-slate-700/50 font-semibold">
                    {filteredClosedPositions.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-slate-400">
                          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
                          <div className="text-sm font-bold text-slate-700 dark:text-slate-300">No closed positions match your filter criteria</div>
                          <p className="text-xs text-slate-500 mt-1">Try adjusting your search keyword, order direction, or outcome state.</p>
                          <button
                            onClick={() => { setSearchTerm(''); setTypeFilter('ALL'); setPnlFilter('ALL'); }}
                            className="mt-4 bg-[#E3000F] text-white text-xs font-bold px-4 py-2 rounded-xl transition hover:bg-red-700 cursor-pointer"
                          >
                            Reset Search & Filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredClosedPositions.map((pos) => {
                        const isWin = pos.profit >= 0;
                        return (
                          <tr 
                            key={pos.id} 
                            className={`transition-colors ${accountMode === 'demo' ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50'}`}
                          >
                            <td className="p-4 font-mono text-slate-400 text-[11px] font-bold">
                              <span className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                {pos.id}
                              </span>
                            </td>
                            <td className="p-4 font-black text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{pos.symbol}</span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                pos.type === 'BUY' 
                                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                              }`}>
                                {pos.type}
                              </span>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">{pos.volume} Lots</td>
                            <td className="p-4 font-mono font-bold text-slate-600 dark:text-slate-400">{pos.entryPrice}</td>
                            <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">{pos.exitPrice}</td>
                            <td className="p-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">{pos.entryTime || 'N/A'}</td>
                            <td className="p-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">{pos.exitTime || 'N/A'}</td>
                            <td className="p-4 text-right font-mono font-black text-sm">
                              <div className={`flex items-center justify-end gap-1 ${isWin ? 'text-emerald-500' : 'text-rose-500'}`}>
                                <span>{isWin ? '+' : ''}${pos.profit.toFixed(2)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Summary */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-slate-500">
                <div>Official Axi Execution Records | Regulated Broker Liquidity</div>
                <div className="flex items-center gap-4">
                  <span>Filtered Realized Total: <strong className={filteredClosedPositions.reduce((a, b) => a + b.profit, 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}>${filteredClosedPositions.reduce((a, b) => a + b.profit, 0).toFixed(2)}</strong></span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: ANALYTICS & HEATMAP */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-8">
            <BalanceHistoryChart
              activeBalance={activeBalance}
              closedPositions={effectiveClosedPositions}
              accountMode={accountMode}
            />

            <TradingPerformanceHeatmap
              closedPositions={effectiveClosedPositions}
              accountMode={accountMode}
            />

            <PortfolioCompositionChart
              openPositions={openPositions}
              closedPositions={effectiveClosedPositions}
              accountMode={accountMode}
            />
          </div>
        )}

        {/* TAB 4: COPY-TRADING & LEADERBOARD */}
        {activeTab === 'copy_trading' && (
          <CopyTradeSection
            activeBalance={activeBalance}
            accountMode={accountMode}
            openPositions={openPositions}
            addOpenPosition={addOpenPosition}
            setOpenPositions={setOpenPositions}
            showToast={showToast}
            quotes={quotes}
            formatCurrency={formatCurrency}
          />
        )}
      </div>


      
      <IdentityVerificationModal 
        isOpen={isVerifyModalOpen} 
        onClose={() => setIsVerifyModalOpen(false)} 
        showToast={showToast}
      />

      {/* Mandatory Risk Disclosure Modal */}
      <RiskDisclosureModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        onAcknowledge={handleRiskAcknowledged}
        showToast={showToast}
      />

      {/* Slide-in Trade Confirmation Drawer */}
      <TradeConfirmationDrawer
        isOpen={isTradeDrawerOpen}
        onClose={() => setIsTradeDrawerOpen(false)}
        orderData={tradeDrawerData}
        onConfirmTrade={handleConfirmFinalTrade}
        showToast={showToast}
      />

      {/* Quick Deposit Modal */}
      <AnimatePresence>
        {isDepositModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsDepositModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-slate-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#E3000F]" /> Quick Deposit
                </h3>
                <button onClick={() => setIsDepositModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 flex flex-col gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                    <input 
                      type="number" 
                      value={depositAmount} 
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg py-3 pl-8 pr-4 text-slate-900 font-medium focus:border-[#E3000F] focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {['100', '500', '1000', '5000'].map(amt => (
                      <button 
                        key={amt}
                        onClick={() => setDepositAmount(amt)}
                        className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-600 transition"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Payment Method</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => setPaymentMethod('visa')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${paymentMethod === 'visa' ? 'border-[#E3000F] bg-red-50/50 text-[#E3000F]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      <CreditCard className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold uppercase">Card</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('bank')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${paymentMethod === 'bank' ? 'border-[#E3000F] bg-red-50/50 text-[#E3000F]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      <Landmark className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold uppercase">Wire</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('crypto')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${paymentMethod === 'crypto' ? 'border-[#E3000F] bg-red-50/50 text-[#E3000F]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      <Banknote className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold uppercase">Crypto</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#fdf5e6] border border-[#f3d9b1] rounded-lg p-3 text-[11px] text-[#d97706] font-medium mt-2">
                  <span className="font-bold">Note:</span> Live deposits are placed in a pending state until approved by an administrator.
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button 
                  onClick={() => {
                    setView('funds');
                  }}
                  className="w-full bg-[#E3000F] hover:bg-red-700 text-white font-bold py-3 rounded-lg transition shadow-md"
                >
                  Go to Secure Funding
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcut Cheat Sheet Modal */}
      <AnimatePresence>
        {isShortcutHelpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#E3000F]/10 text-[#E3000F]">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Keyboard Shortcuts Guide
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Axi Rapid Market Order Execution
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsShortcutHelpOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm">Instant BUY Market Order</div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">Submits immediate BUY order for selected symbol</div>
                  </div>
                  <kbd className="bg-slate-900 dark:bg-slate-950 text-emerald-400 px-3 py-1.5 rounded-xl font-mono text-xs font-black border border-slate-700 shadow-xs">
                    Shift + B
                  </kbd>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm">Instant SELL Market Order</div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">Submits immediate SELL order for selected symbol</div>
                  </div>
                  <kbd className="bg-slate-900 dark:bg-slate-950 text-rose-400 px-3 py-1.5 rounded-xl font-mono text-xs font-black border border-slate-700 shadow-xs">
                    Shift + S
                  </kbd>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm">Navigate to Dashboard Terminal</div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">Jump straight to main trading dashboard view</div>
                  </div>
                  <kbd className="bg-slate-900 dark:bg-slate-950 text-sky-400 px-3 py-1.5 rounded-xl font-mono text-xs font-black border border-slate-700 shadow-xs">
                    Shift + D
                  </kbd>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm">Navigate to Live Markets</div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">Switch view to asset quotes & market overview</div>
                  </div>
                  <kbd className="bg-slate-900 dark:bg-slate-950 text-sky-400 px-3 py-1.5 rounded-xl font-mono text-xs font-black border border-slate-700 shadow-xs">
                    Shift + M
                  </kbd>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm">Navigate to Wallet & Funds</div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">Jump directly to deposit, withdrawal & wallet view</div>
                  </div>
                  <kbd className="bg-slate-900 dark:bg-slate-950 text-sky-400 px-3 py-1.5 rounded-xl font-mono text-xs font-black border border-slate-700 shadow-xs">
                    Shift + W
                  </kbd>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm">Toggle Help Modal</div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">Open or close this shortcut cheat sheet</div>
                  </div>
                  <kbd className="bg-slate-900 dark:bg-slate-950 text-amber-400 px-3 py-1.5 rounded-xl font-mono text-xs font-black border border-slate-700 shadow-xs">
                    Shift + H / ?
                  </kbd>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Smart Typing Guard:</strong> Keyboard shortcuts are automatically suppressed while you are typing inside text input fields or search bars to prevent accidental order triggers.
                  </span>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                <button
                  onClick={() => setIsShortcutHelpOpen(false)}
                  className="bg-[#E3000F] hover:bg-red-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Got it, close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Settings & Risk Limits Drawer */}
      <QuickSettingsDrawer
        isOpen={isQuickSettingsOpen}
        onClose={() => setIsQuickSettingsOpen(false)}
        showToast={showToast}
      />

      {/* Instant Asset & Crypto Swap Modal */}
      <SwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        quotes={quotes}
        balance={balance}
        setBalance={setBalance}
        liveBalance={liveBalance}
        setLiveBalance={setLiveBalance}
        showToast={showToast}
      />

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="bg-[#E3000F] text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-transform hover:scale-105">
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
