"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  Download,
  RefreshCw,
  CreditCard,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { PosCard, PosCardContent, PosCardHeader } from "@/components/pos/PosCard";
import { useToast, ReportsSkeleton } from "@/components/pos";
import type { SalesReport } from "@/types/pos";

export default function ReportsPage() {
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const toast = useToast();

  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("today");
  const [groupBy, setGroupBy] = useState("hour");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/pos/tenants/${tenantSlug}/reports/sales?period=${period}&groupBy=${groupBy}`
      );
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      }
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, period, groupBy]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const formatMoney = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
    }).format(cents / 100);
  };

  const getPaymentIcon = (provider: string) => {
    switch (provider) {
      case "CASH":
        return <Banknote className="w-4 h-4" />;
      case "CARD":
        return <CreditCard className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const maxSales = report?.salesTimeline
    ? Math.max(...report.salesTimeline.map((t) => t.salesCents), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-violet-500" />
            Sales Reports
          </h1>
          <p className="text-sm text-[var(--pos-muted)] mt-1">
            Analyze your sales performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--pos-border)] hover:bg-[var(--pos-border)] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--pos-accent)] text-white font-semibold hover:opacity-90">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "today", label: "Today" },
          { value: "yesterday", label: "Yesterday" },
          { value: "week", label: "This Week" },
          { value: "month", label: "This Month" },
          { value: "year", label: "This Year" },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => {
              setPeriod(p.value);
              setGroupBy(p.value === "today" ? "hour" : p.value === "year" ? "month" : "day");
            }}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
              period === p.value
                ? "bg-[var(--pos-accent)] text-white"
                : "border border-[var(--pos-border)] hover:border-[var(--pos-accent)]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[var(--pos-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PosCard className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-[var(--pos-muted)]">Total Sales</div>
                  <div className="text-2xl font-bold mt-1">
                    {formatMoney(report.summary.totalSalesCents)}
                  </div>
                  <div className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3" />
                    Net: {formatMoney(report.summary.netSalesCents)}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </PosCard>

            <PosCard className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-[var(--pos-muted)]">Orders</div>
                  <div className="text-2xl font-bold mt-1">{report.summary.totalOrders}</div>
                  <div className="text-xs text-[var(--pos-muted)] mt-1">
                    Avg: {formatMoney(report.summary.averageOrderCents)}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </PosCard>

            <PosCard className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-[var(--pos-muted)]">Tax Collected</div>
                  <div className="text-2xl font-bold mt-1">
                    {formatMoney(report.summary.totalTaxCents)}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </PosCard>

            <PosCard className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-[var(--pos-muted)]">Tips</div>
                  <div className="text-2xl font-bold mt-1">
                    {formatMoney(report.summary.totalTipsCents)}
                  </div>
                  <div className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                    <ArrowDownRight className="w-3 h-3" />
                    Discounts: {formatMoney(report.summary.totalDiscountsCents)}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-500" />
                </div>
              </div>
            </PosCard>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sales Chart */}
            <PosCard className="lg:col-span-2">
              <PosCardHeader>
                <h3 className="font-semibold">Sales Timeline</h3>
              </PosCardHeader>
              <PosCardContent>
                <div className="h-64 flex items-end gap-1">
                  {report.salesTimeline.map((t, i) => {
                    const heightPct = Math.max(5, (t.salesCents / maxSales) * 100);
                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-1 group"
                      >
                        <div className="text-xs text-[var(--pos-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatMoney(t.salesCents)}
                        </div>
                        <div
                          className="w-full rounded-t-lg transition-all hover:opacity-80"
                          style={{
                            height: `${heightPct}%`,
                            background:
                              "linear-gradient(180deg, var(--pos-accent2), var(--pos-accent))",
                          }}
                        />
                        <div className="text-[10px] text-[var(--pos-muted)] truncate w-full text-center">
                          {t.period?.split(" ")[1] || t.period?.split("-").slice(-1)[0] || "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PosCardContent>
            </PosCard>

            {/* Payment Breakdown */}
            <PosCard>
              <PosCardHeader>
                <h3 className="font-semibold">Payment Methods</h3>
              </PosCardHeader>
              <PosCardContent>
                <div className="space-y-3">
                  {Object.entries(report.paymentBreakdown).map(([method, amount]) => {
                    const total = Object.values(report.paymentBreakdown).reduce(
                      (a, b) => a + b,
                      0
                    );
                    const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
                    return (
                      <div key={method}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 text-sm">
                            {getPaymentIcon(method)}
                            <span>{method}</span>
                          </div>
                          <span className="text-sm font-semibold">{formatMoney(amount)}</span>
                        </div>
                        <div className="h-2 bg-[var(--pos-bg)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background:
                                "linear-gradient(90deg, var(--pos-accent), var(--pos-accent2))",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(report.paymentBreakdown).length === 0 && (
                    <p className="text-sm text-[var(--pos-muted)] text-center py-4">
                      No payment data
                    </p>
                  )}
                </div>
              </PosCardContent>
            </PosCard>
          </div>

          {/* Top Products */}
          <PosCard>
            <PosCardHeader>
              <h3 className="font-semibold">Top Selling Products</h3>
            </PosCardHeader>
            <PosCardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--pos-muted)] border-b border-[var(--pos-border)]">
                      <th className="py-3 pr-4">#</th>
                      <th className="py-3 pr-4">Product</th>
                      <th className="py-3 pr-4 text-right">Quantity</th>
                      <th className="py-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topProducts.map((product, i) => (
                      <tr key={product.id} className="border-b border-[var(--pos-border)]">
                        <td className="py-3 pr-4 text-[var(--pos-muted)]">{i + 1}</td>
                        <td className="py-3 pr-4 font-medium">{product.name}</td>
                        <td className="py-3 pr-4 text-right">{product.quantity}</td>
                        <td className="py-3 text-right font-semibold text-emerald-500">
                          {formatMoney(product.totalCents)}
                        </td>
                      </tr>
                    ))}
                    {report.topProducts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[var(--pos-muted)]">
                          No product data for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </PosCardContent>
          </PosCard>
        </>
      ) : (
        <div className="text-center py-12 text-[var(--pos-muted)]">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No report data available</p>
        </div>
      )}
    </div>
  );
}
