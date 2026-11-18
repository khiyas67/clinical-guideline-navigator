import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f7f4fc] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 sm:p-8 border border-purple-100 shadow-lg shadow-purple-950/5 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1a102f]">Something went wrong</h2>
              <p className="text-xs text-[#6e6284] mt-1.5 leading-relaxed">
                A display error occurred while rendering this page. You can reload or return to the dashboard.
              </p>
            </div>
            {this.state.error && (
              <div className="w-full p-3 rounded-xl bg-purple-50/60 border border-purple-100 text-[11px] font-mono text-purple-900 text-left overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="mt-2 w-full py-2.5 px-4 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
