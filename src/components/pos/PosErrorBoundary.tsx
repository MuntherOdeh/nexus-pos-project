'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class PosErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('POS Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-[var(--pos-text)] mb-2">
              Something went wrong
            </h2>

            {/* Message */}
            <p className="text-[var(--pos-muted)] mb-6">
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>

            {/* Error details (collapsible in dev) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-[var(--pos-muted)] hover:text-[var(--pos-text)] flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Error Details
                </summary>
                <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400 overflow-auto max-h-40">
                  <p className="font-semibold">{this.state.error.name}: {this.state.error.message}</p>
                  {this.state.errorInfo && (
                    <pre className="mt-2 whitespace-pre-wrap opacity-70">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--pos-accent)] text-white font-medium hover:opacity-90 transition-opacity"
              >
                <RefreshCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[color:var(--pos-border)] text-[var(--pos-text)] font-medium hover:bg-[var(--pos-border)] transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[color:var(--pos-border)] text-[var(--pos-muted)] font-medium hover:bg-[var(--pos-border)] transition-colors"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for easier use with hooks
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <PosErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </PosErrorBoundary>
    );
  };
}
