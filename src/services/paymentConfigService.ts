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

export const defaultCryptoWallets: Record<string, CryptoWalletConfig> = {
  usdc: { address: '0x12107F3eB874442301756daFBd3360418ae3C366', network: 'Ethereum ERC20', active: true },
  btc: { address: 'bc1qndch4p2dm8hdv4e4t0zm7jaf7ajasnjum25dhu', network: 'Bitcoin', active: true },
  usdt: { address: 'TBcivkHbpBh3fa14pPwYemqtNzg7bDQJZ4', network: 'TRON TRC20', active: true },
  sol: { address: '7ds3cKbJNVXTLcsUea6qj1WsisdqRuqBTYENYi9vsd7F', network: 'Solana', active: true },
  bnb: { address: '0x12107F3eB874442301756daFBd3360418ae3C366', network: 'BNB Smart Chain', active: true },
  eth: { address: '0x12107F3eB874442301756daFBd3360418ae3C366', network: 'Ethereum', active: true },
  xrp: { address: 'rwyQp3eC5j6AumcptZhfmiXAykpeswZKeJ', network: 'XRP Ledger', memo: '1476340', active: true }
};

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

export const defaultPaymentMethods: PaymentMethodItem[] = [
  {
    id: 'card',
    name: 'Card Payment',
    type: 'card',
    currency: 'USD',
    active: true,
    minDeposit: 10,
    maxDeposit: 100000,
    feePercent: 0,
    processingTime: 'Stripe confirmation',
    instructions: 'Secure card payment processed by Stripe. Payment confirmation is required before the deposit can be reviewed by the platform.',
    iconName: 'card'
  },
  {
    id: 'crypto',
    name: 'Crypto Wallet',
    type: 'crypto',
    currency: 'USDC / BTC / USDT / ETH / BNB / SOL / XRP',
    active: true,
    minDeposit: 10,
    maxDeposit: 1000000,
    feePercent: 0,
    processingTime: 'Blockchain confirmation',
    instructions: 'Select a supported cryptocurrency, copy the displayed receiving wallet address, and send the payment from your external wallet or exchange.',
    iconName: 'crypto'
  },
  {
    id: 'skrill',
    name: 'Skrill',
    type: 'wallet',
    currency: 'USD',
    active: false,
    minDeposit: 10,
    maxDeposit: 100000,
    feePercent: 0,
    processingTime: 'Provider confirmation',
    instructions: 'Enable after the live Skrill receiving account/merchant configuration has been supplied.',
    iconName: 'skrill'
  },
  {
    id: 'neteller',
    name: 'Neteller',
    type: 'wallet',
    currency: 'USD',
    active: false,
    minDeposit: 10,
    maxDeposit: 100000,
    feePercent: 0,
    processingTime: 'Provider confirmation',
    instructions: 'Enable after the live Neteller receiving account/merchant configuration has been supplied.',
    iconName: 'neteller'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    type: 'wallet',
    currency: 'USD',
    active: false,
    minDeposit: 10,
    maxDeposit: 100000,
    feePercent: 0,
    processingTime: 'Provider confirmation',
    instructions: 'Enable after a live PayPal merchant integration and receiving configuration has been supplied.',
    iconName: 'paypal'
  }
];

const cryptoNames: Record<string, string> = {
  btc: 'Bitcoin (BTC)',
  eth: 'Ethereum (ETH)',
  usdt: 'Tether (USDT)',
  usdc: 'USD Coin (USDC)',
  sol: 'Solana (SOL)',
  bnb: 'BNB (BNB)',
  xrp: 'XRP (XRP)'
};

/**
 * Builds the user-facing crypto deposit methods directly from the admin wallet registry.
 * Wallet keys are also used as method IDs so FundsView can resolve the matching wallet.
 * The user flow is copy-only: the address/network/memo are displayed for an external payment.
 */
export function syncCryptoWalletPaymentMethods(
  wallets: Record<string, CryptoWalletConfig>,
  methods: PaymentMethodItem[] = defaultPaymentMethods
): PaymentMethodItem[] {
  const walletKeys = new Set(Object.keys(wallets));
  const configuredMethods = methods.filter(method =>
    !method.id.startsWith('crypto-wallet-') && !walletKeys.has(method.id)
  );

  const walletMethods: PaymentMethodItem[] = Object.entries(wallets)
    .filter(([, wallet]) => Boolean(wallet?.address) && wallet.active !== false)
    .map(([key, wallet]) => {
      const existing = methods.find(method =>
        method.id === key ||
        method.id === `crypto-wallet-${key}` ||
        (method.type === 'crypto' && method.currency?.toLowerCase() === key.toLowerCase())
      );

      return {
        ...existing,
        id: key,
        name: existing?.name || cryptoNames[key] || `${key.toUpperCase()} Crypto`,
        type: 'crypto' as const,
        currency: existing?.currency || key.toUpperCase(),
        active: true,
        minDeposit: existing?.minDeposit ?? 10,
        maxDeposit: existing?.maxDeposit ?? 1000000,
        feePercent: existing?.feePercent ?? 0,
        processingTime: existing?.processingTime || 'Blockchain confirmation',
        walletAddress: wallet.address,
        network: wallet.network,
        memo: wallet.memo,
        instructions: existing?.instructions || `Copy this ${key.toUpperCase()} wallet address and send the payment from your external wallet or exchange. Send only ${key.toUpperCase()} on the ${wallet.network} network.`,
        iconName: existing?.iconName || key
      };
    });

  return [...configuredMethods, ...walletMethods];
}

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
      const cryptoWallets = { ...defaultCryptoWallets, ...(parsed.cryptoWallets || {}) };
      const paymentMethods = syncCryptoWalletPaymentMethods(cryptoWallets, parsed.paymentMethods || defaultPaymentMethods);
      return {
        updatedAt: parsed.updatedAt || Date.now(),
        cryptoWallets,
        bankSettings: sanitizeBank(parsed.bankSettings),
        paymentMethods,
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
    const paymentMethods = syncCryptoWalletPaymentMethods(
      cryptoWallets,
      savedMethods ? JSON.parse(savedMethods) : defaultPaymentMethods
    );

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
      paymentMethods: syncCryptoWalletPaymentMethods(defaultCryptoWallets, defaultPaymentMethods),
      autoApproveLimit: 0,
      requireKycForDeposit: true,
      maintenanceMode: defaultMaintenanceMode
    };
  }
}

export function saveLocalPaymentConfig(config: CentralPaymentConfig) {
  try {
    const normalizedConfig = {
      ...config,
      paymentMethods: syncCryptoWalletPaymentMethods(config.cryptoWallets || {}, config.paymentMethods || [])
    };
    safeStorage.setItem('axi_payment_config', JSON.stringify(normalizedConfig));
    safeStorage.setItem('axi_admin_wallet_settings', JSON.stringify(normalizedConfig.cryptoWallets));
    safeStorage.setItem('axi_admin_bank_settings', JSON.stringify(normalizedConfig.bankSettings));
    safeStorage.setItem('axi_payment_methods', JSON.stringify(normalizedConfig.paymentMethods));
    window.dispatchEvent(new Event('axi_payment_config_updated'));
    window.dispatchEvent(new Event('axi_admin_wallet_settings_updated'));
    window.dispatchEvent(new Event('axi_payment_methods_updated'));
  } catch (err) {
    console.error('Failed to save local payment config:', err);
  }
}

export function subscribeSystemConfigWallets(onData: (wallets: Record<string, CryptoWalletConfig>, isLive: boolean) => void): () => void {
  const initial = getLocalPaymentConfig().cryptoWallets;
  onData(initial, false);
  try {
    const sysDocRef = doc(db, 'system_config', 'wallets');
    const unsubscribe = onSnapshot(sysDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const current = getLocalPaymentConfig().cryptoWallets;
        const wallets: Record<string, CryptoWalletConfig> = {
          ...current,
          ...Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'updatedAt'))
        };
        const currentConfig = getLocalPaymentConfig();
        const updatedConfig = {
          ...currentConfig,
          cryptoWallets: wallets,
          paymentMethods: syncCryptoWalletPaymentMethods(wallets, currentConfig.paymentMethods)
        };
        saveLocalPaymentConfig(updatedConfig);
        onData(wallets, true);
      } else {
        const current = getLocalPaymentConfig().cryptoWallets;
        setDoc(sysDocRef, { ...current, updatedAt: Date.now() }, { merge: true }).catch(() => {});
        onData(current, true);
      }
    }, (err) => {
      console.warn('system_config/wallets subscription warning:', err.message);
      onData(getLocalPaymentConfig().cryptoWallets, false);
    });
    return () => unsubscribe();
  } catch (err) {
    console.warn('system_config setup failed:', err);
    onData(getLocalPaymentConfig().cryptoWallets, false);
    return () => {};
  }
}

export async function updateSystemConfigWallets(wallets: Record<string, CryptoWalletConfig>): Promise<{ success: boolean; firestoreSynced: boolean; message: string }> {
  const currentConfig = getLocalPaymentConfig();
  const syncedMethods = syncCryptoWalletPaymentMethods(wallets, currentConfig.paymentMethods);
  const updatedConfig: CentralPaymentConfig = {
    ...currentConfig,
    cryptoWallets: wallets,
    paymentMethods: syncedMethods,
    updatedAt: Date.now()
  };
  saveLocalPaymentConfig(updatedConfig);
  let firestoreSynced = false;
  try {
    const sysDocRef = doc(db, 'system_config', 'wallets');
    await setDoc(sysDocRef, { ...wallets, updatedAt: Date.now() }, { merge: true });
    const configDocRef = doc(db, 'config', 'paymentConfig');
    await setDoc(configDocRef, {
      cryptoWallets: wallets,
      paymentMethods: syncedMethods,
      updatedAt: Date.now()
    }, { merge: true });
    firestoreSynced = true;
  } catch (err: any) {
    console.warn('Firestore system_config/wallets write warning:', err?.message || err);
  }
  return {
    success: true,
    firestoreSynced,
    message: firestoreSynced
      ? 'Crypto wallets saved and synchronized as active deposit payment methods in Firestore.'
      : 'Crypto wallets saved locally; payment methods were synchronized and Firestore sync fallback remains active.'
  };
}

export function subscribePaymentConfig(onData: (config: CentralPaymentConfig, isLiveFirestore: boolean) => void): () => void {
  const initialLocal = getLocalPaymentConfig();
  onData(initialLocal, false);
  try {
    const configDocRef = doc(db, 'config', 'paymentConfig');
    const sysDocRef = doc(db, 'system_config', 'wallets');
    const unsubscribeConfig = onSnapshot(configDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<CentralPaymentConfig>;
        const cryptoWallets = { ...defaultCryptoWallets, ...(data.cryptoWallets || {}) };
        const baseMethods = data.paymentMethods && data.paymentMethods.length > 0 ? data.paymentMethods : defaultPaymentMethods;
        const merged: CentralPaymentConfig = {
          updatedAt: data.updatedAt || Date.now(),
          cryptoWallets,
          bankSettings: { ...defaultBankSettings, ...(data.bankSettings || {}) },
          paymentMethods: syncCryptoWalletPaymentMethods(cryptoWallets, baseMethods),
          autoApproveLimit: 0,
          requireKycForDeposit: data.requireKycForDeposit ?? true,
          maintenanceMode: { ...defaultMaintenanceMode, ...(data.maintenanceMode || {}) }
        };
        saveLocalPaymentConfig(merged);
        onData(merged, true);
      } else {
        const initial = getLocalPaymentConfig();
        setDoc(configDocRef, initial, { merge: true }).catch(err => console.warn('Could not bootstrap initial Firestore payment config:', err));
        onData(initial, true);
      }
    }, (error) => {
      console.warn('Firestore paymentConfig subscription error, using local storage:', error.message);
      onData(getLocalPaymentConfig(), false);
    });
    const unsubscribeSys = onSnapshot(sysDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const walletEntries = Object.entries(data || {}).filter(([key, value]) => key !== 'updatedAt' && value && typeof value === 'object');
        if (walletEntries.length > 0) {
          const current = getLocalPaymentConfig();
          const updatedWallets = {
            ...current.cryptoWallets,
            ...Object.fromEntries(walletEntries)
          } as Record<string, CryptoWalletConfig>;
          const merged = {
            ...current,
            cryptoWallets: updatedWallets,
            paymentMethods: syncCryptoWalletPaymentMethods(updatedWallets, current.paymentMethods),
            updatedAt: Date.now()
          };
          saveLocalPaymentConfig(merged);
          onData(merged, true);
        }
      }
    }, () => {});
    return () => { unsubscribeConfig(); unsubscribeSys(); };
  } catch (error) {
    console.warn('Firestore snapshot setup failed:', error);
    onData(getLocalPaymentConfig(), false);
    return () => {};
  }
}

export async function updateCentralPaymentConfig(config: CentralPaymentConfig): Promise<{ success: boolean; firestoreSynced: boolean; message: string }> {
  const normalizedConfig: CentralPaymentConfig = {
    ...config,
    paymentMethods: syncCryptoWalletPaymentMethods(config.cryptoWallets || {}, config.paymentMethods || []),
    autoApproveLimit: Math.max(0, Number(config.autoApproveLimit || 0)),
    requireKycForDeposit: config.requireKycForDeposit ?? true,
    updatedAt: Date.now()
  };
  saveLocalPaymentConfig(normalizedConfig);
  let firestoreSynced = false;
  try {
    const configDocRef = doc(db, 'config', 'paymentConfig');
    await setDoc(configDocRef, normalizedConfig, { merge: true });
    if (normalizedConfig.cryptoWallets) {
      const sysDocRef = doc(db, 'system_config', 'wallets');
      await setDoc(sysDocRef, { ...normalizedConfig.cryptoWallets, updatedAt: Date.now() }, { merge: true });
    }
    firestoreSynced = true;
  } catch (err: any) {
    console.warn('Firestore write warning:', err?.message || err);
  }
  return {
    success: true,
    firestoreSynced,
    message: firestoreSynced
      ? 'Payment configuration updated and crypto wallets synchronized with active deposit methods.'
      : 'Payment configuration saved locally; Firestore offline/sync fallback active.'
  };
}
