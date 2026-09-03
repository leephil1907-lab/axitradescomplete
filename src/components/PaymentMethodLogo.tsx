import React from 'react';

export type PaymentBrand = 'bank' | 'instant' | 'paypal' | 'skrill' | 'neteller' | 'crypto' | 'card';

export function PaymentMethodLogo({ brand, size = 'md' }: { brand: PaymentBrand; size?: 'sm' | 'md' | 'lg' }) {
  const px = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;
  const common = { width: px, height: px, viewBox: '0 0 48 48', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };
  if (brand === 'paypal') return <svg {...common} aria-label="PayPal logo" role="img"><circle cx="24" cy="24" r="23" fill="#fff" stroke="#D7DEE8"/><path d="M17.5 34.5 21 13h8.2c5 0 7.6 2.5 6.8 6.5-.8 4.2-3.7 6.2-8.3 6.2h-3.1l-1.5 8.8h-5.6Z" fill="#003087"/><path d="m22 31.5 1.4-8.1h4.2c4.4 0 7.2-1.9 8-5.3.1.4.1.8 0 1.4-.8 4.2-3.7 6.2-8.3 6.2h-3.1l-1 5.8H22Z" fill="#009CDE"/></svg>;
  if (brand === 'skrill') return <svg {...common} aria-label="Skrill logo" role="img"><circle cx="24" cy="24" r="23" fill="#862165" stroke="#D7DEE8"/><path d="M15 12h6v10.4l7.7-10.4h7.1l-8.7 11.2L36 36h-7.4l-7.6-10.5V36h-6V12Z" fill="#fff"/><circle cx="32.7" cy="29.9" r="2.3" fill="#fff"/></svg>;
  if (brand === 'neteller') return <svg {...common} aria-label="Neteller logo" role="img"><circle cx="24" cy="24" r="23" fill="#8CC63F" stroke="#D7DEE8"/><path d="M13 34V14h5.2l11.6 11.2V14H35v20h-5.1L18.3 22.7V34H13Z" fill="#fff"/><path d="M18 14h12v4H18z" fill="#1B1B1B" opacity=".18"/></svg>;
  if (brand === 'card') return <svg {...common} aria-label="Card payment logo" role="img"><rect x="5" y="9" width="38" height="30" rx="6" fill="#fff" stroke="#CBD5E1" strokeWidth="2"/><rect x="5" y="15" width="38" height="6" fill="#0F172A"/><rect x="11" y="28" width="10" height="5" rx="1.5" fill="#CBD5E1"/><path d="M27 28h9M27 33h6" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (brand === 'crypto') return <svg {...common} aria-label="Cryptocurrency logo" role="img"><circle cx="24" cy="24" r="23" fill="#F59E0B" stroke="#D7DEE8"/><path d="M28.5 12.5c4.5.9 7.1 3.3 6.5 6.8-.4 2.3-1.8 3.8-4 4.6 2.5 1.1 3.6 3.1 3.1 5.6-.7 3.8-4.1 5.7-9 5.8h-1.2l-.9 3.7h-3.2l.9-3.8h-2.5l-.9 3.8h-3.2l1-4.2h-3l.8-3.3h2.8l3.8-15.1h-2.8l.8-3.3h3l1-4h3.2l-1 4h2.4l1-4h3.2l-1 4h1.2Zm-8.1 4.3-1.1 4.5h4.1c2.1 0 3.3-.9 3.6-2.4.3-1.4-.7-2.1-2.7-2.1h-3.9Zm-2.1 7.8-1.1 4.5h4.8c2.2 0 3.5-.9 3.8-2.5.3-1.5-.8-2-2.9-2h-4.6Z" fill="#fff"/></svg>;
  if (brand === 'instant') return <svg {...common} aria-label="Instant transfer logo" role="img"><circle cx="24" cy="24" r="23" fill="#0F766E" stroke="#D7DEE8"/><path d="M27 8 13 25h9l-2 15 15-19h-9l1-13Z" fill="#fff"/></svg>;
  return <svg {...common} aria-label="Bank transfer logo" role="img"><rect x="5" y="9" width="38" height="30" rx="6" fill="#fff" stroke="#D7DEE8"/><path d="m10 19 14-8 14 8v3H10v-3Zm4 5h4v9h-4v-9Zm8 0h4v9h-4v-9Zm8 0h4v9h-4v-9ZM10 36h28v-3H10v3Z" fill="#334155"/></svg>;
}

export default PaymentMethodLogo;
