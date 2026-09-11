import React, { useState } from 'react';
import { Mail, X, Eye, Pencil, Send, Loader2, CheckCircle2, XCircle, Users2 } from 'lucide-react';
import { adminAuthHeaders } from '../utils/authHeaders';

interface TargetUser { id: string; name?: string; email: string; }

interface Props {
  user: TargetUser | null;
  broadcastCount?: number; // when set (and user is null), this is a broadcast-to-all-users compose
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type Stage = 'edit' | 'preview';
type SendState = 'idle' | 'sending' | 'success' | 'error';

// Admin "Send Email" workflow, launched from a specific user row (or as a
// broadcast) in the Users section: compose -> preview the real branded Axi
// template -> send -> Sending... -> Success / Failure (form preserved on
// failure so nothing typed is lost).
export default function AdminSendEmailModal({ user, broadcastCount, onClose, showToast }: Props) {
  const isBroadcast = !user;
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [stage, setStage] = useState<Stage>('edit');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendState, setSendState] = useState<SendState>('idle');
  const [resultText, setResultText] = useState('');

  const canSubmit = subject.trim().length > 0 && message.trim().length > 0;

  const loadPreview = async () => {
    if (!canSubmit) { showToast('Add a subject and message before previewing.', 'error'); return; }
    setPreviewLoading(true);
    try {
      const r = await fetch('/api/admin/email/preview', {
        method: 'POST',
        headers: await adminAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          recipientEmail: user?.email,
          recipientName: user?.name,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Unable to render preview');
      setPreviewHtml(d.html);
      setStage('preview');
    } catch (e: any) {
      showToast(e?.message || 'Unable to render preview', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSend = async () => {
    if (!canSubmit) return;
    setSendState('sending');
    setResultText('');
    try {
      const body: Record<string, any> = { subject: subject.trim(), message: message.trim() };
      if (isBroadcast) body.broadcast = true;
      else { body.recipientEmail = user!.email; body.recipientName = user!.name; }

      const r = await fetch('/api/admin/email/compose', {
        method: 'POST',
        headers: await adminAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Email dispatch failed');

      const text = isBroadcast
        ? `Broadcast sent to ${d.sent}/${d.totalRecipients} users${d.failed ? `, ${d.failed} failed` : ''}.`
        : `Email sent successfully to ${d.dispatchedTo}.`;
      setSendState('success');
      setResultText(text);
      showToast(`✉️ ${text}`, d.failed ? 'info' : 'success');
    } catch (e: any) {
      // Preserve form contents on failure so the admin doesn't lose their message.
      setSendState('error');
      setResultText(e?.message || 'Email dispatch failed');
      showToast(e?.message || 'Email dispatch failed', 'error');
    }
  };

  const disabled = sendState === 'sending';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/15 text-rose-300">
              {isBroadcast ? <Users2 className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
            </span>
            <div>
              <h3 className="text-base font-bold text-white">{isBroadcast ? 'Broadcast Email' : 'Send Email'}</h3>
              <p className="text-xs text-slate-400">
                {isBroadcast
                  ? `Will be sent to ${broadcastCount ?? 0} registered user${broadcastCount === 1 ? '' : 's'}`
                  : `${user?.name || 'Unnamed Client'} · ${user?.email}`}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={disabled} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 disabled:opacity-40"><X className="h-5 w-5" /></button>
        </div>

        {/* Stage toggle */}
        <div className="flex gap-2 border-b border-white/10 p-3">
          <button
            type="button"
            onClick={() => setStage('edit')}
            disabled={disabled}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${stage === 'edit' ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-300'}`}
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button
            type="button"
            onClick={() => void loadPreview()}
            disabled={disabled || previewLoading}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${stage === 'preview' ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-300'}`}
          >
            {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />} Preview
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[55vh] overflow-y-auto p-5">
          {stage === 'edit' ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Subject</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  disabled={disabled}
                  placeholder="e.g. Important update to your Axi account"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white placeholder:text-slate-500 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  disabled={disabled}
                  rows={9}
                  placeholder="Write your message here. It is automatically wrapped in the official Axi Trades branded email template — header, footer, support contact and styling included — so no need to add a greeting or sign-off."
                  className="w-full resize-y rounded-lg border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white placeholder:text-slate-500 disabled:opacity-60"
                />
              </div>
              {isBroadcast && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  This broadcasts immediately to every real registered user with no undo — double check the subject and message before sending.
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-white/10 bg-white">
              {previewHtml ? (
                <iframe title="Email preview" srcDoc={previewHtml} className="h-[420px] w-full bg-white" sandbox="" />
              ) : (
                <div className="flex h-[200px] items-center justify-center text-sm text-slate-500">No preview generated yet.</div>
              )}
            </div>
          )}

          {sendState === 'success' && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> {resultText || 'Email sent successfully.'}
            </div>
          )}
          {sendState === 'error' && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-300">
              <XCircle className="h-4 w-4" /> {resultText || 'Email failed to send.'}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 border-t border-white/10 p-4">
          <button type="button" onClick={onClose} disabled={disabled} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 disabled:opacity-40">
            {sendState === 'success' ? 'Close' : 'Cancel'}
          </button>
          {sendState !== 'success' && (
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!canSubmit || disabled}
              className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {sendState === 'sending' ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>) : (<><Send className="h-4 w-4" /> Send Email</>)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
