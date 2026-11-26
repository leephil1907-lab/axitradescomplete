import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { COUNTRIES } from '../../data';
import watchlist from '../../assets/axi-reference/watchlist.webp';

export default function OpenAccountDialog({ onClose, onContinue, onLogin }: { onClose: () => void; onContinue: (country: string) => void; onLogin: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [country, setCountry] = useState('');
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { node?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={dialog} className="reference-signup" aria-labelledby="reference-signup-title"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.currentTarget === event.target) onClose(); }}>
    <div className="reference-signup-grid">
      <form onSubmit={event => { event.preventDefault(); if (country) onContinue(country); }}>
        <button type="button" className="reference-signup-close" onClick={onClose} aria-label="Close account dialog"><X size={18} /></button>
        <h2 id="reference-signup-title">Create your <span>account in minutes</span></h2>
        <label htmlFor="reference-country" className="sr-only">Country of residence</label>
        <select id="reference-country" required value={country} onChange={event => setCountry(event.target.value)}>
          <option value="" disabled>Select your country</option>
          {COUNTRIES.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <button type="submit" className="reference-signup-submit">Continue</button>
        <p className="reference-signup-risk">Your capital is at risk.</p>
        <p className="reference-signup-login">Already an Axi client? <button type="button" onClick={onLogin}>Log in here</button></p>
      </form>
      <div className="reference-signup-art" aria-hidden="true"><img src={watchlist} alt="" /></div>
    </div>
  </dialog>;
}
