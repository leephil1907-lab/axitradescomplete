import { MarketQuote, MasterTrader, CanonicalInstrument } from './types';

export const CANONICAL_INSTRUMENTS: CanonicalInstrument[] = [
  // Crypto (Binance Realtime Feed / Public crypto tickers)
  { id: 'btc-usd', symbol: 'BTCUSD', displaySymbol: 'BTC/USD', name: 'Bitcoin CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'BTCUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.01, lotSize: 1, minVolume: 0.01, maxLeverage: '1:100' },
  { id: 'eth-usd', symbol: 'ETHUSD', displaySymbol: 'ETH/USD', name: 'Ethereum CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'ETHUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.01, lotSize: 1, minVolume: 0.01, maxLeverage: '1:100' },
  { id: 'sol-usd', symbol: 'SOLUSD', displaySymbol: 'SOL/USD', name: 'Solana CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'SOLUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.01, lotSize: 1, minVolume: 0.1, maxLeverage: '1:50' },
  { id: 'xrp-usd', symbol: 'XRPUSD', displaySymbol: 'XRP/USD', name: 'XRP Ripple CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'XRPUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.0001, lotSize: 100, minVolume: 1, maxLeverage: '1:50' },
  { id: 'doge-usd', symbol: 'DOGEUSD', displaySymbol: 'DOGE/USD', name: 'Dogecoin CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'DOGEUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.00001, lotSize: 1000, minVolume: 10, maxLeverage: '1:20' },
  { id: 'bnb-usd', symbol: 'BNBUSD', displaySymbol: 'BNB/USD', name: 'BNB Binance Coin CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'BNBUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.01, lotSize: 1, minVolume: 0.1, maxLeverage: '1:50' },
  { id: 'ada-usd', symbol: 'ADAUSD', displaySymbol: 'ADA/USD', name: 'Cardano CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'ADAUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.0001, lotSize: 100, minVolume: 1, maxLeverage: '1:50' },
  { id: 'avax-usd', symbol: 'AVAXUSD', displaySymbol: 'AVAX/USD', name: 'Avalanche CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'AVAXUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.01, lotSize: 1, minVolume: 0.1, maxLeverage: '1:50' },
  { id: 'dot-usd', symbol: 'DOTUSD', displaySymbol: 'DOT/USD', name: 'Polkadot CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'DOTUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.01, lotSize: 10, minVolume: 0.1, maxLeverage: '1:50' },
  { id: 'link-usd', symbol: 'LINKUSD', displaySymbol: 'LINK/USD', name: 'Chainlink CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'LINKUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.01, lotSize: 10, minVolume: 0.1, maxLeverage: '1:50' },
  { id: 'ltc-usd', symbol: 'LTCUSD', displaySymbol: 'LTC/USD', name: 'Litecoin CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'LTCUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.01, lotSize: 1, minVolume: 0.1, maxLeverage: '1:50' },
  { id: 'trx-usd', symbol: 'TRXUSD', displaySymbol: 'TRX/USD', name: 'TRON CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'TRXUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.00001, lotSize: 1000, minVolume: 10, maxLeverage: '1:20' },
  { id: 'ton-usd', symbol: 'TONUSD', displaySymbol: 'TON/USD', name: 'Toncoin CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'TONUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.001, lotSize: 10, minVolume: 1, maxLeverage: '1:20' },
  { id: 'near-usd', symbol: 'NEARUSD', displaySymbol: 'NEAR/USD', name: 'NEAR Protocol CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'NEARUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.001, lotSize: 10, minVolume: 1, maxLeverage: '1:20' },
  { id: 'sui-usd', symbol: 'SUIUSD', displaySymbol: 'SUI/USD', name: 'Sui Network CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'SUIUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.0001, lotSize: 10, minVolume: 1, maxLeverage: '1:20' },
  { id: 'shib-usd', symbol: 'SHIBUSD', displaySymbol: 'SHIB/USD', name: 'Shiba Inu CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'SHIBUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.00000001, lotSize: 1000000, minVolume: 1, maxLeverage: '1:20' },
  { id: 'pepe-usd', symbol: 'PEPEUSD', displaySymbol: 'PEPE/USD', name: 'Pepe CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'PEPEUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.00000001, lotSize: 1000000, minVolume: 1, maxLeverage: '1:20' },
  { id: 'matic-usd', symbol: 'MATICUSD', displaySymbol: 'POL/USD', name: 'Polygon (POL) CFD', assetClass: 'Crypto', provider: 'Binance', providerSymbol: 'POLUSDT', currency: 'USD', exchange: 'Binance Spot', pipSize: 0.0001, lotSize: 100, minVolume: 1, maxLeverage: '1:50' },
  
  // Forex (Finnhub / Alpha Vantage / Interbank)
  { id: 'eur-usd', symbol: 'EURUSD', displaySymbol: 'EUR/USD', name: 'Euro / US Dollar', assetClass: 'Forex', provider: 'Finnhub', providerSymbol: 'OANDA:EUR_USD', currency: 'USD', exchange: 'Interbank ECN', pipSize: 0.0001, lotSize: 100000, minVolume: 0.01, maxLeverage: '1:500' },
  { id: 'gbp-usd', symbol: 'GBPUSD', displaySymbol: 'GBP/USD', name: 'British Pound / US Dollar', assetClass: 'Forex', provider: 'Finnhub', providerSymbol: 'OANDA:GBP_USD', currency: 'USD', exchange: 'Interbank ECN', pipSize: 0.0001, lotSize: 100000, minVolume: 0.01, maxLeverage: '1:500' },
  { id: 'usd-jpy', symbol: 'USDJPY', displaySymbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', assetClass: 'Forex', provider: 'Finnhub', providerSymbol: 'OANDA:USD_JPY', currency: 'JPY', exchange: 'Interbank ECN', pipSize: 0.01, lotSize: 100000, minVolume: 0.01, maxLeverage: '1:500' },
  { id: 'aud-usd', symbol: 'AUDUSD', displaySymbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', assetClass: 'Forex', provider: 'Finnhub', providerSymbol: 'OANDA:AUD_USD', currency: 'USD', exchange: 'Interbank ECN', pipSize: 0.0001, lotSize: 100000, minVolume: 0.01, maxLeverage: '1:500' },
  { id: 'usd-cad', symbol: 'USDCAD', displaySymbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', assetClass: 'Forex', provider: 'Finnhub', providerSymbol: 'OANDA:USD_CAD', currency: 'CAD', exchange: 'Interbank ECN', pipSize: 0.0001, lotSize: 100000, minVolume: 0.01, maxLeverage: '1:500' },
  { id: 'usd-chf', symbol: 'USDCHF', displaySymbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', assetClass: 'Forex', provider: 'Finnhub', providerSymbol: 'OANDA:USD_CHF', currency: 'CHF', exchange: 'Interbank ECN', pipSize: 0.0001, lotSize: 100000, minVolume: 0.01, maxLeverage: '1:500' },
  { id: 'nzd-usd', symbol: 'NZDUSD', displaySymbol: 'NZD/USD', name: 'New Zealand Dollar / USD', assetClass: 'Forex', provider: 'Finnhub', providerSymbol: 'OANDA:NZD_USD', currency: 'USD', exchange: 'Interbank ECN', pipSize: 0.0001, lotSize: 100000, minVolume: 0.01, maxLeverage: '1:500' },
  { id: 'eur-gbp', symbol: 'EURGBP', displaySymbol: 'EUR/GBP', name: 'Euro / British Pound', assetClass: 'Forex', provider: 'Finnhub', providerSymbol: 'OANDA:EUR_GBP', currency: 'GBP', exchange: 'Interbank ECN', pipSize: 0.0001, lotSize: 100000, minVolume: 0.01, maxLeverage: '1:500' },
  { id: 'eur-jpy', symbol: 'EURJPY', displaySymbol: 'EUR/JPY', name: 'Euro / Japanese Yen', assetClass: 'Forex', provider: 'Finnhub', providerSymbol: 'OANDA:EUR_JPY', currency: 'JPY', exchange: 'Interbank ECN', pipSize: 0.01, lotSize: 100000, minVolume: 0.01, maxLeverage: '1:500' },
  { id: 'gbp-jpy', symbol: 'GBPJPY', displaySymbol: 'GBP/JPY', name: 'British Pound / Japanese Yen', assetClass: 'Forex', provider: 'Finnhub', providerSymbol: 'OANDA:GBP_JPY', currency: 'JPY', exchange: 'Interbank ECN', pipSize: 0.01, lotSize: 100000, minVolume: 0.01, maxLeverage: '1:500' },

  // Commodities & Precious Metals
  { id: 'xau-usd', symbol: 'XAUUSD', displaySymbol: 'XAU/USD', name: 'Gold Spot USD', assetClass: 'Commodities', provider: 'Finnhub', providerSymbol: 'OANDA:XAU_USD', currency: 'USD', exchange: 'COMEX/London Bullion', pipSize: 0.01, lotSize: 100, minVolume: 0.01, maxLeverage: '1:200' },
  { id: 'xag-usd', symbol: 'XAGUSD', displaySymbol: 'XAG/USD', name: 'Silver Spot USD', assetClass: 'Commodities', provider: 'Finnhub', providerSymbol: 'OANDA:XAG_USD', currency: 'USD', exchange: 'London Bullion', pipSize: 0.001, lotSize: 5000, minVolume: 0.01, maxLeverage: '1:100' },
  { id: 'uso-usd', symbol: 'USOUSD', displaySymbol: 'WTI/USD', name: 'WTI Crude Oil Spot', assetClass: 'Commodities', provider: 'Yahoo Finance', providerSymbol: 'CL=F', currency: 'USD', exchange: 'NYMEX', pipSize: 0.01, lotSize: 1000, minVolume: 0.1, maxLeverage: '1:100' },
  { id: 'brent-usd', symbol: 'BRENTUSD', displaySymbol: 'BRENT/USD', name: 'Brent Crude Oil Spot', assetClass: 'Commodities', provider: 'Yahoo Finance', providerSymbol: 'BZ=F', currency: 'USD', exchange: 'ICE', pipSize: 0.01, lotSize: 1000, minVolume: 0.1, maxLeverage: '1:100' },
  { id: 'natgas-usd', symbol: 'NATGAS', displaySymbol: 'NATGAS/USD', name: 'Natural Gas Spot', assetClass: 'Commodities', provider: 'Yahoo Finance', providerSymbol: 'NG=F', currency: 'USD', exchange: 'NYMEX', pipSize: 0.001, lotSize: 10000, minVolume: 0.1, maxLeverage: '1:50' },

  // Indices
  { id: 'us-30', symbol: 'US30', displaySymbol: 'US30 (Dow)', name: 'Dow Jones Industrial Average CFD', assetClass: 'Indices', provider: 'Yahoo Finance', providerSymbol: '^DJI', currency: 'USD', exchange: 'CME Globex', pipSize: 1, lotSize: 1, minVolume: 0.1, maxLeverage: '1:200' },
  { id: 'spx-500', symbol: 'SPX500', displaySymbol: 'SPX500 (S&P)', name: 'S&P 500 Index CFD', assetClass: 'Indices', provider: 'Yahoo Finance', providerSymbol: '^GSPC', currency: 'USD', exchange: 'CME Globex', pipSize: 0.1, lotSize: 1, minVolume: 0.1, maxLeverage: '1:200' },
  { id: 'nas-100', symbol: 'NAS100', displaySymbol: 'NAS100 (Nasdaq)', name: 'Nasdaq 100 Index CFD', assetClass: 'Indices', provider: 'Yahoo Finance', providerSymbol: '^IXIC', currency: 'USD', exchange: 'NASDAQ', pipSize: 0.1, lotSize: 1, minVolume: 0.1, maxLeverage: '1:200' },
  { id: 'uk-100', symbol: 'UK100', displaySymbol: 'UK100 (FTSE)', name: 'FTSE 100 Index CFD', assetClass: 'Indices', provider: 'Yahoo Finance', providerSymbol: '^FTSE', currency: 'GBP', exchange: 'LSE', pipSize: 0.5, lotSize: 1, minVolume: 0.1, maxLeverage: '1:200' },
  { id: 'ger-40', symbol: 'GER40', displaySymbol: 'GER40 (DAX)', name: 'DAX 40 Index CFD', assetClass: 'Indices', provider: 'Yahoo Finance', providerSymbol: '^GDAXI', currency: 'EUR', exchange: 'XETRA', pipSize: 0.5, lotSize: 1, minVolume: 0.1, maxLeverage: '1:200' },

  // Equities (Finnhub real-time quotes)
  { id: 'aapl', symbol: 'AAPL', displaySymbol: 'AAPL', name: 'Apple Inc. Share CFD', assetClass: 'Shares', provider: 'Finnhub', providerSymbol: 'AAPL', currency: 'USD', exchange: 'NASDAQ', pipSize: 0.01, lotSize: 1, minVolume: 1, maxLeverage: '1:20' },
  { id: 'tsla', symbol: 'TSLA', displaySymbol: 'TSLA', name: 'Tesla Inc. Share CFD', assetClass: 'Shares', provider: 'Finnhub', providerSymbol: 'TSLA', currency: 'USD', exchange: 'NASDAQ', pipSize: 0.01, lotSize: 1, minVolume: 1, maxLeverage: '1:20' },
  { id: 'nvda', symbol: 'NVDA', displaySymbol: 'NVDA', name: 'NVIDIA Corp. Share CFD', assetClass: 'Shares', provider: 'Finnhub', providerSymbol: 'NVDA', currency: 'USD', exchange: 'NASDAQ', pipSize: 0.01, lotSize: 1, minVolume: 1, maxLeverage: '1:20' },
  { id: 'msft', symbol: 'MSFT', displaySymbol: 'MSFT', name: 'Microsoft Corp. Share CFD', assetClass: 'Shares', provider: 'Finnhub', providerSymbol: 'MSFT', currency: 'USD', exchange: 'NASDAQ', pipSize: 0.01, lotSize: 1, minVolume: 1, maxLeverage: '1:20' },
  { id: 'amzn', symbol: 'AMZN', displaySymbol: 'AMZN', name: 'Amazon.com Inc. Share CFD', assetClass: 'Shares', provider: 'Finnhub', providerSymbol: 'AMZN', currency: 'USD', exchange: 'NASDAQ', pipSize: 0.01, lotSize: 1, minVolume: 1, maxLeverage: '1:20' },
  { id: 'googl', symbol: 'GOOGL', displaySymbol: 'GOOGL', name: 'Alphabet / Google Share CFD', assetClass: 'Shares', provider: 'Finnhub', providerSymbol: 'GOOGL', currency: 'USD', exchange: 'NASDAQ', pipSize: 0.01, lotSize: 1, minVolume: 1, maxLeverage: '1:20' },
  { id: 'meta', symbol: 'META', displaySymbol: 'META', name: 'Meta Platforms Share CFD', assetClass: 'Shares', provider: 'Finnhub', providerSymbol: 'META', currency: 'USD', exchange: 'NASDAQ', pipSize: 0.01, lotSize: 1, minVolume: 1, maxLeverage: '1:20' },
  { id: 'amd', symbol: 'AMD', displaySymbol: 'AMD', name: 'Advanced Micro Devices CFD', assetClass: 'Shares', provider: 'Finnhub', providerSymbol: 'AMD', currency: 'USD', exchange: 'NASDAQ', pipSize: 0.01, lotSize: 1, minVolume: 1, maxLeverage: '1:20' },
  { id: 'nflx', symbol: 'NFLX', displaySymbol: 'NFLX', name: 'Netflix Inc. Share CFD', assetClass: 'Shares', provider: 'Finnhub', providerSymbol: 'NFLX', currency: 'USD', exchange: 'NASDAQ', pipSize: 0.01, lotSize: 1, minVolume: 1, maxLeverage: '1:20' },
  { id: 'coin', symbol: 'COIN', displaySymbol: 'COIN', name: 'Coinbase Global Share CFD', assetClass: 'Shares', provider: 'Finnhub', providerSymbol: 'COIN', currency: 'USD', exchange: 'NASDAQ', pipSize: 0.01, lotSize: 1, minVolume: 1, maxLeverage: '1:20' }
];

export const ASSET_METADATA: Record<string, { name: string; category: MarketQuote['category'] }> = {
  // Forex
  'EURUSD': { name: 'EUR vs USD (Euro Dollar)', category: 'Forex' },
  'GBPUSD': { name: 'GBP vs USD (Pound Dollar)', category: 'Forex' },
  'USDJPY': { name: 'USD vs JPY (Dollar Yen)', category: 'Forex' },
  'AUDUSD': { name: 'AUD vs USD (Aussie Dollar)', category: 'Forex' },
  'USDCAD': { name: 'USD vs CAD (Dollar Loonie)', category: 'Forex' },
  'USDCHF': { name: 'USD vs CHF (Dollar Swiss)', category: 'Forex' },
  'NZDUSD': { name: 'NZD vs USD (Kiwi Dollar)', category: 'Forex' },
  'EURGBP': { name: 'EUR vs GBP (Euro Sterling)', category: 'Forex' },
  'EURJPY': { name: 'EUR vs JPY (Euro Yen)', category: 'Forex' },
  'GBPJPY': { name: 'GBP vs JPY (Pound Yen)', category: 'Forex' },

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
  'LTCUSD': { name: 'Litecoin CFD', category: 'Crypto' },
  'TRXUSD': { name: 'TRON CFD', category: 'Crypto' },
  'TONUSD': { name: 'Toncoin CFD', category: 'Crypto' },
  'NEARUSD': { name: 'NEAR Protocol CFD', category: 'Crypto' },
  'SUIUSD': { name: 'Sui Network CFD', category: 'Crypto' },
  'SHIBUSD': { name: 'Shiba Inu CFD', category: 'Crypto' },
  'PEPEUSD': { name: 'Pepe CFD', category: 'Crypto' },
  'MATICUSD': { name: 'Polygon (POL) CFD', category: 'Crypto' },

  // Commodities & Metals
  'XAUUSD': { name: 'Gold Spot USD', category: 'Commodities' },
  'XAGUSD': { name: 'Silver Spot USD', category: 'Commodities' },
  'USOUSD': { name: 'WTI Crude Oil', category: 'Commodities' },
  'BRENTUSD': { name: 'Brent Crude Oil', category: 'Commodities' },
  'NATGAS': { name: 'Natural Gas Spot', category: 'Commodities' },

  // Indices
  'US30': { name: 'Dow Jones Index CFD', category: 'Indices' },
  'SPX500': { name: 'S&P 500 Index CFD', category: 'Indices' },
  'NAS100': { name: 'Nasdaq 100 Index CFD', category: 'Indices' },
  'UK100': { name: 'FTSE 100 Index CFD', category: 'Indices' },
  'GER40': { name: 'DAX 40 Index CFD', category: 'Indices' },

  // Shares / Stocks
  'AAPL': { name: 'Apple Inc. Share CFD', category: 'Shares' },
  'TSLA': { name: 'Tesla Inc. Share CFD', category: 'Shares' },
  'NVDA': { name: 'NVIDIA Corp. Share CFD', category: 'Shares' },
  'MSFT': { name: 'Microsoft Corp. Share CFD', category: 'Shares' },
  'AMZN': { name: 'Amazon.com Inc. Share CFD', category: 'Shares' },
  'GOOGL': { name: 'Alphabet / Google Share CFD', category: 'Shares' },
  'META': { name: 'Meta Platforms Share CFD', category: 'Shares' },
  'AMD': { name: 'Advanced Micro Devices Share CFD', category: 'Shares' },
  'NFLX': { name: 'Netflix Inc. Share CFD', category: 'Shares' },
  'COIN': { name: 'Coinbase Global Share CFD', category: 'Shares' }
};

export const DEFAULT_MARKET_QUOTES: Record<string, MarketQuote> = {
  // Forex
  EURUSD: { symbol: 'EURUSD', name: 'EUR vs USD (Euro Dollar)', category: 'Forex', price: 1.0482, change: 0.14, bidDiff: -0.0001, askDiff: 0.0001, spread: 0.0002, history: [1.0465, 1.0472, 1.0478, 1.0482] },
  GBPUSD: { symbol: 'GBPUSD', name: 'GBP vs USD (Pound Dollar)', category: 'Forex', price: 1.2590, change: -0.06, bidDiff: -0.0002, askDiff: 0.0002, spread: 0.0004, history: [1.2605, 1.2598, 1.2592, 1.2590] },
  USDJPY: { symbol: 'USDJPY', name: 'USD vs JPY (Dollar Yen)', category: 'Forex', price: 154.60, change: 0.32, bidDiff: -0.01, askDiff: 0.01, spread: 0.02, history: [154.10, 154.30, 154.48, 154.60] },
  AUDUSD: { symbol: 'AUDUSD', name: 'AUD vs USD (Aussie Dollar)', category: 'Forex', price: 0.6385, change: 0.18, bidDiff: -0.0001, askDiff: 0.0001, spread: 0.0002, history: [0.6370, 0.6378, 0.6382, 0.6385] },
  USDCAD: { symbol: 'USDCAD', name: 'USD vs CAD (Dollar Loonie)', category: 'Forex', price: 1.4180, change: -0.12, bidDiff: -0.0001, askDiff: 0.0001, spread: 0.0002, history: [1.4195, 1.4190, 1.4185, 1.4180] },
  USDCHF: { symbol: 'USDCHF', name: 'USD vs CHF (Dollar Swiss)', category: 'Forex', price: 0.9025, change: 0.05, bidDiff: -0.0001, askDiff: 0.0001, spread: 0.0002, history: [0.9018, 0.9020, 0.9023, 0.9025] },
  NZDUSD: { symbol: 'NZDUSD', name: 'NZD vs USD (Kiwi Dollar)', category: 'Forex', price: 0.5730, change: 0.15, bidDiff: -0.0001, askDiff: 0.0001, spread: 0.0002, history: [0.5720, 0.5724, 0.5728, 0.5730] },
  EURGBP: { symbol: 'EURGBP', name: 'EUR vs GBP (Euro Sterling)', category: 'Forex', price: 0.8325, change: 0.08, bidDiff: -0.0001, askDiff: 0.0001, spread: 0.0002, history: [0.8318, 0.8320, 0.8322, 0.8325] },
  EURJPY: { symbol: 'EURJPY', name: 'EUR vs JPY (Euro Yen)', category: 'Forex', price: 162.05, change: 0.45, bidDiff: -0.01, askDiff: 0.01, spread: 0.02, history: [161.40, 161.65, 161.85, 162.05] },
  GBPJPY: { symbol: 'GBPJPY', name: 'GBP vs JPY (Pound Yen)', category: 'Forex', price: 194.65, change: 0.28, bidDiff: -0.01, askDiff: 0.01, spread: 0.02, history: [194.10, 194.30, 194.50, 194.65] },

  // Crypto
  BTCUSD: { symbol: 'BTCUSD', name: 'Bitcoin CFD', category: 'Crypto', price: 96450.00, change: 2.85, bidDiff: -2.5, askDiff: 2.5, spread: 5.0, history: [94800, 95400, 95900, 96450] },
  ETHUSD: { symbol: 'ETHUSD', name: 'Ethereum CFD', category: 'Crypto', price: 2740.50, change: 1.95, bidDiff: -0.25, askDiff: 0.25, spread: 0.5, history: [2680, 2705, 2725, 2740.5] },
  SOLUSD: { symbol: 'SOLUSD', name: 'Solana CFD', category: 'Crypto', price: 188.40, change: 4.20, bidDiff: -0.05, askDiff: 0.05, spread: 0.1, history: [180, 183, 186, 188.4] },
  XRPUSD: { symbol: 'XRPUSD', name: 'XRP Ripple CFD', category: 'Crypto', price: 2.3850, change: 5.15, bidDiff: -0.0005, askDiff: 0.0005, spread: 0.001, history: [2.25, 2.29, 2.34, 2.385] },
  DOGEUSD: { symbol: 'DOGEUSD', name: 'Dogecoin CFD', category: 'Crypto', price: 0.2450, change: 3.80, bidDiff: -0.0001, askDiff: 0.0001, spread: 0.0002, history: [0.235, 0.238, 0.242, 0.245] },
  ADAUSD: { symbol: 'ADAUSD', name: 'Cardano CFD', category: 'Crypto', price: 0.7420, change: 2.10, bidDiff: -0.0002, askDiff: 0.0002, spread: 0.0004, history: [0.725, 0.731, 0.738, 0.742] },
  AVAXUSD: { symbol: 'AVAXUSD', name: 'Avalanche CFD', category: 'Crypto', price: 28.60, change: 1.85, bidDiff: -0.02, askDiff: 0.02, spread: 0.04, history: [27.8, 28.1, 28.4, 28.6] },
  DOTUSD: { symbol: 'DOTUSD', name: 'Polkadot CFD', category: 'Crypto', price: 5.85, change: 0.90, bidDiff: -0.01, askDiff: 0.01, spread: 0.02, history: [5.78, 5.80, 5.83, 5.85] },
  LINKUSD: { symbol: 'LINKUSD', name: 'Chainlink CFD', category: 'Crypto', price: 18.25, change: 2.40, bidDiff: -0.01, askDiff: 0.01, spread: 0.02, history: [17.70, 17.90, 18.10, 18.25] },
  BNBUSD: { symbol: 'BNBUSD', name: 'BNB Binance Coin CFD', category: 'Crypto', price: 645.00, change: 1.50, bidDiff: -0.10, askDiff: 0.10, spread: 0.20, history: [635, 638, 642, 645] },
  LTCUSD: { symbol: 'LTCUSD', name: 'Litecoin CFD', category: 'Crypto', price: 112.50, change: 3.20, bidDiff: -0.05, askDiff: 0.05, spread: 0.10, history: [108, 110, 111.5, 112.5] },
  TRXUSD: { symbol: 'TRXUSD', name: 'TRON CFD', category: 'Crypto', price: 0.2350, change: 0.85, bidDiff: -0.0001, askDiff: 0.0001, spread: 0.0002, history: [0.232, 0.233, 0.234, 0.235] },
  TONUSD: { symbol: 'TONUSD', name: 'Toncoin CFD', category: 'Crypto', price: 5.25, change: 1.40, bidDiff: -0.01, askDiff: 0.01, spread: 0.02, history: [5.15, 5.18, 5.22, 5.25] },
  NEARUSD: { symbol: 'NEARUSD', name: 'NEAR Protocol CFD', category: 'Crypto', price: 4.65, change: 2.15, bidDiff: -0.01, askDiff: 0.01, spread: 0.02, history: [4.52, 4.58, 4.62, 4.65] },
  SUIUSD: { symbol: 'SUIUSD', name: 'Sui Network CFD', category: 'Crypto', price: 3.15, change: 6.40, bidDiff: -0.005, askDiff: 0.005, spread: 0.01, history: [2.95, 3.02, 3.09, 3.15] },
  SHIBUSD: { symbol: 'SHIBUSD', name: 'Shiba Inu CFD', category: 'Crypto', price: 0.0000185, change: 2.40, bidDiff: -0.00000002, askDiff: 0.00000002, spread: 0.00000004, history: [0.0000178, 0.0000181, 0.0000183, 0.0000185] },
  PEPEUSD: { symbol: 'PEPEUSD', name: 'Pepe CFD', category: 'Crypto', price: 0.0000115, change: 4.80, bidDiff: -0.00000002, askDiff: 0.00000002, spread: 0.00000004, history: [0.0000108, 0.0000111, 0.0000113, 0.0000115] },
  MATICUSD: { symbol: 'MATICUSD', name: 'Polygon (POL) CFD', category: 'Crypto', price: 0.4450, change: 1.20, bidDiff: -0.0005, askDiff: 0.0005, spread: 0.001, history: [0.438, 0.441, 0.443, 0.445] },

  // Commodities & Metals
  XAUUSD: { symbol: 'XAUUSD', name: 'Gold Spot USD', category: 'Commodities', price: 2915.40, change: 0.95, bidDiff: -0.18, askDiff: 0.18, spread: 0.36, history: [2885, 2895, 2908, 2915.4] },
  XAGUSD: { symbol: 'XAGUSD', name: 'Silver Spot USD', category: 'Commodities', price: 32.85, change: 1.45, bidDiff: -0.01, askDiff: 0.01, spread: 0.02, history: [32.25, 32.45, 32.68, 32.85] },
  USOUSD: { symbol: 'USOUSD', name: 'WTI Crude Oil', category: 'Commodities', price: 71.80, change: -0.65, bidDiff: -0.02, askDiff: 0.02, spread: 0.04, history: [72.30, 72.10, 71.95, 71.80] },
  BRENTUSD: { symbol: 'BRENTUSD', name: 'Brent Crude Oil', category: 'Commodities', price: 75.40, change: -0.55, bidDiff: -0.02, askDiff: 0.02, spread: 0.04, history: [75.90, 75.75, 75.55, 75.40] },
  NATGAS: { symbol: 'NATGAS', name: 'Natural Gas Spot', category: 'Commodities', price: 3.25, change: 2.10, bidDiff: -0.005, askDiff: 0.005, spread: 0.01, history: [3.15, 3.19, 3.22, 3.25] },

  // Indices
  US30: { symbol: 'US30', name: 'Dow Jones Index CFD', category: 'Indices', price: 43850.00, change: 0.45, bidDiff: -1.5, askDiff: 1.5, spread: 3.0, history: [43650, 43720, 43790, 43850] },
  SPX500: { symbol: 'SPX500', name: 'S&P 500 Index CFD', category: 'Indices', price: 5985.50, change: 0.62, bidDiff: -0.25, askDiff: 0.25, spread: 0.5, history: [5945, 5960, 5975, 5985.5] },
  NAS100: { symbol: 'NAS100', name: 'Nasdaq 100 Index CFD', category: 'Indices', price: 21450.00, change: 0.88, bidDiff: -0.80, askDiff: 0.80, spread: 1.6, history: [21250, 21320, 21390, 21450] },
  UK100: { symbol: 'UK100', name: 'FTSE 100 Index CFD', category: 'Indices', price: 8390.00, change: 0.25, bidDiff: -0.5, askDiff: 0.5, spread: 1.0, history: [8360, 8372, 8382, 8390] },
  GER40: { symbol: 'GER40', name: 'DAX 40 Index CFD', category: 'Indices', price: 20250.00, change: 0.55, bidDiff: -0.8, askDiff: 0.8, spread: 1.6, history: [20120, 20160, 20210, 20250] },

  // Shares / Stocks
  AAPL: { symbol: 'AAPL', name: 'Apple Inc. Share CFD', category: 'Shares', price: 232.40, change: 0.75, bidDiff: -0.05, askDiff: 0.05, spread: 0.10, history: [230.5, 231.2, 231.8, 232.4] },
  TSLA: { symbol: 'TSLA', name: 'Tesla Inc. Share CFD', category: 'Shares', price: 248.50, change: 3.20, bidDiff: -0.08, askDiff: 0.08, spread: 0.16, history: [240.2, 243.5, 246.0, 248.5] },
  NVDA: { symbol: 'NVDA', name: 'NVIDIA Corp. Share CFD', category: 'Shares', price: 138.85, change: 2.65, bidDiff: -0.05, askDiff: 0.05, spread: 0.10, history: [134.5, 136.0, 137.5, 138.85] },
  MSFT: { symbol: 'MSFT', name: 'Microsoft Corp. Share CFD', category: 'Shares', price: 418.20, change: 0.40, bidDiff: -0.10, askDiff: 0.10, spread: 0.20, history: [415.5, 416.5, 417.4, 418.2] },
  AMZN: { symbol: 'AMZN', name: 'Amazon.com Inc. Share CFD', category: 'Shares', price: 212.80, change: 1.15, bidDiff: -0.08, askDiff: 0.08, spread: 0.16, history: [209.5, 210.8, 211.9, 212.8] },
  GOOGL: { symbol: 'GOOGL', name: 'Alphabet / Google Share CFD', category: 'Shares', price: 182.50, change: 0.90, bidDiff: -0.06, askDiff: 0.06, spread: 0.12, history: [180.5, 181.2, 181.8, 182.5] },
  META: { symbol: 'META', name: 'Meta Platforms Share CFD', category: 'Shares', price: 654.20, change: 1.85, bidDiff: -0.15, askDiff: 0.15, spread: 0.30, history: [642, 646, 650, 654.2] },
  AMD: { symbol: 'AMD', name: 'Advanced Micro Devices Share CFD', category: 'Shares', price: 122.40, change: 2.10, bidDiff: -0.08, askDiff: 0.08, spread: 0.16, history: [119.5, 120.6, 121.5, 122.4] },
  NFLX: { symbol: 'NFLX', name: 'Netflix Inc. Share CFD', category: 'Shares', price: 945.00, change: 1.45, bidDiff: -0.15, askDiff: 0.15, spread: 0.30, history: [930, 936, 941, 945] },
  COIN: { symbol: 'COIN', name: 'Coinbase Global Share CFD', category: 'Shares', price: 268.50, change: 4.80, bidDiff: -0.12, askDiff: 0.12, spread: 0.24, history: [255, 260, 264.5, 268.5] }
};

export const MASTER_TRADERS: MasterTrader[] = [];

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
    authority: 'Financial Services FSA',
    jurisdiction: 'Global Markets / St. Vincent & the Grenadines',
    license: '25389 BC 2019',
    details: 'Incorporated to facilitate international leverage structures and raw-spread global liquidity.'
  }
];
