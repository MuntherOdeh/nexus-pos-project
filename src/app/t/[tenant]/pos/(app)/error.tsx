'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home, Bug } from 'lucide-react';

export default function PosAppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('POS App Error:', error);
    console.error('Error Digest:', error.digest);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          POS System Error
        </h1>

        <p className="text-gray-500 mb-6">
          Something went wrong while loading the POS system. This might be a temporary issue.
        </p>

        {/* Error details - always show for debugging */}
        <details className="mb-6 text-left" open>
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-2">
            <Bug className="w-4 h-4" />
            Technical Details
          </summary>
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm font-semibold text-red-600 mb-2">
              {error.name}: {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-500 mb-2">
                Error Digest: {error.digest}
              </p>
            )}
            {error.stack && (
              <pre className="text-xs text-red-500 whitespace-pre-wrap overflow-auto max-h-60 mt-2 p-2 bg-red-100 rounded">
                {error.stack}
              </pre>
            )}
          </div>
        </details>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
          >
            <RefreshCcw className="w-5 h-5" />
            Try Again
          </button>
          <a
            href="/"
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go Home
          </a>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
