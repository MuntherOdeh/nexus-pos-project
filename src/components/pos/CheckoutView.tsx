"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, CreditCard, RefreshCw, Send, ShoppingCart, Wallet, X } from "lucide-react";
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
}> = [
  { key: "CASH", label: "Cash", description: "Record cash received + change.", icon: Wallet },
  { key: "CARD", label: "Card", description: "Capture full outstanding amount.", icon: CreditCard },
  { key: "BANK", label: "Bank", description: "Mark bank transfer as received.", icon: CheckCircle2 },
  { key: "PAYPAL", label: "PayPal", description: "Mark PayPal as captured.", icon: CheckCircle2 },
];

function tableSurface(status?: string | null): string {
  switch (status) {
    case "IN_KITCHEN":
      return "border-amber-400/25 bg-amber-500/10 hover:bg-amber-500/15";
    case "READY":
      return "border-emerald-400/25 bg-emerald-500/10 hover:bg-emerald-500/15";
    case "FOR_PAYMENT":
      return "border-sky-400/25 bg-sky-500/10 hover:bg-sky-500/15";
    case "OPEN":
      return "border-white/15 bg-white/5 hover:bg-white/10";
    default:
      return "border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10";
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
      setToast("Sent to kitchen.");
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
          ? `Payment captured. Change due: ${formatMoney({ cents: changeDueCents, currency: data.order.currency })}`
          : "Payment captured."
      );
      setPayOpen(false);
      await refreshOpenOrders();
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Checkout</h1>
          <p className="text-sm md:text-base text-[var(--pos-muted)] mt-2">
            Floor plan, orders, kitchen sending, and payments for{" "}
            <span className="font-semibold text-[var(--pos-text)]">{tenant.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={startQuickSale}
            disabled={busyKey === "quick-sale"}
            className="px-4 py-2 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
          >
            <ShoppingCart className="w-4 h-4" />
            Quick sale
          </button>
          <button
            type="button"
            onClick={refreshOpenOrders}
            className="px-4 py-2 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-sm font-semibold inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {(error || toast) && (
        <div
          className={cn(
            "rounded-2xl border p-4 text-sm",
            error
              ? "bg-rose-500/10 border-rose-400/20 text-rose-200"
              : "bg-emerald-500/10 border-emerald-400/20 text-emerald-200"
          )}
        >
          {error || toast}
        </div>
      )}

      <div className="grid xl:grid-cols-12 gap-6">
        {/* Floor plan */}
        <PosCard className="xl:col-span-5">
          <PosCardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Floor plan</div>
                <div className="text-xs text-[var(--pos-muted)]">Click a table to open or continue an order.</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {floors.map((floor) => (
                  <button
                    key={floor.id}
                    type="button"
                    onClick={() => setActiveFloorId(floor.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-xs font-semibold",
                      floor.id === activeFloor?.id
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-[var(--pos-muted)]"
                    )}
                  >
                    {floor.name}
                  </button>
                ))}
              </div>
            </div>
          </PosCardHeader>
          <PosCardContent>
            <div className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 overflow-auto">
              <div className="relative w-[800px] h-[520px]">
                <div className="absolute inset-0 opacity-60 pointer-events-none">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.07),transparent_55%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.05),transparent_55%)]" />
                </div>

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
                        "absolute border shadow-sm text-left transition-colors focus:outline-none",
                        "focus:ring-2 focus:ring-[color:var(--pos-accent2)] disabled:opacity-70 disabled:cursor-wait",
                        tableSurface(order?.status),
                        table.shape === "ROUND" ? "rounded-full" : "rounded-2xl",
                        selected ? "ring-2 ring-[color:var(--pos-accent2)]" : ""
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
                            <div className="text-[11px] text-[var(--pos-muted)]">Seats {table.capacity}</div>
                          </div>
                          {order && <StatusBadge status={order.status} />}
                        </div>

                        {order ? (
                          <div className="flex items-end justify-between gap-2">
                            <div className="text-[11px] text-[var(--pos-muted)] font-mono truncate">
                              {order.orderNumber}
                            </div>
                            <div className="text-xs font-semibold">
                              {formatMoney({ cents: order.totalCents, currency: order.currency })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-[var(--pos-muted)]">Tap to open</div>
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
              <div>
                <div className="text-sm font-semibold">Order</div>
                <div className="text-xs text-[var(--pos-muted)]">
                  {activeOrder?.table
                    ? `Table ${activeOrder.table.name}`
                    : activeOrder
                      ? "Quick sale"
                      : "No order open"}
                </div>
              </div>
              {activeOrder && <StatusBadge status={activeOrder.status} />}
            </div>
          </PosCardHeader>
          <PosCardContent>
            {!activeOrder ? (
              <div className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 p-5">
                <div className="text-sm font-semibold">Start selling</div>
                <div className="text-xs text-[var(--pos-muted)] mt-1">
                  Pick a table from the floor plan, or start a quick sale.
                </div>
                <button
                  type="button"
                  onClick={startQuickSale}
                  disabled={busyKey === "quick-sale"}
                  className="mt-4 w-full px-4 py-2.5 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Quick sale
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-[var(--pos-muted)]">Order</div>
                      <div className="font-mono text-xs break-all">{activeOrder.orderNumber}</div>
                    </div>
                    <div className="text-xs text-[var(--pos-muted)] font-mono">{activeOrder.currency}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)]">
                  <div className="p-4 border-b border-[color:var(--pos-border)] flex items-center justify-between">
                    <div className="text-sm font-semibold">Items</div>
                    <div className="text-xs text-[var(--pos-muted)]">{activeOrder.items.length}</div>
                  </div>
                  <div className="max-h-[360px] overflow-auto">
                    {activeOrder.items.map((item) => {
                      const editable = item.status === "NEW";
                      const lineTotal = item.unitPriceCents * item.quantity;
                      return (
                        <div
                          key={item.id}
                          className="p-4 border-b border-[color:var(--pos-border)] last:border-b-0"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{item.productName}</div>
                              <div className="mt-1 flex items-center gap-2 flex-wrap">
                                <StatusBadge status={item.status} />
                                {item.notes && (
                                  <span className="text-xs text-[var(--pos-muted)] truncate max-w-[160px]">
                                    {item.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">
                                {formatMoney({ cents: lineTotal, currency: activeOrder.currency })}
                              </div>
                              <div className="text-xs text-[var(--pos-muted)] mt-0.5">
                                {formatMoney({ cents: item.unitPriceCents, currency: activeOrder.currency })} ea
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="inline-flex items-center rounded-2xl border border-[color:var(--pos-border)] bg-white/5 overflow-hidden">
                              <button
                                type="button"
                                disabled={!editable || busyKey === `item:${item.id}` || item.quantity <= 1}
                                onClick={() => patchItem(item.id, { quantity: item.quantity - 1 })}
                                className="px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50"
                              >
                                -
                              </button>
                              <div className="px-3 py-1.5 text-sm font-semibold w-10 text-center">
                                {item.quantity}
                              </div>
                              <button
                                type="button"
                                disabled={!editable || busyKey === `item:${item.id}`}
                                onClick={() => patchItem(item.id, { quantity: item.quantity + 1 })}
                                className="px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              disabled={busyKey === `item:${item.id}`}
                              onClick={() => patchItem(item.id, { status: "VOID" })}
                              className="px-3 py-2 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-60"
                            >
                              <Ban className="w-4 h-4" />
                              Void
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {activeOrder.items.length === 0 && (
                      <div className="p-6 text-center text-sm text-[var(--pos-muted)]">
                        Add items from the menu to start the order.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--pos-muted)]">Subtotal</span>
                    <span className="font-semibold">
                      {formatMoney({ cents: activeOrder.subtotalCents, currency: activeOrder.currency })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--pos-muted)]">Tax</span>
                    <span className="font-semibold">
                      {formatMoney({ cents: activeOrder.taxCents, currency: activeOrder.currency })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-base border-t border-[color:var(--pos-border)] pt-3">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold">
                      {formatMoney({ cents: activeOrder.totalCents, currency: activeOrder.currency })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--pos-muted)]">
                    <span>Paid</span>
                    <span className="font-mono">{formatMoney({ cents: paidCents, currency: activeOrder.currency })}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--pos-muted)]">
                    <span>Outstanding</span>
                    <span className="font-mono">
                      {formatMoney({ cents: outstandingCents, currency: activeOrder.currency })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!canSendToKitchen || busyKey === "send"}
                    onClick={sendToKitchen}
                    className="px-4 py-2.5 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>

                  <button
                    type="button"
                    disabled={!canPay || busyKey === "pay"}
                    onClick={openPay}
                    className="px-4 py-2.5 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay
                  </button>

                  <button
                    type="button"
                    disabled={activeOrder.status === "PAID" || busyKey === "cancel"}
                    onClick={cancelOrder}
                    className="col-span-2 px-4 py-2.5 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Ban className="w-4 h-4" />
                    Cancel order
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
              <div>
                <div className="text-sm font-semibold">Menu</div>
                <div className="text-xs text-[var(--pos-muted)]">Tap an item to add it to the order.</div>
              </div>
              <input
                value={menuQuery}
                onChange={(e) => setMenuQuery(e.target.value)}
                placeholder="Search..."
                className="w-48 max-w-full px-3 py-2 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--pos-accent2)]"
              />
            </div>
          </PosCardHeader>
          <PosCardContent>
            <div className="space-y-5 max-h-[700px] overflow-auto pr-1">
              {filteredCatalog.categories.map((category) => (
                <div key={category.id}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="font-semibold">{category.name}</div>
                    <div className="text-xs text-[var(--pos-muted)]">{category.products.length}</div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {category.products.map((product) => {
                      const busy = busyKey === `add:${product.id}`;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          disabled={busy}
                          onClick={() => addProduct(product.id)}
                          className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 p-4 text-left transition-colors disabled:opacity-60"
                        >
                          <div className="font-semibold truncate">{product.name}</div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold">
                              {formatMoney({ cents: product.priceCents, currency: product.currency })}
                            </div>
                            <div className="text-xs text-[var(--pos-muted)]">{busy ? "Adding..." : "Add"}</div>
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
                    <div className="font-semibold">Other</div>
                    <div className="text-xs text-[var(--pos-muted)]">{filteredCatalog.uncategorized.length}</div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {filteredCatalog.uncategorized.map((product) => {
                      const busy = busyKey === `add:${product.id}`;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          disabled={busy}
                          onClick={() => addProduct(product.id)}
                          className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 p-4 text-left transition-colors disabled:opacity-60"
                        >
                          <div className="font-semibold truncate">{product.name}</div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold">
                              {formatMoney({ cents: product.priceCents, currency: product.currency })}
                            </div>
                            <div className="text-xs text-[var(--pos-muted)]">{busy ? "Adding..." : "Add"}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredCatalog.categories.length === 0 && filteredCatalog.uncategorized.length === 0 && (
                <div className="text-sm text-[var(--pos-muted)]">No matching products.</div>
              )}
            </div>
          </PosCardContent>
        </PosCard>
      </div>

      {payOpen && activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-3xl border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] overflow-hidden">
            <div className="p-6 border-b border-[color:var(--pos-border)] flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">Take payment</div>
                <div className="text-xs text-[var(--pos-muted)] font-mono mt-1">{activeOrder.orderNumber}</div>
              </div>
              <button
                type="button"
                onClick={() => setPayOpen(false)}
                className="p-2 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 p-4 flex items-center justify-between">
                <div className="text-sm text-[var(--pos-muted)]">Outstanding</div>
                <div className="text-lg font-bold">
                  {formatMoney({ cents: outstandingCents, currency: activeOrder.currency })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {PAY_PROVIDERS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPayProvider(p.key)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition-colors",
                        payProvider === p.key
                          ? "border-white/20 bg-white/10"
                          : "border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10"
                      )}
                    >
                      <div className="inline-flex items-center gap-2 text-sm font-semibold">
                        <Icon className="w-4 h-4" />
                        {p.label}
                      </div>
                      <div className="text-xs text-[var(--pos-muted)] mt-1">{p.description}</div>
                    </button>
                  );
                })}
              </div>

              {payProvider === "CASH" && (
                <div className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 p-4 space-y-2">
                  <div className="text-sm font-semibold">Cash received</div>
                  <input
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder={(outstandingCents / 100).toFixed(2)}
                    className="w-full px-3 py-2 rounded-2xl border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--pos-accent2)]"
                  />
                  <div className="text-xs text-[var(--pos-muted)]">
                    Change due:{" "}
                    {(() => {
                      const received = safeParseMoneyToCents(cashReceived) ?? outstandingCents;
                      return formatMoney({
                        cents: Math.max(0, received - outstandingCents),
                        currency: activeOrder.currency,
                      });
                    })()}
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={busyKey === "pay"}
                onClick={confirmPay}
                className="w-full px-4 py-3 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <CheckCircle2 className="w-5 h-5" />
                Confirm payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
