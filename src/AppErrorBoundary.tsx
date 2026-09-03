import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };
  private readonly children: React.ReactNode;

  constructor(props: Props) {
    super(props);
    this.children = props.children;
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error || 'Unknown application error');
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[AXI] Frontend runtime error', error, info);
  }

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.children;

    return (
      <main className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center px-6">
        <section className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E3000F] font-black">A</div>
            <div>
              <h1 className="text-xl font-bold">Axi Trades</h1>
              <p className="text-sm text-slate-400">Application startup error</p>
            </div>
          </div>
          <p className="text-slate-300">The trading interface encountered an unexpected frontend error.</p>
          <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-slate-400 whitespace-pre-wrap">{this.state.message}</pre>
          <button onClick={this.reload} className="mt-6 w-full rounded-lg bg-[#E3000F] px-4 py-3 font-semibold hover:bg-[#CC000D]">Reload application</button>
        </section>
      </main>
    );
  }
}
