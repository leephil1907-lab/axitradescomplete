import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, Mail, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { ViewType } from '../types';
import { auth } from '../firebase';
import AxiLogo from './AxiLogo';

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

interface LoginViewProps {
  setView: (view: ViewType) => void;
  login: () => Promise<any>;
  loginWithFacebook?: () => Promise<any>;
  loginWithEmail?: (email: string, pass: string) => Promise<any>;
  openSignUp: () => void;
  openForgotPassword?: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
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
  const [email, setEmail] = useState(() => (typeof window !== 'undefined' ? (localStorage.getItem('axi_remembered_email') || '') : ''));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => (typeof window !== 'undefined' ? Boolean(localStorage.getItem('axi_remembered_email')) : false));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupBusy, setSignupBusy] = useState(false);

  const clearMessages = () => { setError(null); setSuccess(null); };

  const showError = (message: string) => { setError(message); showToast?.(message, 'error'); };
  const showSuccess = (message: string) => { setSuccess(message); showToast?.(message, 'success'); };

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return showError('Please enter a valid email address.');
    if (password.length < 6) return showError('Password must be at least 6 characters.');
    setBusy(true);
    try {
      if (loginWithEmail) await loginWithEmail(normalizedEmail, password);
      else throw new Error('Email authentication is not configured.');
      if (rememberMe) localStorage.setItem('axi_remembered_email', normalizedEmail);
      else localStorage.removeItem('axi_remembered_email');
      showSuccess('Authentication successful. Opening your secure trading account…');
      setView('dashboard');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') showError('No account exists for this email. Please create an account.');
      else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') showError('Invalid email or password.');
      else if (code === 'auth/too-many-requests') showError('Too many failed attempts. Please wait and try again.');
      else showError((err?.message || 'Unable to authenticate. Please try again.').replace('Firebase: ', ''));
    } finally { setBusy(false); }
  };

  const handleProviderLogin = async (provider: 'google' | 'facebook') => {
    setBusy(true); clearMessages();
    try {
      if (provider === 'google') await login();
      else if (loginWithFacebook) await loginWithFacebook();
      else throw new Error(`${provider} authentication is not configured.`);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Authentication completed without an active session.');
      showSuccess('Authentication successful.');
      setView('dashboard');
    } catch (err: any) {
      showError((err?.message || `${provider} authentication failed.`).replace('Firebase: ', ''));
    } finally { setBusy(false); }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();
    const normalizedEmail = signupEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return showError('Please enter a valid email address.');
    if (signupPassword.length < 8) return showError('Password must be at least 8 characters.');
    if (signupPassword !== signupConfirmPassword) return showError('Passwords do not match.');
    setSignupBusy(true);
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const userCred = await createUserWithEmailAndPassword(auth, normalizedEmail, signupPassword);
      await updateProfile(userCred.user, { displayName: normalizedEmail.split('@')[0] });
      showSuccess('Account created successfully. You are now signed in.');
      setView('dashboard');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') showError('An account already exists for this email. Please sign in.');
      else if (code === 'auth/weak-password') showError('This password is too weak. Please choose a stronger one.');
      else showError((err?.message || 'Unable to create account. Please try again.').replace('Firebase: ', ''));
    } finally { setSignupBusy(false); }
  };

  return (
    <div className="min-h-screen w-full overflow-hidden flex items-center justify-center p-4 font-sans bg-[#FAF6EE] dark:bg-slate-950 select-none">
      {/* Decorative brand geometry background */ }
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[700px] h-[700px] bg-[#C8102E]/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-[#F5CE47]/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0F172A]">
        {/* Top brand header */ }
        <div className="px-8 pt-8 pb-2">
          <div className="flex items-center gap-3 mb-6">
            <AxiLogo size="lg" variant="red" aria-label="Axi" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Secure client access
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-1">
            {tab === 'signin' ? 'Sign in to Axi' : 'Create your Axi account'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-semibold">
            {tab === 'signin'
              ? 'Use your registered credentials to access your trading terminal.'
              : 'Join thousands of traders worldwide. Complete registration to begin.'}
          </p>
        </div>

        <div className="px-8 pb-8">
          {/* Alert / success banners */ }
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-5 flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] font-bold text-rose-800 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-300"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-5 flex gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] font-bold text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab pills */ }
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setTab('signin')}
              className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                tab === 'signin'
                  ? 'bg-[#C8102E] text-white shadow-lg shadow-red-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                tab === 'signup'
                  ? 'bg-[#C8102E] text-white shadow-lg shadow-red-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create account
            </button>
          </div>

          {/* SIGN IN FORM */ }
          <AnimatePresence mode="wait">
            {tab === 'signin' && (
              <motion.div
                key="signin"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <form onSubmit={handleEmailLogin}>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={email} onChange={e => setEmail(e.target.value)}
                        type="email" autoComplete="email" required
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pl-10 text-sm text-slate-900 outline-none transition focus:border-[#E3000F] focus:ring-2 focus:ring-[#E3000F]/10 dark:border-slate-700 dark:bg-[#0B1220] dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Password
                    </label>
                    <User className="absolute left-3.5 top-[52px] h-4 w-4 text-slate-400" />
                    <input
                      value={password} onChange={e => setPassword(e.target.value)}
                      type={showPassword ? 'text' : 'password'} autoComplete="current-password" required
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-11 py-3.5 text-sm text-slate-900 outline-none transition focus:border-[#E3000F] focus:ring-2 focus:ring-[#E3000F]/10 dark:border-slate-700 dark:bg-[#0B1220] dark:text-white"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-[52px] text-slate-500 transition hover:text-slate-800 dark:hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <label className="flex cursor-pointer items-center gap-2 text-slate-600 dark:text-slate-400">
                      <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="h-3.5 w-3.5 rounded border-slate-300 text-[#E3000F] focus:ring-[#E3000F]" />
                      Remember this email
                    </label>
                    {openForgotPassword && <button type="button" onClick={openForgotPassword} className="font-black text-[#E3000F] hover:underline">Forgot password?</button>}
                  </div>

                  <button type="submit" disabled={busy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E3000F] py-4 text-sm font-black text-white shadow-lg shadow-red-500/15 transition hover:bg-[#c9000d] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]">
                    <Lock className="h-4 w-4" /> {busy ? 'Authenticating…' : 'Sign in securely'}
                  </button>
                </form>

                <div className="my-5 relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-800"></span></div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white dark:bg-[#0F172A] px-3">
                    or
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button type="button" disabled={busy} onClick={() => void handleProviderLogin('google')} className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-[11px] font-black text-slate-800 shadow-sm transition hover:border-[#E3000F] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-[#0B1220] dark:text-white dark:hover:bg-[#111827]">
                    <GoogleIcon /><span>Google</span>
                  </button>
                  <button type="button" disabled={busy} onClick={() => void handleProviderLogin('facebook')} className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-[11px] font-black text-slate-800 shadow-sm transition hover:border-[#E3000F] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-[#0B1220] dark:text-white dark:hover:bg-[#111827]">
                    <FacebookIcon /><span>Facebook</span>
                  </button>
                </div>

                <div className="mt-6 text-center text-[11px] text-slate-500 dark:text-slate-400">
                  New to the platform?{' '}
                  <button type="button" onClick={() => setTab('signup')} className="font-black text-[#E3000F] hover:underline transition">Create an account</button>
                </div>
                <button type="button" onClick={() => setView('home')} className="mt-3 flex w-full items-center justify-center text-[11px] font-bold text-slate-500 transition hover:text-slate-800 dark:hover:text-white">
                  Back to public site
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SIGN UP FORM */ }
          <AnimatePresence mode="wait">
            {tab === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <form onSubmit={handleSignup}>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={signupEmail} onChange={e => setSignupEmail(e.target.value)}
                        type="email" autoComplete="email" required
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pl-10 text-sm text-slate-900 outline-none transition focus:border-[#E3000F] focus:ring-2 focus:ring-[#E3000F]/10 dark:border-slate-700 dark:bg-[#0B1220] dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Password
                    </label>
                    <User className="absolute left-3.5 top-[52px] h-4 w-4 text-slate-400" />
                    <input
                      value={signupPassword} onChange={e => setSignupPassword(e.target.value)}
                      type="password" autoComplete="new-password" required
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-11 py-3.5 text-sm text-slate-900 outline-none transition focus:border-[#E3000F] focus:ring-2 focus:ring-[#E3000F]/10 dark:border-slate-700 dark:bg-[#0B1220] dark:text-white"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-[52px] text-slate-500 transition hover:text-slate-800 dark:hover:text-white">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="relative">
                    <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Confirm password
                    </label>
                    <input
                      value={signupConfirmPassword} onChange={e => setSignupConfirmPassword(e.target.value)}
                      type="password" autoComplete="new-password" required
                      className="w-full rounded-xl border border-slate-300 bg-white pr-11 py-3.5 text-sm text-slate-900 outline-none transition focus:border-[#E3000F] focus:ring-2 focus:ring-[#E3000F]/10 dark:border-slate-700 dark:bg-[#0B1220] dark:text-white"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-[52px] text-slate-500 transition hover:text-slate-800 dark:hover:text-white">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 text-[10px] text-slate-500 font-semibold">
                    Must be at least 8 characters with upper, lower, number and special character.
                  </div>

                  <button type="submit" disabled={signupBusy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E3000F] py-4 text-sm font-black text-white shadow-lg shadow-red-500/15 transition hover:bg-[#c9000d] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]">
                    <ShieldCheck className="h-4 w-4" /> {signupBusy ? 'Creating account…' : 'Create account'}
                  </button>
                </form>

                <div className="mt-6 text-center text-[11px] text-slate-500 dark:text-slate-400">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setTab('signin')} className="font-black text-[#E3000F] hover:underline transition">Sign in here</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer trust bar */ }
        <div className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#0B1220] px-8 py-5">
          <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400 dark:text-emerald-500" />
              SSL secured
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              Segregated funds
            </span>
            <span className="flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              FCA & ASIC regulated
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
