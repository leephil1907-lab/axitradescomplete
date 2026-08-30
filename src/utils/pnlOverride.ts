export interface PnlOverrideConfig {
  enabled: boolean;
  unrealizedPnl: number;
  realizedPnl?: number;
  pnlPercentage?: number;
  trendPattern?: 'bullish' | 'growth' | 'volatile' | 'bearish';
  customAccountNotes?: string;
  updatedAt?: string;
}

// P&L is derived from actual positions and provider prices. There is deliberately
// no client-side override store or synthetic fallback in production.
export const getPnlOverrideForUser = (_userKey?: string): null => null;
export const setPnlOverrideForUser = (_userKey: string, _config: PnlOverrideConfig): void => {
  throw new Error('Artificial P&L overrides are disabled in production.');
};
export const clearPnlOverrideForUser = (_userKey: string): void => {
  // No override state exists to clear.
};
