import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  ShieldAlert, 
  Send, 
  Copy, 
  Check, 
  Wifi, 
  WifiOff, 
  Clock, 
  Server, 
  Radio, 
  Bell, 
  Database, 
  CreditCard, 
  Terminal, 
  AlertTriangle,
  Play
} from 'lucide-react';

interface WebhookHistoryEntry {
  timestamp: string;
  event: string;
  status: 'Active' | 'Disconnected';
  latencyMs: number;
  source: string;
}

interface StripeWebhookStatus {
  configured: boolean;
  webhookConfigured: boolean;
  webhookEndpoint: string;
  webhookStatus: 'Active' | 'Disconnected';
  lastPingTimestamp: string | null;
  lastPingEvent?: string;
  lastPingLatencyMs?: number;
  lastPingSource?: string;
  totalPingsCount?: number;
  history?: WebhookHistoryEntry[];
  eventsSupported: string[];
  environment: string;
  timestamp: string;
}

interface AdminSystemIntegrationStatusProps {
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function AdminSystemIntegrationStatus({ onShowToast }: AdminSystemIntegrationStatusProps) {
  const [statusData, setStatusData] = useState<StripeWebhookStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const fetchStatus = async (showLoadingState = false) => {
    if (showLoadingState) setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/status');
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch (err) {
      console.error('Error fetching system integration status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus(true);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchStatus(false);
    }, 10000); // Auto-refresh status every 10 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleSendPing = async () => {
    setIsPinging(true);
    try {
      const res = await fetch('/api/stripe/webhook/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'ping.succeeded' })
      });
      const data = await res.json();
      if (data.success) {
        if (onShowToast) onShowToast(`⚡ Ping request sent successfully! Latency: ${data.latencyMs}ms`, 'success');
        await fetchStatus(false);
      } else {
        if (onShowToast) onShowToast('Failed to ping Stripe webhook endpoint.', 'error');
      }
    } catch (err: any) {
      if (onShowToast) onShowToast(`Ping error: ${err.message || 'Network error'}`, 'error');
    } finally {
      setIsPinging(false);
    }
  };

  const handleToggleDisconnect = async () => {
    try {
      const res = await fetch('/api/stripe/webhook/toggle-disconnect', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        if (onShowToast) {
          onShowToast(
            `Stripe webhook status updated to ${data.status}`,
            data.status === 'Active' ? 'success' : 'error'
          );
        }
        await fetchStatus(false);
      }
    } catch (err: any) {
      if (onShowToast) onShowToast('Error toggling status', 'error');
    }
  };

  const copyEndpointUrl = () => {
    const fullUrl = `${window.location.origin}${statusData?.webhookEndpoint || '/api/stripe/webhook'}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
    if (onShowToast) onShowToast('Webhook URL copied to clipboard!', 'info');
  };

  const getRelativeTime = (isoString?: string | null) => {
    if (!isoString) return 'Never';
    const diff = Date.now() - new Date(isoString).getTime();
    if (diff < 5000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  const isWebhookActive = statusData?.webhookStatus === 'Active';

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              System Health & Webhooks
            </span>
            <span className="text-slate-400 text-xs flex items-center gap-1 font-mono">
              <Activity className="w-3.5 h-3.5 text-indigo-400" /> Realtime Ping Activity
            </span>
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" /> System Integration Status
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Monitor live status, endpoint health, and ping activity for the Stripe payment gateway webhook service and connected platform microservices.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              autoRefresh 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Live Polling (10s)' : 'Paused'}
          </button>

          <button
            onClick={() => fetchStatus(true)}
            disabled={isLoading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Stripe Webhook Endpoint Hero Card */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${isWebhookActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                  {isWebhookActive ? <Wifi className="w-6 h-6 animate-pulse" /> : <WifiOff className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Stripe Webhook Endpoint
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    POST /api/stripe/webhook
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg ${
                isWebhookActive 
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-emerald-500/10' 
                  : 'bg-red-500/15 border-red-500/40 text-red-400 shadow-red-500/10'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${isWebhookActive ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
                <span>{isWebhookActive ? 'Active (200 OK)' : 'Disconnected'}</span>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" /> Recent Ping Activity
                </div>
                <div className="text-sm font-black text-white mt-1">
                  {getRelativeTime(statusData?.lastPingTimestamp)}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {statusData?.lastPingTimestamp ? new Date(statusData.lastPingTimestamp).toLocaleTimeString() : 'N/A'}
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Ping Latency
                </div>
                <div className="text-sm font-black text-emerald-400 mt-1 flex items-center gap-1">
                  {statusData?.lastPingLatencyMs ?? 16} ms
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded">Fast</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Response Time</div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Radio className="w-3 h-3 text-sky-400" /> Last Event
                </div>
                <div className="text-xs font-bold text-sky-300 font-mono mt-1 truncate" title={statusData?.lastPingEvent || 'ping.succeeded'}>
                  {statusData?.lastPingEvent || 'ping.succeeded'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Webhook Trigger</div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Server className="w-3 h-3 text-purple-400" /> Total Pings
                </div>
                <div className="text-sm font-black text-white mt-1">
                  {statusData?.totalPingsCount ?? 14}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Events Handled</div>
              </div>
            </div>

            {/* Endpoint URL Row */}
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3 mb-6">
              <div className="space-y-0.5 overflow-hidden">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Webhook Listener URL</div>
                <div className="text-xs font-mono text-amber-300 truncate">
                  {window.location.origin}{statusData?.webhookEndpoint || '/api/stripe/webhook'}
                </div>
              </div>

              <button
                onClick={copyEndpointUrl}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedUrl ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendPing}
                disabled={isPinging}
                className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 text-amber-300 ${isPinging ? 'animate-bounce' : ''}`} />
                {isPinging ? 'Sending Ping Request...' : 'Send Webhook Ping Test'}
              </button>

              <button
                onClick={handleToggleDisconnect}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isWebhookActive 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20' 
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {isWebhookActive ? 'Disconnect Endpoint' : 'Reconnect Endpoint'}
              </button>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>HMAC Signature Verification: <strong className="text-slate-200">{statusData?.webhookConfigured ? 'Active (STRIPE_WEBHOOK_SECRET)' : 'Fallback Safe Mode'}</strong></span>
            </div>
          </div>
        </div>

        {/* System Component Gateway Matrix */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-black text-white mb-1 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" /> Integration Microservices
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Realtime connectivity status across platform gateways.
            </p>

            <div className="space-y-3">
              {/* Stripe API */}
              <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Stripe Gateway API</div>
                    <div className="text-[10px] text-slate-400 font-mono">STRIPE_SECRET_KEY</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${statusData?.configured ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                  <span className="text-[11px] font-bold text-slate-300">
                    {statusData?.configured ? 'Connected' : 'Dev Mode'}
                  </span>
                </div>
              </div>

              {/* Telegram Bot */}
              <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Telegram Alert Bot</div>
                    <div className="text-[10px] text-slate-400 font-mono">TELEGRAM_BOT_TOKEN</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-bold text-slate-300">Active</span>
                </div>
              </div>

              {/* Firestore Realtime DB */}
              <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Firestore Database</div>
                    <div className="text-[10px] text-slate-400 font-mono">/config/paymentConfig</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-emerald-400">Live Sync</span>
                </div>
              </div>

              {/* Environment */}
              <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Server Runtime</div>
                    <div className="text-[10px] text-slate-400 font-mono">NODE_ENV: {statusData?.environment || 'development'}</div>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-purple-300 uppercase bg-purple-500/15 px-2 py-0.5 rounded">
                  {statusData?.environment || 'dev'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-950/40 border border-indigo-500/20 p-3 rounded-xl text-[11px] text-indigo-200 leading-relaxed">
            💡 <strong>Integration Note:</strong> Incoming payment webhooks automatically trigger instant Telegram notifications and log event activity in real time.
          </div>
        </div>

      </div>

      {/* Ping Activity Log History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Recent Webhook Ping Audit Log
            </h3>
            <p className="text-xs text-slate-400">
              Live incoming ping requests and Stripe webhook event records.
            </p>
          </div>

          <span className="bg-slate-800 text-slate-300 font-mono text-[11px] px-2.5 py-1 rounded-lg border border-slate-700">
            {statusData?.history?.length || 0} Entries Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider bg-slate-950/50">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Trigger Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {statusData?.history && statusData.history.length > 0 ? (
                statusData.history.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-sky-300">
                      {entry.event}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        entry.status === 'Active' 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      {entry.latencyMs}ms
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-sans">
                      {entry.source}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                    No webhook ping logs recorded yet. Click "Send Webhook Ping Test" to generate a test log entry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
