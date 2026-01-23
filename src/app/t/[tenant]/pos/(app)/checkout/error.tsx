'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Checkout Error:', error);
    console.error('Error Digest:', error.digest);
    console.error('Error Stack:', error.stack);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-xl font-bold mb-2">
          Checkout Error
        </h2>

        <p className="text-gray-500 mb-4">
          An error occurred while loading the checkout page.
        </p>

        {/* Error details - always show for debugging */}
        <div className="mb-6 text-left p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm font-semibold text-red-500 mb-2">
            {error.name}: {error.message}
          </p>
          {error.digest && (
            <p className="text-xs text-red-400 mb-2">
              Digest: {error.digest}
            </p>
          )}
          {error.stack && (
            <pre className="text-xs text-red-400 whitespace-pre-wrap overflow-auto max-h-40">
              {error.stack}
            </pre>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
          <a
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 font-medium hover:bg-gray-100 transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
