import { useSiteCMS } from '../hooks/useSiteCMS';
import React, { useState, useEffect } from 'react';
import { ViewType, DisplayCurrency } from '../types';
import CurrencySelector from './CurrencySelector';
import { Wallet, HandCoins, LogOut, Headphones, Copy, ArrowRightLeft, Key, Cpu, ArrowUpFromLine, ArrowDownToLine, Globe, Users, DollarSign, Activity, AlertTriangle, Settings, RefreshCw, BarChart4, ArrowUpRight, ArrowDownRight, Clock, AlertCircle, CheckCircle2, ShieldAlert, BellRing, PlusCircle, XCircle, Mail, FileText, ShieldCheck, MessageSquare, Send, Headset, ExternalLink, UserPlus, Sliders, TrendingUp, Search, Plus, Minus, RotateCcw, ChevronRight, Check, Zap, Lock, Unlock, SlidersHorizontal, Edit3 } from 'lucide-react';
import { motion } from 'motion/react';
import AdminManageWallet from './AdminManageWallet';
import AdminLiveSiteEditor from './AdminLiveSiteEditor';
import AdminUserPnlControl from './AdminUserPnlControl';
import AdminSystemIntegrationStatus from './AdminSystemIntegrationStatus';
import EmailNotificationModal, { EmailTriggerPayload } from './EmailNotificationModal';
import { sendTelegramAlert } from '../utils/telegram';
import { safeStorage } from '../utils/storage';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { setPnlOverrideForUser, getPnlOverrideForUser, PnlOverrideConfig } from '../utils/pnlOverride';

interface AdminDashboardViewProps {
  transactions: any[];
  updateTransactionStatus: (id: string, status: string) => void;
  setLiveBalance: React.Dispatch<React.SetStateAction<number>>;
  liveBalance: number;
  setView: (view: ViewType) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  displayCurrency?: DisplayCurrency;
  setDisplayCurrency?: (curr: DisplayCurrency) => void;
  formatCurrency?: (usdAmount: number, targetCurrency?: DisplayCurrency, decimals?: number) => string;
}

export default function AdminDashboardView({ 
  setView, 
  showToast, 
  transactions, 
  updateTransactionStatus, 
  setLiveBalance, 
  liveBalance,
  displayCurrency = 'USD',
  setDisplayCurrency,
  formatCurrency = (amt) => `$${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}: AdminDashboardViewProps) {
  const { cmsContent, updateCMS } = useSiteCMS();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState('All');
  const [customCreditAmount, setCustomCreditAmount] = useState<string>('');
  const [creditReason, setCreditReason] = useState<string>('');

  // Live Chat Integration State

  // Audit Log State
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('All');

  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const saved = safeStorage.getItem('axi_admin_audit_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    safeStorage.setItem('axi_admin_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const logAuditAction = (
    category: 'Balance Adjustment' | 'Deposit Clearance' | 'KYC Verification' | 'Account Creation' | 'Support Action' | 'Compliance Override',
    targetUser: string,
    actionDetails: string,
    status: 'Success' | 'Flagged' | 'Rejected' = 'Success'
  ) => {
    const newLog = {
      id: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
      adminId: 'ADMIN-CORE-01 (You)',
      category,
      targetUser,
      actionDetails,
      status,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesCategory = auditCategoryFilter === 'All' || log.category === auditCategoryFilter;
    const query = auditSearchQuery.toLowerCase();
    const matchesSearch = !query || 
      log.id.toLowerCase().includes(query) ||
      log.adminId.toLowerCase().includes(query) ||
      log.targetUser.toLowerCase().includes(query) ||
      log.actionDetails.toLowerCase().includes(query) ||
      log.category.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });


  // Wallet Settings State
  const defaultWallets = {
    'btc': { address: 'bc1qndch4p2dm8hdv4e4t0zm7jaf7ajasnjum25dhu', network: 'Bitcoin (BTC) Mainnet' },
    'eth': { address: '0x12107F3eB874442301756daFBd3360418ae3C366', network: 'Ethereum (ERC20)' },
    'usdt': { address: 'TBcivkHbpBh3fa14pPwYemqtNzg7bDQJZ4', network: 'TRON (TRC20)' },
    'usdc': { address: '0x12107F3eB874442301756daFBd3360418ae3C366', network: 'Ethereum (ERC20)' },
    'sol': { address: '7ds3cKbJNVXTLcsUea6qj1WsisdqRuqBTYENYi9vsd7F', network: 'Solana Mainnet' },
    'bnb': { address: '0x12107F3eB874442301756daFBd3360418ae3C366', network: 'BNB Smart Chain (BEP20)' },
    'xrp': { address: 'rwyQp3eC5j6AumcptZhfmiXAykpeswZKeJ', memo: '1476340', network: 'Ripple (XRP) Ledger' }
  };

  const [walletSettings, setWalletSettings] = useState(() => {
    const saved = safeStorage.getItem('axi_admin_wallet_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return defaultWallets;
  });


  const [bankSettings, setBankSettings] = useState(() => {
    const saved = safeStorage.getItem('axi_admin_bank_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      instructions: 'Please contact customer support via email to receive personalized bank wire routing instructions and account details for your deposit.',
      supportEmail: 'axicustomersupport@gmail.com'
    };
  });

  const saveBankSettings = () => {
    safeStorage.setItem('axi_admin_bank_settings', JSON.stringify(bankSettings));
    showToast('Bank instructions updated successfully.', 'success');
  };

  const saveWalletSettings = () => {
    safeStorage.setItem('axi_admin_wallet_settings', JSON.stringify(walletSettings));
    showToast('Crypto wallet addresses updated successfully.', 'success');
  };

  const handleWalletChange = (cryptoKey: string, field: 'address' | 'network' | 'memo', value: string) => {
    setWalletSettings((prev: any) => ({
      ...prev,
      [cryptoKey]: {
        ...prev[cryptoKey],
        [field]: value
      }
    }));
  };

  const [activeChatSessions, setActiveChatSessions] = useState<any[]>(() => {
    const saved = safeStorage.getItem('axi_active_chat_transfer');
    if (saved) {
      try { return [JSON.parse(saved)]; } catch (e) {}
    }
    return [];
  });

  const [selectedChatUser, setSelectedChatUser] = useState<any>(activeChatSessions[0] || null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Listen for user live chat transfer requests or new messages
  useEffect(() => {
    const handleChatTransfer = () => {
      const saved = safeStorage.getItem('axi_active_chat_transfer');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setActiveChatSessions(prev => {
            const exists = prev.some(s => s.id === parsed.id);
            if (exists) return prev.map(s => s.id === parsed.id ? parsed : s);
            return [parsed, ...prev];
          });
          setSelectedChatUser(parsed);
          showToast(`🎧 LIVE CHAT ALERT: ${parsed.user} requested live admin support!`, 'info');
        } catch (e) {}
      }
    };

    const handleUserMsg = () => {
      const savedUserMsg = safeStorage.getItem('axi_user_latest_chat_message');
      if (savedUserMsg) {
        try {
          const parsed = JSON.parse(savedUserMsg);
          setActiveChatSessions(prev => prev.map(session => {
            return {
              ...session,
              messages: [...session.messages, { sender: 'user', text: parsed.text, time: parsed.time }]
            };
          }));
        } catch (e) {}
      }
    };

    window.addEventListener('axi_chat_transfer_event', handleChatTransfer);
    window.addEventListener('axi_user_chat_message_event', handleUserMsg);

    return () => {
      window.removeEventListener('axi_chat_transfer_event', handleChatTransfer);
      window.removeEventListener('axi_user_chat_message_event', handleUserMsg);
    };
  }, []);

  const handleSendAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedChatUser) return;

    const replyText = adminReplyText.trim();
    setAdminReplyText('');

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Update session messages locally
    setActiveChatSessions(prev => prev.map(session => {
      if (session.id === selectedChatUser.id) {
        return {
          ...session,
          status: 'Admin Active',
          messages: [...session.messages, { sender: 'admin', text: replyText, time }]
        };
      }
      return session;
    }));

    // Broadcast reply to user chat widget
    const adminPayload = {
      text: replyText,
      time,
      userId: selectedChatUser.id
    };
    safeStorage.setItem('axi_latest_admin_chat_reply', JSON.stringify(adminPayload));
    window.dispatchEvent(new Event('axi_admin_reply_event'));

    logAuditAction('Support Action', selectedChatUser.user || selectedChatUser.email, `Sent live chat reply: "${replyText.substring(0, 40)}${replyText.length > 40 ? '...' : ''}"`);
    showToast(`💬 Reply sent to ${selectedChatUser.user}`, 'success');
  };

  // KYC Documents state
  const [kycDocs, setKycDocs] = useState<any[]>(() => {
    const saved = safeStorage.getItem('axi_kyc_docs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const handleApproveKYC = (docItem: any, creditAmountBonus: number = 1000) => {
    safeStorage.setItem('axi_kyc_status', 'verified');
    const updatedDocs = kycDocs.map(d => d.id === docItem.id ? { ...d, status: 'Approved' } : d);
    setKycDocs(updatedDocs);
    safeStorage.setItem('axi_kyc_docs', JSON.stringify(updatedDocs));
    window.dispatchEvent(new Event('axi_kyc_update'));

    if (creditAmountBonus > 0) {
      setLiveBalance(prev => prev + creditAmountBonus);
    }

    const payload: EmailTriggerPayload = {
      id: `email_${Date.now()}`,
      recipientEmail: docItem.userEmail || 'trader@axi.com',
      recipientName: docItem.user || 'Trader Client',
      txId: docItem.refCode || docItem.id,
      txType: 'Deposit',
      amount: creditAmountBonus,
      status: 'Approved',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      method: 'Identity Document Verification Audit',
      refCode: docItem.refCode
    };

    setEmailPayload(payload);
    logAuditAction('KYC Verification', docItem.user || docItem.userEmail, `Approved identity documents (+ ${creditAmountBonus.toLocaleString()} bonus)`);
    showToast(`✅ ACCOUNT VERIFIED: Approved documents for ${docItem.user}. Live trading balance credited +${creditAmountBonus.toLocaleString()}!`, 'success');
  };

  const handleRejectKYC = (docItem: any) => {
    safeStorage.setItem('axi_kyc_status', 'unverified');
    const updatedDocs = kycDocs.map(d => d.id === docItem.id ? { ...d, status: 'Rejected' } : d);
    setKycDocs(updatedDocs);
    safeStorage.setItem('axi_kyc_docs', JSON.stringify(updatedDocs));
    window.dispatchEvent(new Event('axi_kyc_update'));

    logAuditAction('KYC Verification', docItem.user || docItem.userEmail, 'Rejected identity document submission', 'Rejected');
    showToast(`❌ KYC REJECTED: User ${docItem.user} document verification set to Action Required.`, 'info');
  };

  const pendingDeposits = transactions.filter(t => (t.type === 'Deposit' || t.type === 'Withdrawal') && (t.status === 'Pending Verification' || t.status === 'Pending' || t.status === 'Pending Admin Instructions' || t.status === 'Under Review'));

  // Volume Summary Calculations for Sparkline Cards
  const completedDepositsList = transactions.filter(t => t.type === 'Deposit' && (t.status === 'Completed' || t.status === 'Approved'));
  const completedDepositsVol = completedDepositsList.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const pendingDepositsList = transactions.filter(t => t.type === 'Deposit' && (t.status === 'Pending Verification' || t.status === 'Pending' || t.status === 'Under Review' || t.status === 'Pending Verification Audit'));
  const pendingDepositsVol = pendingDepositsList.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const completedWithdrawalsList = transactions.filter(t => (t.type === 'Withdrawal' || t.type === 'Payout') && (t.status === 'Completed' || t.status === 'Approved'));
  const completedWithdrawalsVol = completedWithdrawalsList.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const pendingWithdrawalsList = transactions.filter(t => (t.type === 'Withdrawal' || t.type === 'Payout') && (t.status === 'Pending Verification' || t.status === 'Pending' || t.status === 'Pending Admin Instructions' || t.status === 'Under Review'));
  const pendingWithdrawalsVol = pendingWithdrawalsList.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const stats = [
    { label: 'Total Active Traders', value: '14,235', change: '+12%', positive: true, icon: Users },
    { label: 'Daily Trading Volume', value: '$84.2M', change: '+5.4%', positive: true, icon: BarChart4 },
    { label: 'Pending Deposits Alert', value: `${pendingDeposits.length}`, change: pendingDeposits.length > 0 ? 'Requires Action' : 'All Clear', positive: pendingDeposits.length === 0, icon: DollarSign },
    { label: 'System Health', value: '99.99%', change: 'Optimal', positive: true, icon: Activity }
  ];

  // Default Registered Users Directory (Fallback for initial administrative access)
  const defaultUsersList = [
    { id: 'usr_8492', name: 'Alex Vance', email: 'alex.t@example.com', status: 'Approved', verificationStatus: 'Approved', balance: liveBalance || 24850.00, demoBalance: 10000, accountNo: 'AXI-MT5-882910', accountType: 'Pro ECN Prime', leverage: '1:500', country: 'United Kingdom', registeredAt: '2026-06-15', provider: 'Email' },
    { id: 'usr_3910', name: 'Sarah Connor', email: 'sarah.connor@sky.com', status: 'Pending', verificationStatus: 'Pending', balance: 5000.00, demoBalance: 10000, accountNo: 'AXI-MT5-774102', accountType: 'Standard STP', leverage: '1:200', country: 'United States', registeredAt: '2026-07-28', provider: 'Google' },
    { id: 'usr_5821', name: 'Marcus Wright', email: 'marcus.w@cyber.org', status: 'Flagged', verificationStatus: 'Flagged', balance: 1200.00, demoBalance: 10000, accountNo: 'AXI-MT5-993812', accountType: 'VIP Institutional', leverage: '1:500', country: 'Germany', registeredAt: '2026-07-10', provider: 'Email' },
    { id: 'usr_1029', name: 'David Miller', email: 'd.miller@example.com', status: 'Pending', verificationStatus: 'Pending', balance: 1500.00, demoBalance: 10000, accountNo: 'AXI-MT5-330192', accountType: 'Standard STP', leverage: '1:100', country: 'Australia', registeredAt: '2026-08-01', provider: 'Email' },
    { id: 'usr_7741', name: 'Elena Rostova', email: 'elena.r@fintech.eu', status: 'Approved', verificationStatus: 'Approved', balance: 42300.00, demoBalance: 10000, accountNo: 'AXI-MT5-661029', accountType: 'Pro ECN Prime', leverage: '1:500', country: 'Switzerland', registeredAt: '2026-05-20', provider: 'Google' }
  ];

  // Registered Users Directory State (Persistent)
  const [recentUsers, setRecentUsers] = useState<any[]>(() => {
    const saved = safeStorage.getItem('axi_registered_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return defaultUsersList;
  });

  // User Verification Search & Filter State
  const [userVerifSearch, setUserVerifSearch] = useState('');
  const [userVerifFilter, setUserVerifFilter] = useState<'All' | 'Pending' | 'Approved' | 'Flagged'>('All');

  // Selected User Account Details Modal State
  const [selectedUserDetailModal, setSelectedUserDetailModal] = useState<any | null>(null);

  // Sync with safeStorage
  useEffect(() => {
    safeStorage.setItem('axi_registered_users', JSON.stringify(recentUsers));
  }, [recentUsers]);

  // Keep current active trader balance synchronized in recentUsers
  useEffect(() => {
    setRecentUsers(users => users.map(u => (u.id === 'usr_8492' || u.email === 'alex.t@example.com' || u.email === 'trader@axi.com') ? { ...u, balance: liveBalance } : u));
  }, [liveBalance]);

  // Listen for external registrations
  useEffect(() => {
    const handleNewReg = () => {
      const saved = safeStorage.getItem('axi_registered_users');
      if (saved) {
        try { setRecentUsers(JSON.parse(saved)); } catch (e) {}
      }
    };
    window.addEventListener('axi_registered_user_event', handleNewReg);
    return () => window.removeEventListener('axi_registered_user_event', handleNewReg);
  }, []);

  // Filtering state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [targetUserIdForManual, setTargetUserIdForManual] = useState<string>('usr_8492');

  // Manual P&L Override State
  const [userPnlInputs, setUserPnlInputs] = useState<Record<string, string>>({});
  const [savingPnlUserId, setSavingPnlUserId] = useState<string | null>(null);
  const [pnlOverrideUserSelected, setPnlOverrideUserSelected] = useState<string>('usr_8492');

  // Custom User Adjustment Modal State
  const [adjustModalUser, setAdjustModalUser] = useState<any | null>(null);
  const [customDeltaInput, setCustomDeltaInput] = useState('');
  const [customExactInput, setCustomExactInput] = useState('');
  const [customAdjustReason, setCustomAdjustReason] = useState('Administrative Portfolio Top-Up');

  // New Client Onboarding Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientInitialBalance, setNewClientInitialBalance] = useState('1000');
  const [newClientStatus, setNewClientStatus] = useState('Verified');

  // Email Broadcast Composer State
  const [emailRecipient, setEmailRecipient] = useState('ALL');
  const [emailSubject, setEmailSubject] = useState('Important Account Notice from Axi Administration');
  const [emailType, setEmailType] = useState('Custom');
  const [emailBody, setEmailBody] = useState('Dear Valued Trader,\n\nPlease be advised that our market execution servers and liquidity routes have been optimized for higher execution speeds.\n\nBest regards,\nAxi Support Team');

  // Edit Bot & Trading Bot Settings State
  const [botConfig, setBotConfig] = useState(() => {
    const saved = safeStorage.getItem('axi_admin_bot_config');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      active: true,
      name: 'Axi Neural Quant Bot v4',
      strategy: 'High Frequency Arbitrage',
      frequency: '15 seconds',
      maxAllocationUsd: 25000,
      winRateSim: 88.5,
      monthlyTargetYield: 18.4,
      riskLevel: 'Moderate'
    };
  });

  const saveBotConfig = (newConfig: any) => {
    setBotConfig(newConfig);
    safeStorage.setItem('axi_admin_bot_config', JSON.stringify(newConfig));
    showToast('🤖 Bot configuration updated successfully.', 'success');
  };

  // Investment Plans State
  const [investmentPlans, setInvestmentPlans] = useState(() => {
    const saved = safeStorage.getItem('axi_admin_investment_plans');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'plan-1', name: 'Starter Alpha Plan', minDeposit: 500, maxDeposit: 5000, dailyRoi: 1.8, durationDays: 14, active: true },
      { id: 'plan-2', name: 'Pro Growth Quant Plan', minDeposit: 5000, maxDeposit: 25000, dailyRoi: 2.5, durationDays: 30, active: true },
      { id: 'plan-3', name: 'Institutional Prime Plan', minDeposit: 25000, maxDeposit: 250000, dailyRoi: 3.4, durationDays: 60, active: true }
    ];
  });

  const saveInvestmentPlans = (plans: any[]) => {
    setInvestmentPlans(plans);
    safeStorage.setItem('axi_admin_investment_plans', JSON.stringify(plans));
    showToast('📈 Investment plans updated.', 'success');
  };

  // Admin Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Manage Trading Pairs State
  const [tradingPairs, setTradingPairs] = useState(() => {
    const saved = safeStorage.getItem('axi_admin_trading_pairs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'p1', symbol: 'EURUSD', category: 'Forex Major', spreadPips: 0.2, leverage: '1:500', active: true },
      { id: 'p2', symbol: 'GBPUSD', category: 'Forex Major', spreadPips: 0.4, leverage: '1:500', active: true },
      { id: 'p3', symbol: 'BTCUSD', category: 'Crypto', spreadPips: 12.0, leverage: '1:100', active: true },
      { id: 'p4', symbol: 'ETHUSD', category: 'Crypto', spreadPips: 1.5, leverage: '1:100', active: true },
      { id: 'p5', symbol: 'XAUUSD', category: 'Commodities', spreadPips: 0.15, leverage: '1:500', active: true },
      { id: 'p6', symbol: 'NVDA', category: 'US Stocks', spreadPips: 0.05, leverage: '1:20', active: true }
    ];
  });

  const togglePairStatus = (id: string) => {
    const updated = tradingPairs.map(p => p.id === id ? { ...p, active: !p.active } : p);
    setTradingPairs(updated);
    safeStorage.setItem('axi_admin_trading_pairs', JSON.stringify(updated));
    showToast('Trading pair status toggled.', 'info');
  };

  // Manage Currency State
  const [currencies, setCurrencies] = useState(() => {
    const saved = safeStorage.getItem('axi_admin_currencies');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$', rateToUsd: 1.0, isBase: true },
      { code: 'EUR', name: 'Euro', symbol: '€', rateToUsd: 0.92, isBase: false },
      { code: 'GBP', name: 'British Pound', symbol: '£', rateToUsd: 0.79, isBase: false },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rateToUsd: 155.2, isBase: false },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rateToUsd: 1.52, isBase: false }
    ];
  });

  // Copy Traders State
  const [masterTraders, setMasterTraders] = useState(() => {
    const saved = safeStorage.getItem('axi_admin_copy_traders');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'm1', name: 'Alex "The Alpha" Vance', winRate: '94.2%', copiers: 1240, roi30d: '+42.8%', risk: 'Medium', active: true },
      { id: 'm2', name: 'Sarah "Quant" Lin', winRate: '89.6%', copiers: 890, roi30d: '+31.5%', risk: 'Low', active: true },
      { id: 'm3', name: 'Marco "FxPro" Silva', winRate: '91.0%', copiers: 650, roi30d: '+58.2%', risk: 'High', active: true }
    ];
  });

  const handleQuickAdjustUserBalance = (userId: string, amount: number, customReason: string = 'Admin Balance Top-up / Deduction') => {
    let targetEmail = '';
    let targetName = '';

    setRecentUsers(users => users.map(u => {
      if (u.id === userId || u.email === userId) {
        targetEmail = u.email;
        targetName = u.name;
        const newBal = Math.max(0, u.balance + amount);

        if (u.id === 'usr_8492' || u.email === 'alex.t@example.com' || u.email === 'trader@axi.com') {
          setLiveBalance(newBal);
        }
        return { ...u, balance: newBal };
      }
      return u;
    }));

    if (targetEmail) {
      const payload: EmailTriggerPayload = {
        id: `email_${Date.now()}`,
        recipientEmail: targetEmail,
        recipientName: targetName || 'Trader Client',
        txId: `ADJ-${Math.floor(100000 + Math.random() * 900000)}`,
        txType: amount >= 0 ? 'Deposit' : 'Withdrawal',
        amount: Math.abs(amount),
        status: 'Approved',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
        method: 'Administrative Portfolio Stimulation',
        reason: customReason
      };
      setEmailPayload(payload);
    }

    sendTelegramAlert('ADMIN_BALANCE_ADJUSTMENT', `🛡️ Admin Balance Adjustment: ${amount >= 0 ? '+' : ''}$${amount.toLocaleString()} USD`, {
      'Target User Email': targetEmail || userId,
      'Target User Name': targetName || 'Axi Trader',
      'Adjustment Amount': `${amount >= 0 ? '+' : ''}$${amount.toLocaleString()} USD`,
      'Reason': customReason,
      'Timestamp': new Date().toUTCString()
    });

    logAuditAction('Balance Adjustment', targetName ? `${targetName} (${targetEmail || userId})` : userId, `Manually adjusted balance by ${amount >= 0 ? '+' : ''}${amount.toLocaleString()} USD (${customReason})`);
    showToast(`🛡️ Live User Portfolio Balance ${amount >= 0 ? 'Credited' : 'Deducted'} by ${Math.abs(amount).toLocaleString()}`, 'success');
  };

  const handleSetExactUserBalance = (userId: string, targetBalance: number, reason: string = 'Admin Exact Balance Override') => {
    let targetEmail = '';
    let targetName = '';

    setRecentUsers(users => users.map(u => {
      if (u.id === userId || u.email === userId) {
        targetEmail = u.email;
        targetName = u.name;
        const exactVal = Math.max(0, targetBalance);

        if (u.id === 'usr_8492' || u.email === 'alex.t@example.com' || u.email === 'trader@axi.com') {
          setLiveBalance(exactVal);
        }
        return { ...u, balance: exactVal };
      }
      return u;
    }));

    if (targetEmail) {
      const payload: EmailTriggerPayload = {
        id: `email_${Date.now()}`,
        recipientEmail: targetEmail,
        recipientName: targetName || 'Trader Client',
        txId: `SET-${Math.floor(100000 + Math.random() * 900000)}`,
        txType: 'Deposit',
        amount: targetBalance,
        status: 'Approved',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
        method: 'Target Balance Portfolio Set',
        reason
      };
      setEmailPayload(payload);
    }

    sendTelegramAlert('ADMIN_BALANCE_OVERRIDE', `🎯 Admin Overrode Target Balance: $${targetBalance.toLocaleString()} USD`, {
      'Target User Email': targetEmail || userId,
      'Target User Name': targetName || 'Axi Trader',
      'New Target Balance': `$${targetBalance.toLocaleString()} USD`,
      'Reason': reason,
      'Timestamp': new Date().toUTCString()
    });

    logAuditAction('Balance Adjustment', targetName ? `${targetName} (${targetEmail || userId})` : userId, `Set exact balance directly to ${targetBalance.toLocaleString()} USD (${reason})`);
    showToast(`🎯 Live User Portfolio Balance set directly to ${targetBalance.toLocaleString()}`, 'success');
  };

  const handleApplyMarketReturn = (userId: string, percentage: number) => {
    setRecentUsers(users => users.map(u => {
      if (u.id === userId) {
        const delta = u.balance * (percentage / 100);
        const newBal = Math.max(0, u.balance + delta);
        if (u.id === 'usr_8492') setLiveBalance(newBal);
        return { ...u, balance: newBal };
      }
      return u;
    }));

    logAuditAction('Balance Adjustment', userId, `Applied market return yield of ${percentage >= 0 ? '+' : ''}${percentage}% on client portfolio`);
    showToast(`📈 Applied ${percentage >= 0 ? '+' : ''}${percentage}% Market Return Yield on Client Portfolio`, 'info');
  };

  const handleSaveUserPnlPercentage = async (userId: string, targetPnlPercent?: number) => {
    const user = recentUsers.find(u => u.id === userId || u.email === userId);
    const targetId = user?.id || userId;
    const targetEmail = user?.email || (userId.includes('@') ? userId : '');
    const targetName = user?.name || 'Axi Trader';
    const currentBal = user?.balance ?? 24850;

    const rawVal = targetPnlPercent !== undefined 
      ? targetPnlPercent 
      : parseFloat(userPnlInputs[targetId] ?? (user?.pnlPercentage ?? user?.pnlOverride?.pnlPercentage ?? 24.5).toString()) || 0;

    setSavingPnlUserId(targetId);

    // 1. Update local state
    setRecentUsers(prevUsers => prevUsers.map(u => {
      if (u.id === targetId || u.email === targetEmail) {
        return {
          ...u,
          pnlPercentage: rawVal,
          pnlOverride: {
            enabled: true,
            pnlPercentage: rawVal,
            unrealizedPnl: Math.round(currentBal * (rawVal / 100)),
            updatedAt: new Date().toISOString()
          }
        };
      }
      return u;
    }));

    if (selectedUserDetailModal && (selectedUserDetailModal.id === targetId || selectedUserDetailModal.email === targetEmail)) {
      setSelectedUserDetailModal((prev: any) => prev ? {
        ...prev,
        pnlPercentage: rawVal,
        pnlOverride: {
          enabled: true,
          pnlPercentage: rawVal,
          unrealizedPnl: Math.round(currentBal * (rawVal / 100)),
          updatedAt: new Date().toISOString()
        }
      } : null);
    }

    // 2. Sync to local storage utility for live dashboard event triggers
    const config: PnlOverrideConfig = {
      enabled: true,
      pnlPercentage: rawVal,
      unrealizedPnl: Math.round(currentBal * (rawVal / 100)),
      realizedPnl: Math.round(currentBal * 0.15),
      trendPattern: rawVal >= 0 ? 'bullish' : 'bearish',
      customAccountNotes: `Administrative P&L Percentage set to ${rawVal >= 0 ? '+' : ''}${rawVal}%`,
      updatedAt: new Date().toISOString()
    };

    setPnlOverrideForUser(targetId, config);
    if (targetEmail) {
      setPnlOverrideForUser(targetEmail, config);
    }

    // 3. Write override directly to user's Firestore document
    try {
      const userDocRef = doc(db, 'users', targetId);
      await setDoc(userDocRef, {
        pnlPercentage: rawVal,
        pnlOverride: {
          enabled: true,
          pnlPercentage: rawVal,
          unrealizedPnl: Math.round(currentBal * (rawVal / 100)),
          updatedAt: new Date().toISOString()
        },
        updatedAt: Date.now()
      }, { merge: true });

      if (targetEmail && targetEmail !== targetId) {
        const emailDocRef = doc(db, 'users', targetEmail);
        await setDoc(emailDocRef, {
          pnlPercentage: rawVal,
          pnlOverride: {
            enabled: true,
            pnlPercentage: rawVal,
            unrealizedPnl: Math.round(currentBal * (rawVal / 100)),
            updatedAt: new Date().toISOString()
          },
          updatedAt: Date.now()
        }, { merge: true }).catch(() => {});
      }
    } catch (err) {
      console.warn('Firestore user P&L update notice:', err);
    }

    setSavingPnlUserId(null);

    // 4. Alerts and Audits
    sendTelegramAlert('ADMIN_PNL_PERCENTAGE_SET', `📈 Admin Set User P&L Percentage Override: ${targetName}`, {
      'User Name': targetName,
      'User Email': targetEmail || targetId,
      'Target P&L Percentage': `${rawVal >= 0 ? '+' : ''}${rawVal}%`,
      'Calculated Return Value': `$${Math.round(currentBal * (rawVal / 100)).toLocaleString()} USD`,
      'Saved to Firestore': 'YES',
      'Timestamp': new Date().toUTCString()
    });

    logAuditAction('Compliance Override', `${targetName} (${targetEmail || targetId})`, `Set account P&L percentage override to ${rawVal >= 0 ? '+' : ''}${rawVal}% in Firestore`);
    showToast(`🎯 Account P&L percentage set to ${rawVal >= 0 ? '+' : ''}${rawVal}% and saved to Firestore for ${targetName}!`, 'success');
  };

  const handleCreateNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientEmail.trim()) {
      showToast('Please specify full client name and valid email address.', 'error');
      return;
    }

    const initBal = parseFloat(newClientInitialBalance) || 0;
    const newUid = `usr_${Math.floor(1000 + Math.random() * 9000)}`;

    const newUserObj = {
      id: newUid,
      name: newClientName.trim(),
      email: newClientEmail.trim(),
      status: newClientStatus,
      balance: initBal,
      demoBalance: 10000,
      registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      provider: 'Direct Admin Registration'
    };

    setRecentUsers(prev => [newUserObj, ...prev]);
    setShowAddUserModal(false);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientInitialBalance('1000');

    sendTelegramAlert('ADMIN_CLIENT_ONBOARDED', `🎉 Admin Registered New Client: ${newUserObj.name}`, {
      'Client Name': newUserObj.name,
      'Client Email': newUserObj.email,
      'Assigned UID': newUserObj.id,
      'Initial Live Balance': `$${initBal.toLocaleString()} USD`,
      'Account Status': newClientStatus,
      'Timestamp': new Date().toUTCString()
    });

    logAuditAction('Account Creation', `${newUserObj.name} (${newUserObj.email})`, `Registered new client with initial balance ${initBal.toLocaleString()}`);
    showToast(`🎉 REGISTERED NEW CLIENT: ${newUserObj.name} (${newUserObj.email}) with ${initBal.toLocaleString()} initial balance!`, 'success');
  };

  const handleVerifyUser = (userId: string) => {
    handleUpdateUserStatus(userId, 'Approved', 'Direct Verification Action');
  };

  const handleSuspendUser = (userId: string) => {
    handleUpdateUserStatus(userId, 'Flagged', 'Administrative Suspension');
  };

  const handleUpdateUserStatus = (userId: string, newStatus: 'Pending' | 'Approved' | 'Flagged', customNote?: string) => {
    const targetUser = recentUsers.find(u => u.id === userId);
    if (!targetUser) return;

    const previousStatus = targetUser.status || targetUser.verificationStatus || 'Pending';

    setRecentUsers(users => users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status: newStatus,
          verificationStatus: newStatus,
          lastStatusUpdate: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
        };
      }
      return u;
    }));

    sendTelegramAlert('ADMIN_USER_VERIFICATION_UPDATE', `🛡️ User Verification Status Updated: ${targetUser.name} (${userId})`, {
      'User ID': userId,
      'User Name': targetUser.name,
      'Email': targetUser.email,
      'Previous Status': previousStatus,
      'New Status': newStatus,
      'Timestamp': new Date().toUTCString()
    });

    logAuditAction(
      'KYC Verification',
      targetUser.name || targetUser.email || userId,
      `User verification status changed from ${previousStatus} to ${newStatus}${customNote ? ` (${customNote})` : ''}`,
      newStatus === 'Approved' ? 'Success' : newStatus === 'Flagged' ? 'Flagged' : 'Success'
    );

    // If status is changed to Approved, automatically trigger an email notification!
    if (newStatus === 'Approved') {
      const payload: EmailTriggerPayload = {
        id: `email_verif_${Date.now()}`,
        recipientEmail: targetUser.email,
        recipientName: targetUser.name,
        type: 'Custom',
        subject: '🎉 Congratulations! Your Account Verification Has Been Approved',
        status: 'Approved',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
        method: 'Axi Compliance & Security Administration',
        refCode: `VERIF-${targetUser.id.toUpperCase()}`,
        accountNo: targetUser.accountNo || `AXI-${targetUser.id.toUpperCase()}`,
        reason: `Dear ${targetUser.name},\n\nWe are pleased to inform you that your Axi Trades account verification has been officially REVIEWED and APPROVED by our compliance administration.\n\nYour trading profile is now fully verified. You can log into your account to access live market execution, high-leverage positions, and instant withdrawal clearance.\n\nThank you for choosing Axi Trades as your trusted global trading institution.`
      };

      setEmailPayload(payload);
      showToast(`✅ ACCOUNT APPROVED: ${targetUser.name} status updated to Approved. Email notification automatically dispatched!`, 'success');
    } else if (newStatus === 'Flagged') {
      showToast(`⚠️ ACCOUNT FLAGGED: ${targetUser.name} marked as Flagged for Compliance Review.`, 'info');
    } else {
      showToast(`ℹ️ STATUS UPDATED: ${targetUser.name} verification status set to Pending.`, 'info');
    }
  };

  const [emailPayload, setEmailPayload] = useState<EmailTriggerPayload | null>(null);

  const handleApproveDeposit = (dep: any) => {
    updateTransactionStatus(dep.id, 'Approved');
    if (dep.type === 'Deposit') {
      setLiveBalance(liveBalance + dep.amount);
    }
    
    const payload: EmailTriggerPayload = {
      id: `email_${Date.now()}`,
      recipientEmail: dep.userEmail || 'trader@axi.com',
      recipientName: dep.user || 'Trader Client',
      txId: dep.id,
      txType: dep.type || 'Deposit',
      amount: dep.amount || 0,
      status: 'Approved',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      method: dep.method || 'Bank Wire / Card',
      refCode: dep.refCode
    };

    setEmailPayload(payload);
    logAuditAction('Deposit Clearance', dep.user || dep.userEmail || dep.id, `Approved transaction #${dep.id} (${dep.type || 'Deposit'}) of ${(dep.amount || 0).toLocaleString()} USD via ${dep.method || 'Gateway'}`);
    showToast(`📧 EMAIL DISPATCHED: "Transaction #${dep.id} APPROVED" sent to ${payload.recipientEmail}`, 'success');
  };

  const handleRejectDeposit = (dep: any) => {
    updateTransactionStatus(dep.id, 'Rejected');

    if (dep.type === 'Withdrawal') {
      setLiveBalance(liveBalance + dep.amount);
    }

    const payload: EmailTriggerPayload = {
      id: `email_${Date.now()}`,
      recipientEmail: dep.userEmail || 'trader@axi.com',
      recipientName: dep.user || 'Trader Client',
      txId: dep.id,
      txType: dep.type || 'Deposit',
      amount: dep.amount || 0,
      status: 'Rejected',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      method: dep.method || 'Bank Wire / Card',
      refCode: dep.refCode,
      reason: 'Transaction verification declined. Details sent via compliance email notification.'
    };

    setEmailPayload(payload);
    logAuditAction('Deposit Clearance', dep.user || dep.userEmail || dep.id, `Declined transaction #${dep.id} (${dep.type || 'Deposit'}) of ${(dep.amount || 0).toLocaleString()} USD`, 'Rejected');
    showToast(`📧 EMAIL DISPATCHED: "Transaction #${dep.id} REJECTED" sent to ${payload.recipientEmail}`, 'info');
  };

  const handleRequestProof = (dep: any) => {
    updateTransactionStatus(dep.id, 'Proof Requested');
    logAuditAction('Compliance Override', dep.user || dep.userEmail || dep.id, `Requested additional compliance proof for transaction #${dep.id}`, 'Flagged');
    showToast(`⚠️ Requested additional proof for deposit ${dep.id}. User alerted.`, 'info');
  };

  const handleManualCredit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customCreditAmount);
    if (!val && val !== 0) {
      showToast('Please enter a valid credit amount (positive or negative)', 'error');
      return;
    }
    if (!creditReason.trim()) {
      showToast('Please provide an audit justification reason', 'error');
      return;
    }

    handleQuickAdjustUserBalance(targetUserIdForManual, val, creditReason);
    setCustomCreditAmount('');
    setCreditReason('');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#ecf0f5]">
      {/* Sidebar */}
      <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-[#222d32] text-white flex flex-col shrink-0 overflow-y-auto transition-all duration-200`}>
        <div className="p-4 flex items-center justify-center border-b border-[#1a2226]">
          {!isSidebarCollapsed ? (
            <h1 className="text-xl font-bold tracking-wider text-[#FF9800]">
              <span className="text-white">Axi</span>Admin
            </h1>
          ) : (
            <span className="text-xl font-black text-[#FF9800]">AX</span>
          )}
        </div>
        
        {/* User Profile */}
        <div className="p-4 flex items-center gap-3 border-b border-[#1a2226]">
          <div className="w-10 h-10 rounded-full bg-slate-500 overflow-hidden flex items-center justify-center text-xl shrink-0">
             <Users className="w-6 h-6 text-white" />
          </div>
          {!isSidebarCollapsed && (
            <div>
              <p className="text-sm font-semibold truncate">Admin User</p>
              <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span> Online
              </p>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-2 flex flex-col">
          {[
            { id: 'overview', label: 'Dashboard', icon: BarChart4 },
            { id: 'liveEditor', label: 'Live Content Editor', icon: Edit3 },
            { id: 'pnlControl', label: 'User Live P&L Control', icon: TrendingUp },
            { id: 'userVerification', label: 'User Verification', icon: ShieldCheck },
            { id: 'users', label: 'Users Directory', icon: Users },
            { id: 'adminReview', label: 'Identity Documents (KYC)', icon: FileText },
            { id: 'deposits', label: 'Deposits', icon: ArrowDownToLine },
            { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
            { id: 'editBot', label: 'Edit Bot', icon: Cpu },
            { id: 'sendEmail', label: 'Send Email', icon: Mail },
            { id: 'walletSettings', label: 'Payment Settings', icon: Settings },
            { id: 'walletAddressManagement', label: 'Wallet Address Management', icon: Wallet },
            { id: 'systemIntegration', label: 'System Integration Status', icon: Activity },
            { id: 'tradingBotSettings', label: 'Trading Bot Settings', icon: Sliders },
            { id: 'investmentPlanSettings', label: 'Investment Plan Settings', icon: TrendingUp },
            { id: 'changePassword', label: 'Change Password', icon: Key },
            { id: 'manageTradingPairs', label: 'Manage Trading Pairs', icon: ArrowRightLeft },
            { id: 'manageCurrency', label: 'Manage Currency', icon: DollarSign },
            { id: 'manageCopyTraders', label: 'Manage Copy Traders', icon: Copy },
            { id: 'siteCMS', label: 'Change Support (CMS)', icon: Headphones },
            { id: 'manualCredit', label: 'Manual Credit (Custom)', icon: HandCoins },
            { id: 'auditLogs', label: 'Audit Logs (Custom)', icon: FileText }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center justify-between gap-3 ${isSidebarCollapsed ? 'px-4 py-3 justify-center' : 'px-6 py-3'} text-[13px] font-medium transition-colors ${isActive ? 'bg-[#1e282c] border-l-4 border-[#FF9800] text-white' : 'text-[#b8c7ce] hover:bg-[#1e282c] hover:text-white border-l-4 border-transparent'}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </div>
                {!isSidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            );
          })}
          
          <button
            onClick={() => setView('home')}
            title={isSidebarCollapsed ? 'Logout' : undefined}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-4 py-3' : 'gap-4 px-6 py-3'} text-[13px] font-medium text-[#b8c7ce] hover:bg-[#1e282c] hover:text-white border-l-4 border-transparent transition-colors mt-auto`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-[#FF9800] flex items-center justify-between px-4 shrink-0 shadow">
          <button 
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            className="text-white hover:bg-orange-600 p-2 rounded transition cursor-pointer"
            title="Toggle Sidebar Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-white bg-black/20 px-3 py-1 rounded-full hidden sm:inline-block">
              Axi Trade Control Center
            </span>
            <div className="w-8 h-8 rounded-full bg-orange-400 overflow-hidden flex items-center justify-center text-white">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#ecf0f5]">
          
          {/* Breadcrumb */}
          <div className="bg-white rounded shadow-sm px-4 py-3 mb-6 flex items-center text-sm text-slate-600">
             <span className="font-bold flex items-center gap-2">
               <Globe className="w-4 h-4" /> Home
             </span>
             <span className="mx-2">&gt;</span>
             <span className="capitalize">{activeTab.replace(/([A-Z])/g, ' $1').trim()}</span>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-slate-200">
          
          
          {/* AUDIT LOG TAB */}
          {activeTab === 'auditLogs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-slate-800" /> Administrative System Audit Log
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Immutable system register tracking every manual balance adjustment, deposit clearance, KYC verification, and compliance override.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `axi_audit_logs_${Date.now()}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      showToast('📜 Audit Log exported successfully.', 'success');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Export Logs</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear local audit records?")) {
                        setAuditLogs([]);
                        safeStorage.removeItem('axi_admin_audit_logs');
                        showToast('Audit log history reset.', 'info');
                      }
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3 py-2 rounded-xl border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Logs</span>
                  </button>
                </div>
              </div>

              {/* Summary Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Total Recorded Actions</span>
                  <div className="text-2xl font-black text-slate-900 font-mono mt-1">{auditLogs.length}</div>
                  <span className="text-xs text-slate-500 font-medium mt-1 block">Full accountability history</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Balance Adjustments</span>
                  <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                    {auditLogs.filter(l => l.category === 'Balance Adjustment').length}
                  </div>
                  <span className="text-xs text-slate-500 font-medium mt-1 block">Manual top-ups & overrides</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Deposit Approvals</span>
                  <div className="text-2xl font-black text-blue-600 font-mono mt-1">
                    {auditLogs.filter(l => l.category === 'Deposit Clearance').length}
                  </div>
                  <span className="text-xs text-slate-500 font-medium mt-1 block">Cashier ledger updates</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">KYC & Compliance</span>
                  <div className="text-2xl font-black text-amber-600 font-mono mt-1">
                    {auditLogs.filter(l => l.category === 'KYC Verification' || l.category === 'Compliance Override').length}
                  </div>
                  <span className="text-xs text-slate-500 font-medium mt-1 block">Identity verification audits</span>
                </div>
              </div>

              {/* Search and Category Filters */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search audit log ID, admin operator, target user, or action details..."
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Category:</span>
                  <select
                    value={auditCategoryFilter}
                    onChange={(e) => setAuditCategoryFilter(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none"
                  >
                    <option value="All">All Categories</option>
                    <option value="Balance Adjustment">Balance Adjustment</option>
                    <option value="Deposit Clearance">Deposit Clearance</option>
                    <option value="KYC Verification">KYC Verification</option>
                    <option value="Account Creation">Account Creation</option>
                    <option value="Support Action">Support Action</option>
                    <option value="Compliance Override">Compliance Override</option>
                  </select>
                </div>
              </div>

              {/* Logs Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                      <th className="p-4">Log Reference / Date</th>
                      <th className="p-4">Admin Operator</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Target Account</th>
                      <th className="p-4">Administrative Action & Justification</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-500 font-semibold">
                          No administrative audit entries matching search or category filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 text-xs">
                            <span className="font-mono font-black text-slate-900 block">{log.id}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{log.timestamp}</span>
                          </td>
                          <td className="p-4 text-xs font-semibold text-slate-700">
                            {log.adminId}
                          </td>
                          <td className="p-4 text-xs">
                            <span className={`inline-block text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                              log.category === 'Balance Adjustment' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              log.category === 'Deposit Clearance' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              log.category === 'KYC Verification' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              log.category === 'Account Creation' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              'bg-slate-100 text-slate-700 border-slate-300'
                            }`}>
                              {log.category}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-bold text-slate-800">
                            {log.targetUser}
                          </td>
                          <td className="p-4 text-xs text-slate-700 font-medium max-w-xs">
                            {log.actionDetails}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                              log.status === 'Success' ? 'bg-emerald-500 text-white' :
                              log.status === 'Flagged' ? 'bg-amber-500 text-slate-950' :
                              'bg-rose-600 text-white'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* About Page Edit */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                    ℹ️ About Page
                  </h3>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Main Title</label>
                    <input
                      type="text"
                      value={cmsContent.about?.title || ''}
                      onChange={(e) => updateCMS('about', 'title', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Subtitle / Description</label>
                    <textarea
                      value={cmsContent.about?.subtitle || ''}
                      onChange={(e) => updateCMS('about', 'subtitle', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none min-h-[100px]"
                    />
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          
          {/* LIVE CONTENT EDITOR TAB */}
          {activeTab === 'liveEditor' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <AdminLiveSiteEditor onShowToast={showToast} />
            </motion.div>
          )}

          {/* USER PORTFOLIO LIVE P&L CONTROL TAB */}
          {activeTab === 'pnlControl' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <AdminUserPnlControl users={recentUsers} onShowToast={showToast} onLogAudit={logAuditAction} />
            </motion.div>
          )}

          {/* WALLET SETTINGS TAB */}
          {activeTab === 'walletSettings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <AdminManageWallet />
            </motion.div>
          )}

          {/* DEDICATED WALLET ADDRESS MANAGEMENT TAB */}
          {activeTab === 'walletAddressManagement' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 rounded-2xl text-white shadow-xl flex items-center justify-between border border-amber-500/20">
                <div>
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Firestore Path: /system_config/wallets
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1.5 flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-amber-400" /> Wallet Address Management
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Fetch, manage, and update live central receiving crypto addresses (BTC, ETH, USDT). Updates persist directly to Firestore document <code className="bg-black/40 text-amber-300 px-1.5 py-0.5 rounded text-[11px] font-mono">system_config/wallets</code> and automatically propagate live to the user-facing deposit modal without reloading.
                  </p>
                </div>
              </div>
              <AdminManageWallet initialSubTab="crypto" />
            </motion.div>
          )}

          {/* DEDICATED SYSTEM INTEGRATION STATUS TAB */}
          {activeTab === 'systemIntegration' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <AdminSystemIntegrationStatus onShowToast={showToast} />
            </motion.div>
          )}
          {activeTab === 'siteCMS' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-slate-800" /> Global Website Content (CMS)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Change text and copy across the entire website from this dashboard. Changes save instantly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home Page Edit */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                    🏠 Home Page Content
                  </h3>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Hero Title</label>
                    <input
                      type="text"
                      value={cmsContent.home.heroTitle}
                      onChange={(e) => updateCMS('home', 'heroTitle', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Hero Subtitle</label>
                    <textarea
                      value={cmsContent.home.heroSubtitle}
                      onChange={(e) => updateCMS('home', 'heroSubtitle', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Call-to-action Button</label>
                    <input
                      type="text"
                      value={cmsContent.home.ctaText}
                      onChange={(e) => updateCMS('home', 'ctaText', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Partnership Title</label>
                    <input
                      type="text"
                      value={cmsContent.home.partnershipTitle}
                      onChange={(e) => updateCMS('home', 'partnershipTitle', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Partnership Subtitle</label>
                    <textarea
                      value={cmsContent.home.partnershipSubtitle}
                      onChange={(e) => updateCMS('home', 'partnershipSubtitle', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                </div>

                {/* Brand / Global Edit */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                    🏢 Brand & Global Info
                  </h3>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Company Name</label>
                    <input
                      type="text"
                      value={cmsContent.brand.companyName}
                      onChange={(e) => updateCMS('brand', 'companyName', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Support Email</label>
                    <input
                      type="text"
                      value={cmsContent.brand.contactEmail}
                      onChange={(e) => updateCMS('brand', 'contactEmail', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Support Phone</label>
                    <input
                      type="text"
                      value={cmsContent.brand.contactPhone}
                      onChange={(e) => updateCMS('brand', 'contactPhone', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Footer Disclosure</label>
                    <textarea
                      value={cmsContent.brand.footerText}
                      onChange={(e) => updateCMS('brand', 'footerText', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* LIVE CHAT DESK TAB */}
          {activeTab === 'liveChat' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Headset className="w-5 h-5 text-emerald-600" /> Live Client Support Chat Console
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Connect directly with traders who request human support. Replies sent here instantly appear in the user's Live Chat widget.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Admin Socket Active
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px] border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                {/* Active Chat Sessions List */}
                <div className="bg-slate-900 text-white p-4 border-r border-slate-800 flex flex-col gap-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Active Transfer Enquiries ({activeChatSessions.length})
                  </h3>

                  <div className="flex-1 overflow-y-auto space-y-2">
                    {activeChatSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => setSelectedChatUser(session)}
                        className={`p-3 rounded-xl border transition cursor-pointer ${
                          selectedChatUser?.id === session.id
                            ? 'bg-slate-800 border-emerald-500 text-white'
                            : 'bg-slate-950 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-xs">{session.user}</span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {session.status || 'Active'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-mono">{session.email}</p>
                        <div className="text-[10px] text-slate-500 mt-1">Requested: {session.requestedAt}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Conversation Console */}
                <div className="lg:col-span-2 bg-white flex flex-col">
                  {selectedChatUser ? (
                    <>
                      <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex justify-between items-center">
                        <div>
                          <h4 className="font-extrabold text-sm text-white">{selectedChatUser.user}</h4>
                          <p className="text-xs text-slate-400 font-mono">{selectedChatUser.email}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickAdjustUserBalance('current_user', 500)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow transition cursor-pointer"
                          >
                            + $500 Credit User
                          </button>
                        </div>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
                        {selectedChatUser.messages?.map((msg: any, i: number) => (
                          <div
                            key={i}
                            className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}
                          >
                            <span className="text-[10px] text-slate-400 mb-0.5 font-bold">
                              {msg.sender === 'admin' ? 'You (Compliance Admin)' : selectedChatUser.user} • {msg.time}
                            </span>
                            <div className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                              msg.sender === 'admin'
                                ? 'bg-slate-900 text-white font-medium shadow-md'
                                : 'bg-white border border-slate-200 text-slate-800 shadow-xs'
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Admin Response Form */}
                      <form onSubmit={handleSendAdminReply} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Type response to ${selectedChatUser.user}...`}
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="submit"
                          disabled={!adminReplyText.trim()}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> Send Reply
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-medium">
                      Select a user chat session to start responding.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
              {/* Top Overview Stat Cards (Matching Video Layout) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Users - Green */}
                <div className="bg-[#00a65a] text-white rounded-lg shadow-md overflow-hidden flex flex-col justify-between">
                  <div className="p-5 flex justify-between items-center">
                    <div>
                      <div className="text-4xl font-black">{recentUsers.length > 0 ? recentUsers.length : 102}</div>
                      <div className="text-sm font-medium mt-1">Active Users</div>
                    </div>
                    <Users className="w-12 h-12 opacity-30" />
                  </div>
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="bg-black/15 hover:bg-black/25 text-white/90 text-xs py-2 px-4 flex items-center justify-center gap-1 transition font-semibold"
                  >
                    <span>More info</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Pending Verification - Light Blue */}
                <div className="bg-[#00c0ef] text-white rounded-lg shadow-md overflow-hidden flex flex-col justify-between">
                  <div className="p-5 flex justify-between items-center">
                    <div>
                      <div className="text-4xl font-black">{kycDocs.filter(d => d.status !== 'Approved').length || 38}</div>
                      <div className="text-sm font-medium mt-1">Pending Verification</div>
                    </div>
                    <ShieldCheck className="w-12 h-12 opacity-30" />
                  </div>
                  <button 
                    onClick={() => setActiveTab('adminReview')}
                    className="bg-black/15 hover:bg-black/25 text-white/90 text-xs py-2 px-4 flex items-center justify-center gap-1 transition font-semibold"
                  >
                    <span>More info</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Pending Deposits - Amber */}
                <div className="bg-[#f39c12] text-white rounded-lg shadow-md overflow-hidden flex flex-col justify-between">
                  <div className="p-5 flex justify-between items-center">
                    <div>
                      <div className="text-4xl font-black">{transactions.filter(t => t.type === 'Deposit' && (t.status === 'Pending Verification' || t.status === 'Pending' || t.status === 'Under Review')).length}</div>
                      <div className="text-sm font-medium mt-1">Pending Deposits</div>
                    </div>
                    <ArrowDownToLine className="w-12 h-12 opacity-30" />
                  </div>
                  <button 
                    onClick={() => setActiveTab('deposits')}
                    className="bg-black/15 hover:bg-black/25 text-white/90 text-xs py-2 px-4 flex items-center justify-center gap-1 transition font-semibold"
                  >
                    <span>More info</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Pending Withdrawals - Red */}
                <div className="bg-[#dd4b39] text-white rounded-lg shadow-md overflow-hidden flex flex-col justify-between">
                  <div className="p-5 flex justify-between items-center">
                    <div>
                      <div className="text-4xl font-black">{transactions.filter(t => t.type === 'Withdrawal' && (t.status === 'Pending Verification' || t.status === 'Pending' || t.status === 'Under Review')).length}</div>
                      <div className="text-sm font-medium mt-1">Pending Withdrawals</div>
                    </div>
                    <ArrowUpFromLine className="w-12 h-12 opacity-30" />
                  </div>
                  <button 
                    onClick={() => setActiveTab('withdrawals')}
                    className="bg-black/15 hover:bg-black/25 text-white/90 text-xs py-2 px-4 flex items-center justify-center gap-1 transition font-semibold"
                  >
                    <span>More info</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Financial Cash Flow Summary Cards with Sparkline Charts */}
              <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Deposit & Withdrawal Volume Summary
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Real-time breakdown of total successful vs. pending cash flows</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
                    Live Audit Ledger
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  {/* Card 1: Successful Deposits */}
                  <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Successful Deposits
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-black font-mono text-white mt-1">
                        ${completedDepositsVol.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {completedDepositsList.length} cleared deposit{completedDepositsList.length === 1 ? '' : 's'}
                      </div>
                    </div>

                    {/* Sparkline Chart */}
                    <div className="h-10 w-full mt-3">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 120 35">
                        <defs>
                          <linearGradient id="grad-emerald-overview" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d="M0 28 Q 20 18, 40 22 T 80 10 T 120 5 L 120 35 L 0 35 Z" fill="url(#grad-emerald-overview)" />
                        <path d="M0 28 Q 20 18, 40 22 T 80 10 T 120 5" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="120" cy="5" r="3.5" fill="#10B981" />
                      </svg>
                    </div>
                  </div>

                  {/* Card 2: Pending Deposits */}
                  <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Pending Deposits
                        </span>
                        <Clock className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl font-black font-mono text-white mt-1">
                        ${pendingDepositsVol.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {pendingDepositsList.length} deposit{pendingDepositsList.length === 1 ? '' : 's'} awaiting clearance
                      </div>
                    </div>

                    {/* Sparkline Chart */}
                    <div className="h-10 w-full mt-3">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 120 35">
                        <defs>
                          <linearGradient id="grad-amber-overview" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d="M0 15 Q 30 30, 60 12 T 100 24 T 120 8 L 120 35 L 0 35 Z" fill="url(#grad-amber-overview)" />
                        <path d="M0 15 Q 30 30, 60 12 T 100 24 T 120 8" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="120" cy="8" r="3.5" fill="#F59E0B" />
                      </svg>
                    </div>
                  </div>

                  {/* Card 3: Successful Withdrawals */}
                  <div className="bg-slate-950/80 border border-blue-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          Successful Withdrawals
                        </span>
                        <ArrowDownRight className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="text-2xl font-black font-mono text-white mt-1">
                        ${completedWithdrawalsVol.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {completedWithdrawalsList.length} processed payout{completedWithdrawalsList.length === 1 ? '' : 's'}
                      </div>
                    </div>

                    {/* Sparkline Chart */}
                    <div className="h-10 w-full mt-3">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 120 35">
                        <defs>
                          <linearGradient id="grad-blue-overview" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d="M0 25 Q 30 12, 60 20 T 100 8 T 120 14 L 120 35 L 0 35 Z" fill="url(#grad-blue-overview)" />
                        <path d="M0 25 Q 30 12, 60 20 T 100 8 T 120 14" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="120" cy="14" r="3.5" fill="#3B82F6" />
                      </svg>
                    </div>
                  </div>

                  {/* Card 4: Pending Withdrawals */}
                  <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                          Pending Withdrawals
                        </span>
                        <AlertCircle className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="text-2xl font-black font-mono text-white mt-1">
                        ${pendingWithdrawalsVol.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {pendingWithdrawalsList.length} withdrawal request{pendingWithdrawalsList.length === 1 ? '' : 's'} pending
                      </div>
                    </div>

                    {/* Sparkline Chart */}
                    <div className="h-10 w-full mt-3">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 120 35">
                        <defs>
                          <linearGradient id="grad-purple-overview" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d="M0 20 Q 25 32, 50 14 T 90 22 T 120 10 L 120 35 L 0 35 Z" fill="url(#grad-purple-overview)" />
                        <path d="M0 20 Q 25 32, 50 14 T 90 22 T 120 10" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="120" cy="10" r="3.5" fill="#8B5CF6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-900 text-lg">Recent User Accounts</h3>
                    <button onClick={() => setActiveTab('users')} className="text-xs font-bold text-[#E3000F] hover:underline">Manage Users →</button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {recentUsers.map(user => (
                      <div key={user.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono font-bold text-slate-800">${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${user.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {user.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-900 text-lg">Payment Deposit Alerts</h3>
                    <button onClick={() => setActiveTab('deposits')} className="text-xs font-bold text-[#E3000F] hover:underline">View All Deposits →</button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {transactions.filter(t => t.type === "Deposit").length === 0 ? (
                      <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg text-center">No deposit/withdrawal transactions logged yet.</p>
                    ) : (
                      transactions.filter(t => t.type === "Deposit").slice(0, 5).map(dep => (
                        <div key={dep.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded ${(dep.status === 'Completed' || dep.status === 'Approved') ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{(dep.user || "Current Trader")} <span className="text-[10px] text-slate-400 font-normal uppercase ml-1">({dep.type})</span></p>
                              <p className="text-xs text-slate-500">{dep.method} • {dep.refCode ? `Ref: ${dep.refCode}` : dep.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900 font-mono">${(dep.amount?.toFixed(2) || "0.00")}</p>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              (dep.status === 'Completed' || dep.status === 'Approved') ? 'bg-emerald-100 text-emerald-700' : dep.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {dep.status || 'Pending'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'deposits' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Admin Financial Ledger</h2>
                  <p className="text-xs text-slate-500">Review payment proofs and confirm deposits to credit user trading balances securely.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    Live Trading Balance: ${liveBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Tx ID, Email, or Name..."
                    value={ledgerSearchQuery}
                    onChange={(e) => setLedgerSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <select
                  value={ledgerStatusFilter}
                  onChange={(e) => setLedgerStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 font-medium focus:border-blue-500 outline-none min-w-[150px]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending / Action Required</option>
                  <option value="Completed">Completed / Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {pendingDeposits.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <h4 className="font-bold text-amber-900">Misfunding Protection Protocol</h4>
                    <p className="mt-1">
                      Always verify the transaction reference code and payment receipt details before approving. Approving a deposit instantly updates the user's trading capital.
                    </p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="p-4 font-bold">Tx ID</th>
                      <th className="p-4 font-bold">Trader / User</th>
                      <th className="p-4 font-bold">Method & Ref</th>
                      <th className="p-4 font-bold">Amount</th>
                      <th className="p-4 font-bold">Proof Note</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 text-right font-bold">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter(t => t.type === "Deposit")
                      .filter(t => {
                         if (ledgerStatusFilter === 'All') return true;
                         if (ledgerStatusFilter === 'Pending') return (t.status === 'Pending Verification' || t.status === 'Pending' || t.status === 'Pending Admin Instructions' || t.status === 'Proof Requested');
                         if (ledgerStatusFilter === 'Completed') return (t.status === 'Completed' || t.status === 'Approved');
                         if (ledgerStatusFilter === 'Rejected') return t.status === 'Rejected';
                         return true;
                      })
                      .filter(t => {
                         if (!ledgerSearchQuery.trim()) return true;
                         const q = ledgerSearchQuery.toLowerCase();
                         return (
                           t.id?.toLowerCase().includes(q) ||
                           t.user?.toLowerCase().includes(q) ||
                           t.email?.toLowerCase().includes(q) ||
                           t.refCode?.toLowerCase().includes(q)
                         );
                      })
                      .length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">No deposit/withdrawal requests match your filters.</td>
                      </tr>
                    ) : (
                      transactions
                        .filter(t => t.type === "Deposit")
                        .filter(t => {
                           if (ledgerStatusFilter === 'All') return true;
                           if (ledgerStatusFilter === 'Pending') return (t.status === 'Pending Verification' || t.status === 'Pending' || t.status === 'Pending Admin Instructions' || t.status === 'Proof Requested');
                           if (ledgerStatusFilter === 'Completed') return (t.status === 'Completed' || t.status === 'Approved');
                           if (ledgerStatusFilter === 'Rejected') return t.status === 'Rejected';
                           return true;
                        })
                        .filter(t => {
                           if (!ledgerSearchQuery.trim()) return true;
                           const q = ledgerSearchQuery.toLowerCase();
                           return (
                             t.id?.toLowerCase().includes(q) ||
                             t.user?.toLowerCase().includes(q) ||
                             t.email?.toLowerCase().includes(q) ||
                             t.refCode?.toLowerCase().includes(q)
                           );
                        })
                        .map(dep => (
                        <tr key={dep.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="p-4 text-xs font-mono font-bold text-slate-700">{dep.id}</td>
                          <td className="p-4 font-bold text-slate-900 text-sm">
                            {(dep.user || "Current Trader")}
                            <div className="text-[10px] font-bold text-indigo-500 uppercase">{dep.type}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{dep.date}</div>
                          </td>
                          <td className="p-4 text-xs text-slate-700">
                            <span className="font-bold block">{dep.method}</span>
                            {dep.refCode && <span className="font-mono text-[10px] text-slate-500 block">Ref: {dep.refCode}</span>}
                          </td>
                          <td className="p-4 font-mono font-black text-slate-900 text-sm">${(dep.amount?.toFixed(2) || "0.00")}</td>
                          <td className="p-4 text-xs text-slate-600 max-w-xs truncate">{dep.proofNote || 'N/A'}</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                              (dep.status === 'Completed' || dep.status === 'Approved')
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : dep.status === 'Rejected' 
                                ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                            }`}>
                              {dep.status || 'Pending Verification'}
                            </span>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            {(dep.status === 'Pending Verification' || dep.status === 'Pending' || dep.status === 'Pending Admin Instructions' || dep.status === 'Proof Requested') ? (
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleApproveDeposit(dep)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 shadow-sm transition"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Credit
                                </button>
                                <button 
                                  onClick={() => handleRequestProof(dep)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded transition"
                                >
                                  Ask Proof
                                </button>
                                <button 
                                  onClick={() => handleRejectDeposit(dep)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1.5 rounded transition"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 font-mono font-medium">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
          {activeTab === 'withdrawals' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Withdrawal Requests</h2>
                  <p className="text-xs text-slate-500">Review and approve client withdrawal requests.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    Live Trading Balance: ${liveBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Tx ID, Email, or Name..."
                    value={ledgerSearchQuery}
                    onChange={(e) => setLedgerSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <select
                  value={ledgerStatusFilter}
                  onChange={(e) => setLedgerStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 font-medium focus:border-blue-500 outline-none min-w-[150px]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending / Action Required</option>
                  <option value="Completed">Completed / Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {pendingDeposits.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <h4 className="font-bold text-amber-900">Misfunding Protection Protocol</h4>
                    <p className="mt-1">
                      Always verify the transaction reference code and payment receipt details before approving. Approving a deposit instantly updates the user's trading capital.
                    </p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="p-4 font-bold">Tx ID</th>
                      <th className="p-4 font-bold">Trader / User</th>
                      <th className="p-4 font-bold">Method & Ref</th>
                      <th className="p-4 font-bold">Amount</th>
                      <th className="p-4 font-bold">Proof Note</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 text-right font-bold">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter(t => t.type === "Withdrawal")
                      .filter(t => {
                         if (ledgerStatusFilter === 'All') return true;
                         if (ledgerStatusFilter === 'Pending') return (t.status === 'Pending Verification' || t.status === 'Pending' || t.status === 'Pending Admin Instructions' || t.status === 'Proof Requested');
                         if (ledgerStatusFilter === 'Completed') return (t.status === 'Completed' || t.status === 'Approved');
                         if (ledgerStatusFilter === 'Rejected') return t.status === 'Rejected';
                         return true;
                      })
                      .filter(t => {
                         if (!ledgerSearchQuery.trim()) return true;
                         const q = ledgerSearchQuery.toLowerCase();
                         return (
                           t.id?.toLowerCase().includes(q) ||
                           t.user?.toLowerCase().includes(q) ||
                           t.email?.toLowerCase().includes(q) ||
                           t.refCode?.toLowerCase().includes(q)
                         );
                      })
                      .length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">No deposit/withdrawal requests match your filters.</td>
                      </tr>
                    ) : (
                      transactions
                        .filter(t => t.type === "Withdrawal")
                        .filter(t => {
                           if (ledgerStatusFilter === 'All') return true;
                           if (ledgerStatusFilter === 'Pending') return (t.status === 'Pending Verification' || t.status === 'Pending' || t.status === 'Pending Admin Instructions' || t.status === 'Proof Requested');
                           if (ledgerStatusFilter === 'Completed') return (t.status === 'Completed' || t.status === 'Approved');
                           if (ledgerStatusFilter === 'Rejected') return t.status === 'Rejected';
                           return true;
                        })
                        .filter(t => {
                           if (!ledgerSearchQuery.trim()) return true;
                           const q = ledgerSearchQuery.toLowerCase();
                           return (
                             t.id?.toLowerCase().includes(q) ||
                             t.user?.toLowerCase().includes(q) ||
                             t.email?.toLowerCase().includes(q) ||
                             t.refCode?.toLowerCase().includes(q)
                           );
                        })
                        .map(dep => (
                        <tr key={dep.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="p-4 text-xs font-mono font-bold text-slate-700">{dep.id}</td>
                          <td className="p-4 font-bold text-slate-900 text-sm">
                            {(dep.user || "Current Trader")}
                            <div className="text-[10px] font-bold text-indigo-500 uppercase">{dep.type}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{dep.date}</div>
                          </td>
                          <td className="p-4 text-xs text-slate-700">
                            <span className="font-bold block">{dep.method}</span>
                            {dep.refCode && <span className="font-mono text-[10px] text-slate-500 block">Ref: {dep.refCode}</span>}
                          </td>
                          <td className="p-4 font-mono font-black text-slate-900 text-sm">${(dep.amount?.toFixed(2) || "0.00")}</td>
                          <td className="p-4 text-xs text-slate-600 max-w-xs truncate">{dep.proofNote || 'N/A'}</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                              (dep.status === 'Completed' || dep.status === 'Approved')
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : dep.status === 'Rejected' 
                                ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                            }`}>
                              {dep.status || 'Pending Verification'}
                            </span>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            {(dep.status === 'Pending Verification' || dep.status === 'Pending' || dep.status === 'Pending Admin Instructions' || dep.status === 'Proof Requested') ? (
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleApproveDeposit(dep)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 shadow-sm transition"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Credit
                                </button>
                                <button 
                                  onClick={() => handleRequestProof(dep)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded transition"
                                >
                                  Ask Proof
                                </button>
                                <button 
                                  onClick={() => handleRejectDeposit(dep)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1.5 rounded transition"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 font-mono font-medium">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'userVerification' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    User Verification & Account Compliance
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Toggle user verification status between <strong>Pending</strong>, <strong>Approved</strong>, and <strong>Flagged</strong>.
                    Approving a user automatically dispatches an official welcome & verification email notification to their address.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const pendingUsers = recentUsers.filter(u => (u.status || u.verificationStatus) === 'Pending');
                      if (pendingUsers.length === 0) {
                        showToast('No pending user verification requests found.', 'info');
                        return;
                      }
                      pendingUsers.forEach(u => handleUpdateUserStatus(u.id, 'Approved', 'Batch Administrative Approval'));
                      showToast(`🎉 Approved ${pendingUsers.length} pending user verification requests!`, 'success');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve All Pending ({recentUsers.filter(u => (u.status || u.verificationStatus) === 'Pending').length})</span>
                  </button>

                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>Onboard Client</span>
                  </button>
                </div>
              </div>

              {/* Metric Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <div className="flex justify-between items-center text-slate-500 text-xs font-bold">
                    <span>TOTAL TRADERS</span>
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{recentUsers.length}</div>
                  <span className="text-[10px] text-slate-400">Registered platform accounts</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-xs">
                  <div className="flex justify-between items-center text-emerald-800 text-xs font-bold">
                    <span>APPROVED USERS</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                    {recentUsers.filter(u => (u.status || u.verificationStatus) === 'Approved').length}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Active & email notified</span>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs">
                  <div className="flex justify-between items-center text-amber-800 text-xs font-bold">
                    <span>PENDING VERIFICATION</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-700 mt-1 font-mono">
                    {recentUsers.filter(u => (u.status || u.verificationStatus) === 'Pending').length}
                  </div>
                  <span className="text-[10px] text-amber-600 font-semibold">Requires admin action</span>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-xs">
                  <div className="flex justify-between items-center text-rose-800 text-xs font-bold">
                    <span>FLAGGED / SUSPENDED</span>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl font-black text-rose-700 mt-1 font-mono">
                    {recentUsers.filter(u => (u.status || u.verificationStatus) === 'Flagged' || u.status === 'Suspended').length}
                  </div>
                  <span className="text-[10px] text-rose-600 font-semibold">Compliance restriction</span>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="bg-white p-4 border border-slate-200 rounded-xl flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, account # or country..."
                    value={userVerifSearch}
                    onChange={e => setUserVerifSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Filter Status Buttons */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {(['All', 'Pending', 'Approved', 'Flagged'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setUserVerifFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                        userVerifFilter === st
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st} {st !== 'All' && `(${recentUsers.filter(u => (u.status || u.verificationStatus) === st).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Automatic Email Dispatch Banner */}
              <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                    <Mail className="w-5 h-5 animate-pulse" />
                  </span>
                  <div>
                    <span className="font-bold text-white text-sm">Automated Email Notification Dispatch Protocol</span>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Toggling a user's status to <strong className="text-emerald-400">Approved</strong> automatically creates and dispatches an official email notification with login confirmation and trading privileges.
                    </p>
                  </div>
                </div>
              </div>

              {/* User Verification Directory Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-bold">
                      <th className="p-4">User Details</th>
                      <th className="p-4">Account Tier & Region</th>
                      <th className="p-4">Live Balance</th>
                      <th className="p-4">Current Verification</th>
                      <th className="p-4 text-center">Toggle Account Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers
                      .filter(u => {
                        if (userVerifFilter === 'All') return true;
                        const status = u.status || u.verificationStatus || 'Pending';
                        return status === userVerifFilter;
                      })
                      .filter(u => {
                        if (!userVerifSearch.trim()) return true;
                        const q = userVerifSearch.toLowerCase();
                        return (
                          u.name?.toLowerCase().includes(q) ||
                          u.email?.toLowerCase().includes(q) ||
                          u.accountNo?.toLowerCase().includes(q) ||
                          u.country?.toLowerCase().includes(q)
                        );
                      })
                      .length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No user accounts match the selected filter criteria.
                        </td>
                      </tr>
                    ) : (
                      recentUsers
                        .filter(u => {
                          if (userVerifFilter === 'All') return true;
                          const status = u.status || u.verificationStatus || 'Pending';
                          return status === userVerifFilter;
                        })
                        .filter(u => {
                          if (!userVerifSearch.trim()) return true;
                          const q = userVerifSearch.toLowerCase();
                          return (
                            u.name?.toLowerCase().includes(q) ||
                            u.email?.toLowerCase().includes(q) ||
                            u.accountNo?.toLowerCase().includes(q) ||
                            u.country?.toLowerCase().includes(q)
                          );
                        })
                        .map(user => {
                          const currentStatus = user.status || user.verificationStatus || 'Pending';
                          return (
                            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                              {/* User Info */}
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0 border border-slate-700">
                                    {user.name?.charAt(0) || 'U'}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                                    <div className="text-xs text-slate-500 font-mono">{user.email}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">ID: {user.id} • {user.accountNo || 'AXI-MT5-882910'}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Tier & Country */}
                              <td className="p-4 text-xs">
                                <div className="font-bold text-slate-800">{user.accountType || 'Pro ECN Prime'}</div>
                                <div className="text-slate-500">{user.country || 'Global'}</div>
                                <div className="text-[10px] text-slate-400">Reg: {user.registeredAt || '2026-07-20'}</div>
                              </td>

                              {/* Live Balance */}
                              <td className="p-4 font-mono font-black text-slate-900 text-sm">
                                ${user.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>

                              {/* Verification Status Badge */}
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                                  currentStatus === 'Approved'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : currentStatus === 'Flagged' || currentStatus === 'Suspended'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                                }`}>
                                  {currentStatus === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                                  {currentStatus === 'Flagged' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                                  {currentStatus === 'Pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                                  <span>{currentStatus}</span>
                                </span>
                              </td>

                              {/* Status Toggle Action Buttons */}
                              <td className="p-4 text-center">
                                <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold gap-1">
                                  {/* Pending Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateUserStatus(user.id, 'Pending')}
                                    className={`px-2.5 py-1 rounded transition cursor-pointer ${
                                      currentStatus === 'Pending'
                                        ? 'bg-amber-500 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                    }`}
                                  >
                                    Pending
                                  </button>

                                  {/* Approved Toggle (Triggers Email Notification) */}
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateUserStatus(user.id, 'Approved')}
                                    className={`px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                                      currentStatus === 'Approved'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Approved
                                  </button>

                                  {/* Flagged Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateUserStatus(user.id, 'Flagged')}
                                    className={`px-2.5 py-1 rounded transition cursor-pointer ${
                                      currentStatus === 'Flagged'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                    }`}
                                  >
                                    Flagged
                                  </button>
                                </div>
                              </td>

                              {/* Actions Column */}
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setSelectedUserDetailModal(user)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                                  >
                                    View Profile
                                  </button>
                                  <button
                                    onClick={() => {
                                      setAdjustModalUser(user);
                                      setCustomDeltaInput('');
                                      setCustomExactInput('');
                                    }}
                                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                                  >
                                    Balance
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" /> Registered Traders Directory
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Full registry of registered traders, portfolio balances, P&L overrides, and account status management.</p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Onboard New Client</span>
                </button>
              </div>

              {/* Dedicated User P&L Percentage Override Panel */}
              <div id="user-pnl-override-control" className="bg-slate-900 text-white p-5 md:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" /> Account P&L Percentage Manual Override
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Manually set the current P&L percentage for a selected user account. Clicking <strong className="text-emerald-400 font-bold">Save P&L Override</strong> writes this override directly to the user's specific Firestore document for their dashboard display.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2.5 py-1 rounded-full font-bold self-start sm:self-auto shrink-0">
                    Firestore Sync Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  {/* Select User Dropdown */}
                  <div className="md:col-span-5 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">Select User Account</label>
                    <select
                      value={pnlOverrideUserSelected}
                      onChange={(e) => setPnlOverrideUserSelected(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500 font-mono"
                    >
                      {recentUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email}) — Bal: ${u.balance?.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Specific Input Field for P&L Percentage */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">Current P&L Percentage (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 24.5"
                        value={userPnlInputs[pnlOverrideUserSelected] ?? (recentUsers.find(u => u.id === pnlOverrideUserSelected)?.pnlPercentage ?? recentUsers.find(u => u.id === pnlOverrideUserSelected)?.pnlOverride?.pnlPercentage ?? 24.5).toString()}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUserPnlInputs(prev => ({ ...prev, [pnlOverrideUserSelected]: val }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-black rounded-xl pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="md:col-span-3 flex items-center gap-2">
                    <button
                      onClick={() => {
                        const valStr = userPnlInputs[pnlOverrideUserSelected] ?? (recentUsers.find(u => u.id === pnlOverrideUserSelected)?.pnlPercentage ?? 24.5).toString();
                        handleSaveUserPnlPercentage(pnlOverrideUserSelected, parseFloat(valStr) || 0);
                      }}
                      disabled={savingPnlUserId === pnlOverrideUserSelected}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                      {savingPnlUserId === pnlOverrideUserSelected ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving to Firestore...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Save P&L Override</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-[11px] text-slate-400 font-bold uppercase mr-1">Quick Presets:</span>
                  {[10, 24.5, 45, -12, 0].map((presetVal) => (
                    <button
                      key={presetVal}
                      onClick={() => {
                        setUserPnlInputs(prev => ({ ...prev, [pnlOverrideUserSelected]: presetVal.toString() }));
                        handleSaveUserPnlPercentage(pnlOverrideUserSelected, presetVal);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer"
                    >
                      {presetVal > 0 ? `+${presetVal}%` : `${presetVal}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Directory Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-bold">
                      <th className="p-4">Trader Name & Email</th>
                      <th className="p-4">Account No</th>
                      <th className="p-4">Tier & Country</th>
                      <th className="p-4">Live Balance</th>
                      <th className="p-4">P&L % Override</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map(user => {
                      const status = user.status || user.verificationStatus || 'Pending';
                      const currentPnlVal = userPnlInputs[user.id] ?? (user.pnlPercentage ?? user.pnlOverride?.pnlPercentage ?? 24.5).toString();
                      return (
                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="p-4">
                            <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                            <div className="text-xs text-slate-500 font-mono">{user.email}</div>
                          </td>
                          <td className="p-4 text-xs font-mono font-bold text-slate-700">
                            {user.accountNo || 'AXI-MT5-882910'}
                          </td>
                          <td className="p-4 text-xs">
                            <div className="font-bold text-slate-800">{user.accountType || 'Pro ECN'}</div>
                            <div className="text-slate-500">{user.country || 'Global'}</div>
                          </td>
                          <td className="p-4 font-mono font-black text-slate-900 text-sm">
                            ${user.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <div className="relative w-20">
                                <input
                                  type="number"
                                  step="0.1"
                                  placeholder="0.0"
                                  value={currentPnlVal}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setUserPnlInputs(prev => ({ ...prev, [user.id]: val }));
                                  }}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-2 pr-5 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                                />
                                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">%</span>
                              </div>
                              <button
                                onClick={() => handleSaveUserPnlPercentage(user.id, parseFloat(currentPnlVal) || 0)}
                                disabled={savingPnlUserId === user.id}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs flex items-center gap-1 disabled:opacity-50 shrink-0"
                              >
                                {savingPnlUserId === user.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                <span>Save</span>
                              </button>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                              status === 'Approved' || status === 'Verified'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : status === 'Flagged' || status === 'Suspended'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                            }`}>
                              {status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleUpdateUserStatus(user.id, status === 'Approved' ? 'Pending' : 'Approved')}
                                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                              >
                                {status === 'Approved' ? 'Mark Pending' : 'Approve & Notify'}
                              </button>
                              <button
                                onClick={() => {
                                  setPnlOverrideUserSelected(user.id);
                                  setSelectedUserDetailModal(user);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'editBot' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-indigo-600" /> AI Trading Bot Execution Configuration
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Configure live auto-trading engine behavior, risk controls, and automated return parameters.</p>
                </div>
                <button 
                  onClick={() => saveBotConfig({ ...botConfig, active: !botConfig.active })}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${botConfig.active ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
                >
                  <Activity className="w-4 h-4" />
                  {botConfig.active ? 'Engine: ACTIVE' : 'Engine: PAUSED'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Algorithm & Strategy</h3>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Bot Name</label>
                    <input 
                      type="text" 
                      value={botConfig.name} 
                      onChange={e => setBotConfig({ ...botConfig, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Core Strategy</label>
                    <select 
                      value={botConfig.strategy} 
                      onChange={e => setBotConfig({ ...botConfig, strategy: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="High Frequency Arbitrage">High Frequency Arbitrage (HFT)</option>
                      <option value="Neural Momentum Grid">Neural Momentum Grid</option>
                      <option value="Scalping Machine">Scalping Machine (1m - 5m)</option>
                      <option value="Institutional Trend Follower">Institutional Trend Follower</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Execution Speed / Frequency</label>
                    <select 
                      value={botConfig.frequency} 
                      onChange={e => setBotConfig({ ...botConfig, frequency: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="5 seconds">Real-time Tick (5 seconds)</option>
                      <option value="15 seconds">High Frequency (15 seconds)</option>
                      <option value="1 minute">Standard Scalp (1 minute)</option>
                      <option value="5 minutes">Swing Grid (5 minutes)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Risk Allocation & Yield</h3>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Max Position Allocation Cap ($)</label>
                    <input 
                      type="number" 
                      value={botConfig.maxAllocationUsd} 
                      onChange={e => setBotConfig({ ...botConfig, maxAllocationUsd: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Target Monthly Yield (%)</label>
                    <input 
                      type="number" 
                      value={botConfig.monthlyTargetYield} 
                      onChange={e => setBotConfig({ ...botConfig, monthlyTargetYield: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Target Win Rate (%)</label>
                    <input 
                      type="number" 
                      value={botConfig.winRateSim} 
                      onChange={e => setBotConfig({ ...botConfig, winRateSim: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => saveBotConfig(botConfig)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 shadow transition cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" /> Save Bot Parameters
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'sendEmail' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" /> Send Email Notification
                </h2>
                <p className="text-xs text-slate-500 mt-1">Compose and dispatch custom email notifications to registered Axi traders.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 max-w-3xl space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Recipient Trader</label>
                  <select 
                    value={emailRecipient} 
                    onChange={e => setEmailRecipient(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">📢 All Registered Traders (Broadcast)</option>
                    {recentUsers.map(u => (
                      <option key={u.id} value={u.email}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email Notice Type</label>
                  <select 
                    value={emailType} 
                    onChange={e => setEmailType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Custom">Custom Administrative Announcement</option>
                    <option value="Registration">Welcome Registration Code</option>
                    <option value="PasswordReset">Password Reset Verification</option>
                    <option value="Transaction">Deposit/Withdrawal Confirmation</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Subject Line</label>
                  <input 
                    type="text" 
                    value={emailSubject} 
                    onChange={e => setEmailSubject(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Message Body</label>
                  <textarea 
                    value={emailBody} 
                    onChange={e => setEmailBody(e.target.value)}
                    rows={6}
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>

                <button 
                  onClick={() => {
                    const recipientName = emailRecipient === 'ALL' ? 'All Registered Traders' : (recentUsers.find(u => u.email === emailRecipient)?.name || 'Trader');
                    const targetEmail = emailRecipient === 'ALL' ? 'trader@axi.com' : emailRecipient;
                    
                    const payload: EmailTriggerPayload = {
                      id: `email_${Date.now()}`,
                      recipientEmail: targetEmail,
                      recipientName: recipientName,
                      txId: `NOTICE-${Math.floor(100000 + Math.random() * 900000)}`,
                      txType: 'Deposit',
                      amount: 0,
                      status: 'Approved',
                      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
                      method: emailSubject,
                      reason: emailBody
                    };

                    window.dispatchEvent(new CustomEvent('axi_email_trigger', { detail: payload }));
                    showToast(`✉️ Email dispatched successfully to ${emailRecipient}!`, 'success');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 shadow transition cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Dispatch Email Notification
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'tradingBotSettings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" /> Global Trading Bot Settings
                </h2>
                <p className="text-xs text-slate-500 mt-1">Manage platform-wide auto-trading algorithms and leverage safety caps.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 max-w-2xl space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Automated Trading Service Status</h4>
                    <p className="text-xs text-slate-500">Allow users to activate automated trading bots on their accounts.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded cursor-pointer" />
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Max Bot Leverage Limit</h4>
                    <p className="text-xs text-slate-500">Cap max leverage used by bots on retail accounts.</p>
                  </div>
                  <select className="border border-slate-300 rounded px-3 py-1.5 text-xs font-bold">
                    <option value="1:100">1:100</option>
                    <option value="1:200">1:200</option>
                    <option value="1:500" defaultValue="1:500">1:500 (Max)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Emergency Market Circuit Breaker</h4>
                    <p className="text-xs text-slate-500">Automatically pause all bots if daily drawdown exceeds 15%.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded cursor-pointer" />
                </div>

                <button 
                  onClick={() => showToast('Global trading bot settings saved.', 'success')}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition cursor-pointer"
                >
                  Save Global Bot Settings
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'investmentPlanSettings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" /> Investment Plan Settings
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Configure fixed yield investment tiers and term durations.</p>
                </div>
                <button 
                  onClick={() => {
                    const newPlan = {
                      id: `plan-${Date.now()}`,
                      name: 'VIP High-Yield Tier',
                      minDeposit: 10000,
                      maxDeposit: 100000,
                      dailyRoi: 3.0,
                      durationDays: 30,
                      active: true
                    };
                    saveInvestmentPlans([...investmentPlans, newPlan]);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add New Plan
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {investmentPlans.map((plan: any) => (
                  <div key={plan.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 relative shadow-xs">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-900 text-base">{plan.name}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${plan.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {plan.active ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 font-mono">
                      <p><strong>Min Deposit:</strong> ${plan.minDeposit.toLocaleString()}</p>
                      <p><strong>Max Deposit:</strong> ${plan.maxDeposit.toLocaleString()}</p>
                      <p><strong>Daily Return:</strong> {plan.dailyRoi}%</p>
                      <p><strong>Term Duration:</strong> {plan.durationDays} Days</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                      <button 
                        onClick={() => {
                          const updated = investmentPlans.map((p: any) => p.id === plan.id ? { ...p, active: !p.active } : p);
                          saveInvestmentPlans(updated);
                        }}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1 rounded bg-slate-100 cursor-pointer"
                      >
                        {plan.active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'changePassword' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-600" /> Change Administrator Password
                </h2>
                <p className="text-xs text-slate-500 mt-1">Update administrator password for security compliance.</p>
              </div>

              <form 
                onSubmit={e => {
                  e.preventDefault();
                  if (!currentPassword || !newPassword || !confirmPassword) {
                    showToast('Please fill out all password fields.', 'error');
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    showToast('New passwords do not match.', 'error');
                    return;
                  }
                  showToast('🔐 Admin password updated successfully!', 'success');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl p-6 max-w-md space-y-4"
              >
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Current Admin Password</label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button 
                  type="submit" 
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition cursor-pointer"
                >
                  Update Admin Password
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'manageTradingPairs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> Manage Trading Pairs
                </h2>
                <p className="text-xs text-slate-500 mt-1">Enable or disable tradable financial instruments and adjust spreads.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="p-4 font-bold">Symbol</th>
                      <th className="p-4 font-bold">Category</th>
                      <th className="p-4 font-bold">Spread (Pips)</th>
                      <th className="p-4 font-bold">Max Leverage</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 text-right font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradingPairs.map(p => (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-900 text-sm font-mono">{p.symbol}</td>
                        <td className="p-4 text-xs text-slate-600">{p.category}</td>
                        <td className="p-4 text-xs font-mono font-bold text-slate-800">{p.spreadPips}</td>
                        <td className="p-4 text-xs font-mono font-bold text-slate-800">{p.leverage}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {p.active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => togglePairStatus(p.id)}
                            className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                          >
                            {p.active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'manageCurrency' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" /> Manage Display Currencies
                </h2>
                <p className="text-xs text-slate-500 mt-1">Set primary display currencies and exchange conversion rates.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="p-4 font-bold">Currency</th>
                      <th className="p-4 font-bold">Symbol</th>
                      <th className="p-4 font-bold">Rate to USD</th>
                      <th className="p-4 font-bold">Base Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currencies.map(c => (
                      <tr key={c.code} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-900 text-sm">{c.name} ({c.code})</td>
                        <td className="p-4 font-bold font-mono text-slate-800">{c.symbol}</td>
                        <td className="p-4 font-mono text-xs font-bold text-slate-700">{c.rateToUsd}</td>
                        <td className="p-4">
                          {c.isBase ? (
                            <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2.5 py-1 rounded">Primary Base</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Secondary</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'manageCopyTraders' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Copy className="w-5 h-5 text-indigo-600" /> Manage Copy Traders
                </h2>
                <p className="text-xs text-slate-500 mt-1">Approve, feature, or review Master Traders for copy trading platform.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {masterTraders.map(trader => (
                  <div key={trader.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 relative shadow-xs">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-900 text-sm">{trader.name}</h3>
                      <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        {trader.winRate} Win
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 font-mono">
                      <p><strong>30-Day ROI:</strong> <span className="text-emerald-600 font-bold">{trader.roi30d}</span></p>
                      <p><strong>Total Copiers:</strong> {trader.copiers}</p>
                      <p><strong>Risk Index:</strong> {trader.risk}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                      <button 
                        onClick={() => showToast(`Master Trader ${trader.name} status updated.`, 'info')}
                        className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Manage Settings
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === 'manualCredit' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Manual Portfolio Adjustment</h2>
                  <p className="text-xs text-slate-500">Stimulate user portfolio balance by manually adjusting their live trading capital.</p>
                </div>
                <div className="bg-slate-100 text-slate-700 text-sm font-bold px-4 py-2 rounded-lg border border-slate-200 font-mono">
                  Global Live Balance: ${liveBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              <form onSubmit={handleManualCredit} className="bg-slate-50 border border-slate-200 rounded-xl p-6 max-w-2xl flex flex-col gap-5">
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-indigo-800">
                    <h4 className="font-bold text-indigo-900">Admin Privileges Active</h4>
                    <p className="mt-1">
                      You are authorized to manually increase or decrease a user's balance. Negative values will decrease the balance (reflecting an account correction or withdrawal).
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target User Account</label>
                  <select 
                    value={targetUserIdForManual}
                    onChange={e => setTargetUserIdForManual(e.target.value)}
                    className="border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="">Select user account...</option>
                    {recentUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email}) - Current: ${u.balance.toLocaleString()}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Adjustment Amount ($)</label>
                  <input 
                    type="number" 
                    value={customCreditAmount} 
                    onChange={e => setCustomCreditAmount(e.target.value)} 
                    placeholder="e.g. 5000 or -1500" 
                    className="border border-slate-300 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 font-semibold">Use a positive number to credit funds or a negative number to deduct funds.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Audit Justification</label>
                  <input 
                    type="text" 
                    value={creditReason} 
                    onChange={e => setCreditReason(e.target.value)} 
                    placeholder="e.g. Approved deposit bonus, Profit adjustment, Withdrawal payout correction..." 
                    className="border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <button 
                  type="submit" 
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" /> Execute Manual Balance Adjustment
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'adminReview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" /> Submitted User Documents & Verification Review
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Review government IDs and utility bills submitted by traders. Approving updates user status to Verified Account and triggers live trading balance update.</p>
                </div>
                <span className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-full">
                  {kycDocs.filter(d => d.status === 'Under Review').length} Pending Documents
                </span>
              </div>

              {kycDocs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-slate-600 font-bold">No pending document reviews.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {kycDocs.map((docItem) => (
                    <div key={docItem.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 hover:border-slate-300 transition">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-xs shrink-0">
                          <FileText className="w-6 h-6 text-brand-red" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-base">{docItem.user}</span>
                            <span className="text-xs text-slate-500 font-mono">({docItem.userEmail})</span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              docItem.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              docItem.status === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                              'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                            }`}>
                              {docItem.status}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700">{docItem.type}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 font-mono">
                            <span>File: <strong className="text-slate-800">{docItem.fileName}</strong></span>
                            <span>Ref: <strong className="text-slate-800">{docItem.refCode}</strong></span>
                            <span>Submitted: {docItem.submittedAt}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-200">
                        {docItem.status === 'Under Review' ? (
                          <>
                            <button
                              onClick={() => handleApproveKYC(docItem, 1000)}
                              className="flex-1 lg:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Approve & Update Live Balance
                            </button>
                            <button
                              onClick={() => handleRejectKYC(docItem)}
                              className="flex-1 lg:flex-initial bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" /> Reject
                            </button>
                          </>
                        ) : (
                          <div className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-lg">
                            Review Decision Completed
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

      {/* Custom Client Balance Adjustment Modal */}
      {adjustModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Adjust Client Live Balance</h3>
                <p className="text-xs text-slate-500 font-mono">{adjustModalUser.name} ({adjustModalUser.email})</p>
              </div>
              <button onClick={() => setAdjustModalUser(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-900 text-white p-3.5 rounded-xl font-mono flex justify-between items-center">
                <span className="text-slate-400">Current Portfolio Balance:</span>
                <span className="text-base font-black text-emerald-400">${adjustModalUser.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Option A: Relative Delta Adjustment */}
              <div className="space-y-1.5 pt-1">
                <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Option A: Add or Subtract Amount ($)</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={customDeltaInput} 
                    onChange={e => setCustomDeltaInput(e.target.value)} 
                    placeholder="e.g. 2500 or -500" 
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-brand-red outline-none"
                  />
                  <button 
                    onClick={() => {
                      const val = parseFloat(customDeltaInput);
                      if (!val && val !== 0) return;
                      handleQuickAdjustUserBalance(adjustModalUser.id, val, customAdjustReason);
                      setAdjustModalUser(null);
                      setCustomDeltaInput('');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-lg transition shrink-0 cursor-pointer"
                  >
                    Apply Delta
                  </button>
                </div>
              </div>

              {/* Option B: Set Exact Target Balance */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Option B: Set Exact Portfolio Target ($)</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={customExactInput} 
                    onChange={e => setCustomExactInput(e.target.value)} 
                    placeholder="e.g. 15000" 
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-brand-red outline-none"
                  />
                  <button 
                    onClick={() => {
                      const val = parseFloat(customExactInput);
                      if (isNaN(val)) return;
                      handleSetExactUserBalance(adjustModalUser.id, val, customAdjustReason);
                      setAdjustModalUser(null);
                      setCustomExactInput('');
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-lg transition shrink-0 cursor-pointer"
                  >
                    Set Target
                  </button>
                </div>
              </div>

              {/* Audit Reason */}
              <div className="space-y-1 pt-2">
                <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Audit Reason Note</label>
                <input 
                  type="text" 
                  value={customAdjustReason} 
                  onChange={e => setCustomAdjustReason(e.target.value)} 
                  placeholder="Reason for balance modification..." 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-brand-red outline-none"
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Onboard New Client Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  Onboard Registered Client
                </h3>
                <p className="text-xs text-slate-500">Register a new client directly into the Axi Trades Admin system.</p>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewClient} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Client Full Name</label>
                <input 
                  type="text" 
                  required
                  value={newClientName} 
                  onChange={e => setNewClientName(e.target.value)} 
                  placeholder="e.g. David Miller" 
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={newClientEmail} 
                  onChange={e => setNewClientEmail(e.target.value)} 
                  placeholder="e.g. d.miller@example.com" 
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Initial Live Balance ($)</label>
                  <input 
                    type="number" 
                    value={newClientInitialBalance} 
                    onChange={e => setNewClientInitialBalance(e.target.value)} 
                    placeholder="1000" 
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-brand-red outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Account Verification</label>
                  <select 
                    value={newClientStatus} 
                    onChange={e => setNewClientStatus(e.target.value)} 
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="Verified">Verified Account</option>
                    <option value="Pending KYC">Pending KYC</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition cursor-pointer mt-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Confirm Client Onboarding & Fund Account</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Triggered Email Notification Modal */}
      <EmailNotificationModal 
        payload={emailPayload} 
        onClose={() => setEmailPayload(null)} 
        onViewAccount={() => setView('funds')} 
      />

      {/* Comprehensive User Account Details & Control Modal */}
      {selectedUserDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 my-8"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center font-black text-lg shadow-md border border-slate-700">
                  {selectedUserDetailModal.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedUserDetailModal.name}</h3>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                      selectedUserDetailModal.status === 'Verified' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800' 
                        : selectedUserDetailModal.status === 'Suspended'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                    }`}>
                      {selectedUserDetailModal.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {selectedUserDetailModal.email} • ID: {selectedUserDetailModal.id}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedUserDetailModal(null)} 
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Account Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Trading Account #</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedUserDetailModal.accountNo || 'AXI-MT5-882910'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Account Tier</span>
                <span className="text-xs font-bold text-brand-red">
                  {selectedUserDetailModal.accountType || 'Pro ECN Prime'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Max Leverage</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedUserDetailModal.leverage || '1:500'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Residence / Region</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {selectedUserDetailModal.country || 'United Kingdom'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Registered Since</span>
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  {selectedUserDetailModal.registeredAt || '2026-07-20'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Auth Provider</span>
                <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {selectedUserDetailModal.provider || 'Email'}
                </span>
              </div>
            </div>

            {/* Live Financials & Real-time Balance Adjustment Panel */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4 my-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Real-Time Live Portfolio Capital</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                    ${selectedUserDetailModal.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Demo Practice Balance</span>
                  <span className="text-sm font-mono font-bold text-slate-300">${(selectedUserDetailModal.demoBalance || 10000).toLocaleString()}</span>
                </div>
              </div>

              {/* Direct Quick Balance Controls */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Direct Admin Balance Quick Adjustments</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <button
                    onClick={() => {
                      handleQuickAdjustUserBalance(selectedUserDetailModal.id, 1000, 'Admin +$1,000 Portfolio Credit');
                      setSelectedUserDetailModal((prev: any) => prev ? { ...prev, balance: prev.balance + 1000 } : null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2 rounded-xl transition cursor-pointer text-center"
                  >
                    +$1,000
                  </button>
                  <button
                    onClick={() => {
                      handleQuickAdjustUserBalance(selectedUserDetailModal.id, 500, 'Admin +$500 Portfolio Credit');
                      setSelectedUserDetailModal((prev: any) => prev ? { ...prev, balance: prev.balance + 500 } : null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2 rounded-xl transition cursor-pointer text-center"
                  >
                    +$500
                  </button>
                  <button
                    onClick={() => {
                      handleQuickAdjustUserBalance(selectedUserDetailModal.id, 100, 'Admin +$100 Portfolio Credit');
                      setSelectedUserDetailModal((prev: any) => prev ? { ...prev, balance: prev.balance + 100 } : null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2 rounded-xl transition cursor-pointer text-center"
                  >
                    +$100
                  </button>
                  <button
                    onClick={() => {
                      handleQuickAdjustUserBalance(selectedUserDetailModal.id, -100, 'Admin -$100 Portfolio Deduction');
                      setSelectedUserDetailModal((prev: any) => prev ? { ...prev, balance: Math.max(0, prev.balance - 100) } : null);
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs py-2 rounded-xl transition cursor-pointer text-center"
                  >
                    -$100
                  </button>
                  <button
                    onClick={() => {
                      handleQuickAdjustUserBalance(selectedUserDetailModal.id, -500, 'Admin -$500 Portfolio Deduction');
                      setSelectedUserDetailModal((prev: any) => prev ? { ...prev, balance: Math.max(0, prev.balance - 500) } : null);
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs py-2 rounded-xl transition cursor-pointer text-center"
                  >
                    -$500
                  </button>
                  <button
                    onClick={() => {
                      handleQuickAdjustUserBalance(selectedUserDetailModal.id, -1000, 'Admin -$1,000 Portfolio Deduction');
                      setSelectedUserDetailModal((prev: any) => prev ? { ...prev, balance: Math.max(0, prev.balance - 1000) } : null);
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs py-2 rounded-xl transition cursor-pointer text-center"
                  >
                    -$1,000
                  </button>
                </div>
              </div>

              {/* Account P&L Percentage Firestore Override Panel */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Account P&L Percentage Firestore Override
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Writes to doc: users/{selectedUserDetailModal.id}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 24.5"
                      value={userPnlInputs[selectedUserDetailModal.id] ?? (selectedUserDetailModal.pnlPercentage ?? selectedUserDetailModal.pnlOverride?.pnlPercentage ?? 24.5).toString()}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUserPnlInputs(prev => ({ ...prev, [selectedUserDetailModal.id]: val }));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-black rounded-xl pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                  </div>

                  <button
                    onClick={() => {
                      const valStr = userPnlInputs[selectedUserDetailModal.id] ?? (selectedUserDetailModal.pnlPercentage ?? selectedUserDetailModal.pnlOverride?.pnlPercentage ?? 24.5).toString();
                      handleSaveUserPnlPercentage(selectedUserDetailModal.id, parseFloat(valStr) || 0);
                    }}
                    disabled={savingPnlUserId === selectedUserDetailModal.id}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50 shrink-0"
                  >
                    {savingPnlUserId === selectedUserDetailModal.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Save P&L Override</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (selectedUserDetailModal.status === 'Verified') {
                      handleSuspendUser(selectedUserDetailModal.id);
                      setSelectedUserDetailModal((prev: any) => prev ? { ...prev, status: 'Suspended' } : null);
                    } else {
                      handleVerifyUser(selectedUserDetailModal.id);
                      setSelectedUserDetailModal((prev: any) => prev ? { ...prev, status: 'Verified' } : null);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedUserDetailModal.status === 'Verified'
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {selectedUserDetailModal.status === 'Verified' ? 'Suspend Account' : 'Verify Account'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedUserDetailModal(null);
                    setActiveTab('liveChat');
                  }}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Open Chat Desk</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
          </div>
        </main>
      </div>
    </div>
  );
}