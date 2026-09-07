import React from 'react';
import { reportFrontendError } from '../utils/reportFrontendError';

interface Props {
  children: React.ReactNode;
  /** When the active view changes, the boundary is intentionally reset so a
   *  stale failure in the previous view never blocks the new one. */
  viewKey: string;
}
interface State { hasError: boolean; message: string; }

/**
 * Per-view error boundary. If a single view (Home, Markets, Dashboard …) throws
 * while rendering, ONLY that view collapses into a compact recovery card — the
 * header, footer, navigation and the rest of the shell keep working, so users
 * can always leave the broken view. This prevents the whole application from
 * ever dead-ending on one screen (the old global behaviour).
 *
 * Resets automatically whenever `viewKey` changes, and reports the real error
 * to the server so the admin is alerted (same channel as the global boundary).
 */
export default class ViewErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  // The repo has no @types/react installed, so the Component base class is
  // untyped and inherited members are invisible to tsc — access them via casts.
  private get propsTyped(): Props { return (this as unknown as { props: Props }).props; }
  private applyState(patch: Partial<State>) {
    (this as unknown as { setState(p: Partial<State>): void }).setState(patch);
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error || 'Unknown error');
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[AXI] View render error', error, info);
    reportFrontendError(error, { componentStack: info.componentStack });
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.viewKey !== this.propsTyped.viewKey && this.state.hasError) {
      this.applyState({ hasError: false, message: '' });
    }
  }

  private retry = () => this.applyState({ hasError: false, message: '' });

  render() {
    if (!this.state.hasError) return this.propsTyped.children;
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center px-6 py-16" translate="no">
        <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E3000F] font-black text-white">A</div>
          <h2 className="text-base font-bold text-white">This section hit a problem</h2>
          <p className="mt-1.5 text-xs text-slate-400 break-words">{this.state.message}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={this.retry}
              className="flex-1 rounded-lg bg-[#E3000F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#CC000D] cursor-pointer"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
