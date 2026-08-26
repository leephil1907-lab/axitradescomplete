import { useState, useEffect } from 'react';
import { safeStorage } from '../utils/storage';

const DEFAULT_CMS = {
  home: {
    heroTitle: "Trade Your Edge",
    heroSubtitle: "Global Online CFD & Forex Broker. Experience high-speed execution and precision.",
    ctaText: "OPEN A LIVE ACCOUNT",
    partnershipTitle: "A winning partnership",
    partnershipSubtitle: "We're proud to be Official Online Trading Partner of Manchester City Football Club.",
    preFooterTitle: "Ready to trade your edge?",
    preFooterSubtitle: "Join thousands of traders choosing Axi."
  },
  brand: {
    contactEmail: "service@axi.com",
    contactPhone: "+44 203 154 4820",
    companyName: "Axi Financial Services",
    footerText: "Trading CFDs and FX carries a high level of risk."
  },
  deposit: {
    minimumDeposit: "50",
    processingTime: "Instant - 24 hours"
  },
  about: {
    title: "About Axi Group",
    subtitle: "Axi is a leading global broker authorized in multiple tier-1 jurisdictions. We prioritize client safety, raw spreads, and lightning-fast NY4 server routing."
  }
};

export const useSiteCMS = () => {
  const [cmsContent, setCmsContent] = useState(() => {
    const saved = safeStorage.getItem('axi_site_cms');
    if (saved) {
      try { return { ...DEFAULT_CMS, ...JSON.parse(saved) }; } catch (e) {}
    }
    return DEFAULT_CMS;
  });

  const updateCMS = (section: string, key: string, value: string) => {
    const updated = {
      ...cmsContent,
      [section]: {
        ...(cmsContent as any)[section],
        [key]: value
      }
    };
    setCmsContent(updated);
    safeStorage.setItem('axi_site_cms', JSON.stringify(updated));
    window.dispatchEvent(new Event('axi_cms_updated'));
  };

  useEffect(() => {
    const handleUpdate = () => {
      const saved = safeStorage.getItem('axi_site_cms');
      if (saved) {
        try { setCmsContent({ ...DEFAULT_CMS, ...JSON.parse(saved) }); } catch (e) {}
      }
    };
    window.addEventListener('axi_cms_updated', handleUpdate);
    return () => window.removeEventListener('axi_cms_updated', handleUpdate);
  }, []);

  return { cmsContent, updateCMS };
};
