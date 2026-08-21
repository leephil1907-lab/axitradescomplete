import { safeStorage } from './storage';

export interface TawkToConfig {
  enabled: boolean;
  propertyId: string;
  widgetId: string;
  directChatUrl: string;
  customScript: string;
  autoOpenOnVisit: boolean;
}

const DEFAULT_TAWKTO_CONFIG: TawkToConfig = {
  enabled: true,
  // User provided Tawk.to credentials
  propertyId: (import.meta.env.VITE_TAWKTO_PROPERTY_ID as string) || '6a877895e687441d49b91140',
  widgetId: (import.meta.env.VITE_TAWKTO_WIDGET_ID as string) || 'default',
  directChatUrl: (import.meta.env.VITE_TAWKTO_DIRECT_URL as string) || 'https://tawk.to/chat/6a877895e687441d49b91140/default',
  customScript: `<!--Start of Tawk.to Script-->
<script type="text/javascript">
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/6a877895e687441d49b91140/default';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
</script>
<!--End of Tawk.to Script-->`,
  autoOpenOnVisit: false,
};

export const getTawkToConfig = (): TawkToConfig => {
  try {
    const saved = safeStorage.getItem('axi_tawkto_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...DEFAULT_TAWKTO_CONFIG, 
        ...parsed,
        autoOpenOnVisit: false // Keep widget compact and minimal on page load
      };
    }
  } catch (e) {
    console.warn('Failed to parse saved Tawk.to config:', e);
  }
  return {
    ...DEFAULT_TAWKTO_CONFIG,
    autoOpenOnVisit: false
  };
};

export const saveTawkToConfig = (updates: Partial<TawkToConfig>): TawkToConfig => {
  const current = getTawkToConfig();
  const updated = { ...current, ...updates };
  
  // Clean propertyId if user pasted full script or URL
  if (updated.propertyId) {
    let cleanProp = updated.propertyId.trim();
    if (cleanProp.includes('embed.tawk.to/')) {
      const parts = cleanProp.split('embed.tawk.to/')[1].split('/');
      if (parts[0]) updated.propertyId = parts[0];
      if (parts[1]) updated.widgetId = parts[1].replace(/['";>]/g, '');
    } else if (cleanProp.includes('tawk.to/chat/')) {
      const parts = cleanProp.split('tawk.to/chat/')[1].split('/');
      if (parts[0]) updated.propertyId = parts[0];
      if (parts[1]) updated.widgetId = parts[1].replace(/['";>]/g, '');
    }
  }

  safeStorage.setItem('axi_tawkto_config', JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('axi_tawkto_config_updated', { detail: updated }));
  return updated;
};

// Script loader state & deferred execution tracking
let isScriptLoading = false;
let isScriptLoaded = false;
let deferredTimeoutId: any = null;
let interactionListenersAttached = false;

export const loadTawkToScript = (config: TawkToConfig, immediate = false) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (!config.enabled || !config.propertyId) {
    if ((window as any).Tawk_API && typeof (window as any).Tawk_API.hideWidget === 'function') {
      try { (window as any).Tawk_API.hideWidget(); } catch (e) {}
    }
    return;
  }

  const propId = config.propertyId.trim();
  const widgetId = config.widgetId ? config.widgetId.trim() : 'default';
  const scriptSrc = `https://embed.tawk.to/${propId}/${widgetId}`;

  // Check if this script is already present and loaded
  const existingScript = document.getElementById('tawkto-script') as HTMLScriptElement | null;
  if (existingScript) {
    if (existingScript.src === scriptSrc) {
      isScriptLoaded = true;
      return; // Already attached with correct ID
    }
    existingScript.remove();
    isScriptLoaded = false;
  }

  const executeLoad = () => {
    if (isScriptLoaded || document.getElementById('tawkto-script')) return;
    isScriptLoading = true;

    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = (window as any).Tawk_LoadStart || new Date();

    // Configure callbacks & direct event listeners for real-time notifications
    (window as any).Tawk_API.onLoad = function () {
      isScriptLoading = false;
      isScriptLoaded = true;
      if (config.autoOpenOnVisit) {
        try {
          (window as any).Tawk_API.maximize?.();
        } catch (e) {}
      }
    };

    (window as any).Tawk_API.onStatusChange = function (status: string) {
      // Safely monitor agent availability without throwing uncaught exceptions
    };

    (window as any).Tawk_API.onChatMessageVisitor = function (message: any) {
      try {
        const msgText = typeof message === 'string' ? message : message?.text || 'Visitor sent a message';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        safeStorage.setItem('axi_tawk_latest_visitor_msg', JSON.stringify({ text: msgText, time, timestamp: Date.now() }));
        window.dispatchEvent(new CustomEvent('axi_tawk_visitor_message', { detail: { text: msgText, time } }));
      } catch (e) {}
    };

    (window as any).Tawk_API.onChatMessageAgent = function (message: any) {
      try {
        const msgText = typeof message === 'string' ? message : message?.text || 'Agent reply';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        safeStorage.setItem('axi_tawk_latest_agent_msg', JSON.stringify({ text: msgText, time, timestamp: Date.now() }));
        window.dispatchEvent(new CustomEvent('axi_tawk_agent_message', { detail: { text: msgText, time } }));
      } catch (e) {}
    };

    const s1 = document.createElement('script');
    s1.id = 'tawkto-script';
    s1.async = true;
    s1.src = scriptSrc;
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');

    // Handle network or embed errors without breaking the host application
    s1.onerror = function () {
      isScriptLoading = false;
      isScriptLoaded = false;
      console.info('[Tawk.to] Live chat script is unavailable or blocked by network/adblocker.');
    };

    const s0 = document.getElementsByTagName('script')[0];
    if (s0 && s0.parentNode) {
      s0.parentNode.insertBefore(s1, s0);
    } else {
      document.head.appendChild(s1);
    }
  };

  // Immediate loading requested (e.g. user clicked live chat button or admin update)
  if (immediate) {
    if (deferredTimeoutId) {
      clearTimeout(deferredTimeoutId);
      deferredTimeoutId = null;
    }
    executeLoad();
    return;
  }

  // Deferred loading strategy: Wait for page load and idle phase to prioritize FCP/LCP
  const scheduleDeferredLoad = () => {
    if (deferredTimeoutId) clearTimeout(deferredTimeoutId);

    const triggerIdleLoad = () => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => executeLoad(), { timeout: 3000 });
      } else {
        setTimeout(executeLoad, 1200);
      }
    };

    // Trigger after a 2-second buffer past initial page render
    deferredTimeoutId = setTimeout(triggerIdleLoad, 2000);

    // Also trigger on first passive user interaction if it occurs before timeout
    if (!interactionListenersAttached) {
      interactionListenersAttached = true;
      const onUserInteraction = () => {
        ['click', 'touchstart', 'keydown', 'scroll'].forEach((event) => {
          window.removeEventListener(event, onUserInteraction);
        });
        if (deferredTimeoutId) {
          clearTimeout(deferredTimeoutId);
          deferredTimeoutId = null;
        }
        triggerIdleLoad();
      };

      ['click', 'touchstart', 'keydown', 'scroll'].forEach((event) => {
        window.addEventListener(event, onUserInteraction, { once: true, passive: true });
      });
    }
  };

  if (document.readyState === 'complete') {
    scheduleDeferredLoad();
  } else {
    window.addEventListener('load', scheduleDeferredLoad, { once: true });
  }
};

export const openTawkToChat = () => {
  if (typeof window === 'undefined') return false;

  const config = getTawkToConfig();
  const tawkAPI = (window as any).Tawk_API;

  if (tawkAPI && typeof tawkAPI.maximize === 'function') {
    try {
      tawkAPI.showWidget?.();
      tawkAPI.maximize();
      return true;
    } catch (e) {
      console.warn('[Tawk.to] Error calling maximize():', e);
    }
  }

  // If script not loaded yet, immediately load with priority
  if (!isScriptLoaded && !isScriptLoading) {
    loadTawkToScript(config, true);
  }

  // Fallback to direct chat URL if available
  if (config.directChatUrl) {
    window.open(config.directChatUrl, 'TawkToChat', 'width=450,height=650,toolbar=no,menubar=no');
    return true;
  } else if (config.propertyId) {
    const directUrl = `https://tawk.to/chat/${config.propertyId}/${config.widgetId || 'default'}`;
    window.open(directUrl, 'TawkToChat', 'width=450,height=650,toolbar=no,menubar=no');
    return true;
  }

  return false;
};

export const setTawkToVisitorAttributes = (attributes: {
  name?: string;
  email?: string;
  accountNo?: string;
  balance?: number | string;
  accountType?: string;
  status?: string;
}) => {
  if (typeof window === 'undefined') return;
  const tawkAPI = (window as any).Tawk_API;
  if (!tawkAPI) return;

  try {
    if (typeof tawkAPI.setAttributes === 'function') {
      tawkAPI.setAttributes({
        name: attributes.name || 'Axi Trader',
        email: attributes.email || '',
        accountNo: attributes.accountNo || '',
        balance: attributes.balance !== undefined ? `$${attributes.balance}` : '',
        accountType: attributes.accountType || 'Pro ECN',
        verificationStatus: attributes.status || 'Verified'
      }, function (error: any) {
        if (error) console.warn('[Tawk.to] setAttributes error:', error);
      });
    }

    if (attributes.name && typeof tawkAPI.visitor === 'object') {
      tawkAPI.visitor = {
        name: attributes.name,
        email: attributes.email || ''
      };
    }
  } catch (e) {
    console.warn('[Tawk.to] Error setting visitor attributes:', e);
  }
};
