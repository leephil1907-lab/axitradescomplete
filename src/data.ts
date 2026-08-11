import { MarketQuote, MasterTrader } from './types';

export const ASSET_METADATA: Record<string, { name: string; category: MarketQuote['category'] }> = {
  // Forex
  'EURUSD': { name: 'EUR vs USD (Euro Dollar)', category: 'Forex' },
  'GBPUSD': { name: 'GBP vs USD (Pound Dollar)', category: 'Forex' },
  'USDJPY': { name: 'USD vs JPY (Dollar Yen)', category: 'Forex' },
  'AUDUSD': { name: 'AUD vs USD (Aussie Dollar)', category: 'Forex' },
  'USDCAD': { name: 'USD vs CAD (Dollar Loonie)', category: 'Forex' },

  // Crypto
  'BTCUSD': { name: 'Bitcoin CFD', category: 'Crypto' },
  'ETHUSD': { name: 'Ethereum CFD', category: 'Crypto' },
  'SOLUSD': { name: 'Solana CFD', category: 'Crypto' },
  'XRPUSD': { name: 'XRP Ripple CFD', category: 'Crypto' },
  'DOGEUSD': { name: 'Dogecoin CFD', category: 'Crypto' },
  'ADAUSD': { name: 'Cardano CFD', category: 'Crypto' },
  'AVAXUSD': { name: 'Avalanche CFD', category: 'Crypto' },
  'DOTUSD': { name: 'Polkadot CFD', category: 'Crypto' },
  'LINKUSD': { name: 'Chainlink CFD', category: 'Crypto' },
  'BNBUSD': { name: 'BNB Binance Coin CFD', category: 'Crypto' },

  // Commodities & Metals
  'XAUUSD': { name: 'Gold Spot USD', category: 'Commodities' },
  'XAGUSD': { name: 'Silver Spot USD', category: 'Commodities' },
  'USOUSD': { name: 'WTI Crude Oil', category: 'Commodities' },

  // Indices
  'US30': { name: 'Dow Jones Index CFD', category: 'Indices' },
  'SPX500': { name: 'S&P 500 Index CFD', category: 'Indices' },
  'NAS100': { name: 'Nasdaq 100 Index CFD', category: 'Indices' },

  // Shares / Stocks
  'AAPL': { name: 'Apple Inc. Share CFD', category: 'Shares' },
  'TSLA': { name: 'Tesla Inc. Share CFD', category: 'Shares' },
  'NVDA': { name: 'NVIDIA Corp. Share CFD', category: 'Shares' },
  'MSFT': { name: 'Microsoft Corp. Share CFD', category: 'Shares' },
  'AMZN': { name: 'Amazon.com Inc. Share CFD', category: 'Shares' },
  'GOOGL': { name: 'Alphabet / Google Share CFD', category: 'Shares' },
  'META': { name: 'Meta Platforms Share CFD', category: 'Shares' },
  'AMD': { name: 'Advanced Micro Devices Share CFD', category: 'Shares' }
};

export const MASTER_TRADERS: MasterTrader[] = [
  {
    id: 'trader-1',
    name: 'Alpha FX Algo',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    roi: 142.8,
    winRate: 81.2,
    copiers: 3241,
    riskScore: 3,
    profitGraph: [100, 105, 103, 115, 122, 120, 131, 142.8],
    assetClass: 'Forex majors'
  },
  {
    id: 'trader-2',
    name: 'Gold Crusader',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    roi: 210.4,
    winRate: 74.5,
    copiers: 1954,
    riskScore: 5,
    profitGraph: [100, 95, 120, 145, 132, 175, 192, 210.4],
    assetClass: 'Commodities & Gold'
  },
  {
    id: 'trader-3',
    name: 'Prudent Macro',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    roi: 84.6,
    winRate: 88.9,
    copiers: 4510,
    riskScore: 2,
    profitGraph: [100, 102, 105, 110, 121, 124, 129, 134.6],
    assetClass: 'Global Indices'
  },
  {
    id: 'trader-4',
    name: 'Crypto Velocity',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    roi: 385.1,
    winRate: 62.3,
    copiers: 1211,
    riskScore: 7,
    profitGraph: [100, 150, 120, 240, 190, 310, 290, 385.1],
    assetClass: 'Cryptocurrencies'
  }
];

export const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bermuda', 'Bolivia',
  'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Cambodia', 'Cameroon', 'Canada',
  'Chile', 'China', 'Colombia', 'Costa Rica', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Georgia', 'Germany',
  'Ghana', 'Greece', 'Guatemala', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait',
  'Latvia', 'Lebanon', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macedonia', 'Madagascar', 'Malaysia', 'Maldives',
  'Malta', 'Mauritius', 'Mexico', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Namibia', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Panama', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Rwanda', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
  'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland',
  'Taiwan', 'Tanzania', 'Thailand', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Uganda', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Zambia', 'Zimbabwe'
];

export const ACCOUNT_TYPES = [
  {
    name: 'Standard Account',
    badge: 'Popular',
    description: 'Perfect for retail traders seeking zero commission and simple spreads.',
    spreadsFrom: '0.9 pips',
    commission: 'USD 0.00',
    minDeposit: 'USD 0.00',
    maxLeverage: '1:500',
    platforms: 'MetaTrader 4, Axi Webtrader',
    orderExecution: 'STP (Straight Through Processing)',
    bgStyle: 'bg-slate-900/80 border-slate-800'
  },
  {
    name: 'Pro Account',
    badge: 'Pro Choice',
    description: 'Ultra-low raw spreads with a low flat commission for experienced traders.',
    spreadsFrom: '0.0 pips',
    commission: 'USD 7.00 per round turn',
    minDeposit: 'USD 0.00',
    maxLeverage: '1:500',
    platforms: 'MetaTrader 4, Copy Trading',
    orderExecution: 'ECN raw liquidity access',
    bgStyle: 'bg-slate-950 border-[#FFC800] shadow-lg shadow-[#FFC800]/5'
  },
  {
    name: 'Elite Account',
    badge: 'VIP clients',
    description: 'Institutional spreads and wholesale commissions for heavy volume VIPs.',
    spreadsFrom: '0.0 pips',
    commission: 'USD 3.50 per round turn',
    minDeposit: 'USD 25,000 (or equivalent)',
    maxLeverage: '1:500',
    platforms: 'MetaTrader 4, API FIX Integration',
    orderExecution: 'Direct market feed (DMA)',
    bgStyle: 'bg-[#121620] border-[#0ea5e9]/30'
  }
];

export const ACADEMY_COURSES = [
  {
    id: 'course-1',
    title: 'Forex Fundamentals',
    duration: '25 min',
    lessons: 4,
    difficulty: 'Beginner',
    description: 'Understand leverage, currency pairs, pip values, and how the global forex market is structured.',
    quiz: {
      question: 'What is leverage of 1:500 on an account?',
      options: [
        'It allows you to trade 500 times the value of your initial capital deposit',
        'It guarantees 500% returns in your first month',
        'You have to wait 500 days before requesting a withdrawal',
        'It reduces the spread on EURUSD by 500%'
      ],
      correctIndex: 0,
      explanation: 'Leverage of 1:500 means you can control a trade size 500 times larger than your margin requirement.'
    }
  },
  {
    id: 'course-2',
    title: 'CFD & Margin Mastery',
    duration: '35 min',
    lessons: 5,
    difficulty: 'Intermediate',
    description: 'Master contract-for-differences trading, calculation of margin calls, and long vs short risk rules.',
    quiz: {
      question: 'What triggers a Margin Call on a retail account?',
      options: [
        'When you place a standard withdraw request',
        'When your account equity falls below the broker margin requirement (e.g., 50%)',
        'When you turn off the MT4 trading terminal',
        'When a trade has been open for more than 24 hours'
      ],
      correctIndex: 1,
      explanation: 'A margin call is triggered when trade losses reduce account equity below the minimum required to support open positions.'
    }
  },
  {
    id: 'course-3',
    title: 'Technical Indicators & Risk Control',
    duration: '45 min',
    lessons: 6,
    difficulty: 'Advanced',
    description: 'Deep dive into RSI oscillators, MACD crossovers, Fibonacci levels, and implementing Stop Loss discipline.',
    quiz: {
      question: 'Which tool is primarily designed to pre-define and limit financial downside risk?',
      options: [
        'Moving Average Crossovers',
        'Take Profit orders',
        'A Stop Loss order',
        'Maximum leverage setup'
      ],
      correctIndex: 2,
      explanation: 'A Stop Loss order is a risk-management instruction that automatically exits a losing position at a specific price level.'
    }
  }
];

export const REGULATIONS = [
  {
    entity: 'Axi Financial Services (UK) Limited',
    authority: 'Financial Conduct Authority (FCA)',
    jurisdiction: 'United Kingdom',
    license: 'FRN 466201',
    details: 'Fully authorized and regulated. Client funds are fully segregated in tier-1 bank custody and covered by the Financial Services Compensation Scheme (FSCS).'
  },
  {
    entity: 'AxiCorp Financial Services Pty Ltd',
    authority: 'Australian Securities & Investments Commission (ASIC)',
    jurisdiction: 'Australia',
    license: 'AFSL number 318232',
    details: 'Monitored by Australia’s corporate regulator. Strict adherence to client money laws, keeping funds fully segregated in tier-1 bank trust accounts.'
  },
  {
    entity: 'AxiCorp Financial Services Pty Ltd (DIFC Branch)',
    authority: 'Dubai Financial Services Authority (DFSA)',
    jurisdiction: 'United Arab Emirates / Dubai',
    license: 'F003738',
    details: 'Regulated for retail and professional investment activities in and from the Dubai International Financial Centre.'
  },
  {
    entity: 'AxiTrader Limited',
    authority: 'Financial Services Authority of St. Vincent and the Grenadines',
    jurisdiction: 'Global Markets / Offshore',
    license: '25389 BC 2019',
    details: 'Incorporated to facilitate international leverage structures and raw-spread global liquidity.'
  }
];
