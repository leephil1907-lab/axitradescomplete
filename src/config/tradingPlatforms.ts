export const TRADING_PLATFORMS = {
  mt4: {
    name: 'MetaTrader 4',
    officialLabel: 'MT4',
    officialUrl: 'https://www.axi.com/int/trading-platforms/metatrader-4',
    webTraderUrl: 'https://www.axi.com/int/trading-platforms/mt4-webtrader',
    description: 'Classic MetaTrader platform with WebTrader access and copy trading support.',
    logoUrl: 'https://aximedia.s3.amazonaws.com/rebrand-prod/5phphwqr/mt4-logo.png'
  },
  mt5: {
    name: 'MetaTrader 5',
    officialLabel: 'MT5',
    officialUrl: 'https://www.axi.com/int/trading-platforms/metatrader-5',
    webTraderUrl: 'https://www.axi.com/int/trading-platforms/metatrader-5',
    description: 'Multi-asset MetaTrader platform with advanced charting, Expert Advisors and copy trading support.',
    logoUrl: 'https://aximedia.s3.amazonaws.com/rebrand-prod/kkznpafn/mt5-hero-section.png'
  },
  webTrader: {
    name: 'Axi Web Trading Platform',
    officialLabel: 'Axi WebTrader',
    officialUrl: 'https://www.axi.com/int',
    webTraderUrl: 'https://www.axi.com/int',
    description: 'Axi web trading experience for managing positions and accessing markets from a browser.',
    logoUrl: 'https://www.axi.com/favicon.ico'
  },
  copyTrading: {
    name: 'Axi Copy Trading',
    officialLabel: 'Copy Trading',
    officialUrl: 'https://www.axi.com/int',
    description: 'Follow and copy experienced traders in real time. Axi documents MT4 and MT5 copy-trading support.',
    supportedPlatforms: ['MT4', 'MT5']
  }
} as const;

export type TradingPlatformKey = keyof typeof TRADING_PLATFORMS;
