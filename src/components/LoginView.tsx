import React, { useState } from 'react';
import { ViewType } from '../types';
import { Eye, EyeOff, ShieldCheck, Lock, AlertCircle, CheckCircle2, ArrowRight, Key, Sparkles, HelpCircle, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginViewProps {
  setView: (view: ViewType) => void;
  login: () => void; // Google login function from useFirebaseData
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
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'password' | 'quick'>('password');
  const [showOldPortalModal, setShowOldPortalModal] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!email || !email.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (loginWithEmail) {
        await loginWithEmail(email.trim(), password);
      } else {
        await login();
      }
      
      if (rememberMe) {
        localStorage.setItem('axi_remembered_email', email.trim());
      } else {
        localStorage.removeItem('axi_remembered_email');
      }

      // Sync user with backend server for Admin visibility
      fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: email.split('@')[0],
          provider: 'Email Authentication',
          status: 'Approved'
        })
      }).catch(e => console.warn('Backend login sync notice:', e));

      setAuthSuccess('Authentication successful! Opening Axi Client Portal...');
      if (showToast) showToast('Logged in successfully. Welcome to Axi Portal!', 'success');
      
      setTimeout(() => {
        setView('dashboard');
      }, 600);
    } catch (err: any) {
      console.error("Login authentication error:", err);
      let errMsg = 'Failed to sign in. Please verify your credentials or try Google login.';
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        errMsg = 'Invalid email address or password. Please try again.';
      } else if (err?.code === 'auth/too-many-requests') {
        errMsg = 'Too many failed login attempts. Please wait a moment and try again.';
      } else if (err?.message) {
        errMsg = err.message.replace('Firebase: ', '');
      }
      setAuthError(errMsg);
      if (showToast) showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);
    try {
      await login();
      
      const user = auth.currentUser;
      if (user?.email) {
        fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: user.uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            provider: 'Google SSO Auth',
            status: 'Approved'
          })
        }).catch(e => console.warn('Google user sync notice:', e));
      }

      setAuthSuccess('Google Authentication verified! Loading portal...');
      if (showToast) showToast('Google Login verified. Welcome back!', 'success');
      setTimeout(() => {
        setView('dashboard');
      }, 500);
    } catch (err: any) {
      console.error("Google login failed:", err);
      let msg = 'Google sign in failed.';
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('popup-closed-by-user')) {
        msg = 'Login window was closed before completing authentication.';
      } else if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        const currentDomain = window.location.hostname;
        msg = `Domain "${currentDomain}" is not authorized in Firebase Console. Go to Firebase Authentication -> Settings -> Authorized Domains and add "${currentDomain}". In the meantime, use Email/Password or Instant Access.`;
      } else if (err?.code === 'auth/popup-blocked') {
        msg = 'Google login popup was blocked by your browser. Please allow popups or use Email/Password login.';
      } else if (err?.code === 'auth/operation-not-allowed') {
        msg = 'Google Sign-In provider is not enabled in Firebase Authentication console.';
      } else if (err?.message) {
        msg = err.message.replace('Firebase: ', '');
      }
      setAuthError(msg);
      if (showToast) showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFacebookLogin = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);
    try {
      if (loginWithFacebook) {
        await loginWithFacebook();
        setAuthSuccess('Facebook Authentication verified! Loading portal...');
        if (showToast) showToast('Facebook Login verified. Welcome back!', 'success');
        setTimeout(() => {
          setView('dashboard');
        }, 500);
      } else {
        throw new Error('Facebook Login not initialized.');
      }
    } catch (err: any) {
      console.error("Facebook login failed:", err);
      let msg = 'Facebook sign in failed.';
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('popup-closed-by-user')) {
        msg = 'Login window was closed before completing authentication.';
      } else if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        const currentDomain = window.location.hostname;
        msg = `Domain "${currentDomain}" is not authorized in Firebase Console. Go to Firebase Authentication -> Settings -> Authorized Domains and add "${currentDomain}". In the meantime, use Email/Password or Instant Access.`;
      } else if (err?.code === 'auth/popup-blocked') {
        msg = 'Facebook login popup was blocked by your browser. Please allow popups or use Email/Password login.';
      } else if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
        msg = 'Facebook Sign-In provider is not enabled in Firebase Authentication console. Please enable Facebook under Auth -> Sign-in method.';
      } else if (err?.message) {
        msg = err.message.replace('Firebase: ', '');
      }
      setAuthError(msg);
      if (showToast) showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoAccess = async (presetEmail: string) => {
    setAuthError(null);
    setIsSubmitting(true);
    setEmail(presetEmail);
    setPassword('AxiTrader2026!');
    try {
      if (loginWithEmail) {
        await loginWithEmail(presetEmail, 'AxiTrader2026!');
      } else {
        await login();
      }
      setAuthSuccess(`Signed in as ${presetEmail}! Loading dashboard...`);
      if (showToast) showToast(`Signed in to ECN Live Portal as ${presetEmail}`, 'success');
      setTimeout(() => {
        setView('dashboard');
      }, 500);
    } catch (err: any) {
      let errMsg = 'Demo login failed. Please ensure Firebase is properly configured.';
      if (err?.message) {
        errMsg = err.message.replace('Firebase: ', '');
      }
      setAuthError(errMsg);
      if (showToast) showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[90vh] bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors font-sans">
      
      {/* Top Breadcrumb Navigation Header */}
      <div className="w-full max-w-[440px] mb-4 flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <button 
          onClick={() => setView('home')}
          className="hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1 cursor-pointer"
        >
          &larr; Back to Home
        </button>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400">256-Bit SSL Encrypted</span>
        </div>
      </div>

      {/* Main Login Portal Card */}
      <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 w-full max-w-[440px] shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        
        {/* Axi Red Accent Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E3000F] via-[#FFD250] to-[#E3000F]" />

        {/* Brand Title Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div 
            onClick={() => setView('home')} 
            className="cursor-pointer group flex flex-col items-center mb-3"
          >
            <div className="flex items-center justify-center gap-1.5">
              <svg className="h-10 sm:h-12 w-auto text-slate-900 dark:text-white" viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="32" fill="currentColor" fontSize="38" fontWeight="900" fontFamily="Outfit, system-ui, sans-serif" letterSpacing="-1.5">axi</text>
                <circle cx="68" cy="28" r="4.5" fill="#E3000F" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FFCC00] border border-[#FFCC00]/30 bg-[#FFCC00]/10 px-2 py-0.5 rounded">GLOBAL</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mt-2">
              Client Trading Portal
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Log in to your account
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access 220+ CFD instruments, live balances & MT5 terminals
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab('password'); setAuthError(null); }}
            className={`py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'password' 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#E3000F]" /> Credentials
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('quick'); setAuthError(null); }}
            className={`py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'quick' 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFD250]" /> Instant Access
          </button>
        </div>

        {/* Dynamic Alert Banner */}
        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300"
            >
              <AlertCircle className="w-4 h-4 text-[#E3000F] shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-snug">{authError}</div>
            </motion.div>
          )}

          {authSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-snug">{authSuccess}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'password' ? (
          <form className="flex flex-col gap-4" onSubmit={handleLoginSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Email address
              </label>
              <input 
                type="email" 
                placeholder="name@domain.com" 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E3000F] focus:border-transparent text-slate-900 dark:text-white rounded-xl transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                {openForgotPassword && (
                  <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); openForgotPassword(); }} 
                    className="text-[#E3000F] text-xs font-bold hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••" 
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E3000F] focus:border-transparent text-slate-900 dark:text-white rounded-xl transition pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 font-medium select-none">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#E3000F] focus:ring-[#E3000F] w-4 h-4 cursor-pointer"
                />
                Remember this device
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 text-sm mt-1"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  Log In to Client Portal <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Instant Quick Access Presets */
          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Select an active verified trader profile to launch the ECN Client Portal instantly:
            </p>

            <button
              type="button"
              onClick={() => handleQuickDemoAccess('trader.pro@axi.com')}
              disabled={isSubmitting}
              className="w-full bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 transition text-left flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> ECN Pro Live Trader
                </div>
                <div className="text-[11px] text-slate-500 font-mono">trader.pro@axi.com • $50,000 Equity</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#E3000F] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoAccess('standard.trader@axi.com')}
              disabled={isSubmitting}
              className="w-full bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 transition text-left flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#E3000F]" /> Standard ECN Account
                </div>
                <div className="text-[11px] text-slate-500 font-mono">standard.trader@axi.com • Live Sync</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#E3000F] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="relative flex items-center my-6">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink-0 mx-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest">OR LOG IN WITH</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Social Authentication Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-100 disabled:opacity-60 shadow-2xs"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Sign in with Google
          </button>

          <button 
            type="button"
            onClick={handleFacebookLogin}
            disabled={isSubmitting}
            className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-xs font-bold disabled:opacity-60 shadow-2xs"
          >
            <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Sign in with Facebook
          </button>
        </div>

        {/* Footer Navigation Links */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Don't have an Axi trading account?{' '}
            <button 
              type="button"
              onClick={() => openSignUp()} 
              className="text-[#E3000F] font-extrabold hover:underline cursor-pointer"
            >
              Open a live account
            </button>
          </p>

          <div>
            <button 
              type="button"
              onClick={() => setShowOldPortalModal(true)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Looking for the old Client Portal?
            </button>
          </div>
        </div>

      </div>

      {/* Security & Regulatory Notice Below Form */}
      <div className="mt-6 text-center max-w-[440px] text-[11px] text-slate-500 space-y-1">
        <p>Axi Financial Services • Regulated by FCA, ASIC, DFSA & FSC</p>
        <p className="text-[10px] text-slate-400">By logging in, you agree to Axi Trading Terms & Conditions & Security Policies.</p>
      </div>

      {/* Old Portal Info Modal */}
      <AnimatePresence>
        {showOldPortalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-extrabold text-sm text-[#E3000F]">
                  <ExternalLink className="w-4 h-4" /> Axi Unified Client Portal Migration
                </div>
                <button 
                  onClick={() => setShowOldPortalModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                All legacy MT4 Client Portal accounts have been seamlessly upgraded to the unified <strong>Axi High-Fidelity Client Portal</strong>.
              </p>

              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-bold">What changed?</div>
                <p>Your login credentials (email and password) remain identical. You can log in directly using the form above to manage funds, MT5 credentials, leverage, and trade execution.</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowOldPortalModal(false)}
                  className="bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Got It, Proceed to Login
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
