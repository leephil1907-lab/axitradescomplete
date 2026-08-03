import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
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

export const defaultCryptoWallets: Record<string, CryptoWalletConfig> = {
  btc: {
    address: 'bc1qndch4p2dm8hdv4e4t0zm7jaf7ajasnjum25dhu',
    network: 'Bitcoin Mainnet',
    memo: '',
    active: true
  },
  usdt: {
    address: 'TBcivkHbpBh3fa14pPwYemqtNzg7bDQJZ4',
    network: 'TRON (TRC20)',
    memo: '',
    active: true
  },
  eth: {
    address: '0x12107F3eB874442301756daFBd3360418ae3C366',
    network: 'Ethereum (ERC20)',
    memo: '',
    active: true
  },
  usdc: {
    address: '0x12107F3eB874442301756daFBd3360418ae3C366',
    network: 'Ethereum (ERC20)',
    memo: '',
    active: true
  },
  sol: {
    address: '7ds3cKbJNVXTLcsUea6qj1WsisdqRuqBTYENYi9vsd7F',
    network: 'Solana Mainnet',
    memo: '',
    active: true
  },
  bnb: {
    address: '0x12107F3eB874442301756daFBd3360418ae3C366',
    network: 'BNB Smart Chain (BEP20)',
    memo: '',
    active: true
  },
  xrp: {
    address: 'rwyQp3eC5j6AumcptZhfmiXAykpeswZKeJ',
    network: 'Ripple (XRP) Ledger',
    memo: '1476340',
    active: true
  }
};

export const defaultBankSettings: BankSettingsConfig = {
  bankName: 'Axi Global Clearing Bank',
  accountName: 'Axi Financial Group Ltd',
  accountNumber: '987654321012',
  swiftBic: 'AXIBUS33XXX',
  routingNumber: '021000021',
  bankAddress: '100 Wall Street, Floor 18, New York, NY 10005, USA',
  instructions: 'Please include your Axi Account ID in the wire transfer memo field. Processing time is 1-3 business days.',
  supportEmail: 'axicustomersupport@gmail.com',
  active: true
};

export const defaultPaymentMethods: PaymentMethodItem[] = [
  {
    id: 'pm-card',
    name: 'Credit / Debit Card (Visa, MasterCard)',
    type: 'card',
    currency: 'USD',
    active: true,
    minDeposit: 50,
    maxDeposit: 10000,
    feePercent: 0,
    processingTime: 'Instant',
    instructions: 'Instant card processing with 3D Secure authentication.'
  },
  {
    id: 'pm-btc',
    name: 'Bitcoin (BTC)',
    type: 'crypto',
    currency: 'BTC',
    active: true,
    minDeposit: 100,
    maxDeposit: 500000,
    feePercent: 0,
    processingTime: '10-30 Mins (1 Confirmation)',
    walletAddress: defaultCryptoWallets.btc.address,
    network: defaultCryptoWallets.btc.network
  },
  {
    id: 'pm-usdt',
    name: 'Tether USD (USDT - TRC20)',
    type: 'crypto',
    currency: 'USDT',
    active: true,
    minDeposit: 20,
    maxDeposit: 1000000,
    feePercent: 0,
    processingTime: 'Instant - 2 Mins',
    walletAddress: defaultCryptoWallets.usdt.address,
    network: defaultCryptoWallets.usdt.network
  },
  {
    id: 'pm-eth',
    name: 'Ethereum (ETH)',
    type: 'crypto',
    currency: 'ETH',
    active: true,
    minDeposit: 100,
    maxDeposit: 500000,
    feePercent: 0,
    processingTime: '2-5 Mins',
    walletAddress: defaultCryptoWallets.eth.address,
    network: defaultCryptoWallets.eth.network
  },
  {
    id: 'pm-bank',
    name: 'Bank Wire Transfer (SWIFT / SEPA)',
    type: 'bank',
    currency: 'USD',
    active: true,
    minDeposit: 500,
    maxDeposit: 2500000,
    feePercent: 0,
    processingTime: '1-3 Business Days',
    bankName: defaultBankSettings.bankName,
    accountName: defaultBankSettings.accountName,
    accountNumber: defaultBankSettings.accountNumber,
    swiftBic: defaultBankSettings.swiftBic,
    instructions: defaultBankSettings.instructions
  },
  {
    id: 'pm-paypal',
    name: 'PayPal / Digital Wallet',
    type: 'wallet',
    currency: 'USD',
    active: true,
    minDeposit: 50,
    maxDeposit: 15000,
    feePercent: 1.5,
    processingTime: 'Instant',
    walletIdentifier: 'payments@axi.com',
    instructions: 'Transfer funds to our official PayPal merchant identifier above.'
  }
];

export function getLocalPaymentConfig(): CentralPaymentConfig {
  try {
    const savedConfig = safeStorage.getItem('axi_payment_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      return {
        updatedAt: parsed.updatedAt || Date.now(),
        cryptoWallets: { ...defaultCryptoWallets, ...(parsed.cryptoWallets || {}) },
        bankSettings: { ...defaultBankSettings, ...(parsed.bankSettings || {}) },
        paymentMethods: parsed.paymentMethods || defaultPaymentMethods,
        autoApproveLimit: parsed.autoApproveLimit ?? 5000,
        requireKycForDeposit: parsed.requireKycForDeposit ?? false,
        maintenanceMode: { ...defaultMaintenanceMode, ...(parsed.maintenanceMode || {}) }
      };
    }

    // Check individual items fallback
    const savedWallets = safeStorage.getItem('axi_admin_wallet_settings');
    const savedBank = safeStorage.getItem('axi_admin_bank_settings');
    const savedMethods = safeStorage.getItem('axi_payment_methods');

    const cryptoWallets = savedWallets ? { ...defaultCryptoWallets, ...JSON.parse(savedWallets) } : defaultCryptoWallets;
    const bankSettings = savedBank ? { ...defaultBankSettings, ...JSON.parse(savedBank) } : defaultBankSettings;
    const paymentMethods = savedMethods ? JSON.parse(savedMethods) : defaultPaymentMethods;

    return {
      updatedAt: Date.now(),
      cryptoWallets,
      bankSettings,
      paymentMethods,
      autoApproveLimit: 5000,
      requireKycForDeposit: false,
      maintenanceMode: defaultMaintenanceMode
    };
  } catch (err) {
    console.warn('Error reading local payment config:', err);
    return {
      updatedAt: Date.now(),
      cryptoWallets: defaultCryptoWallets,
      bankSettings: defaultBankSettings,
      paymentMethods: defaultPaymentMethods,
      autoApproveLimit: 5000,
      requireKycForDeposit: false,
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
          
          // Sync with local config
          const currentConfig = getLocalPaymentConfig();
          const updatedConfig = { ...currentConfig, cryptoWallets: wallets };
          saveLocalPaymentConfig(updatedConfig);
          onData(wallets, true);
        } else {
          // Bootstrap system_config/wallets if missing
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
    // 1. Update dedicated system_config/wallets document
    const sysDocRef = doc(db, 'system_config', 'wallets');
    await setDoc(sysDocRef, { ...wallets, updatedAt: Date.now() }, { merge: true });

    // 2. Also sync config/paymentConfig document
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
  // First send immediate local data
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
            paymentMethods: data.paymentMethods && data.paymentMethods.length > 0 
              ? data.paymentMethods 
              : defaultPaymentMethods,
            autoApproveLimit: data.autoApproveLimit ?? 5000,
            requireKycForDeposit: data.requireKycForDeposit ?? false,
            maintenanceMode: { ...defaultMaintenanceMode, ...(data.maintenanceMode || {}) }
          };

          // Cache locally
          saveLocalPaymentConfig(merged);
          onData(merged, true);
        } else {
          // If doc doesn't exist in Firestore yet, push initial defaults to Firestore
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
    updatedAt: Date.now()
  };

  // Always save locally first for instantaneous UI update
  saveLocalPaymentConfig(updatedConfig);

  let firestoreSynced = false;
  try {
    const configDocRef = doc(db, 'config', 'paymentConfig');
    await setDoc(configDocRef, updatedConfig, { merge: true });

    // Also sync dedicated system_config/wallets document
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
