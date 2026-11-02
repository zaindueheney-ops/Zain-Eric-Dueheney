import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('ErrorBoundary captured rendering notice:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#1a0309] text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#24050e] border-2 border-[#d4af37] rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950 border border-red-500/50 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Belize Alerts • Safe Mode</h2>
              <p className="text-xs text-amber-200/80 mt-1">
                A display error was prevented from crashing your session. Your reports and connection are intact.
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f59e0b] text-slate-950 font-black rounded-xl text-xs shadow hover:brightness-110 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Emergency Dashboard</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
