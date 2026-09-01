import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ViewType } from '../types';
import { auth } from '../firebase';

interface LoginViewProps {
  setView: (view: ViewType) => void;
  login: () => void;
  loginWithFacebook?: () => Promise<any>;
  loginWithEmail?: (email: string, pass: string) => Promise<any>;
  openSignUp: () => void;
  openForgotPassword?: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function LoginView({ setView, login, loginWithFacebook, loginWithEmail, openSignUp, openForgotPassword, showToast }: LoginViewProps) {
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
      else await login();
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
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E3000F] text-white"><ShieldCheck className="h-6 w-6" /></div>
          <div><h1 className="text-xl font-black text-slate-900 dark:text-white">Secure Sign in</h1><p className="text-xs text-slate-500">Use your registered account credentials.</p></div>
        </div>

        {error && <div className="mb-4 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        {success && <div className="mb-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0" />{success}</div>}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div><label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Email address</label><input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" required className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-[#E3000F] dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></div>
          <div><label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Password</label><div className="relative"><input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className="w-full rounded-xl border border-slate-300 px-3 py-3 pr-11 text-sm outline-none focus:border-[#E3000F] dark:border-slate-700 dark:bg-slate-950 dark:text-white" /><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-3 text-slate-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
          <div className="flex items-center justify-between text-xs"><label className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} /> Remember this email</label>{openForgotPassword && <button type="button" onClick={openForgotPassword} className="font-bold text-[#E3000F]">Forgot password?</button>}</div>
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E3000F] py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"><Lock className="h-4 w-4" />{busy ? 'Authenticating…' : 'Sign in securely'}</button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />or<span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /></div>
        <div className="grid grid-cols-2 gap-3"><button type="button" disabled={busy} onClick={() => void handleProviderLogin('google')} className="rounded-xl border border-slate-200 py-2.5 text-xs font-black disabled:opacity-50 dark:border-slate-700 dark:text-white">Continue with Google</button><button type="button" disabled={busy || !loginWithFacebook} onClick={() => void handleProviderLogin('facebook')} className="rounded-xl border border-slate-200 py-2.5 text-xs font-black disabled:opacity-50 dark:border-slate-700 dark:text-white">Continue with Facebook</button></div>

        <div className="mt-5 text-center text-xs text-slate-500">New to the platform? <button type="button" onClick={openSignUp} className="font-black text-[#E3000F]">Create an account</button></div>
        <button type="button" onClick={() => setView('home')} className="mt-4 flex w-full items-center justify-center gap-2 text-xs font-bold text-slate-500"><span>Back to public site</span></button>
      </div>
    </div>
  );
}
