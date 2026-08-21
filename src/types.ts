export type ViewType = 'home' | 'markets' | 'trading' | 'login' | 'platforms' | 'accounts' | 'tools' | 'about' | 'funds' | 'select' | 'blog' | 'support' | 'legal' | 'dashboard' | 'academy' | 'admin' | 'settings' | 'quick_deposit' | 'partners' | 'promotions' | 'forex_vps' | 'economic_calendar';

export type DisplayCurrency = 'USD' | 'EUR' | 'GBP';

export type KYCStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface UserPaymentMethod {
  id: string;
  userId: string;
  type: 'bank_wire' | 'skrill' | 'neteller' | 'crypto_wallet' | 'card';
  title: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt?: string;
  details: {
    // Bank Wire
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    iban?: string;
    swiftBic?: string;
    routingNumber?: string;
    bankCountry?: string;
    // Skrill / Neteller
    walletEmail?: string;
    accountId?: string;
    // Crypto
    cryptoAsset?: 'BTC' | 'ETH' | 'USDT' | 'USDC' | 'SOL';
    network?: string;
    walletAddress?: string;
    // Card
    cardLast4?: string;
    cardBrand?: string;
    expiryMonth?: string;
    expiryYear?: string;
    instructions?: string;
  };
}

export interface CanonicalInstrument {
  id: string;
  symbol: string;
  displaySymbol: string;
  name: string;
  assetClass: 'Forex' | 'Crypto' | 'Commodities' | 'Indices' | 'Shares';
  provider: 'Finnhub' | 'Binance' | 'Alpha Vantage' | 'Yahoo Finance';
  providerSymbol: string;
  currency: string;
  exchange: string;
  pipSize: number;
  lotSize: number;
  minVolume: number;
  maxLeverage: string;
}

export interface LedgerTransaction {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  amount: number;
  currency: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE_PNL' | 'FEE' | 'BONUS' | 'ADJUSTMENT';
  source: 'STRIPE' | 'CRYPTO_TRANSFER' | 'BANK_WIRE' | 'SKRILL' | 'NETELLER' | 'ADMIN_ADJUSTMENT' | 'INTERNAL';
  status: 'PENDING_PAYMENT' | 'PAYMENT_CONFIRMED' | 'PENDING_ADMIN_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  adminNote?: string;
  externalReference?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  receiptProofUrl?: string;
  destinationDetails?: Record<string, any>;
}

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
  stale?: boolean;
  status?: 'live' | 'stale' | 'unavailable';
  lastUpdated?: number;
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
  sl?: number;
  tp?: number;
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
  openPrice?: number;
  closePrice?: number;
  closeTime?: string;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  direction?: 'ABOVE' | 'BELOW';
  createdAt: string;
  isTriggered: boolean;
  active?: boolean;
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

