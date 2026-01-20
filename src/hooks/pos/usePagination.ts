"use client";

import { useState, useCallback, useMemo } from "react";

export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

export interface UsePaginationReturn {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setTotal: (total: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  reset: () => void;
}

/**
 * Hook for managing pagination state
 */
export function usePagination({
  initialPage = 1,
  initialLimit = 20,
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [page, setPageState] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const setPage = useCallback((newPage: number) => {
    setPageState(Math.max(1, newPage));
  }, []);

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(Math.max(1, newLimit));
    setPageState(1); // Reset to first page when limit changes
  }, []);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPageState((p) => p + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPageState((p) => p - 1);
    }
  }, [hasPreviousPage]);

  const goToPage = useCallback(
    (targetPage: number) => {
      const validPage = Math.max(1, Math.min(targetPage, totalPages));
      setPageState(validPage);
    },
    [totalPages]
  );

  const reset = useCallback(() => {
    setPageState(initialPage);
  }, [initialPage]);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    setPage,
    setLimit,
    setTotal,
    nextPage,
    previousPage,
    goToPage,
    reset,
  };
}
