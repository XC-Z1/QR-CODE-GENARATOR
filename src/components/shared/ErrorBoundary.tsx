import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected rendering error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA] dark:bg-[#0C1120] p-6">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#171B2B] dark:text-[#F5F6FC] mb-2">
              Workspace Encountered an Error
            </h2>
            <p className="text-sm text-[#747D91] dark:text-[#A4ADC1] mb-5">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#6655EE] text-white hover:bg-[#5645DD] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Studio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
