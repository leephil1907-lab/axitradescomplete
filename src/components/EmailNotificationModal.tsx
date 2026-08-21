import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, CheckCircle2, XCircle, ShieldCheck, ArrowRight, X, Copy, Check, Key } from 'lucide-react';

export interface EmailTriggerPayload {
  id: string;
  recipientEmail: string;
  recipientName: string;
  type?: 'Registration' | 'PasswordReset' | 'Transaction' | 'Custom';
  subject?: string;
  code?: string;
  txId?: string;
  txType?: 'Deposit' | 'Withdrawal';
  amount?: number;
  status?: 'Approved' | 'Completed' | 'Rejected' | 'Sent' | 'Verified';
  timestamp: string;
  method?: string;
  refCode?: string;
  reason?: string;
  accountNo?: string;
  platform?: string;
}

interface EmailNotificationModalProps {
  payload: EmailTriggerPayload | null;
  onClose: () => void;
  onViewAccount?: () => void;
}

export default function EmailNotificationModal({ payload, onClose, onViewAccount }: EmailNotificationModalProps) {
  const [copiedCode, setCopiedCode] = React.useState(false);

  if (!payload) return null;

  const emailType = payload.type || 'Transaction';
  const isApproved = payload.status === 'Approved' || payload.status === 'Completed' || payload.status === 'Verified' || payload.status === 'Sent';

  const handleCopyCode = (codeToCopy: string) => {
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* System Email Envelope Modal */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
        >
          
          {/* Top Banner indicating Email Triggered */}
          <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 text-white flex justify-between items-center text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
              <Mail className="w-4 h-4 text-emerald-400 animate-pulse" />
              Official Email Notification Dispatch
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Email Header Metadata */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">To:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{payload.recipientName} &lt;{payload.recipientEmail}&gt;</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">From:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {emailType === 'PasswordReset' 
                  ? 'Axi Trades Security <security@axitrades.com>' 
                  : emailType === 'Registration'
                  ? 'Axi Trades Onboarding <welcome@axitrades.com>'
                  : 'Axi Financial Operations <customersupport@axitrades.com>'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Subject:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {payload.subject || (
                  emailType === 'Registration'
                    ? '🎉 Welcome to Axi Trades - Account Registration Successful!'
                    : emailType === 'PasswordReset'
                    ? `🔑 Axi Trades - Password Reset Code: ${payload.code}`
                    : `Transaction #${payload.txId} Update`
                )}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span>Date: {payload.timestamp}</span>
              <span>Server: Axi Trades Secure Mail Server</span>
            </div>
          </div>

          {/* Rendered Email Body Content */}
          <div className="p-6 space-y-5 text-sm">
            
            {/* Axi Corporate Brand Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-[#E3000F] text-white font-black text-xs px-2.5 py-1 rounded tracking-wider uppercase font-sans">AXI TRADES</span>
                <span className="font-black text-xs text-slate-900 dark:text-white tracking-tight uppercase">
                  {emailType === 'Registration' ? 'Account Services' : emailType === 'PasswordReset' ? 'Security Operations' : 'Financial Services'}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                Verified Message
              </span>
            </div>

            {/* EMAIL TYPE 1: REGISTRATION WELCOME */}
            {emailType === 'Registration' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Welcome to Axi Trades, {payload.recipientName}!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Thank you for signing up with Axi Trades. Your account has been registered and initialized under your email <strong className="text-slate-900 dark:text-white font-mono">{payload.recipientEmail}</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Account Registration Details
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 pt-1 font-mono text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-sans block">Registered Email</span>
                      <span className="font-bold">{payload.recipientEmail}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-sans block">Account Status</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">Verified Live</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-sans block">Trading Account</span>
                      <span className="font-bold">{payload.accountNo || 'AXI-E68291'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-sans block">Platform</span>
                      <span className="font-bold">{payload.platform || 'MT5 / ECN Webtrader'}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  You can now log into your trading terminal, execute Buy/Sell orders across Forex, Stocks, and Crypto, manage funds, and utilize live market charts.
                </p>
              </div>
            )}

            {/* EMAIL TYPE 2: PASSWORD RESET CODE */}
            {emailType === 'PasswordReset' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-amber-500" /> Password Reset Verification Code
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    We received a request to reset the password for your Axi Trades account <strong className="text-slate-900 dark:text-white font-mono">{payload.recipientEmail}</strong>.
                  </p>
                </div>

                {/* Prominent Verification Code Display Box */}
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 p-5 rounded-xl text-center space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300 block">
                    Your 6-Digit Password Reset Security Code:
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-black font-mono tracking-widest text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-6 py-2 rounded-lg border border-amber-300 dark:border-amber-700 shadow-sm">
                      {payload.code || '849201'}
                    </span>
                    <button
                      onClick={() => handleCopyCode(payload.code || '849201')}
                      className="p-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-800 dark:text-amber-400 font-medium">
                    This security code is valid for 15 minutes. Do not share this code with anyone.
                  </p>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  If you did not initiate this password reset request, please ignore this email or contact Axi Compliance immediately.
                </p>
              </div>
            )}

            {/* EMAIL TYPE 3: TRANSACTION NOTIFICATION */}
            {emailType === 'Transaction' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Dear {payload.recipientName},
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {isApproved 
                      ? `Your request to ${(payload.txType || 'Deposit').toLowerCase()} funds has been successfully reviewed and APPROVED by our Compliance & Treasury Desk.`
                      : `Your request to ${(payload.txType || 'Deposit').toLowerCase()} funds could not be completed and has been REJECTED by our Compliance Admin.`
                    }
                  </p>
                </div>

                <div className={`p-4 rounded-xl border flex flex-col gap-3 font-mono text-xs ${
                  isApproved 
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50' 
                    : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50'
                }`}>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-slate-500 font-sans font-bold">Transaction Status:</span>
                    <span className={`font-black uppercase px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 ${
                      isApproved 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-rose-600 text-white'
                    }`}>
                      {isApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {isApproved ? 'APPROVED' : 'REJECTED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-sans">Transaction ID</span>
                      <span className="font-bold text-slate-900 dark:text-white">{payload.txId || 'TX-984210'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-sans">Type</span>
                      <span className="font-bold text-slate-900 dark:text-white">{payload.txType || 'Deposit'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-sans">Amount</span>
                      <span className="font-black text-sm text-slate-900 dark:text-white">${(payload.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-sans">Payment Method</span>
                      <span className="font-bold text-slate-900 dark:text-white">{payload.method || 'Gateway'}</span>
                    </div>
                  </div>

                  {payload.refCode && (
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px]">
                      <span className="text-slate-400 font-sans">Reference Code: </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{payload.refCode}</span>
                    </div>
                  )}

                  {payload.reason && (
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] text-rose-700 dark:text-rose-300 font-sans">
                      <span className="font-bold">Reason: </span>
                      <span>{payload.reason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email Footer Disclaimer */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
              If you have any questions regarding this notification, please contact our 24/7 Client Desk or check your Account Dashboard.
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => {
                  onClose();
                  if (onViewAccount) onViewAccount();
                }}
                className="flex-1 bg-[#E3000F] hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>{emailType === 'PasswordReset' ? 'Enter Code' : 'Access Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={onClose}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-xl text-xs transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>

          </div>

          {/* Footer Security Seal */}
          <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-2.5 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-emerald-500 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Axi Security Dispatch
            </span>
            <span>Axi Financial Services Pty Ltd</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
