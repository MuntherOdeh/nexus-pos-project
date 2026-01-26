import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Boxes, CreditCard, TrendingUp, ShoppingCart, Banknote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";
import { formatCompactNumber, formatMoney } from "@/lib/pos/format";
import { PosCard, PosCardContent, PosCardHeader } from "@/components/pos/PosCard";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    OPEN: "Open",
    IN_KITCHEN: "In Kitchen",
    READY: "Ready",
    FOR_PAYMENT: "Payment",
    PAID: "Paid",
    CANCELLED: "Cancelled",
  };
  return statusMap[status] || status;
}

function getOrderStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    OPEN: "bg-blue-500/10 text-blue-500",
    IN_KITCHEN: "bg-amber-500/10 text-amber-500",
    READY: "bg-emerald-500/10 text-emerald-500",
    FOR_PAYMENT: "bg-purple-500/10 text-purple-500",
    PAID: "bg-green-500/10 text-green-500",
    CANCELLED: "bg-red-500/10 text-red-500",
  };
  return colorMap[status] || "bg-gray-500/10 text-gray-500";
}

// Helper to check if error is a Next.js navigation error
function isNextNavigationError(error: unknown): boolean {
  if (error instanceof Error) {
    const digest = (error as Error & { digest?: string }).digest;
    return digest?.startsWith("NEXT_REDIRECT") || digest?.startsWith("NEXT_NOT_FOUND") || false;
  }
  return false;
}

export default async function TenantDashboardPage({ params }: { params: { tenant: string } }) {
  try {
    const tenant = await getTenantBySlug({ prisma, slug: params.tenant });
    if (!tenant) {
      notFound();
    }

  const host = headers().get("host") || "";
  const hostname = host.split(":")[0].toLowerCase();
  const rootDomain = (process.env.TENANT_ROOT_DOMAIN ||
    process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN ||
    "nexuspoint.com").toLowerCase();
  const isSubdomainMode =
    (hostname.endsWith(`.${rootDomain}`) && hostname !== rootDomain && hostname !== `www.${rootDomain}`) ||
    hostname.endsWith(".localhost");

  const checkoutHref = isSubdomainMode ? "/checkout" : `/t/${tenant.slug}/pos/checkout`;
  const ordersHref = isSubdomainMode ? "/orders" : `/t/${tenant.slug}/pos/orders`;

  const now = new Date();
  const sevenDaysAgo = addDays(startOfDay(now), -6);
  const today = startOfDay(now);

  const [
    paidOrdersAgg,
    activeOrdersCount,
    todayOrdersAgg,
    stockItems,
    recentOrders,
    orders7d,
    activeCashSession,
  ] = await Promise.all([
    // Paid orders revenue (7 days)
    prisma.posOrder.aggregate({
      where: {
        tenantId: tenant.id,
        status: "PAID",
        closedAt: { gte: sevenDaysAgo },
      },
      _sum: { totalCents: true },
      _count: { _all: true },
    }),
    // Active orders count
    prisma.posOrder.count({
      where: {
        tenantId: tenant.id,
        status: { in: ["OPEN", "IN_KITCHEN", "READY", "FOR_PAYMENT"] },
      },
    }),
    // Today's orders
    prisma.posOrder.aggregate({
      where: {
        tenantId: tenant.id,
        status: "PAID",
        closedAt: { gte: today },
      },
      _sum: { totalCents: true },
      _count: { _all: true },
    }),
    // Low stock items
    prisma.stockItem.findMany({
      where: { tenantId: tenant.id, reorderPoint: { gt: 0 } },
      select: { onHand: true, reorderPoint: true },
    }),
    // Recent orders
    prisma.posOrder.findMany({
      where: { tenantId: tenant.id },
      orderBy: { openedAt: "desc" },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        currency: true,
        openedAt: true,
        table: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
    // Orders for chart (7 days)
    prisma.posOrder.findMany({
      where: {
        tenantId: tenant.id,
        status: "PAID",
        closedAt: { gte: sevenDaysAgo },
      },
      select: { closedAt: true, totalCents: true },
    }),
    // Active cash session
    prisma.posCashSession.findFirst({
      where: {
        tenantId: tenant.id,
        status: "OPEN",
      },
      orderBy: { openedAt: "desc" },
      select: {
        id: true,
        openingCashCents: true,
        currency: true,
        openedAt: true,
        openedBy: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  const revenue7d = paidOrdersAgg._sum.totalCents ?? 0;
  const ordersCount7d = paidOrdersAgg._count._all ?? 0;
  const todayRevenue = todayOrdersAgg._sum.totalCents ?? 0;
  const todayOrdersCount = todayOrdersAgg._count._all ?? 0;
  const lowStockAlerts = stockItems.filter((item) => item.onHand <= item.reorderPoint).length;

  // Build day buckets for chart
  const dayBuckets = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(sevenDaysAgo, i);
    return { day, label: day.toLocaleDateString("en-US", { weekday: "short" }), cents: 0 };
  });

  for (const order of orders7d) {
    if (order.closedAt) {
      const orderDay = startOfDay(order.closedAt).getTime();
      const bucket = dayBuckets.find((b) => b.day.getTime() === orderDay);
      if (bucket) bucket.cents += order.totalCents ?? 0;
    }
  }

  const maxCents = Math.max(1, ...dayBuckets.map((b) => b.cents));

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Dashboard</h1>
          <p className="text-sm md:text-base text-[var(--pos-muted)] mt-2">
            Overview for <span className="font-semibold text-[var(--pos-text)]">{tenant.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={checkoutHref}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[var(--pos-accent)] to-[var(--pos-accent2)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            New Sale
          </Link>
          <Link
            href={ordersHref}
            className="px-4 py-2 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-sm font-semibold"
          >
            View Orders
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <PosCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-[var(--pos-muted)]">Revenue (7 days)</div>
              <div className="text-2xl font-bold mt-1">{formatMoney({ cents: revenue7d, currency: tenant.currency })}</div>
              <div className="text-xs text-[var(--pos-muted)] mt-1">{ordersCount7d} orders completed</div>
            </div>
            <div
              className="w-11 h-11 rounded-2xl border flex items-center justify-center"
              style={{ borderColor: "var(--pos-border)", background: "rgba(255,255,255,0.04)" }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: "var(--pos-accent2)" }} />
            </div>
          </div>
        </PosCard>

        <PosCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-[var(--pos-muted)]">Today&apos;s Sales</div>
              <div className="text-2xl font-bold mt-1">{formatMoney({ cents: todayRevenue, currency: tenant.currency })}</div>
              <div className="text-xs text-[var(--pos-muted)] mt-1">{todayOrdersCount} orders today</div>
            </div>
            <div
              className="w-11 h-11 rounded-2xl border flex items-center justify-center"
              style={{ borderColor: "var(--pos-border)", background: "rgba(255,255,255,0.04)" }}
            >
              <Banknote className="w-5 h-5" style={{ color: "var(--pos-accent)" }} />
            </div>
          </div>
        </PosCard>

        <PosCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-[var(--pos-muted)]">Cash Drawer</div>
              <div className="text-2xl font-bold mt-1">
                {activeCashSession
                  ? formatMoney({ cents: activeCashSession.openingCashCents, currency: activeCashSession.currency })
                  : "—"}
              </div>
              <div className="text-xs text-[var(--pos-muted)] mt-1">
                {activeCashSession
                  ? `Opened by ${activeCashSession.openedBy?.firstName ?? "Unknown"}`
                  : "No active session"}
              </div>
            </div>
            <div
              className="w-11 h-11 rounded-2xl border flex items-center justify-center"
              style={{ borderColor: "var(--pos-border)", background: activeCashSession ? "rgba(16, 185, 129, 0.1)" : "rgba(255,255,255,0.04)" }}
            >
              <CreditCard className="w-5 h-5" style={{ color: activeCashSession ? "#10b981" : "var(--pos-muted)" }} />
            </div>
          </div>
        </PosCard>

        <PosCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-[var(--pos-muted)]">Active Orders</div>
              <div className="text-2xl font-bold mt-1">{formatCompactNumber(activeOrdersCount)}</div>
              <div className="text-xs text-[var(--pos-muted)] mt-1">Open, Kitchen, Ready</div>
            </div>
            <div
              className="w-11 h-11 rounded-2xl border flex items-center justify-center"
              style={{ borderColor: "var(--pos-border)", background: "rgba(255,255,255,0.04)" }}
            >
              <ShoppingCart className="w-5 h-5" style={{ color: "var(--pos-accent2)" }} />
            </div>
          </div>
        </PosCard>

        <PosCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-[var(--pos-muted)]">Low Stock Alerts</div>
              <div className="text-2xl font-bold mt-1">{formatCompactNumber(lowStockAlerts)}</div>
              <div className="text-xs text-[var(--pos-muted)] mt-1">Below reorder point</div>
            </div>
            <div
              className="w-11 h-11 rounded-2xl border flex items-center justify-center"
              style={{ borderColor: "var(--pos-border)", background: "rgba(255,255,255,0.04)" }}
            >
              <Boxes className="w-5 h-5" style={{ color: "var(--pos-warning)" }} />
            </div>
          </div>
        </PosCard>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Chart */}
        <PosCard className="lg:col-span-2">
          <PosCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Sales Trend</div>
                <div className="text-xs text-[var(--pos-muted)]">Last 7 days</div>
              </div>
              <div className="text-xs text-[var(--pos-muted)] font-mono">{tenant.currency}</div>
            </div>
          </PosCardHeader>
          <PosCardContent>
            <div className="flex items-end gap-2 h-36">
              {dayBuckets.map((b) => {
                const heightPct = maxCents > 0 ? Math.round((b.cents / maxCents) * 100) : 0;
                return (
                  <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full rounded-2xl border border-[color:var(--pos-border)] bg-white/5 overflow-hidden relative"
                      style={{ height: "100%" }}
                    >
                      <div
                        className="w-full rounded-2xl absolute bottom-0"
                        style={{
                          height: `${heightPct}%`,
                          background: "linear-gradient(180deg, var(--pos-accent2), var(--pos-accent))",
                        }}
                      />
                    </div>
                    <div className="text-[11px] text-[var(--pos-muted)]">{b.label}</div>
                  </div>
                );
              })}
            </div>
          </PosCardContent>
        </PosCard>

        {/* Recent Orders */}
        <PosCard className="lg:col-span-3">
          <PosCardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">Recent Orders</div>
                <div className="text-xs text-[var(--pos-muted)]">Latest transactions</div>
              </div>
              <Link
                href={ordersHref}
                className="text-sm font-semibold text-[var(--pos-accent2)] hover:underline"
              >
                View All
              </Link>
            </div>
          </PosCardHeader>
          <PosCardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--pos-muted)]">
                    <th className="py-2 pr-4 font-medium">Order</th>
                    <th className="py-2 pr-4 font-medium">Table</th>
                    <th className="py-2 pr-4 font-medium">Items</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-t border-[color:var(--pos-border)]">
                      <td className="py-3 pr-4 font-mono text-xs">{order.orderNumber?.slice(-10) ?? "—"}</td>
                      <td className="py-3 pr-4">{order.table?.name || "Quick Sale"}</td>
                      <td className="py-3 pr-4">{order._count?.items ?? 0}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getOrderStatusColor(order.status)}`}>
                          {formatOrderStatus(order.status)}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold">
                        {formatMoney({ cents: order.totalCents ?? 0, currency: order.currency })}
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[var(--pos-muted)]">
                        No orders yet. Start selling to see data here!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </PosCardContent>
        </PosCard>
      </div>
    </div>
  );
  } catch (error) {
    if (isNextNavigationError(error)) {
      throw error;
    }
    throw error;
  }
}
