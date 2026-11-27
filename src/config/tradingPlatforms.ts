export const TRADING_PLATFORMS = {
  mt4: {
    name: 'MetaTrader 4',
    officialLabel: 'MT4',
    description: 'Classic MetaTrader platform with WebTrader access and copy trading support.',
    logoUrl: 'https://aximedia.s3.amazonaws.com/rebrand-prod/5phphwqr/mt4-logo.png'
  },
  mt5: {
    name: 'MetaTrader 5',
    officialLabel: 'MT5',
    description: 'Multi-asset MetaTrader platform with advanced charting, Expert Advisors and copy trading support.',
    logoUrl: 'https://aximedia.s3.amazonaws.com/rebrand-prod/kkznpafn/mt5-hero-section.png'
  },
  webTrader: {
    name: 'Axi Web Trading Platform',
    officialLabel: 'Axi WebTrader',
    description: 'Axi web trading experience for managing positions and accessing markets from a browser.',
    logoUrl: '/favicon.svg'
  },
  copyTrading: {
    name: 'Axi Copy Trading',
    officialLabel: 'Copy Trading',
    description: 'Follow and copy experienced traders in real time. Axi documents MT4 and MT5 copy-trading support.',
    supportedPlatforms: ['MT4', 'MT5']
  }
} as const;

export type TradingPlatformKey = keyof typeof TRADING_PLATFORMS;
