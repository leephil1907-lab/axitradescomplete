import { safeStorage } from './storage';

export interface PnlOverrideConfig {
  enabled: boolean;
  unrealizedPnl: number; // e.g. +1450.00 or -230.00
  realizedPnl?: number;  // e.g. +3200.00
  pnlPercentage?: number; // e.g. +28.5
  trendPattern?: 'bullish' | 'growth' | 'volatile' | 'bearish';
  customAccountNotes?: string;
  updatedAt?: string;
}

export const getPnlOverrideForUser = (userKey?: string): PnlOverrideConfig | null => {
  const saved = safeStorage.getItem('axi_user_pnl_overrides');
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    if (userKey && parsed[userKey]) {
      return parsed[userKey];
    }
    // Fallbacks
    if (parsed['default']) return parsed['default'];
    if (parsed['trader@axi.com']) return parsed['trader@axi.com'];
    if (parsed['alex.t@example.com']) return parsed['alex.t@example.com'];
    if (parsed['usr_8492']) return parsed['usr_8492'];
  } catch (e) {}
  return null;
};

export const setPnlOverrideForUser = (userKey: string, config: PnlOverrideConfig) => {
  const saved = safeStorage.getItem('axi_user_pnl_overrides');
  let currentMap: Record<string, PnlOverrideConfig> = {};
  if (saved) {
    try { currentMap = JSON.parse(saved); } catch (e) {}
  }
  currentMap[userKey] = config;
  if (userKey === 'trader@axi.com' || userKey === 'usr_8492' || userKey === 'alex.t@example.com') {
    currentMap['default'] = config;
  }
  safeStorage.setItem('axi_user_pnl_overrides', JSON.stringify(currentMap));
  window.dispatchEvent(new Event('axi_pnl_override_updated'));
};

export const clearPnlOverrideForUser = (userKey: string) => {
  const saved = safeStorage.getItem('axi_user_pnl_overrides');
  if (saved) {
    try {
      const currentMap = JSON.parse(saved);
      delete currentMap[userKey];
      if (userKey === 'trader@axi.com' || userKey === 'usr_8492') {
        delete currentMap['default'];
      }
      safeStorage.setItem('axi_user_pnl_overrides', JSON.stringify(currentMap));
      window.dispatchEvent(new Event('axi_pnl_override_updated'));
    } catch (e) {}
  }
};
