"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Search,
  Truck,
  Package,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  ArrowLeftRight,
  Filter,
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Warehouse,
  Box,
  MoreHorizontal,
  ChevronRight,
  MapPin,
  User,
  Hash,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  X,
  Info,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type MovementLine = {
  productName: string;
  sku?: string | null;
  quantity: number;
};

type MovementRow = {
  id: string;
  type: string;
  status: string;
  reference: string;
  warehouseName: string;
  notes?: string | null;
  createdAt: string;
  lines: MovementLine[];
};

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

const STATUS_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  label: string;
  borderColor: string;
}> = {
  DRAFT: {
    icon: FileText,
    color: "text-slate-500",
    bgColor: "bg-slate-500/10",
    label: "Draft",
    borderColor: "border-slate-500/30",
  },
  PENDING: {
    icon: Clock,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    label: "Pending",
    borderColor: "border-amber-500/30",
  },
  IN_PROGRESS: {
    icon: RefreshCw,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    label: "In Progress",
    borderColor: "border-blue-500/30",
  },
  DONE: {
    icon: CheckCircle2,
    color: "text-primary-500",
    bgColor: "bg-primary-500/10",
    label: "Done",
    borderColor: "border-primary-500/30",
  },
  CANCELLED: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Cancelled",
    borderColor: "border-red-500/30",
  },
};

const TYPE_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  label: string;
}> = {
  RECEIPT: {
    icon: ArrowDownToLine,
    color: "text-primary-500",
    bgColor: "bg-primary-500/10",
    label: "Receipt"
  },
  DELIVERY: {
    icon: ArrowUpFromLine,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    label: "Delivery"
  },
  ADJUSTMENT: {
    icon: RefreshCw,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    label: "Adjustment"
  },
  TRANSFER: {
    icon: ArrowLeftRight,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    label: "Transfer"
  },
};

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  const Icon = config.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border",
      config.bgColor, config.color, config.borderColor
    )}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

// ============================================================================
// TYPE BADGE COMPONENT
// ============================================================================

function TypeBadge({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.ADJUSTMENT;
  const Icon = config.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
      config.bgColor, config.color
    )}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

// ============================================================================
// MAIN LOGISTICS VIEW
// ============================================================================

export function LogisticsView({ movements }: { movements: MovementRow[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [toast]);

  const showComingSoon = (feature: string) => {
    setToast(`${feature} - Coming soon!`);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return movements.filter((m) => {
      const matchesQuery = !q || m.reference.toLowerCase().includes(q) || m.warehouseName.toLowerCase().includes(q);
      const matchesType = type === "ALL" ? true : m.type === type;
      const matchesStatus = status === "ALL" ? true : m.status === status;
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [movements, query, type, status]);

  const selected = useMemo(
    () => filtered.find((m) => m.id === selectedId) || null,
    [filtered, selectedId]
  );

  // Calculate stats
  const stats = useMemo(() => {
    const receipts = movements.filter(m => m.type === "RECEIPT").length;
    const deliveries = movements.filter(m => m.type === "DELIVERY").length;
    const pending = movements.filter(m => m.status === "PENDING" || m.status === "IN_PROGRESS").length;
    const completed = movements.filter(m => m.status === "DONE").length;
    return { receipts, deliveries, pending, completed };
  }, [movements]);

  // If no movements, show empty state
  if (movements.length === 0) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Logistics</h1>
                <p className="text-sm text-[var(--pos-muted)]">
                  Manage stock movements and transfers
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-32 h-32 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-6">
            <Truck className="w-16 h-16 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Stock Movements Yet</h2>
          <p className="text-[var(--pos-muted)] max-w-md mb-8">
            Stock movements will appear here when you receive inventory, make deliveries,
            or transfer stock between locations.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
            <button
              onClick={() => showComingSoon("Receive Stock")}
              className="p-4 rounded-xl border border-[color:var(--pos-border)] hover:border-primary-500 hover:bg-primary-500/5 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-500/20 transition-colors">
                <ArrowDownToLine className="w-6 h-6 text-primary-500" />
              </div>
              <div className="font-medium">Receive Stock</div>
              <div className="text-xs text-[var(--pos-muted)] mt-1">Record incoming goods</div>
            </button>

            <button
              onClick={() => showComingSoon("Ship Order")}
              className="p-4 rounded-xl border border-[color:var(--pos-border)] hover:border-blue-500 hover:bg-blue-500/5 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/20 transition-colors">
                <ArrowUpFromLine className="w-6 h-6 text-blue-500" />
              </div>
              <div className="font-medium">Ship Order</div>
              <div className="text-xs text-[var(--pos-muted)] mt-1">Record outgoing goods</div>
            </button>

            <button
              onClick={() => showComingSoon("Transfer Stock")}
              className="p-4 rounded-xl border border-[color:var(--pos-border)] hover:border-purple-500 hover:bg-purple-500/5 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-500/20 transition-colors">
                <ArrowLeftRight className="w-6 h-6 text-purple-500" />
              </div>
              <div className="font-medium">Transfer</div>
              <div className="text-xs text-[var(--pos-muted)] mt-1">Move between locations</div>
            </button>

            <button
              onClick={() => showComingSoon("Stock Adjustment")}
              className="p-4 rounded-xl border border-[color:var(--pos-border)] hover:border-amber-500 hover:bg-amber-500/5 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-500/20 transition-colors">
                <RefreshCw className="w-6 h-6 text-amber-500" />
              </div>
              <div className="font-medium">Adjust</div>
              <div className="text-xs text-[var(--pos-muted)] mt-1">Correct stock levels</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)]">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Logistics</h1>
              <p className="text-sm text-[var(--pos-muted)]">
                {movements.length} stock movements
              </p>
            </div>
          </div>

          <button
            onClick={() => showComingSoon("New Movement")}
            className="px-5 py-3 rounded-xl bg-primary-500 text-white font-semibold flex items-center gap-2 hover:bg-primary-600 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            New Movement
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4">
            <div className="flex items-center gap-2 text-primary-500 text-sm mb-1">
              <ArrowDownToLine className="w-4 h-4" />
              Receipts
            </div>
            <div className="text-2xl font-bold">{stats.receipts}</div>
          </div>
          <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4">
            <div className="flex items-center gap-2 text-blue-500 text-sm mb-1">
              <ArrowUpFromLine className="w-4 h-4" />
              Deliveries
            </div>
            <div className="text-2xl font-bold">{stats.deliveries}</div>
          </div>
          <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4">
            <div className="flex items-center gap-2 text-amber-500 text-sm mb-1">
              <Clock className="w-4 h-4" />
              Pending
            </div>
            <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
          </div>
          <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4">
            <div className="flex items-center gap-2 text-primary-500 text-sm mb-1">
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </div>
            <div className="text-2xl font-bold text-primary-500">{stats.completed}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 p-4 border-b border-[color:var(--pos-border)] bg-[var(--pos-bg)]">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pos-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by reference or warehouse..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] text-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Types</option>
            <option value="RECEIPT">Receipts</option>
            <option value="DELIVERY">Deliveries</option>
            <option value="ADJUSTMENT">Adjustments</option>
            <option value="TRANSFER">Transfers</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Movement List */}
        <div className="flex-1 overflow-auto border-r border-[color:var(--pos-border)]">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <Search className="w-16 h-16 text-[var(--pos-muted)] mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Results</h3>
              <p className="text-[var(--pos-muted)]">No movements match your search criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-[color:var(--pos-border)]">
              {filtered.map((m) => {
                const typeConfig = TYPE_CONFIG[m.type] || TYPE_CONFIG.ADJUSTMENT;
                const TypeIcon = typeConfig.icon;
                const isSelected = m.id === selectedId;

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={cn(
                      "w-full p-4 text-left transition-colors hover:bg-[var(--pos-bg)]",
                      isSelected && "bg-primary-500/5 border-l-4 border-l-primary-500"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                        typeConfig.bgColor
                      )}>
                        <TypeIcon className={cn("w-6 h-6", typeConfig.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-mono text-sm text-[var(--pos-muted)]">{m.reference}</div>
                            <div className="font-semibold mt-0.5">{typeConfig.label}</div>
                          </div>
                          <StatusBadge status={m.status} />
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm text-[var(--pos-muted)]">
                          <span className="flex items-center gap-1">
                            <Warehouse className="w-3.5 h-3.5" />
                            {m.warehouseName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />
                            {m.lines.length} items
                          </span>
                          <span className="flex items-center gap-1" suppressHydrationWarning>
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(m.createdAt)}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className={cn(
                        "w-5 h-5 text-[var(--pos-muted)] flex-shrink-0 transition-transform",
                        isSelected && "rotate-90"
                      )} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="w-[400px] flex-shrink-0 overflow-auto bg-[var(--pos-panel-solid)]">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <Eye className="w-16 h-16 text-[var(--pos-muted)] mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Movement</h3>
              <p className="text-sm text-[var(--pos-muted)]">Click on a movement to view details</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Movement Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-sm text-[var(--pos-muted)]">{selected.reference}</div>
                  <h2 className="text-xl font-bold mt-1">
                    {TYPE_CONFIG[selected.type]?.label || selected.type}
                  </h2>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4">
                  <div className="flex items-center gap-2 text-xs text-[var(--pos-muted)] mb-1">
                    <Warehouse className="w-3.5 h-3.5" />
                    Warehouse
                  </div>
                  <div className="font-semibold">{selected.warehouseName}</div>
                </div>
                <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4" suppressHydrationWarning>
                  <div className="flex items-center gap-2 text-xs text-[var(--pos-muted)] mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Date
                  </div>
                  <div className="font-semibold">{formatDate(selected.createdAt)}</div>
                </div>
              </div>

              {/* Notes */}
              {selected.notes && (
                <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4">
                  <div className="flex items-center gap-2 text-xs text-[var(--pos-muted)] mb-2">
                    <FileText className="w-3.5 h-3.5" />
                    Notes
                  </div>
                  <div className="text-sm">{selected.notes}</div>
                </div>
              )}

              {/* Line Items */}
              <div className="rounded-xl border border-[color:var(--pos-border)] overflow-hidden">
                <div className="px-4 py-3 bg-[var(--pos-bg)] text-sm font-medium text-[var(--pos-muted)] flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Line Items ({selected.lines.length})
                </div>
                <div className="divide-y divide-[color:var(--pos-border)]">
                  {selected.lines.length > 0 ? (
                    selected.lines.map((line, idx) => (
                      <div key={`${line.productName}-${idx}`} className="px-4 py-3 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{line.productName}</div>
                          {line.sku && (
                            <div className="text-xs text-[var(--pos-muted)] font-mono mt-0.5">{line.sku}</div>
                          )}
                        </div>
                        <div className={cn(
                          "font-bold text-lg",
                          line.quantity > 0 ? "text-primary-500" : "text-red-500"
                        )}>
                          {line.quantity > 0 ? `+${line.quantity}` : line.quantity}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-sm text-[var(--pos-muted)] text-center">
                      <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No line items
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selected.status !== "DONE" && selected.status !== "CANCELLED" && (
                <div className="grid grid-cols-2 gap-3 pt-4">
                  {selected.status === "DRAFT" && (
                    <>
                      <button
                        onClick={() => showComingSoon("Edit Movement")}
                        className="px-4 py-3 rounded-xl border border-[color:var(--pos-border)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--pos-bg)] transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => showComingSoon("Validate Movement")}
                        className="px-4 py-3 rounded-xl bg-primary-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Validate
                      </button>
                    </>
                  )}
                  {(selected.status === "PENDING" || selected.status === "IN_PROGRESS") && (
                    <button
                      onClick={() => showComingSoon("Mark as Done")}
                      className="col-span-2 px-4 py-3 rounded-xl bg-primary-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark as Done
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="px-6 py-3 rounded-2xl bg-[var(--pos-panel-solid)] border border-[color:var(--pos-border)] shadow-xl flex items-center gap-3">
            <Info className="w-5 h-5 text-primary-500" />
            <span className="font-medium">{toast}</span>
            <button onClick={() => setToast(null)} className="p-1 rounded-lg hover:bg-[var(--pos-border)]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
