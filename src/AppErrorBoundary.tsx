import React from 'react';
import { reportFrontendError } from './utils/reportFrontendError';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; message: string; stack?: string; recovering: boolean; }

const RETRY_KEY = 'axi_crash_auto_retry_at';

/**
 * Global error boundary. Catches uncaught React render/commit errors and shows a
 * recovery card instead of a blank/broken page.
 *
 * Behaviour:
 *  - Transient failures (e.g. an out-of-band DOM mutation such as a browser
 *    auto-translate rewrite racing a React update) self-heal with ONE automatic
 *    reload, guarded by a sessionStorage timestamp so it can never loop.
 *  - The card is wrapped in translate="no" and shows the ORIGINAL error text so
 *    browser auto-translate cannot garble the diagnostic message.
 *  - A "Copy error details" button captures the message + stack + URL + UA for
 *    support/debugging.
 */
export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '', stack: undefined, recovering: false };
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError(error: unknown): Partial<State> {
    const message = error instanceof Error ? error.message : String(error || 'Unknown application error');
    const stack = error instanceof Error ? (error.stack || undefined) : undefined;
    return { hasError: true, message, stack };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[AXI] Frontend runtime error', error, info);
    // Ping the admin via Telegram (server forwards it) with the real error
    // details, then self-heal transient failures with one auto-reload.
    reportFrontendError(error, { componentStack: info.componentStack });
    this.scheduleAutoRecovery();
  }

  componentWillUnmount() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  private applyState(patch: Partial<State>) {
    // The repo has no @types/react installed, so the Component base class is
    // untyped (resolved as `any`) and inherited methods like setState are not
    // visible to tsc. Route through a local helper instead of relying on those.
    (this as unknown as { setState(p: Partial<State>): void }).setState(patch);
  }

  private scheduleAutoRecovery() {
    // One automatic reload, at most once per 20s window, to self-heal transient
    // failures without ever reload-looping on a persistent bug.
    try {
      const last = Number(sessionStorage.getItem(RETRY_KEY) || 0);
      const now = Date.now();
      if (now - last < 20000) return;
      sessionStorage.setItem(RETRY_KEY, String(now));
    } catch {
      return;
    }
    this.applyState({ recovering: true });
    this.retryTimer = setTimeout(() => { window.location.reload(); }, 1200);
  }

  private copyDetails = () => {
    const text = [
      `Axi Trades — frontend error`,
      `Message: ${this.state.message}`,
      this.state.stack ? `Stack:\n${this.state.stack}` : '',
      `URL: ${window.location.href}`,
      `Browser: ${navigator.userAgent}`,
      `Time: ${new Date().toISOString()}`,
    ].join('\n');
    const done = () => { /* nothing else to surface */ };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => this.fallbackCopy(text));
    } else {
      this.fallbackCopy(text);
    }
  };

  private fallbackCopy(text: string) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch {
      // best effort
    }
  }

  private reload = () => window.location.reload();

  render() {
    const children = (this as React.Component<Props, State>).props.children;
    if (!this.state.hasError) return children;

    if (this.state.recovering) {
      return (
        <main className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center px-6">
          <section className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl text-center" translate="no">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-700">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#E3000F] border-t-transparent" />
            </div>
            <h1 className="text-xl font-bold text-white">Recovering…</h1>
            <p className="mt-2 text-sm text-slate-400">
              A temporary error was detected. Automatically restoring the application…
            </p>
          </section>
        </main>
      );
    }

    return (
      <main className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center px-6">
        <section className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl" translate="no">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E3000F] font-black">A</div>
            <div><h1 className="text-xl font-bold">Axi Trades</h1><p className="text-sm text-slate-400">Something went wrong</p></div>
          </div>
          <p className="text-slate-300">
            The trading interface hit an unexpected error. If this keeps happening,
            tap “Copy error details” and send it to support.
          </p>
          <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-slate-400 whitespace-pre-wrap break-words">{this.state.message || 'Unknown error'}</pre>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button onClick={this.reload} className="flex-1 rounded-lg bg-[#E3000F] px-4 py-3 font-semibold hover:bg-[#CC000D] cursor-pointer">Reload application</button>
            <button onClick={this.copyDetails} className="flex-1 rounded-lg border border-slate-700 px-4 py-3 font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer">Copy error details</button>
          </div>
        </section>
      </main>
    );
  }
}
