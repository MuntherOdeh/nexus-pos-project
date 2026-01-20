"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { Skeleton } from "../skeletons";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  /** Hide this column on mobile */
  mobileHidden?: boolean;
  /** Use this column for mobile card title */
  mobileTitle?: boolean;
  /** Use this column for mobile card subtitle */
  mobileSubtitle?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  /** Controlled sort state */
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string, dir: "asc" | "desc") => void;
  /** Pagination */
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  /** Custom class for table container */
  className?: string;
  /** Show row numbers */
  showRowNumbers?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField,
  isLoading,
  emptyState,
  onRowClick,
  sortBy: controlledSortBy,
  sortDir: controlledSortDir,
  onSort,
  pagination,
  className,
  showRowNumbers,
}: DataTableProps<T>) {
  const isMobile = useIsMobile();
  const [internalSortBy, setInternalSortBy] = useState<string | null>(null);
  const [internalSortDir, setInternalSortDir] = useState<"asc" | "desc">("asc");

  // Use controlled or internal sort state
  const sortBy = controlledSortBy ?? internalSortBy;
  const sortDir = controlledSortDir ?? internalSortDir;

  const handleSort = (key: string) => {
    const newDir = sortBy === key && sortDir === "asc" ? "desc" : "asc";

    if (onSort) {
      onSort(key, newDir);
    } else {
      setInternalSortBy(key);
      setInternalSortDir(newDir);
    }
  };

  // Sort data if using internal state
  const sortedData = useMemo(() => {
    if (!sortBy || onSort) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [data, sortBy, sortDir, onSort]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("rounded-xl border border-[var(--pos-border)] bg-[var(--pos-panel)] overflow-hidden", className)}>
        <div className="p-4 border-b border-[var(--pos-border)] flex gap-4">
          {columns.slice(0, 4).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 border-b border-[var(--pos-border)] last:border-b-0 flex gap-4">
            {columns.slice(0, 4).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  // Mobile card view
  if (isMobile) {
    const titleColumn = columns.find((c) => c.mobileTitle);
    const subtitleColumn = columns.find((c) => c.mobileSubtitle);
    const visibleColumns = columns.filter((c) => !c.mobileHidden && !c.mobileTitle && !c.mobileSubtitle);

    return (
      <div className={cn("space-y-3", className)}>
        {sortedData.map((row, index) => (
          <div
            key={String(row[keyField])}
            onClick={() => onRowClick?.(row)}
            className={cn(
              "rounded-xl border border-[var(--pos-border)] bg-[var(--pos-panel)] p-4",
              onRowClick && "cursor-pointer hover:border-[var(--pos-accent)] transition-colors"
            )}
          >
            {/* Title and subtitle */}
            {(titleColumn || subtitleColumn) && (
              <div className="mb-3">
                {titleColumn && (
                  <div className="font-semibold text-[var(--pos-text)]">
                    {titleColumn.render ? titleColumn.render(row) : String(row[titleColumn.key] ?? "")}
                  </div>
                )}
                {subtitleColumn && (
                  <div className="text-sm text-[var(--pos-muted)]">
                    {subtitleColumn.render ? subtitleColumn.render(row) : String(row[subtitleColumn.key] ?? "")}
                  </div>
                )}
              </div>
            )}

            {/* Other fields */}
            <div className="grid grid-cols-2 gap-2">
              {visibleColumns.map((column) => (
                <div key={column.key}>
                  <div className="text-xs text-[var(--pos-muted)]">{column.header}</div>
                  <div className="text-sm font-medium">
                    {column.render ? column.render(row) : String(row[column.key] ?? "-")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Mobile Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[var(--pos-border)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <span className="text-sm text-[var(--pos-muted)]">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[var(--pos-border)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={cn("rounded-xl border border-[var(--pos-border)] bg-[var(--pos-panel)] overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--pos-muted)] border-b border-[var(--pos-border)] bg-[var(--pos-bg)]">
              {showRowNumbers && (
                <th className="py-3 px-4 font-medium w-12">#</th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "py-3 px-4 font-medium",
                    column.sortable && "cursor-pointer select-none hover:text-[var(--pos-text)]",
                    column.headerClassName
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && (
                      <span className="text-[var(--pos-muted)]">
                        {sortBy === column.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr
                key={String(row[keyField])}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b border-[var(--pos-border)] last:border-b-0",
                  onRowClick && "cursor-pointer hover:bg-[var(--pos-bg)] transition-colors"
                )}
              >
                {showRowNumbers && (
                  <td className="py-3 px-4 text-[var(--pos-muted)]">
                    {pagination ? (pagination.page - 1) * 20 + index + 1 : index + 1}
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className={cn("py-3 px-4", column.className)}>
                    {column.render ? column.render(row) : String(row[column.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Desktop Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--pos-border)] bg-[var(--pos-bg)]">
          <div className="text-sm text-[var(--pos-muted)]">
            Showing {(pagination.page - 1) * 20 + 1} to{" "}
            {Math.min(pagination.page * 20, pagination.total)} of {pagination.total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg border border-[var(--pos-border)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--pos-border)]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-lg border border-[var(--pos-border)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--pos-border)]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
