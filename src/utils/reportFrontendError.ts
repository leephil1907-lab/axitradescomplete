/**
 * reportFrontendError
 * ---------------------------------------------------------------------------
 * Fire-and-forget telemetry for the global error boundary. When the UI catches
 * an uncaught frontend error it posts the REAL (English) message, stack, page
 * URL and component stack to the server, which forwards it to the admin's
 * Telegram. Never throws, never blocks the UI, never waits for the response —
 * failures are swallowed silently so diagnostics can never break the app.
 */

export interface FrontendErrorDetail {
  componentStack?: string;
}

export function reportFrontendError(error: unknown, detail?: FrontendErrorDetail): void {
  try {
    if (typeof window === 'undefined') return;
    const message = error instanceof Error ? error.message : String(error || 'Unknown error');
    const stack = error instanceof Error && error.stack ? error.stack : '';
    const payload = JSON.stringify({
      message,
      stack,
      componentStack: detail?.componentStack || '',
      url: window.location.href,
    });
    fetch('/api/client/error-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true, // ensure delivery even if the page is about to unload
    }).catch(() => {});
  } catch {
    // Diagnostics must never interfere with the app.
  }
}
