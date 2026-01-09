"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, CreditCard, RefreshCw, Send, ShoppingCart, Wallet, X, Plus, Minus, Search, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/pos/format";
import { PosCard, PosCardContent, PosCardHeader } from "@/components/pos/PosCard";
import { StatusBadge } from "@/components/pos/StatusBadge";

type Floor = {
  id: string;
  name: string;
  sortOrder: number;
  tables: Array<{
    id: string;
    name: string;
    capacity: number;
    x: number;
    y: number;
    width: number;
    height: number;
    shape: "RECT" | "ROUND";
  }>;
};

type CatalogProduct = {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  categoryId: string | null;
};

type CatalogCategory = {
  id: string;
  name: string;
  sortOrder: number;
  products: CatalogProduct[];
};

type OpenOrderSummary = {
  id: string;
  tableId: string | null;
  status: string;
  orderNumber: string;
  totalCents: number;
  currency: string;
  openedAt: string;
};

type OrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  status: string;
  notes: string | null;
};

type OrderPayment = {
  id: string;
  provider: string;
  status: string;
  amountCents: number;
};

type OrderDetail = {
  id: string;
  status: string;
  orderNumber: string;
  notes: string | null;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  openedAt: string;
  table: { id: string; name: string; capacity: number } | null;
  items: OrderItem[];
  payments: OrderPayment[];
};

type PayProvider = "CASH" | "CARD" | "BANK" | "PAYPAL";

const PAY_PROVIDERS: Array<{
  key: PayProvider;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  { key: "CASH", label: "Cash", description: "Record cash received", icon: Wallet, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { key: "CARD", label: "Card", description: "Credit or debit card", icon: CreditCard, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { key: "BANK", label: "Bank", description: "Bank transfer", icon: CheckCircle2, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  { key: "PAYPAL", label: "PayPal", description: "PayPal payment", icon: CheckCircle2, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
];

function tableSurface(status?: string | null): string {
  switch (status) {
    case "IN_KITCHEN":
      return "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 shadow-amber-500/5";
    case "READY":
      return "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 shadow-emerald-500/5";
    case "FOR_PAYMENT":
      return "border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/15 shadow-blue-500/5";
    case "OPEN":
      return "border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/15 shadow-purple-500/5";
    default:
      return "border-[color:var(--pos-border)] bg-[var(--pos-bg)] hover:bg-[var(--pos-border)] shadow-sm";
  }
}

function safeParseMoneyToCents(input: string): number | null {
  const normalized = input.replace(/,/g, ".").trim();
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

export function CheckoutView({
  tenant,
  floors,
  catalog,
  initialOpenOrders,
}: {
  tenant: { id: string; slug: string; name: string; currency: string; industry: string };
  floors: Floor[];
  catalog: { categories: CatalogCategory[]; uncategorized: CatalogProduct[] };
  initialOpenOrders: OpenOrderSummary[];
}) {
  const [activeFloorId, setActiveFloorId] = useState<string>(() => floors[0]?.id ?? "");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<OrderDetail | null>(null);
  const [openOrders, setOpenOrders] = useState<OpenOrderSummary[]>(initialOpenOrders);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payProvider, setPayProvider] = useState<PayProvider>("CASH");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [menuQuery, setMenuQuery] = useState("");

  const activeFloor = useMemo(
    () => floors.find((f) => f.id === activeFloorId) ?? floors[0],
    [floors, activeFloorId]
  );

  const openOrderByTable = useMemo(() => {
    const map = new Map<string, OpenOrderSummary>();
    for (const order of openOrders) {
      if (order.tableId) map.set(order.tableId, order);
    }
    return map;
  }, [openOrders]);

  const paidCents = useMemo(() => {
    if (!activeOrder) return 0;
    return activeOrder.payments
      .filter((p) => p.status === "CAPTURED")
      .reduce((sum, p) => sum + p.amountCents, 0);
  }, [activeOrder]);

  const outstandingCents = useMemo(() => {
    if (!activeOrder) return 0;
    return Math.max(0, activeOrder.totalCents - paidCents);
  }, [activeOrder, paidCents]);

  const canSendToKitchen = useMemo(() => {
    if (!activeOrder) return false;
    return activeOrder.items.some((i) => i.status === "NEW") && activeOrder.items.some((i) => i.status !== "VOID");
  }, [activeOrder]);

  const canPay = useMemo(() => {
    if (!activeOrder) return false;
    if (activeOrder.status === "PAID" || activeOrder.status === "CANCELLED") return false;
    return outstandingCents > 0;
  }, [activeOrder, outstandingCents]);

  const filteredCatalog = useMemo(() => {
    const q = menuQuery.trim().toLowerCase();
    if (!q) return catalog;
    return {
      categories: catalog.categories
        .map((c) => ({ ...c, products: c.products.filter((p) => p.name.toLowerCase().includes(q)) }))
        .filter((c) => c.products.length > 0),
      uncategorized: catalog.uncategorized.filter((p) => p.name.toLowerCase().includes(q)),
    };
  }, [catalog, menuQuery]);

  const refreshOpenOrders = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/pos/tenants/${tenant.slug}/orders?statusIn=OPEN,IN_KITCHEN,READY,FOR_PAYMENT`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (response.ok && data?.success && Array.isArray(data.orders)) {
        setOpenOrders(data.orders);
      }
    } catch {
      // Ignore polling failures
    }
  }, [tenant.slug]);

  const refreshOrder = useCallback(async (orderId: string) => {
    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders/${orderId}`, { cache: "no-store" });
      const data = await response.json();
      if (response.ok && data?.success && data?.order?.id === orderId) {
        setActiveOrder(data.order);
      }
    } catch {
      // Ignore polling failures
    }
  }, [tenant.slug]);

  useEffect(() => {
    let mounted = true;
    const orderId = activeOrder?.id;
    const tick = async () => {
      if (!mounted) return;
      await refreshOpenOrders();
      if (orderId) await refreshOrder(orderId);
    };

    tick();
    const interval = window.setInterval(tick, 4500);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [activeOrder?.id, refreshOpenOrders, refreshOrder]);

  const openTable = async (tableId: string) => {
    setError(null);
    setToast(null);
    setSelectedTableId(tableId);
    setBusyKey(`table:${tableId}`);

    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        setError(data?.error || "Unable to open table");
        return;
      }

      const id: string | undefined = data?.order?.id || data?.orderId;
      if (!id) {
        setError("Unable to open order");
        return;
      }

      if (data?.order) setActiveOrder(data.order);
      else await refreshOrder(id);

      await refreshOpenOrders();
    } finally {
      setBusyKey(null);
    }
  };

  const startQuickSale = async () => {
    setError(null);
    setToast(null);
    setSelectedTableId(null);
    setBusyKey("quick-sale");

    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: null }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success || !data?.order?.id) {
        setError(data?.error || "Unable to start quick sale");
        return;
      }
      setActiveOrder(data.order);
      await refreshOpenOrders();
    } finally {
      setBusyKey(null);
    }
  };

  const addProduct = async (productId: string) => {
    if (!activeOrder?.id) {
      setError("Select a table or start a quick sale first.");
      return;
    }

    setError(null);
    setToast(null);
    setBusyKey(`add:${productId}`);
    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders/${activeOrder.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        setError(data?.error || "Unable to add item");
        return;
      }
      setActiveOrder(data.order);
      await refreshOpenOrders();
    } finally {
      setBusyKey(null);
    }
  };

  const patchItem = async (itemId: string, patch: Record<string, unknown>) => {
    if (!activeOrder?.id) return;
    setBusyKey(`item:${itemId}`);
    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders/${activeOrder.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        setError(data?.error || "Unable to update item");
        return;
      }
      setActiveOrder(data.order);
      await refreshOpenOrders();
    } finally {
      setBusyKey(null);
    }
  };

  const sendToKitchen = async () => {
    if (!activeOrder?.id) return;
    setError(null);
    setToast(null);
    setBusyKey("send");

    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders/${activeOrder.id}/send`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        setError(data?.error || "Unable to send to kitchen");
        return;
      }
      setActiveOrder(data.order);
      setToast("Order sent to kitchen!");
      await refreshOpenOrders();
    } finally {
      setBusyKey(null);
    }
  };

  const cancelOrder = async () => {
    if (!activeOrder?.id) return;
    setError(null);
    setToast(null);
    setBusyKey("cancel");

    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders/${activeOrder.id}/cancel`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        setError(data?.error || "Unable to cancel order");
        return;
      }
      setActiveOrder(null);
      setSelectedTableId(null);
      setToast("Order cancelled.");
      await refreshOpenOrders();
    } finally {
      setBusyKey(null);
    }
  };

  const openPay = () => {
    if (!activeOrder) return;
    setPayProvider("CASH");
    setCashReceived((outstandingCents / 100).toFixed(2));
    setPayOpen(true);
  };

  const confirmPay = async () => {
    if (!activeOrder?.id || !canPay) return;
    setError(null);
    setToast(null);
    setBusyKey("pay");

    try {
      const requestedCents =
        payProvider === "CASH" ? safeParseMoneyToCents(cashReceived) ?? outstandingCents : outstandingCents;
      if (!requestedCents || requestedCents < 1) {
        setError("Enter a valid amount.");
        return;
      }

      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders/${activeOrder.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: payProvider, amountCents: requestedCents }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success || !data?.order) {
        setError(data?.error || "Payment failed");
        return;
      }

      setActiveOrder(data.order);
      const changeDueCents = typeof data.changeDueCents === "number" ? data.changeDueCents : 0;
      setToast(
        changeDueCents > 0
          ? `Payment captured! Change due: ${formatMoney({ cents: changeDueCents, currency: data.order.currency })}`
          : "Payment captured!"
      );
      setPayOpen(false);
      await refreshOpenOrders();
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Point of Sale</h1>
          <p className="text-sm text-[var(--pos-muted)] mt-1">
            Manage orders for <span className="font-medium text-[var(--pos-text)]">{tenant.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={startQuickSale}
            disabled={busyKey === "quick-sale"}
            className="px-5 py-2.5 rounded-xl bg-[var(--pos-accent)] text-white font-semibold text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-[var(--pos-accent)]/20"
          >
            <Plus className="w-4 h-4" />
            Quick Sale
          </button>
          <button
            type="button"
            onClick={refreshOpenOrders}
            className="p-2.5 rounded-xl border border-[color:var(--pos-border)] hover:bg-[var(--pos-border)] transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-[var(--pos-muted)]" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {(error || toast) && (
        <div
          className={cn(
            "rounded-xl border p-4 text-sm flex items-center gap-3",
            error
              ? "bg-red-500/10 border-red-500/20 text-red-600"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
          )}
        >
          {error ? <X className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          {error || toast}
        </div>
      )}

      <div className="grid xl:grid-cols-12 gap-6">
        {/* Floor plan */}
        <PosCard className="xl:col-span-5">
          <PosCardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="font-semibold">Floor Plan</div>
                  <div className="text-xs text-[var(--pos-muted)]">Select a table</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {floors.map((floor) => (
                  <button
                    key={floor.id}
                    type="button"
                    onClick={() => setActiveFloorId(floor.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                      floor.id === activeFloor?.id
                        ? "bg-[var(--pos-accent)] text-white shadow-lg shadow-[var(--pos-accent)]/20"
                        : "border border-[color:var(--pos-border)] hover:bg-[var(--pos-border)] text-[var(--pos-muted)]"
                    )}
                  >
                    {floor.name}
                  </button>
                ))}
              </div>
            </div>
          </PosCardHeader>
          <PosCardContent>
            <div className="rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] overflow-auto">
              <div className="relative w-[800px] h-[520px] p-4">
                {activeFloor?.tables.map((table) => {
                  const order = openOrderByTable.get(table.id);
                  const selected = selectedTableId === table.id;
                  const isBusy = busyKey === `table:${table.id}`;

                  return (
                    <button
                      key={table.id}
                      type="button"
                      disabled={isBusy}
                      onClick={() => openTable(table.id)}
                      className={cn(
                        "absolute border-2 shadow-lg text-left transition-all focus:outline-none",
                        "focus:ring-2 focus:ring-[var(--pos-accent)] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-wait",
                        tableSurface(order?.status),
                        table.shape === "ROUND" ? "rounded-full" : "rounded-2xl",
                        selected ? "ring-2 ring-[var(--pos-accent)] ring-offset-2" : ""
                      )}
                      style={{
                        left: table.x,
                        top: table.y,
                        width: table.width,
                        height: table.height,
                      }}
                    >
                      <div className="h-full w-full p-3 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-sm truncate">{table.name}</div>
                            <div className="text-[11px] text-[var(--pos-muted)]">{table.capacity} seats</div>
                          </div>
                          {order && <StatusBadge status={order.status} />}
                        </div>

                        {order ? (
                          <div className="flex items-end justify-between gap-2">
                            <div className="text-[11px] text-[var(--pos-muted)] font-mono truncate">
                              #{order.orderNumber.slice(-4)}
                            </div>
                            <div className="text-sm font-bold text-[var(--pos-accent)]">
                              {formatMoney({ cents: order.totalCents, currency: order.currency })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-[var(--pos-muted)]">Available</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </PosCardContent>
        </PosCard>

        {/* Order panel */}
        <PosCard className="xl:col-span-3">
          <PosCardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <div className="font-semibold">Current Order</div>
                  <div className="text-xs text-[var(--pos-muted)]">
                    {activeOrder?.table
                      ? `Table ${activeOrder.table.name}`
                      : activeOrder
                        ? "Quick sale"
                        : "No order"}
                  </div>
                </div>
              </div>
              {activeOrder && <StatusBadge status={activeOrder.status} />}
            </div>
          </PosCardHeader>
          <PosCardContent>
            {!activeOrder ? (
              <div className="rounded-xl border border-dashed border-[color:var(--pos-border)] bg-[var(--pos-bg)] p-6 text-center">
                <ShoppingCart className="w-12 h-12 mx-auto text-[var(--pos-muted)] mb-4" />
                <div className="font-semibold mb-1">No Active Order</div>
                <div className="text-sm text-[var(--pos-muted)] mb-4">
                  Select a table or start a quick sale
                </div>
                <button
                  type="button"
                  onClick={startQuickSale}
                  disabled={busyKey === "quick-sale"}
                  className="px-5 py-2.5 rounded-xl bg-[var(--pos-accent)] text-white font-semibold text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  Start Quick Sale
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Order Info */}
                <div className="rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] p-3 flex items-center justify-between">
                  <div className="text-xs text-[var(--pos-muted)]">Order #{activeOrder.orderNumber.slice(-6)}</div>
                  <div className="text-xs font-medium">{activeOrder.currency}</div>
                </div>

                {/* Items List */}
                <div className="rounded-xl border border-[color:var(--pos-border)] overflow-hidden">
                  <div className="p-3 border-b border-[color:var(--pos-border)] bg-[var(--pos-bg)] flex items-center justify-between">
                    <div className="text-sm font-semibold">Items</div>
                    <div className="text-xs text-[var(--pos-muted)] bg-[var(--pos-border)] px-2 py-0.5 rounded-full">
                      {activeOrder.items.length}
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-auto">
                    {activeOrder.items.map((item) => {
                      const editable = item.status === "NEW";
                      const lineTotal = item.unitPriceCents * item.quantity;
                      return (
                        <div
                          key={item.id}
                          className="p-3 border-b border-[color:var(--pos-border)] last:border-b-0 hover:bg-[var(--pos-bg)] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">{item.productName}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <StatusBadge status={item.status} />
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-sm">
                                {formatMoney({ cents: lineTotal, currency: activeOrder.currency })}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="inline-flex items-center rounded-lg border border-[color:var(--pos-border)] overflow-hidden">
                              <button
                                type="button"
                                disabled={!editable || busyKey === `item:${item.id}` || item.quantity <= 1}
                                onClick={() => patchItem(item.id, { quantity: item.quantity - 1 })}
                                className="p-1.5 hover:bg-[var(--pos-border)] disabled:opacity-40 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <div className="px-3 text-sm font-semibold min-w-[32px] text-center">
                                {item.quantity}
                              </div>
                              <button
                                type="button"
                                disabled={!editable || busyKey === `item:${item.id}`}
                                onClick={() => patchItem(item.id, { quantity: item.quantity + 1 })}
                                className="p-1.5 hover:bg-[var(--pos-border)] disabled:opacity-40 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <button
                              type="button"
                              disabled={busyKey === `item:${item.id}`}
                              onClick={() => patchItem(item.id, { status: "VOID" })}
                              className="p-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                              title="Remove item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {activeOrder.items.length === 0 && (
                      <div className="p-6 text-center text-sm text-[var(--pos-muted)]">
                        Add items from the menu
                      </div>
                    )}
                  </div>
                </div>

                {/* Totals */}
                <div className="rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--pos-muted)]">Subtotal</span>
                    <span>{formatMoney({ cents: activeOrder.subtotalCents, currency: activeOrder.currency })}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--pos-muted)]">Tax</span>
                    <span>{formatMoney({ cents: activeOrder.taxCents, currency: activeOrder.currency })}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold border-t border-[color:var(--pos-border)] pt-3 mt-3">
                    <span>Total</span>
                    <span className="text-[var(--pos-accent)]">
                      {formatMoney({ cents: activeOrder.totalCents, currency: activeOrder.currency })}
                    </span>
                  </div>
                  {paidCents > 0 && (
                    <div className="flex items-center justify-between text-xs text-[var(--pos-muted)] pt-1">
                      <span>Paid</span>
                      <span>{formatMoney({ cents: paidCents, currency: activeOrder.currency })}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!canSendToKitchen || busyKey === "send"}
                      onClick={sendToKitchen}
                      className="px-4 py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      Kitchen
                    </button>

                    <button
                      type="button"
                      disabled={!canPay || busyKey === "pay"}
                      onClick={openPay}
                      className="px-4 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <CreditCard className="w-4 h-4" />
                      Payment
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={activeOrder.status === "PAID" || busyKey === "cancel"}
                    onClick={cancelOrder}
                    className="w-full px-4 py-2.5 rounded-xl border border-red-500/30 text-red-500 font-medium text-sm inline-flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  >
                    <Ban className="w-4 h-4" />
                    Cancel Order
                  </button>
                </div>
              </div>
            )}
          </PosCardContent>
        </PosCard>

        {/* Menu */}
        <PosCard className="xl:col-span-4">
          <PosCardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <div className="font-semibold">Menu</div>
                  <div className="text-xs text-[var(--pos-muted)]">Tap to add items</div>
                </div>
              </div>
            </div>
          </PosCardHeader>
          <PosCardContent>
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pos-muted)]" />
                <input
                  value={menuQuery}
                  onChange={(e) => setMenuQuery(e.target.value)}
                  placeholder="Search menu..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pos-accent)] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Products */}
            <div className="space-y-5 max-h-[600px] overflow-auto pr-1">
              {filteredCatalog.categories.map((category) => (
                <div key={category.id}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="font-semibold text-sm">{category.name}</div>
                    <div className="text-xs text-[var(--pos-muted)] bg-[var(--pos-border)] px-2 py-0.5 rounded-full">
                      {category.products.length}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {category.products.map((product) => {
                      const busy = busyKey === `add:${product.id}`;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          disabled={busy || !activeOrder}
                          onClick={() => addProduct(product.id)}
                          className={cn(
                            "rounded-xl border border-[color:var(--pos-border)] p-3 text-left transition-all",
                            activeOrder
                              ? "hover:border-[var(--pos-accent)] hover:bg-[var(--pos-accent)]/5 cursor-pointer"
                              : "opacity-50 cursor-not-allowed",
                            "disabled:opacity-50"
                          )}
                        >
                          <div className="font-medium text-sm truncate mb-2">{product.name}</div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-bold text-[var(--pos-accent)]">
                              {formatMoney({ cents: product.priceCents, currency: product.currency })}
                            </div>
                            {activeOrder && (
                              <div className="w-6 h-6 rounded-full bg-[var(--pos-accent)]/10 flex items-center justify-center">
                                <Plus className="w-3 h-3 text-[var(--pos-accent)]" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredCatalog.uncategorized.length > 0 && (
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="font-semibold text-sm">Other</div>
                    <div className="text-xs text-[var(--pos-muted)]">{filteredCatalog.uncategorized.length}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredCatalog.uncategorized.map((product) => {
                      const busy = busyKey === `add:${product.id}`;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          disabled={busy || !activeOrder}
                          onClick={() => addProduct(product.id)}
                          className="rounded-xl border border-[color:var(--pos-border)] hover:border-[var(--pos-accent)] hover:bg-[var(--pos-accent)]/5 p-3 text-left transition-all disabled:opacity-50"
                        >
                          <div className="font-medium text-sm truncate mb-2">{product.name}</div>
                          <div className="font-bold text-[var(--pos-accent)]">
                            {formatMoney({ cents: product.priceCents, currency: product.currency })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredCatalog.categories.length === 0 && filteredCatalog.uncategorized.length === 0 && (
                <div className="text-center py-8 text-[var(--pos-muted)]">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">No products found</div>
                </div>
              )}
            </div>
          </PosCardContent>
        </PosCard>
      </div>

      {/* Payment Modal */}
      {payOpen && activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[color:var(--pos-border)] flex items-center justify-between">
              <div>
                <div className="font-semibold">Payment</div>
                <div className="text-xs text-[var(--pos-muted)]">Order #{activeOrder.orderNumber.slice(-6)}</div>
              </div>
              <button
                type="button"
                onClick={() => setPayOpen(false)}
                className="p-2 rounded-xl border border-[color:var(--pos-border)] hover:bg-[var(--pos-border)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Amount */}
              <div className="rounded-xl bg-[var(--pos-accent)]/10 p-4 text-center">
                <div className="text-sm text-[var(--pos-muted)] mb-1">Amount Due</div>
                <div className="text-3xl font-bold text-[var(--pos-accent)]">
                  {formatMoney({ cents: outstandingCents, currency: activeOrder.currency })}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-2 gap-3">
                {PAY_PROVIDERS.map((p) => {
                  const Icon = p.icon;
                  const isSelected = payProvider === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPayProvider(p.key)}
                      className={cn(
                        "rounded-xl border-2 p-4 text-left transition-all",
                        isSelected
                          ? "border-[var(--pos-accent)] bg-[var(--pos-accent)]/5"
                          : "border-[color:var(--pos-border)] hover:border-[var(--pos-accent)]/50"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-2", p.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="font-semibold text-sm">{p.label}</div>
                      <div className="text-xs text-[var(--pos-muted)]">{p.description}</div>
                    </button>
                  );
                })}
              </div>

              {/* Cash Input */}
              {payProvider === "CASH" && (
                <div className="rounded-xl border border-[color:var(--pos-border)] p-4">
                  <div className="text-sm font-medium mb-2">Cash Received</div>
                  <input
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder={(outstandingCents / 100).toFixed(2)}
                    className="w-full px-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] text-lg font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[var(--pos-accent)]"
                  />
                  <div className="text-center text-sm text-[var(--pos-muted)] mt-2">
                    Change:{" "}
                    <span className="font-semibold text-[var(--pos-text)]">
                      {(() => {
                        const received = safeParseMoneyToCents(cashReceived) ?? outstandingCents;
                        return formatMoney({
                          cents: Math.max(0, received - outstandingCents),
                          currency: activeOrder.currency,
                        });
                      })()}
                    </span>
                  </div>
                </div>
              )}

              {/* Confirm Button */}
              <button
                type="button"
                disabled={busyKey === "pay"}
                onClick={confirmPay}
                className="w-full px-4 py-4 rounded-xl bg-[var(--pos-accent)] text-white font-semibold text-base inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-[var(--pos-accent)]/20"
              >
                {busyKey === "pay" ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Confirm Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
