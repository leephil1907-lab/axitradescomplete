import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { safeStorage } from '../utils/storage';

export interface CryptoWalletConfig {
  address: string;
  network: string;
  memo?: string;
  active?: boolean;
}

export interface BankSettingsConfig {
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftBic: string;
  routingNumber?: string;
  bankAddress?: string;
  instructions: string;
  supportEmail?: string;
  active: boolean;
}

export interface PaymentMethodItem {
  id: string;
  name: string;
  type: 'crypto' | 'bank' | 'card' | 'wallet' | 'other';
  currency: string;
  active: boolean;
  minDeposit: number;
  maxDeposit: number;
  feePercent: number;
  processingTime: string;
  walletAddress?: string;
  network?: string;
  memo?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  swiftBic?: string;
  routingNumber?: string;
  bankAddress?: string;
  walletIdentifier?: string;
  instructions?: string;
  iconName?: string;
}

export interface MaintenanceModeConfig {
  active: boolean;
  message: string;
  disableDeposits: boolean;
  disableTrading: boolean;
}

export interface CentralPaymentConfig {
  updatedAt: number;
  cryptoWallets: Record<string, CryptoWalletConfig>;
  bankSettings: BankSettingsConfig;
  paymentMethods: PaymentMethodItem[];
  autoApproveLimit?: number;
  requireKycForDeposit?: boolean;
  maintenanceMode?: MaintenanceModeConfig;
}

export const defaultMaintenanceMode: MaintenanceModeConfig = {
  active: false,
  message: 'System Maintenance Active: Deposits and live trading execution are temporarily paused for scheduled platform upgrades. Please check back shortly.',
  disableDeposits: true,
  disableTrading: true
};

export const defaultCryptoWallets: Record<string, CryptoWalletConfig> = {};

export const defaultBankSettings: BankSettingsConfig = {
  bankName: '',
  accountName: '',
  accountNumber: '',
  swiftBic: '',
  routingNumber: '',
  bankAddress: '',
  instructions: '',
  supportEmail: 'axicustomersupport@gmail.com',
  active: false
};

export const defaultPaymentMethods: PaymentMethodItem[] = [];

export function getLocalPaymentConfig(): CentralPaymentConfig {
  try {
    const sanitizeBank = (bank: any): BankSettingsConfig => {
      if (!bank || bank.bankName === 'Axi Global Clearing Bank' || bank.accountNumber === '94820194821') {
        return defaultBankSettings;
      }
      return { ...defaultBankSettings, ...bank };
    };

    const savedConfig = safeStorage.getItem('axi_payment_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      return {
        updatedAt: parsed.updatedAt || Date.now(),
        cryptoWallets: { ...defaultCryptoWallets, ...(parsed.cryptoWallets || {}) },
        bankSettings: sanitizeBank(parsed.bankSettings),
        paymentMethods: parsed.paymentMethods || defaultPaymentMethods,
        // Production safety: automatic approval is opt-in and disabled by default.
        autoApproveLimit: 0,
        requireKycForDeposit: parsed.requireKycForDeposit ?? true,
        maintenanceMode: { ...defaultMaintenanceMode, ...(parsed.maintenanceMode || {}) }
      };
    }

    const savedWallets = safeStorage.getItem('axi_admin_wallet_settings');
    const savedBank = safeStorage.getItem('axi_admin_bank_settings');
    const savedMethods = safeStorage.getItem('axi_payment_methods');

    const cryptoWallets = savedWallets ? { ...defaultCryptoWallets, ...JSON.parse(savedWallets) } : defaultCryptoWallets;
    const bankSettings = savedBank ? sanitizeBank(JSON.parse(savedBank)) : defaultBankSettings;
    const paymentMethods = savedMethods ? JSON.parse(savedMethods) : defaultPaymentMethods;

    return {
      updatedAt: Date.now(),
      cryptoWallets,
      bankSettings,
      paymentMethods,
      autoApproveLimit: 0,
      requireKycForDeposit: true,
      maintenanceMode: defaultMaintenanceMode
    };
  } catch (err) {
    console.warn('Error reading local payment config:', err);
    return {
      updatedAt: Date.now(),
      cryptoWallets: defaultCryptoWallets,
      bankSettings: defaultBankSettings,
      paymentMethods: defaultPaymentMethods,
      autoApproveLimit: 0,
      requireKycForDeposit: true,
      maintenanceMode: defaultMaintenanceMode
    };
  }
}

export function saveLocalPaymentConfig(config: CentralPaymentConfig) {
  try {
    safeStorage.setItem('axi_payment_config', JSON.stringify(config));
    safeStorage.setItem('axi_admin_wallet_settings', JSON.stringify(config.cryptoWallets));
    safeStorage.setItem('axi_admin_bank_settings', JSON.stringify(config.bankSettings));
    safeStorage.setItem('axi_payment_methods', JSON.stringify(config.paymentMethods));

    window.dispatchEvent(new Event('axi_payment_config_updated'));
    window.dispatchEvent(new Event('axi_admin_wallet_settings_updated'));
    window.dispatchEvent(new Event('axi_payment_methods_updated'));
  } catch (err) {
    console.error('Failed to save local payment config:', err);
  }
}

export function subscribeSystemConfigWallets(
  onData: (wallets: Record<string, CryptoWalletConfig>, isLive: boolean) => void
): () => void {
  const initial = getLocalPaymentConfig().cryptoWallets;
  onData(initial, false);

  try {
    const sysDocRef = doc(db, 'system_config', 'wallets');
    const unsubscribe = onSnapshot(
      sysDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const wallets: Record<string, CryptoWalletConfig> = {
            btc: data.btc || defaultCryptoWallets.btc,
            eth: data.eth || defaultCryptoWallets.eth,
            usdt: data.usdt || defaultCryptoWallets.usdt,
            usdc: data.usdc || defaultCryptoWallets.usdc,
            sol: data.sol || defaultCryptoWallets.sol
          };
          const currentConfig = getLocalPaymentConfig();
          const updatedConfig = { ...currentConfig, cryptoWallets: wallets };
          saveLocalPaymentConfig(updatedConfig);
          onData(wallets, true);
        } else {
          const current = getLocalPaymentConfig().cryptoWallets;
          setDoc(sysDocRef, { ...current, updatedAt: Date.now() }, { merge: true }).catch(() => {});
          onData(current, true);
        }
      },
      (err) => {
        console.warn('system_config/wallets subscription warning:', err.message);
        onData(getLocalPaymentConfig().cryptoWallets, false);
      }
    );
    return () => unsubscribe();
  } catch (err) {
    console.warn('system_config setup failed:', err);
    onData(getLocalPaymentConfig().cryptoWallets, false);
    return () => {};
  }
}

export async function updateSystemConfigWallets(
  wallets: Record<string, CryptoWalletConfig>
): Promise<{ success: boolean; firestoreSynced: boolean; message: string }> {
  const currentConfig = getLocalPaymentConfig();
  const updatedConfig: CentralPaymentConfig = {
    ...currentConfig,
    cryptoWallets: wallets,
    updatedAt: Date.now()
  };

  saveLocalPaymentConfig(updatedConfig);

  let firestoreSynced = false;
  try {
    const sysDocRef = doc(db, 'system_config', 'wallets');
    await setDoc(sysDocRef, { ...wallets, updatedAt: Date.now() }, { merge: true });
    const configDocRef = doc(db, 'config', 'paymentConfig');
    await setDoc(configDocRef, { cryptoWallets: wallets, updatedAt: Date.now() }, { merge: true });
    firestoreSynced = true;
  } catch (err: any) {
    console.warn('Firestore system_config/wallets write warning:', err?.message || err);
  }

  return {
    success: true,
    firestoreSynced,
    message: firestoreSynced
      ? 'Crypto wallet addresses saved to Firestore system_config document!'
      : 'Crypto wallet addresses saved locally (Firestore sync fallback active).'
  };
}

export function subscribePaymentConfig(
  onData: (config: CentralPaymentConfig, isLiveFirestore: boolean) => void
): () => void {
  const initialLocal = getLocalPaymentConfig();
  onData(initialLocal, false);

  try {
    const configDocRef = doc(db, 'config', 'paymentConfig');
    const sysDocRef = doc(db, 'system_config', 'wallets');

    const unsubscribeConfig = onSnapshot(
      configDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<CentralPaymentConfig>;
          const merged: CentralPaymentConfig = {
            updatedAt: data.updatedAt || Date.now(),
            cryptoWallets: { ...defaultCryptoWallets, ...(data.cryptoWallets || {}) },
            bankSettings: { ...defaultBankSettings, ...(data.bankSettings || {}) },
            paymentMethods: data.paymentMethods && data.paymentMethods.length > 0 ? data.paymentMethods : defaultPaymentMethods,
            // Never inherit a positive auto-approval limit from stale/mock configuration.
            autoApproveLimit: 0,
            requireKycForDeposit: data.requireKycForDeposit ?? true,
            maintenanceMode: { ...defaultMaintenanceMode, ...(data.maintenanceMode || {}) }
          };

          saveLocalPaymentConfig(merged);
          onData(merged, true);
        } else {
          const initial = getLocalPaymentConfig();
          setDoc(configDocRef, initial, { merge: true }).catch(err => {
            console.warn('Could not bootstrap initial Firestore payment config:', err);
          });
          onData(initial, true);
        }
      },
      (error) => {
        console.warn('Firestore paymentConfig subscription error, using local storage:', error.message);
        onData(getLocalPaymentConfig(), false);
      }
    );

    const unsubscribeSys = onSnapshot(
      sysDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && (data.btc || data.usdt || data.eth)) {
            const current = getLocalPaymentConfig();
            const updatedWallets = {
              btc: data.btc || current.cryptoWallets.btc,
              eth: data.eth || current.cryptoWallets.eth,
              usdt: data.usdt || current.cryptoWallets.usdt,
              usdc: data.usdc || current.cryptoWallets.usdc,
              sol: data.sol || current.cryptoWallets.sol
            };
            const merged = { ...current, cryptoWallets: updatedWallets };
            saveLocalPaymentConfig(merged);
            onData(merged, true);
          }
        }
      },
      () => {}
    );

    return () => {
      unsubscribeConfig();
      unsubscribeSys();
    };
  } catch (error) {
    console.warn('Firestore snapshot setup failed:', error);
    onData(getLocalPaymentConfig(), false);
    return () => {};
  }
}

export async function updateCentralPaymentConfig(config: CentralPaymentConfig): Promise<{ success: boolean; firestoreSynced: boolean; message: string }> {
  const updatedConfig = {
    ...config,
    // Admin must explicitly choose a positive limit if automatic approval is ever enabled.
    autoApproveLimit: Math.max(0, Number(config.autoApproveLimit || 0)),
    requireKycForDeposit: config.requireKycForDeposit ?? true,
    updatedAt: Date.now()
  };

  saveLocalPaymentConfig(updatedConfig);

  let firestoreSynced = false;
  try {
    const configDocRef = doc(db, 'config', 'paymentConfig');
    await setDoc(configDocRef, updatedConfig, { merge: true });

    if (config.cryptoWallets) {
      const sysDocRef = doc(db, 'system_config', 'wallets');
      await setDoc(sysDocRef, { ...config.cryptoWallets, updatedAt: Date.now() }, { merge: true });
    }

    firestoreSynced = true;
  } catch (err: any) {
    console.warn('Firestore write warning:', err?.message || err);
  }

  return {
    success: true,
    firestoreSynced,
    message: firestoreSynced
      ? 'Payment configuration updated & synchronized to Firestore central documents (/config/paymentConfig & /system_config/wallets)!'
      : 'Payment configuration saved locally (Firestore offline/sync fallback active).'
  };
}
