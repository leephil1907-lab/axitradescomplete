import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, ShieldCheck, Key, Lock, ArrowRight, CheckCircle2, AlertTriangle, Eye, EyeOff, RefreshCw } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSuccessLogin?: () => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  showToast,
  onSuccessLogin
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Email, 2: Code, 3: New Password, 4: Complete
  const [email, setEmail] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Step 1: Send Code
  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
      // Generate 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setIsSubmitting(false);

      // Dispatch official Email Notification from Axi Trades
      const emailPayload = {
        id: `PWD-RESET-${Math.floor(100000 + Math.random() * 900000)}`,
        recipientEmail: email,
        recipientName: email.split('@')[0] ? email.split('@')[0].toUpperCase() : 'Axi Trader',
        type: 'PasswordReset',
        code: code,
        subject: `🔑 Axi Trades - Password Reset Code: ${code}`,
        timestamp: new Date().toUTCString()
      };
      window.dispatchEvent(new CustomEvent('axi_email_trigger', { detail: emailPayload }));

      showToast(`🔑 Verification code ${code} sent to ${email}`, 'success');
      setStep(2);
    }, 800);
  };

  // Step 2: Verify Code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (enteredCode.trim() !== generatedCode.trim()) {
      setErrorMsg('Invalid verification code. Please check your Axi email or resend code.');
      showToast('Incorrect verification code entered', 'error');
      return;
    }

    showToast('Code verified successfully!', 'success');
    setStep(3);
  };

  // Resend code helper
  const handleResendCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    const emailPayload = {
      id: `PWD-RESET-${Math.floor(100000 + Math.random() * 900000)}`,
      recipientEmail: email,
      recipientName: email.split('@')[0] ? email.split('@')[0].toUpperCase() : 'Axi Trader',
      type: 'PasswordReset',
      code: code,
      subject: `🔑 Axi Trades - New Password Reset Code: ${code}`,
      timestamp: new Date().toUTCString()
    };
    window.dispatchEvent(new CustomEvent('axi_email_trigger', { detail: emailPayload }));
    showToast(`New verification code ${code} sent to ${email}`, 'info');
  };

  // Step 3: Reset Password
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setStep(4);

      showToast('Password updated successfully!', 'success');
    }, 1000);
  };

  const handleFinish = () => {
    onClose();
    if (onSuccessLogin) {
      onSuccessLogin();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-black text-[#E3000F] font-sans" style={{ fontFamily: '"Clash Display", "General Sans", sans-serif' }}>
                axi
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 border-l border-slate-700 pl-2.5">
                Password Recovery
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">

            {/* Step Indicators */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className={step >= 1 ? 'text-[#E3000F]' : ''}>1. Request Code</span>
              <span>&rarr;</span>
              <span className={step >= 2 ? 'text-[#E3000F]' : ''}>2. Verify</span>
              <span>&rarr;</span>
              <span className={step >= 3 ? 'text-[#E3000F]' : ''}>3. New Password</span>
            </div>

            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 p-3 rounded-xl text-xs font-semibold border border-red-200 dark:border-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {step === 1 && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold">Forgot your password?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter the email address registered with your Axi account. We will send you a 6-digit verification code to reset your password.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Email Address*
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 pl-10 text-sm rounded-xl focus:outline-none focus:border-[#E3000F]"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#E3000F] hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending Code...' : 'Send Recovery Code'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: Enter 6-Digit Code */}
            {step === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold">Check Your Axi Email</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    We sent a 6-digit security code to <strong className="text-slate-900 dark:text-white">{email}</strong>. Please enter it below.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    6-Digit Security Code*
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredCode}
                      onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 849201"
                      required
                      className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center text-xl font-mono tracking-widest font-black rounded-xl focus:outline-none focus:border-[#E3000F]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Didn't receive the code?</span>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-[#E3000F] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Resend Code
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-bold py-3 rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  Verify Code & Continue
                </button>
              </form>
            )}

            {/* STEP 3: Enter New Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold">Create New Password</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose a strong password with at least 6 characters.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    New Password*
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 pl-10 pr-10 text-sm rounded-xl focus:outline-none focus:border-[#E3000F]"
                    />
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Confirm New Password*
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 pl-10 text-sm rounded-xl focus:outline-none focus:border-[#E3000F]"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#E3000F] hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating Password...' : 'Reset Password'}
                </button>
              </form>
            )}

            {/* STEP 4: Success Screen */}
            {step === 4 && (
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Password Reset Complete!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your Axi account password has been updated successfully. A confirmation email was sent to <strong className="text-slate-900 dark:text-white">{email}</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-bold py-3 rounded-xl transition shadow-md cursor-pointer"
                >
                  Proceed to Login
                </button>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
