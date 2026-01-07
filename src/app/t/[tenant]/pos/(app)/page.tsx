import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Boxes, CreditCard, Receipt, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";
import { formatCompactNumber, formatMoney } from "@/lib/pos/format";
import { formatDate } from "@/lib/utils";
import { PosCard, PosCardContent, PosCardHeader } from "@/components/pos/PosCard";
import { StatusBadge } from "@/components/pos/StatusBadge";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default async function TenantDashboardPage({ params }: { params: { tenant: string } }) {
  const tenant = await getTenantBySlug({ prisma, slug: params.tenant });
  if (!tenant) notFound();

  const host = headers().get("host") || "";
  const hostname = host.split(":")[0].toLowerCase();
  const rootDomain = (process.env.TENANT_ROOT_DOMAIN ||
    process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN ||
    "nexuspoint.com").toLowerCase();
  const isSubdomainMode =
    (hostname.endsWith(`.${rootDomain}`) && hostname !== rootDomain && hostname !== `www.${rootDomain}`) ||
    hostname.endsWith(".localhost");

  const invoicesHref = isSubdomainMode ? "/invoices" : `/t/${tenant.slug}/pos/invoices`;
  const settingsHref = isSubdomainMode ? "/settings" : `/t/${tenant.slug}/pos/settings`;

  const now = new Date();
  const sevenDaysAgo = addDays(startOfDay(now), -6);

  const [paidAgg, openInvoices, recentInvoices, stockItems, paymentConnections, invoices7d] =
    await Promise.all([
      prisma.invoice.aggregate({
        where: {
          tenantId: tenant.id,
          status: "PAID",
          issuedAt: { gte: sevenDaysAgo },
        },
        _sum: { totalCents: true },
        _count: { _all: true },
      }),
      prisma.invoice.count({
        where: { tenantId: tenant.id, status: { in: ["SENT", "OVERDUE"] } },
      }),
      prisma.invoice.findMany({
        where: { tenantId: tenant.id },
        orderBy: { issuedAt: "desc" },
        take: 7,
        select: {
          id: true,
          number: true,
          status: true,
          customerName: true,
          issuedAt: true,
          totalCents: true,
          currency: true,
        },
      }),
      prisma.stockItem.findMany({
        where: { tenantId: tenant.id, reorderPoint: { gt: 0 } },
        select: { onHand: true, reorderPoint: true },
      }),
      prisma.paymentConnection.findMany({
        where: { tenantId: tenant.id },
        select: { status: true },
      }),
      prisma.invoice.findMany({
        where: {
          tenantId: tenant.id,
          issuedAt: { gte: sevenDaysAgo },
          status: "PAID",
        },
        select: { issuedAt: true, totalCents: true },
      }),
    ]);

  const revenue7d = paidAgg._sum.totalCents ?? 0;
  const paidCount7d = paidAgg._count._all ?? 0;
  const lowStockAlerts = stockItems.filter((item) => item.onHand <= item.reorderPoint).length;
  const paymentsConnected = paymentConnections.filter((c) => c.status === "CONNECTED").length;

  const dayBuckets = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(sevenDaysAgo, i);
    return { day, label: day.toLocaleDateString("en-US", { weekday: "short" }), cents: 0 };
  });

  for (const invoice of invoices7d) {
    const invoiceDay = startOfDay(invoice.issuedAt).getTime();
    const bucket = dayBuckets.find((b) => b.day.getTime() === invoiceDay);
    if (bucket) bucket.cents += invoice.totalCents;
  }

  const maxCents = Math.max(1, ...dayBuckets.map((b) => b.cents));

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Dashboard</h1>
          <p className="text-sm md:text-base text-[var(--pos-muted)] mt-2">
            A live demo workspace for <span className="font-semibold text-[var(--pos-text)]">{tenant.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={invoicesHref}
            className="px-4 py-2 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-sm font-semibold"
          >
            View invoices
          </Link>
          <Link
            href={settingsHref}
            className="px-4 py-2 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-sm font-semibold"
          >
            Customize
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <PosCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-[var(--pos-muted)]">Revenue (7 days)</div>
              <div className="text-2xl font-bold mt-1">{formatMoney({ cents: revenue7d, currency: tenant.currency })}</div>
              <div className="text-xs text-[var(--pos-muted)] mt-1">{paidCount7d} paid invoices</div>
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
              <div className="text-sm text-[var(--pos-muted)]">Open invoices</div>
              <div className="text-2xl font-bold mt-1">{formatCompactNumber(openInvoices)}</div>
              <div className="text-xs text-[var(--pos-muted)] mt-1">Sent + overdue</div>
            </div>
            <div
              className="w-11 h-11 rounded-2xl border flex items-center justify-center"
              style={{ borderColor: "var(--pos-border)", background: "rgba(255,255,255,0.04)" }}
            >
              <Receipt className="w-5 h-5" style={{ color: "var(--pos-accent)" }} />
            </div>
          </div>
        </PosCard>

        <PosCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-[var(--pos-muted)]">Low stock alerts</div>
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

        <PosCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-[var(--pos-muted)]">Payments connected</div>
              <div className="text-2xl font-bold mt-1">{formatCompactNumber(paymentsConnected)}</div>
              <div className="text-xs text-[var(--pos-muted)] mt-1">Bank / PayPal / Card</div>
            </div>
            <div
              className="w-11 h-11 rounded-2xl border flex items-center justify-center"
              style={{ borderColor: "var(--pos-border)", background: "rgba(255,255,255,0.04)" }}
            >
              <CreditCard className="w-5 h-5" style={{ color: "var(--pos-accent2)" }} />
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
                <div className="text-sm font-semibold">Paid revenue trend</div>
                <div className="text-xs text-[var(--pos-muted)]">Last 7 days</div>
              </div>
              <div className="text-xs text-[var(--pos-muted)] font-mono">{tenant.currency}</div>
            </div>
          </PosCardHeader>
          <PosCardContent>
            <div className="flex items-end gap-2 h-36">
              {dayBuckets.map((b) => {
                const heightPct = Math.round((b.cents / maxCents) * 100);
                return (
                  <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full rounded-2xl border border-[color:var(--pos-border)] bg-white/5 overflow-hidden"
                      style={{ height: "100%" }}
                    >
                      <div
                        className="w-full rounded-2xl"
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

        {/* Recent invoices */}
        <PosCard className="lg:col-span-3">
          <PosCardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">Recent invoices</div>
                <div className="text-xs text-[var(--pos-muted)]">Click into the module to explore more.</div>
              </div>
              <Link
                href={invoicesHref}
                className="text-sm font-semibold text-[var(--pos-accent2)] hover:underline"
              >
                Open module
              </Link>
            </div>
          </PosCardHeader>
          <PosCardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--pos-muted)]">
                    <th className="py-2 pr-4 font-medium">Invoice</th>
                    <th className="py-2 pr-4 font-medium">Customer</th>
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-[color:var(--pos-border)]">
                      <td className="py-3 pr-4 font-mono text-xs">{inv.number}</td>
                      <td className="py-3 pr-4">{inv.customerName}</td>
                      <td className="py-3 pr-4">{formatDate(inv.issuedAt)}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 text-right font-semibold">
                        {formatMoney({ cents: inv.totalCents, currency: inv.currency })}
                      </td>
                    </tr>
                  ))}
                  {recentInvoices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[var(--pos-muted)]">
                        No invoices yet.
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
}
