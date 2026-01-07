"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Timer, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { PosCard, PosCardContent, PosCardHeader } from "@/components/pos/PosCard";
import { StatusBadge } from "@/components/pos/StatusBadge";

type KdsItem = {
  id: string;
  productName: string;
  quantity: number;
  status: string;
  notes: string | null;
  createdAt: string;
};

type KdsOrder = {
  id: string;
  status: string;
  orderNumber: string;
  openedAt: string;
  sentToKitchenAt: string | null;
  table: { id: string; name: string } | null;
  items: KdsItem[];
};

function formatAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
}

function nextItemActions(status: string): Array<{ to: string; label: string }> {
  switch (status) {
    case "SENT":
      return [{ to: "IN_PROGRESS", label: "Start" }];
    case "IN_PROGRESS":
      return [{ to: "READY", label: "Ready" }];
    case "READY":
      return [{ to: "SERVED", label: "Served" }];
    default:
      return [];
  }
}

export function KdsView({
  tenant,
  initialOrders,
}: {
  tenant: { slug: string; name: string; currency: string };
  initialOrders: KdsOrder[];
}) {
  const [orders, setOrders] = useState<KdsOrder[]>(initialOrders);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const inKitchen = orders.filter((o) => o.status === "IN_KITCHEN");
    const ready = orders.filter((o) => o.status === "READY");
    const forPayment = orders.filter((o) => o.status === "FOR_PAYMENT");
    return { inKitchen, ready, forPayment };
  }, [orders]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/pos/tenants/${tenant.slug}/orders?statusIn=IN_KITCHEN,READY,FOR_PAYMENT`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (response.ok && data?.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
        setError(null);
      }
    } catch {
      setError("Unable to refresh kitchen screen.");
    }
  }, [tenant.slug]);

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      if (!mounted) return;
      await refresh();
    };
    const interval = window.setInterval(tick, 3000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [refresh]);

  const patchItem = async (orderId: string, itemId: string, nextStatus: string) => {
    setBusy(itemId);
    try {
      const response = await fetch(`/api/pos/tenants/${tenant.slug}/orders/${orderId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success || !data?.order) {
        setError(data?.error || "Unable to update item.");
        return;
      }

      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      setError(null);
    } finally {
      setBusy(null);
    }
  };

  const Column = ({
    title,
    subtitle,
    orders,
  }: {
    title: string;
    subtitle: string;
    orders: KdsOrder[];
  }) => (
    <PosCard className="min-h-[420px]">
      <PosCardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-xs text-[var(--pos-muted)]">{subtitle}</div>
          </div>
          <div className="text-xs text-[var(--pos-muted)]">{orders.length}</div>
        </div>
      </PosCardHeader>
      <PosCardContent className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">
                  {order.table ? `Table ${order.table.name}` : "Quick sale"}
                </div>
                <div className="text-xs text-[var(--pos-muted)] font-mono break-all mt-1">
                  {order.orderNumber}
                </div>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--pos-muted)]">
              <div className="inline-flex items-center gap-2">
                <Timer className="w-4 h-4" />
                {formatAge(order.sentToKitchenAt || order.openedAt)}
              </div>
              <div className="font-mono">{order.items.length} items</div>
            </div>

            <div className="mt-4 space-y-3">
              {order.items.map((item) => {
                const actions = nextItemActions(item.status);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-2xl border p-3 flex items-start justify-between gap-3",
                      item.status === "READY"
                        ? "border-emerald-400/20 bg-emerald-500/10"
                        : item.status === "IN_PROGRESS"
                          ? "border-amber-400/20 bg-amber-500/10"
                          : item.status === "SENT"
                            ? "border-sky-400/20 bg-sky-500/10"
                            : "border-[color:var(--pos-border)] bg-white/5"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        <span className="font-mono mr-2">{item.quantity}×</span>
                        {item.productName}
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <StatusBadge status={item.status} />
                        {item.notes && <span className="text-xs text-[var(--pos-muted)]">{item.notes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {actions.map((a) => (
                        <button
                          key={a.to}
                          type="button"
                          disabled={busy === item.id}
                          onClick={() => patchItem(order.id, item.id, a.to)}
                          className="px-3 py-2 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-xs font-semibold disabled:opacity-60"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {orders.length === 0 && <div className="text-sm text-[var(--pos-muted)]">No orders.</div>}
      </PosCardContent>
    </PosCard>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Kitchen Display (KDS)</h1>
          <p className="text-sm md:text-base text-[var(--pos-muted)] mt-2">
            Real-time kitchen queue for <span className="font-semibold text-[var(--pos-text)]">{tenant.name}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="px-4 py-2 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-sm font-semibold inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <Column title="In kitchen" subtitle="SENT / IN_PROGRESS items" orders={grouped.inKitchen} />
        <Column title="Ready" subtitle="Ready to serve" orders={grouped.ready} />
        <Column title="For payment" subtitle="Served (waiting checkout)" orders={grouped.forPayment} />
      </div>

      <div className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 p-4 text-xs text-[var(--pos-muted)] inline-flex items-center gap-2">
        <Utensils className="w-4 h-4" />
        Tip: open <span className="font-mono">Checkout</span> in another tab, send items to the kitchen, then bump them here.
      </div>
    </div>
  );
}
