import React, { useState } from 'react';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ViewType } from '../types';
import { auth } from '../firebase';
import AxiLogo from './AxiLogo';

interface LoginViewProps {
  setView: (view: ViewType) => void;
  login: () => Promise<any>;
  loginWithFacebook?: () => Promise<any>;
  loginWithEmail?: (email: string, pass: string) => Promise<any>;
  openSignUp: () => void;
  openForgotPassword?: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M21.35 12.22c0-.68-.06-1.34-.18-1.97H12v3.73h5.23a4.47 4.47 0 0 1-1.94 2.93v2.44h3.14c1.84-1.69 2.92-4.18 2.92-7.13Z" />
      <path fill="#34A853" d="M12 21.7c2.63 0 4.84-.87 6.45-2.35l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.75 9.75 0 0 0 12 21.7Z" />
      <path fill="#FBBC05" d="M6.54 13.8A5.86 5.86 0 0 1 6.23 12c0-.63.11-1.24.31-1.8V7.68H3.3A9.76 9.76 0 0 0 2.25 12c0 1.57.38 3.06 1.05 4.32l3.24-2.52Z" />
      <path fill="#EA4335" d="M12 6.17c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.83 3.27 14.63 2.3 12 2.3a9.75 9.75 0 0 0-8.7 5.38l3.24 2.52C7.31 7.89 9.46 6.17 12 6.17Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0">
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.86v-8.4H7.08V12h3.04V9.36c0-3 1.79-4.66 4.52-4.66 1.31 0 2.68.23 2.68.23v2.95h-1.51c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.46h-2.8v8.4A12 12 0 0 0 24 12Z" />
      <path fill="#fff" d="M13.65 15.46h2.8l.53-3.46h-3.33V9.76c0-.95.47-1.88 1.96-1.88h1.51V4.93s-1.37-.23-2.68-.23c-2.73 0-4.52 1.66-4.52 4.66V12H7.08v3.46h3.04v8.4c.61.1 1.24.14 1.88.14s1.27-.05 1.88-.14v-8.4Z" />
    </svg>
  );
}

export default function LoginView({
  setView,
  login,
  loginWithFacebook,
  loginWithEmail,
  openSignUp,
  openForgotPassword,
  showToast
}: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showError = (message: string) => {
    setError(message);
    showToast?.(message, 'error');
  };

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return showError('Please enter a valid email address.');
    if (password.length < 6) return showError('Password must be at least 6 characters.');

    setBusy(true);
    try {
      if (loginWithEmail) await loginWithEmail(normalizedEmail, password);
      else throw new Error('Email authentication is not configured.');
      if (rememberMe) localStorage.setItem('axi_remembered_email', normalizedEmail);
      else localStorage.removeItem('axi_remembered_email');
      setSuccess('Authentication successful. Opening your secure trading account…');
      showToast?.('Logged in successfully.', 'success');
      setView('dashboard');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') showError('No account exists for this email. Please use Sign up.');
      else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') showError('Invalid email or password.');
      else if (code === 'auth/too-many-requests') showError('Too many failed attempts. Please wait and try again.');
      else showError((err?.message || 'Unable to authenticate. Please try again.').replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  };

  const handleProviderLogin = async (provider: 'google' | 'facebook') => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      if (provider === 'google') await login();
      else if (loginWithFacebook) await loginWithFacebook();
      else throw new Error('Facebook authentication is not configured.');
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Authentication completed without an active session.');
      setSuccess('Authentication successful. Opening your secure trading account…');
      showToast?.('Authentication successful.', 'success');
      setView('dashboard');
    } catch (err: any) {
      showError((err?.message || `${provider} authentication failed.`).replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[90vh] bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="px-7 pt-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <AxiLogo size="lg" variant="red" aria-label="Axi" />
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">Secure access</span>
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Sign in to Axi Trades</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use your registered account credentials.</p>
          </div>
        </div>

        <div className="px-7 pb-7">
          {error && <div className="mb-4 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
          {success && <div className="mb-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0" />{success}</div>}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Email address</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" required className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3.5 text-sm text-slate-900 outline-none transition focus:border-[#E3000F] focus:ring-2 focus:ring-[#E3000F]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3.5 pr-11 text-sm text-slate-900 outline-none transition focus:border-[#E3000F] focus:ring-2 focus:ring-[#E3000F]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-800 dark:hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex cursor-pointer items-center gap-2 text-slate-600 dark:text-slate-400"><input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#E3000F] focus:ring-[#E3000F]" /> Remember this email</label>
              {openForgotPassword && <button type="button" onClick={openForgotPassword} className="font-black text-[#E3000F] hover:underline">Forgot password?</button>}
            </div>

            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E3000F] py-3.5 text-sm font-black text-white shadow-lg shadow-red-500/10 transition hover:bg-[#c9000d] disabled:cursor-not-allowed disabled:opacity-60"><Lock className="h-4 w-4" />{busy ? 'Authenticating…' : 'Sign in securely'}</button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />or<span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /></div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" disabled={busy} onClick={() => void handleProviderLogin('google')} className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-xs font-black text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-750"><GoogleIcon /><span>Google</span></button>
            <button type="button" disabled={busy} onClick={() => void handleProviderLogin('facebook')} className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-xs font-black text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-750"><FacebookIcon /><span>Facebook</span></button>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">New to the platform? <button type="button" onClick={openSignUp} className="font-black text-[#E3000F] hover:underline">Create an account</button></div>
          <button type="button" onClick={() => setView('home')} className="mt-4 flex w-full items-center justify-center text-xs font-bold text-slate-500 transition hover:text-slate-800 dark:hover:text-white">Back to public site</button>
        </div>
      </div>
    </div>
  );
}
