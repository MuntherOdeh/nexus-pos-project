"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  CheckCircle2,
  RefreshCw,
  Timer,
  ChefHat,
  Play,
  Bell,
  Flame,
  Clock,
  AlertCircle,
  Package,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

function formatAge(iso: string, now: number): string {
  const ms = now - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
}

function getAgeColor(iso: string, now: number): string {
  const ms = now - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 5) return "text-primary-500";
  if (minutes < 15) return "text-amber-500";
  return "text-red-500";
}

function nextItemActions(status: string): Array<{ to: string; label: string; icon: React.ComponentType<{ className?: string }>; color: string }> {
  switch (status) {
    case "SENT":
      return [{ to: "IN_PROGRESS", label: "Start", icon: Play, color: "bg-blue-500 hover:bg-blue-600" }];
    case "IN_PROGRESS":
      return [{ to: "READY", label: "Ready", icon: Bell, color: "bg-primary-500 hover:bg-primary-600" }];
    case "READY":
      return [{ to: "SERVED", label: "Served", icon: CheckCircle2, color: "bg-secondary-500 hover:bg-secondary-600" }];
    default:
      return [];
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case "SENT":
      return { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500", label: "Waiting" };
    case "IN_PROGRESS":
      return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-500", label: "Cooking" };
    case "READY":
      return { bg: "bg-primary-500/10", border: "border-primary-500/30", text: "text-primary-500", label: "Ready" };
    case "SERVED":
      return { bg: "bg-secondary-500/10", border: "border-secondary-500/30", text: "text-secondary-500", label: "Served" };
    default:
      return { bg: "bg-[var(--pos-bg)]", border: "border-[color:var(--pos-border)]", text: "text-[var(--pos-muted)]", label: status };
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
  const [lastRefreshTime, setLastRefreshTime] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const previousOrderCountRef = useRef(initialOrders.length);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play notification sound using Web Audio API
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create a pleasant chime sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1); // C#6
      oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.2); // E6

      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
      // Ignore audio errors
    }
  }, [soundEnabled]);

  // Set mounted state and initialize time on client only
  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(Date.now());
    setLastRefreshTime(new Date().toLocaleTimeString());

    // Update current time every second for age displays
    const timeInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  const grouped = useMemo(() => {
    // Single pass instead of 3 filter operations
    const result = { inKitchen: [] as KdsOrder[], ready: [] as KdsOrder[], forPayment: [] as KdsOrder[] };
    for (const o of orders) {
      if (o.status === "IN_KITCHEN") result.inKitchen.push(o);
      else if (o.status === "READY") result.ready.push(o);
      else if (o.status === "FOR_PAYMENT") result.forPayment.push(o);
    }
    return result;
  }, [orders]);

  const totalItems = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.items.length, 0);
  }, [orders]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/pos/tenants/${tenant.slug}/orders?statusIn=IN_KITCHEN,READY,FOR_PAYMENT`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (response.ok && data?.success && Array.isArray(data.orders)) {
        const newOrders = data.orders as KdsOrder[];

        // Check for new orders and play notification
        const currentIds = new Set(orders.map(o => o.id));
        const incomingNewOrderIds = newOrders
          .filter(o => !currentIds.has(o.id) && o.status === "IN_KITCHEN")
          .map(o => o.id);

        if (incomingNewOrderIds.length > 0) {
          playNotificationSound();
          setNewOrderIds(new Set(incomingNewOrderIds));
          // Clear the "new" indicator after 5 seconds
          setTimeout(() => {
            setNewOrderIds(new Set());
          }, 5000);
        }

        setOrders(newOrders);
        setError(null);
        setLastRefreshTime(new Date().toLocaleTimeString());
        previousOrderCountRef.current = newOrders.length;
      }
    } catch {
      setError("Unable to refresh kitchen screen.");
    }
  }, [tenant.slug, orders, playNotificationSound]);

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

  const markAllReady = async (order: KdsOrder) => {
    const itemsToUpdate = order.items.filter(
      (i) => i.status === "SENT" || i.status === "IN_PROGRESS"
    );
    if (itemsToUpdate.length === 0) return;

    setBusy(order.id);
    try {
      for (const item of itemsToUpdate) {
        await fetch(`/api/pos/tenants/${tenant.slug}/orders/${order.id}/items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "READY" }),
        });
      }
      await refresh();
    } catch {
      setError("Failed to update items");
    } finally {
      setBusy(null);
    }
  };

  const markAllServed = async (order: KdsOrder) => {
    const itemsToUpdate = order.items.filter((i) => i.status === "READY");
    if (itemsToUpdate.length === 0) return;

    setBusy(order.id);
    try {
      for (const item of itemsToUpdate) {
        await fetch(`/api/pos/tenants/${tenant.slug}/orders/${order.id}/items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "SERVED" }),
        });
      }
      await refresh();
    } catch {
      setError("Failed to update items");
    } finally {
      setBusy(null);
    }
  };

  const EmptyColumn = ({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--pos-bg)] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[var(--pos-muted)]" />
      </div>
      <p className="font-medium text-[var(--pos-muted)]">{title}</p>
      <p className="text-sm text-[var(--pos-muted)] opacity-70 mt-1">{subtitle}</p>
    </div>
  );

  const OrderCard = React.memo(function OrderCard({ order, isNew }: { order: KdsOrder; isNew?: boolean }) {
    const ageColor = isMounted ? getAgeColor(order.sentToKitchenAt || order.openedAt, currentTime) : "text-[var(--pos-muted)]";
    const activeItems = order.items.filter(i => i.status !== "SERVED" && i.status !== "VOID");
    const readyItems = order.items.filter(i => i.status === "READY").length;
    const pendingItems = order.items.filter(i => i.status === "SENT" || i.status === "IN_PROGRESS").length;
    const totalActiveItems = activeItems.length;

    return (
      <motion.div
        initial={isNew ? { scale: 0.9, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "rounded-2xl bg-[var(--pos-panel-solid)] border overflow-hidden shadow-lg transition-all",
          isNew
            ? "border-primary-500 ring-2 ring-primary-500/30 animate-pulse"
            : "border-[color:var(--pos-border)]"
        )}
      >
        {/* Order Header */}
        <div className="p-4 border-b border-[color:var(--pos-border)] bg-[var(--pos-bg)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <span className="font-bold text-lg text-primary-500">
                  {order.table?.name || "#"}
                </span>
              </div>
              <div>
                <div className="font-bold text-lg">
                  {order.table ? `Table ${order.table.name}` : "Quick Sale"}
                </div>
                <div className="text-xs text-[var(--pos-muted)] font-mono">
                  {order.orderNumber.slice(-8)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={cn("flex items-center gap-1 font-bold text-lg", ageColor)}>
                <Timer className="w-4 h-4" />
                {isMounted ? formatAge(order.sentToKitchenAt || order.openedAt, currentTime) : "--"}
              </div>
              <div className="text-xs text-[var(--pos-muted)]">
                {readyItems}/{totalActiveItems} ready
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-3 flex gap-2">
            {pendingItems > 0 && (
              <button
                type="button"
                onClick={() => markAllReady(order)}
                disabled={busy === order.id}
                className="flex-1 px-3 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                All Ready ({pendingItems})
              </button>
            )}
            {readyItems > 0 && (
              <button
                type="button"
                onClick={() => markAllServed(order)}
                disabled={busy === order.id}
                className="flex-1 px-3 py-2 rounded-xl bg-secondary-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-secondary-600 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                All Served ({readyItems})
              </button>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="divide-y divide-[color:var(--pos-border)]">
          {order.items.filter(i => i.status !== "VOID").map((item) => {
            const actions = nextItemActions(item.status);
            const statusStyle = getStatusStyle(item.status);

            return (
              <div
                key={item.id}
                className={cn(
                  "p-4 transition-colors",
                  item.status === "SERVED" && "opacity-50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-primary-500 w-10">
                        {item.quantity}x
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{item.productName}</div>
                        {item.notes && (
                          <div className="text-sm text-amber-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold border",
                      statusStyle.bg, statusStyle.border, statusStyle.text
                    )}>
                      {statusStyle.label}
                    </span>

                    {actions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.to}
                          type="button"
                          disabled={busy === item.id}
                          onClick={() => patchItem(order.id, item.id, action.to)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-white font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-50 shadow-md",
                            action.color
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  });

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Kitchen Display</h1>
              <p className="text-sm text-[var(--pos-muted)]">
                {orders.length} orders - {totalItems} items
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--pos-muted)]">
              <Clock className="w-4 h-4" />
              Last update: {lastRefreshTime || "--:--:--"}
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Disable sound notifications" : "Enable sound notifications"}
              className={cn(
                "p-3 rounded-xl border transition-colors",
                soundEnabled
                  ? "bg-primary-500/10 border-primary-500/30 text-primary-500"
                  : "bg-[var(--pos-bg)] border-[color:var(--pos-border)] text-[var(--pos-muted)]"
              )}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={refresh}
              className="px-4 sm:px-5 py-3 rounded-xl bg-primary-500 text-white font-semibold flex items-center gap-2 hover:bg-primary-600 transition-colors shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-32 h-32 rounded-3xl bg-primary-500/10 flex items-center justify-center mb-6">
              <ChefHat className="w-16 h-16 text-primary-500" />
            </div>
            <h2 className="text-3xl font-bold mb-2">All Caught Up!</h2>
            <p className="text-lg text-[var(--pos-muted)] max-w-md">
              No orders in the kitchen right now. Orders will appear here automatically when sent from the POS.
            </p>
            <div className="mt-8 flex items-center gap-2 text-sm text-[var(--pos-muted)]">
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              Auto-refreshing every 3 seconds
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* In Kitchen Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2 sticky top-0 bg-[var(--pos-bg)] py-2 z-10">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">In Kitchen</h2>
                  <p className="text-xs text-[var(--pos-muted)]">{grouped.inKitchen.length} orders</p>
                </div>
              </div>
              <AnimatePresence>
                {grouped.inKitchen.length === 0 ? (
                  <EmptyColumn title="No orders cooking" subtitle="Start preparing incoming orders" icon={Flame} />
                ) : (
                  grouped.inKitchen.map((order) => (
                    <OrderCard key={order.id} order={order} isNew={newOrderIds.has(order.id)} />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Ready Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2 sticky top-0 bg-[var(--pos-bg)] py-2 z-10">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary-500" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">Ready to Serve</h2>
                  <p className="text-xs text-[var(--pos-muted)]">{grouped.ready.length} orders</p>
                </div>
              </div>
              <AnimatePresence>
                {grouped.ready.length === 0 ? (
                  <EmptyColumn title="No orders ready" subtitle="Completed orders appear here" icon={Bell} />
                ) : (
                  grouped.ready.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* For Payment Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2 sticky top-0 bg-[var(--pos-bg)] py-2 z-10">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">Awaiting Payment</h2>
                  <p className="text-xs text-[var(--pos-muted)]">{grouped.forPayment.length} orders</p>
                </div>
              </div>
              <AnimatePresence>
                {grouped.forPayment.length === 0 ? (
                  <EmptyColumn title="No pending bills" subtitle="Served orders move here" icon={Package} />
                ) : (
                  grouped.forPayment.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
