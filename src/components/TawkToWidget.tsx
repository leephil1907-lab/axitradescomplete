import React, { useEffect, useState } from 'react';
import { getTawkToConfig, loadTawkToScript, setTawkToVisitorAttributes, TawkToConfig } from '../utils/tawkto';

interface TawkToWidgetProps {
  currentUser?: {
    name?: string;
    email?: string;
    accountNo?: string;
    balance?: number | string;
    accountType?: string;
    status?: string;
  } | null;
}

export default function TawkToWidget({ currentUser }: TawkToWidgetProps) {
  const [config, setConfig] = useState<TawkToConfig>(() => getTawkToConfig());

  // Listen for config changes from Admin Dashboard
  useEffect(() => {
    const handleConfigUpdate = (e: any) => {
      const updatedConfig = e.detail || getTawkToConfig();
      setConfig(updatedConfig);
      loadTawkToScript(updatedConfig, true);
    };

    window.addEventListener('axi_tawkto_config_updated', handleConfigUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'axi_tawkto_config') {
        const updated = getTawkToConfig();
        setConfig(updated);
        loadTawkToScript(updated, true);
      }
    });

    // Initial load uses deferred idle strategy
    loadTawkToScript(config, false);

    return () => {
      window.removeEventListener('axi_tawkto_config_updated', handleConfigUpdate);
    };
  }, []);

  // Update visitor attributes when user changes
  useEffect(() => {
    if (currentUser) {
      setTawkToVisitorAttributes({
        name: currentUser.name,
        email: currentUser.email,
        accountNo: currentUser.accountNo,
        balance: currentUser.balance,
        accountType: currentUser.accountType,
        status: currentUser.status
      });
    }
  }, [currentUser, config]);

  return null; // Tawk.to mounts its own DOM element
}
