"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  DollarSign,
  Users,
  Search,
  Filter,
  ChefHat,
  CreditCard,
  Timer,
  MapPin,
  Eye,
  Send,
  Ban,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/pos/format";

type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  status: string;
  notes: string | null;
};

type Order = {
  id: string;
  status: string;
  orderNumber: string;
  notes: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  openedAt: string;
  sentToKitchenAt: string | null;
  closedAt: string | null;
  tableId: string | null;
  table: { id: string; name: string } | null;
  items: OrderItem[];
};

type ActiveOrdersViewProps = {
  tenant: { slug: string; name: string; currency: string };
  initialOrders: Order[];
  userRole: string;
};

function formatAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours}h ${rem}m ago` : `${hours}h ago`;
}

function getStatusInfo(status: string) {
  switch (status) {
    case "OPEN":
      return { label: "Open", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: Clock };
    case "IN_KITCHEN":
      return { label: "In Kitchen", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: ChefHat };
    case "READY":
      return { label: "Ready", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle2 };
    case "FOR_PAYMENT":
      return { label: "Awaiting Payment", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", icon: CreditCard };
    case "PAID":
      return { label: "Paid", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30", icon: CheckCircle2 };
    case "CANCELLED":
      return { label: "Cancelled", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", icon: XCircle };
    default:
      return { label: status, color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/30", icon: AlertCircle };
  }
}

export function ActiveOrdersView({ tenant, initialOrders, userRole }: ActiveOrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lastRefreshTime, setLastRefreshTime] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval] = useState(10); // seconds

  useEffect(() => {
    setLastRefreshTime(new Date().toLocaleTimeString());
    // Auto-refresh on mount to get latest data
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/pos/tenants/${tenant.slug}/orders?statusIn=OPEN,IN_KITCHEN,READY,FOR_PAYMENT`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (response.ok && data?.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
        setError(null);
        setLastRefreshTime(new Date().toLocaleTimeString());
      }
    } catch {
      setError("Unable to refresh orders.");
    } finally {
      setLoading(false);
    }
  }, [tenant.slug]);

  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const interval = setInterval(refresh, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refresh, autoRefreshEnabled, refreshInterval]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !searchQuery ||
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.table?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item) => item.productName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    // Single pass instead of 5 iterations
    let open = 0, inKitchen = 0, ready = 0, forPayment = 0, totalValue = 0;
    for (const o of orders) {
      totalValue += o.totalCents;
      switch (o.status) {
        case "OPEN": open++; break;
        case "IN_KITCHEN": inKitchen++; break;
        case "READY": ready++; break;
        case "FOR_PAYMENT": forPayment++; break;
      }
    }
    return { open, inKitchen, ready, forPayment, total: orders.length, totalValue };
  }, [orders]);

  const sendToKitchen = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders/${orderId}/send`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok && data?.success) {
        await refresh();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
      } else {
        setError(data?.error || "Failed to send to kitchen");
      }
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    setActionLoading(orderId);
    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok && data?.success) {
        await refresh();
        setSelectedOrder(null);
      } else {
        setError(data?.error || "Failed to cancel order");
      }
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const canModifyOrder = ["OWNER", "ADMIN", "MANAGER", "STAFF"].includes(userRole);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)]">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Active Orders</h1>
              <p className="text-sm text-[var(--pos-muted)]">
                {stats.total} orders - {formatMoney({ cents: stats.totalValue, currency: tenant.currency })} total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-refresh toggle */}
            <button
              type="button"
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={cn(
                "px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors border",
                autoRefreshEnabled
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  : "bg-[var(--pos-bg)] border-[var(--pos-border)] text-[var(--pos-muted)]"
              )}
            >
              {autoRefreshEnabled ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span className="hidden sm:inline">Auto ({refreshInterval}s)</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">Paused</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 text-sm text-[var(--pos-muted)]">
              <Timer className="w-4 h-4" />
              <span className="hidden md:inline">Updated:</span> {lastRefreshTime || "--:--:--"}
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-primary-500 text-white font-semibold flex items-center gap-2 hover:bg-primary-600 transition-colors shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-3 text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.open}</div>
            <div className="text-xs text-[var(--pos-muted)]">Open</div>
          </div>
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-center">
            <div className="text-2xl font-bold text-amber-500">{stats.inKitchen}</div>
            <div className="text-xs text-[var(--pos-muted)]">In Kitchen</div>
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-center">
            <div className="text-2xl font-bold text-emerald-500">{stats.ready}</div>
            <div className="text-xs text-[var(--pos-muted)]">Ready</div>
          </div>
          <div className="rounded-xl bg-purple-500/10 border border-purple-500/30 p-3 text-center">
            <div className="text-2xl font-bold text-purple-500">{stats.forPayment}</div>
            <div className="text-xs text-[var(--pos-muted)]">For Payment</div>
          </div>
          <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-[var(--pos-muted)]">Total Active</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 p-4 border-b border-[color:var(--pos-border)] bg-[var(--pos-bg)]">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pos-muted)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders, tables, or items..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] text-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "All" },
              { key: "OPEN", label: "Open" },
              { key: "IN_KITCHEN", label: "Kitchen" },
              { key: "READY", label: "Ready" },
              { key: "FOR_PAYMENT", label: "Payment" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={cn(
                  "px-4 py-3 rounded-xl font-medium transition-colors",
                  statusFilter === f.key
                    ? "bg-primary-500 text-white"
                    : "border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] hover:bg-[var(--pos-bg)]"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Order List - Table View */}
        <div className="flex-1 overflow-auto">
          {filteredOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 rounded-3xl bg-cyan-500/10 flex items-center justify-center mb-6">
                <Clock className="w-12 h-12 text-cyan-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Active Orders</h2>
              <p className="text-[var(--pos-muted)] max-w-md">
                {searchQuery || statusFilter !== "all"
                  ? "No orders match your filters. Try adjusting your search."
                  : "Orders will appear here when created from the POS."}
              </p>
            </div>
          ) : (
            <div className="p-4">
              <div className="rounded-xl border border-[var(--pos-border)] bg-[var(--pos-panel)] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-[var(--pos-muted)] border-b border-[var(--pos-border)] bg-[var(--pos-bg)]">
                      <th className="py-3 px-4 font-medium">#</th>
                      <th className="py-3 px-4 font-medium">Order</th>
                      <th className="py-3 px-4 font-medium">Table</th>
                      <th className="py-3 px-4 font-medium">Items</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium">Time</th>
                      <th className="py-3 px-4 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, index) => {
                      const statusInfo = getStatusInfo(order.status);
                      const StatusIcon = statusInfo.icon;
                      const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

                      return (
                        <tr
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={cn(
                            "border-b border-[var(--pos-border)] last:border-b-0 cursor-pointer transition-colors",
                            selectedOrder?.id === order.id
                              ? "bg-primary-500/10"
                              : "hover:bg-[var(--pos-bg)]"
                          )}
                        >
                          <td className="py-3 px-4 text-[var(--pos-muted)] text-sm">{index + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-mono text-sm">{order.orderNumber.slice(-8)}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">
                              {order.table ? order.table.name : "Quick Sale"}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{itemCount}</span>
                              <span className="text-[var(--pos-muted)] text-sm">
                                {order.items.slice(0, 2).map(i => i.productName).join(", ")}
                                {order.items.length > 2 && ` +${order.items.length - 2}`}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold",
                                statusInfo.bg,
                                statusInfo.color
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-[var(--pos-muted)]">
                            {formatAge(order.openedAt)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-lg">
                              {formatMoney({ cents: order.totalCents, currency: order.currency })}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedOrder && (
          <div className="w-[400px] flex-shrink-0 border-l border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] overflow-auto">
            <div className="p-6 space-y-6">
              {/* Order Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-sm text-[var(--pos-muted)]">
                    {selectedOrder.orderNumber}
                  </div>
                  <h2 className="text-xl font-bold mt-1">
                    {selectedOrder.table ? `Table ${selectedOrder.table.name}` : "Quick Sale"}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-xl hover:bg-[var(--pos-border)] transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Status */}
              {(() => {
                const statusInfo = getStatusInfo(selectedOrder.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <div
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border",
                      statusInfo.bg,
                      statusInfo.border
                    )}
                  >
                    <StatusIcon className={cn("w-6 h-6", statusInfo.color)} />
                    <div>
                      <div className={cn("font-bold", statusInfo.color)}>{statusInfo.label}</div>
                      <div className="text-xs text-[var(--pos-muted)]">
                        Opened {formatAge(selectedOrder.openedAt)}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Items */}
              <div className="rounded-xl border border-[color:var(--pos-border)] overflow-hidden">
                <div className="px-4 py-3 bg-[var(--pos-bg)] text-sm font-medium text-[var(--pos-muted)]">
                  Order Items ({selectedOrder.items.length})
                </div>
                <div className="divide-y divide-[color:var(--pos-border)]">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium">
                          {item.quantity}x {item.productName}
                        </div>
                        {item.notes && (
                          <div className="text-xs text-amber-500 mt-1">{item.notes}</div>
                        )}
                      </div>
                      <div className="font-bold">
                        {formatMoney({ cents: item.unitPriceCents * item.quantity, currency: selectedOrder.currency })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="rounded-xl border border-[color:var(--pos-border)] p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--pos-muted)]">Subtotal</span>
                  <span>{formatMoney({ cents: selectedOrder.subtotalCents, currency: selectedOrder.currency })}</span>
                </div>
                {selectedOrder.discountCents > 0 && (
                  <div className="flex justify-between text-sm text-emerald-500">
                    <span>Discount</span>
                    <span>-{formatMoney({ cents: selectedOrder.discountCents, currency: selectedOrder.currency })}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--pos-muted)]">Tax</span>
                  <span>{formatMoney({ cents: selectedOrder.taxCents, currency: selectedOrder.currency })}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[color:var(--pos-border)]">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-bold">
                    {formatMoney({ cents: selectedOrder.totalCents, currency: selectedOrder.currency })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {canModifyOrder && (
                <div className="space-y-3">
                  {selectedOrder.status === "OPEN" && selectedOrder.items.length > 0 && (
                    <button
                      onClick={() => sendToKitchen(selectedOrder.id)}
                      disabled={actionLoading === selectedOrder.id}
                      className="w-full px-4 py-3 rounded-xl bg-amber-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === selectedOrder.id ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send to Kitchen
                        </>
                      )}
                    </button>
                  )}

                  {["OPEN", "IN_KITCHEN", "READY"].includes(selectedOrder.status) && (
                    <button
                      onClick={() => cancelOrder(selectedOrder.id)}
                      disabled={actionLoading === selectedOrder.id}
                      className="w-full px-4 py-3 rounded-xl border border-red-500/30 text-red-500 font-semibold flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      <Ban className="w-5 h-5" />
                      Cancel Order
                    </button>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="rounded-xl border border-[color:var(--pos-border)] p-4">
                  <div className="text-sm font-medium text-[var(--pos-muted)] mb-2">Notes</div>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
