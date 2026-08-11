import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gift, 
  Copy, 
  Check, 
  Send, 
  Users, 
  DollarSign, 
  Share2, 
  X, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Mail, 
  Award, 
  ExternalLink,
  RefreshCw,
  Zap,
  ShieldCheck,
  TrendingUp,
  UserPlus
} from 'lucide-react';
import { ReferralInvite } from '../types';

interface ReferAFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  referralInvites: ReferralInvite[];
  onAddInvite: (invite: ReferralInvite) => void;
  onUpdateInviteStatus?: (id: string, status: 'Invited' | 'Registered' | 'Funded' | 'Claimed') => void;
  onClaimBonus?: (amount: number, friendName: string) => void;
  liveBalance?: number;
}

export default function ReferAFriendModal({
  isOpen,
  onClose,
  user,
  showToast,
  referralInvites,
  onAddInvite,
  onUpdateInviteStatus,
  onClaimBonus,
  liveBalance = 0
}: ReferAFriendModalProps) {
  const [copied, setCopied] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [friendName, setFriendName] = useState('');
  const [customNote, setCustomNote] = useState('Hey! Join me on Axi to trade Forex, Share CFDs, and Crypto with raw 0.0 pip spreads. Get a $50 welcome trading bonus when you open an account!');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'invite' | 'tracker' | 'rewards'>('invite');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Derive user referral code
  const referralCode = React.useMemo(() => {
    if (user?.uid) {
      return `AXI-${user.uid.substring(0, 6).toUpperCase()}`;
    }
    const stored = localStorage.getItem('axi_user_ref_code');
    if (stored) return stored;
    const gen = `AXI-${Math.floor(100000 + Math.random() * 900000)}`;
    localStorage.setItem('axi_user_ref_code', gen);
    return gen;
  }, [user]);

  const referralUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/login?ref=${referralCode}`
    : `https://axi.com/register?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    if (showToast) {
      showToast('✓ Unique referral link copied to clipboard!', 'success');
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendEmail || !friendEmail.includes('@')) {
      if (showToast) showToast('Please enter a valid email address.', 'error');
      return;
    }

    setIsSending(true);

    setTimeout(() => {
      const newInvite: ReferralInvite = {
        id: `REF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        email: friendEmail.trim(),
        name: friendName.trim() || friendEmail.split('@')[0],
        status: 'Invited',
        reward: 100,
        sentAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        refCode: referralCode,
        claimed: false
      };

      onAddInvite(newInvite);
      setIsSending(false);
      setFriendEmail('');
      setFriendName('');
      
      if (showToast) {
        showToast(`🎁 Referral invitation sent to ${newInvite.email}! $100 reward pending registration.`, 'success');
      }

      setActiveTab('tracker');
    }, 800);
  };

  // Metrics summary
  const totalInvited = referralInvites.length;
  const fundedInvites = referralInvites.filter(i => i.status === 'Funded' || i.status === 'Claimed');
  const totalEarned = fundedInvites.reduce((acc, curr) => acc + curr.reward, 0);
  const pendingRewards = referralInvites.filter(i => i.status === 'Registered' || i.status === 'Invited').length * 100;
  const unclaimedBonusCount = referralInvites.filter(i => i.status === 'Funded' && !i.claimed).length;

  const handleShareSocial = (platform: string) => {
    const text = encodeURIComponent(`Trade Forex and CFDs with Axi using my referral link and get up to $50 welcome bonus! ${referralUrl}`);
    let url = '';

    switch (platform) {
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${text}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent('Join me on Axi Trading!')}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${text}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent('Join me on Axi & get a $50 Trading Bonus!')}&body=${encodeURIComponent(customNote + '\n\n' + referralUrl)}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleUpdateReferralStatus = (id: string) => {
    if (!onUpdateInviteStatus) return;
    const inv = referralInvites.find(i => i.id === id);
    if (!inv) return;

    if (inv.status === 'Invited') {
      onUpdateInviteStatus(id, 'Registered');
      if (showToast) showToast(`ℹ️ Status updated: ${inv.name || inv.email} registered an account!`, 'info');
    } else if (inv.status === 'Registered') {
      onUpdateInviteStatus(id, 'Funded');
      if (showToast) showToast(`🎉 $100 BONUS UNLOCKED! ${inv.name || inv.email} made their first deposit!`, 'success');
    }
  };

  const filteredInvites = referralInvites.filter(i => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return i.status === 'Invited' || i.status === 'Registered';
    if (filterStatus === 'funded') return i.status === 'Funded';
    if (filterStatus === 'claimed') return i.status === 'Claimed';
    return true;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-100"
        >
          {/* Header Banner */}
          <div className="relative bg-gradient-to-r from-amber-600 via-brand-yellow to-amber-500 p-6 text-slate-950 overflow-hidden">
            <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
              <Gift className="w-56 h-56 text-slate-950" />
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/20 text-slate-950 hover:bg-black/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="bg-slate-950 text-brand-yellow text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> Axi Refer-a-Friend Program
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mb-1">
              Give $50, Get <span className="underline decoration-slate-950 decoration-wavy">$100 Cash</span>
            </h2>
            <p className="text-slate-900 text-xs sm:text-sm font-medium max-w-xl">
              Invite fellow traders to Axi. When they deposit $200+, you earn <strong className="font-extrabold">$100 USD</strong> directly into your Live Account, and they receive a <strong className="font-extrabold">$50 welcome bonus</strong>.
            </p>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
              <div className="bg-slate-950/85 backdrop-blur-sm p-3 rounded-xl border border-amber-400/30 text-white">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-400" /> Total Earned
                </div>
                <div className="text-xl font-black text-emerald-400 mt-0.5">${totalEarned.toLocaleString()}</div>
              </div>

              <div className="bg-slate-950/85 backdrop-blur-sm p-3 rounded-xl border border-amber-400/30 text-white">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Pending Rewards
                </div>
                <div className="text-xl font-black text-amber-300 mt-0.5">${pendingRewards.toLocaleString()}</div>
              </div>

              <div className="bg-slate-950/85 backdrop-blur-sm p-3 rounded-xl border border-amber-400/30 text-white">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-blue-400" /> Friends Invited
                </div>
                <div className="text-xl font-black text-white mt-0.5">{totalInvited}</div>
              </div>

              <div className="bg-slate-950/85 backdrop-blur-sm p-3 rounded-xl border border-amber-400/30 text-white">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-brand-yellow" /> Unique Ref Code
                </div>
                <div className="text-sm font-black text-brand-yellow mt-1 truncate">{referralCode}</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/90 px-6 pt-3">
            <button
              onClick={() => setActiveTab('invite')}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'invite'
                  ? 'border-brand-yellow text-brand-yellow'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" /> Send Invites & Share
            </button>

            <button
              onClick={() => setActiveTab('tracker')}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 relative ${
                activeTab === 'tracker'
                  ? 'border-brand-yellow text-brand-yellow'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Invite Tracker ({referralInvites.length})
              {unclaimedBonusCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-2 right-1" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('rewards')}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'rewards'
                  ? 'border-brand-yellow text-brand-yellow'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Program Benefits
            </button>
          </div>

          {/* Modal Body Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'invite' && (
              <div className="space-y-6">
                {/* Section 1: Unique Shareable Link */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2 block flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-brand-yellow" /> Your Unique Referral Link
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={referralUrl}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs sm:text-sm font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-yellow"
                    />

                    <button
                      onClick={handleCopyLink}
                      className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md ${
                        copied
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-brand-yellow text-slate-950 hover:bg-yellow-400'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copy Link
                        </>
                      )}
                    </button>
                  </div>

                  {/* Social Share Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-semibold mb-2 block">Quick Share via Social Apps:</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleShareSocial('whatsapp')}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <MessageSquareIcon /> WhatsApp
                      </button>

                      <button
                        onClick={() => handleShareSocial('telegram')}
                        className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" /> Telegram
                      </button>

                      <button
                        onClick={() => handleShareSocial('twitter')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <TwitterIcon /> X (Twitter)
                      </button>

                      <button
                        onClick={() => handleShareSocial('linkedin')}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <LinkedinIcon /> LinkedIn
                      </button>

                      <button
                        onClick={() => handleShareSocial('email')}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" /> Direct Email
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 2: Direct Email Invitation Form */}
                <form onSubmit={handleSendInvite} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-brand-yellow" /> Send Direct Email Invitation
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      +$100 Bonus / Qualified Friend
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-1 block">Friend's Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Smith"
                        value={friendName}
                        onChange={(e) => setFriendName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-brand-yellow"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-1 block">Friend's Email Address <span className="text-red-400">*</span></label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. alex.smith@example.com"
                        value={friendEmail}
                        onChange={(e) => setFriendEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-brand-yellow"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Personal Message Note</label>
                    <textarea
                      rows={2}
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg p-2.5 focus:outline-none focus:border-brand-yellow"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full bg-brand-yellow text-slate-950 hover:bg-yellow-400 font-black text-xs uppercase tracking-wider py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching Referral Invite...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Send Email Invitation ($100 Reward)
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'tracker' && (
              <div className="space-y-4">
                {/* Status Filter Bar */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400">Filter Status:</span>
                    {['all', 'pending', 'funded', 'claimed'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase transition-colors ${
                          filterStatus === st
                            ? 'bg-brand-yellow text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs text-slate-400">
                    Showing <strong>{filteredInvites.length}</strong> of {referralInvites.length} referrals
                  </span>
                </div>

                {filteredInvites.length === 0 ? (
                  <div className="text-center py-12 bg-slate-950 rounded-xl border border-slate-800">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-300">No Referrals Recorded Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Share your unique referral link or send direct email invitations above to start earning $100 per friend!
                    </p>
                    <button
                      onClick={() => setActiveTab('invite')}
                      className="px-4 py-2 bg-brand-yellow text-slate-950 font-bold text-xs rounded-lg hover:bg-yellow-400"
                    >
                      Invite Your First Friend
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredInvites.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-100">{inv.name || 'Trader'}</span>
                            <span className="text-xs text-slate-500">({inv.email})</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-3">
                            <span>Sent: {inv.sentAt}</span>
                            <span>Ref Code: <code className="text-brand-yellow font-mono">{inv.refCode}</code></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-between sm:justify-end">
                          {/* Status Badge */}
                          <div>
                            {inv.status === 'Invited' && (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Invited (Pending Signup)
                              </span>
                            )}
                            {inv.status === 'Registered' && (
                              <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Registered (Pending Deposit)
                              </span>
                            )}
                            {inv.status === 'Funded' && (
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 shadow-xs animate-pulse">
                                <Zap className="w-3 h-3" /> $100 Reward Unlocked!
                              </span>
                            )}
                            {inv.status === 'Claimed' && (
                              <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-400" /> $100 Claimed & Deposited
                              </span>
                            )}
                          </div>

                          {/* Interactive Action Buttons */}
                          {inv.status === 'Funded' && onClaimBonus && (
                            <button
                              onClick={() => {
                                onClaimBonus(inv.reward, inv.name || inv.email);
                                if (onUpdateInviteStatus) onUpdateInviteStatus(inv.id, 'Claimed');
                              }}
                              className="px-3 py-1.5 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-md"
                            >
                              <DollarSign className="w-3.5 h-3.5" /> Claim $100 Cash
                            </button>
                          )}

                          {(inv.status === 'Invited' || inv.status === 'Registered') && (
                            <button
                              onClick={() => handleUpdateReferralStatus(inv.id)}
                              title="Update referral tracking status"
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Update Status
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-brand-yellow flex items-center justify-center font-black">
                      1
                    </div>
                    <h4 className="font-bold text-sm text-slate-100">Send Your Link</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Copy your custom referral URL or send direct invitation emails via our instant portal above.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                      2
                    </div>
                    <h4 className="font-bold text-sm text-slate-100">Friend Opens Account</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your friend completes registration and deposits $200+ into their new live trading account.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-yellow/20 text-brand-yellow flex items-center justify-center font-black">
                      3
                    </div>
                    <h4 className="font-bold text-sm text-slate-100">Earn $100 Cash</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      You receive $100 cash directly into your Axi Live Account balance with full withdrawal rights.
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-brand-yellow tracking-widest block mb-1">
                      VIP Milestones & Leaderboards
                    </span>
                    <h4 className="text-base font-extrabold text-slate-100">
                      Refer 5 Friends → Get Extra $500 Milestone Bonus
                    </h4>
                    <p className="text-xs text-slate-400 max-w-lg mt-0.5">
                      Top referrers also qualify for Axi Select funding priority and custom institutional rebate tiers.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('invite')}
                    className="px-5 py-2.5 bg-brand-yellow text-slate-950 hover:bg-yellow-400 font-extrabold text-xs uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap shadow-md"
                  >
                    Start Inviting Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-950 px-6 py-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Fully Regulated Axi Referral Terms Apply
            </span>
            <button onClick={onClose} className="hover:text-slate-300 font-bold transition-colors">
              Close Window
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Helper SVG Icon components
function MessageSquareIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}
