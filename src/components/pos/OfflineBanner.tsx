'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCcw } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-red-500 text-white"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
            <WifiOff className="w-5 h-5" />
            <span className="font-medium">You&apos;re offline. Some features may not work.</span>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium"
            >
              <RefreshCcw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </motion.div>
      )}

      {showReconnected && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-emerald-500 text-white"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
            <Wifi className="w-5 h-5" />
            <span className="font-medium">Back online!</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
