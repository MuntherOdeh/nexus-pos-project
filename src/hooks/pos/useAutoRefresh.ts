"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface UseAutoRefreshOptions {
  /** Whether auto-refresh is enabled */
  enabled?: boolean;
  /** Interval in milliseconds between refreshes */
  intervalMs?: number;
  /** Callback to execute on each refresh */
  onRefresh: () => Promise<void>;
  /** Whether to run onRefresh immediately on mount */
  immediate?: boolean;
}

export interface UseAutoRefreshReturn {
  /** Timestamp of the last successful refresh */
  lastUpdate: Date | null;
  /** Whether a refresh is currently in progress */
  isRefreshing: boolean;
  /** Whether auto-refresh is enabled */
  isEnabled: boolean;
  /** Toggle auto-refresh on/off */
  toggle: () => void;
  /** Enable auto-refresh */
  enable: () => void;
  /** Disable auto-refresh */
  disable: () => void;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
}

/**
 * Hook for auto-refreshing data at a specified interval
 */
export function useAutoRefresh({
  enabled = true,
  intervalMs = 5000,
  onRefresh,
  immediate = true,
}: UseAutoRefreshOptions): UseAutoRefreshReturn {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEnabled, setIsEnabled] = useState(enabled);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
      if (isMountedRef.current) {
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Auto-refresh failed:", error);
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [onRefresh, isRefreshing]);

  const toggle = useCallback(() => {
    setIsEnabled((prev) => !prev);
  }, []);

  const enable = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const disable = useCallback(() => {
    setIsEnabled(false);
  }, []);

  // Setup interval
  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch if immediate
    if (immediate && isEnabled) {
      refresh();
    }

    // Setup interval
    if (isEnabled && intervalMs > 0) {
      intervalRef.current = setInterval(() => {
        refresh();
      }, intervalMs);
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isEnabled, intervalMs, immediate, refresh]);

  return {
    lastUpdate,
    isRefreshing,
    isEnabled,
    toggle,
    enable,
    disable,
    refresh,
  };
}

/**
 * Format the last update time as a relative string
 */
export function formatLastUpdate(date: Date | null): string {
  if (!date) return "Never";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  return date.toLocaleTimeString();
}
