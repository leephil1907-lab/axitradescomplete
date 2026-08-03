export type ViewType = 'home' | 'markets' | 'login' | 'platforms' | 'accounts' | 'tools' | 'about' | 'funds' | 'select' | 'blog' | 'support' | 'legal' | 'dashboard' | 'academy' | 'admin' | 'settings' | 'quick_deposit';

export type DisplayCurrency = 'USD' | 'EUR' | 'GBP';

export interface MarketQuote {
  symbol: string;
  name: string;
  category: 'Forex' | 'Crypto' | 'Commodities' | 'Indices' | 'Shares';
  price: number;
  change: number;
  bidDiff: number;
  askDiff: number;
  spread: number;
  history: number[]; // For mini chart sparklines
}

export interface MasterTrader {
  id: string;
  name: string;
  avatar: string;
  roi: number; // Return on Investment
  winRate: number;
  copiers: number;
  riskScore: number;
  profitGraph: number[];
  assetClass: string;
}

export interface TradeOrder {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  currentPrice: number;
  volume: number; // Lot size (e.g., 0.1, 1.0)
  profit: number;
  timestamp: string;
}

export interface ClosedPosition {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  entryPrice: number;
  exitPrice: number;
  profit: number;
  entryTime: string;
  exitTime: string;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  createdAt: string;
  isTriggered: boolean;
}

export interface Transaction {
  id: string;
  type: 'Deposit' | 'Withdraw';
  amount: number;
  method: string;
  refCode?: string;
  proofNote?: string;
  date: string;
  status: 'Pending Verification' | 'Completed' | 'Rejected' | 'Proof Requested';
  account: string;
  user?: string;
  userId?: string;
}

export interface SupportMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: Array<{ title: string; uri: string }>;
}

export interface KYCDocument {
  id: string;
  type: 'Passport / National ID' | 'Proof of Address' | 'Bank Statement / Wealth Proof';
  fileName: string;
  fileSize?: string;
  submittedAt: string;
  status: 'Verified' | 'Under Review' | 'Action Required' | 'Not Uploaded';
  reviewStep: 1 | 2 | 3 | 4; // 1: Received, 2: Security Scan, 3: Admin Audit, 4: Approved
  adminNote?: string;
  refCode: string;
}

export interface ReferralInvite {
  id: string;
  email: string;
  name?: string;
  status: 'Invited' | 'Registered' | 'Funded' | 'Claimed';
  reward: number;
  sentAt: string;
  refCode: string;
  claimed?: boolean;
}

