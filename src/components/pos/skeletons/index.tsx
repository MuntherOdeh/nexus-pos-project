'use client';

import { cn } from '@/lib/utils';

// Base skeleton component with shimmer animation
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-[var(--pos-border)]',
        className
      )}
    />
  );
}

// Dashboard stat card skeleton
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// Dashboard grid skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-[var(--pos-bg)]">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Order list item skeleton
export function OrderItemSkeleton() {
  return (
    <div className="rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[color:var(--pos-border)]">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

// Order list skeleton
export function OrderListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <OrderItemSkeleton key={i} />
      ))}
    </div>
  );
}

// Product card skeleton
export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] p-4 space-y-3">
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

// Product grid skeleton
export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// KDS column skeleton
export function KdsColumnSkeleton() {
  return (
    <div className="flex-1 min-w-[300px] rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] overflow-hidden">
      <div className="p-4 border-b border-[color:var(--pos-border)]">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="p-3 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[color:var(--pos-border)] bg-[var(--pos-bg)] p-3">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// KDS view skeleton
export function KdsSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <KdsColumnSkeleton key={i} />
      ))}
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[color:var(--pos-border)] flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="p-4 border-b border-[color:var(--pos-border)] last:border-b-0 flex gap-4"
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Checkout view skeleton
export function CheckoutSkeleton() {
  return (
    <div className="h-full flex gap-4">
      {/* Left - Products */}
      <div className="flex-1 space-y-4">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>
        {/* Products Grid */}
        <ProductGridSkeleton count={12} />
      </div>

      {/* Right - Cart */}
      <div className="w-80 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] p-4 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3 flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--pos-bg)]">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
        <div className="border-t border-[color:var(--pos-border)] pt-4 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

// Inventory view skeleton
export function InventorySkeleton() {
  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1 max-w-md rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] p-4">
            <div className="flex items-start gap-3 mb-3">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[color:var(--pos-border)]">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Full page loading skeleton with spinner
export function PageLoadingSkeleton({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-10 h-10 border-3 border-[var(--pos-border)] border-t-[var(--pos-accent)] rounded-full animate-spin" />
      <p className="text-sm text-[var(--pos-muted)]">{message}</p>
    </div>
  );
}

// Customer card skeleton
export function CustomerCardSkeleton() {
  return (
    <div className="rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-[color:var(--pos-border)]">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </div>
  );
}

// Customers page skeleton
export function CustomersSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Search */}
      <Skeleton className="h-12 w-full max-w-md rounded-xl" />

      {/* Customer Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <CustomerCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Employee card skeleton
export function EmployeeCardSkeleton() {
  return (
    <div className="rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-6 w-20 rounded-lg" />
        <Skeleton className="h-6 w-16 rounded-lg" />
      </div>
    </div>
  );
}

// Employees page skeleton
export function EmployeesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[color:var(--pos-border)] pb-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-11 flex-1 max-w-md rounded-xl" />
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>

      {/* Employee Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <EmployeeCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Discount card skeleton
export function DiscountCardSkeleton() {
  return (
    <div className="rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-[color:var(--pos-border)]">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-16 rounded-lg" />
      </div>
    </div>
  );
}

// Discounts page skeleton
export function DiscountsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-16 rounded-xl" />
        <Skeleton className="h-10 w-20 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>

      {/* Search */}
      <Skeleton className="h-11 w-full max-w-md rounded-xl" />

      {/* Discount Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <DiscountCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Reports page skeleton
export function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-xl" />
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] p-6">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <TableSkeleton rows={5} cols={4} />
    </div>
  );
}

// Stock/Inventory page skeleton
export function StockSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[color:var(--pos-border)] pb-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-20" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-11 flex-1 max-w-md rounded-xl" />
        <Skeleton className="h-11 w-40 rounded-xl" />
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>

      {/* Stock Table */}
      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}
