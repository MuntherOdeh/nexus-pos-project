import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

// GET - Get sales reports with various filters
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only managers/admins can view sales reports
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const period = request.nextUrl.searchParams.get("period") || "today"; // today, week, month, custom
  const startDate = request.nextUrl.searchParams.get("startDate")?.trim() || null;
  const endDate = request.nextUrl.searchParams.get("endDate")?.trim() || null;
  const groupBy = request.nextUrl.searchParams.get("groupBy") || "day"; // hour, day, week, month

  // Calculate date range
  let dateStart: Date;
  let dateEnd: Date = new Date();

  if (period === "custom" && startDate && endDate) {
    dateStart = new Date(startDate);
    dateEnd = new Date(endDate);
  } else {
    const now = new Date();
    switch (period) {
      case "today":
        dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "yesterday":
        dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        dateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case "month":
        dateStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case "year":
        dateStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
  }

  // Get orders in date range
  const orders = await prisma.posOrder.findMany({
    where: {
      tenantId: auth.ctx.tenantId,
      status: "PAID",
      closedAt: {
        gte: dateStart,
        lte: dateEnd,
      },
    },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, categoryId: true } },
        },
      },
      payments: true,
    },
    orderBy: { closedAt: "asc" },
  });

  // Calculate overall summary
  const totalOrders = orders.length;
  const totalSalesCents = orders.reduce((sum, o) => sum + o.totalCents, 0);
  const totalTaxCents = orders.reduce((sum, o) => sum + o.taxCents, 0);
  const totalDiscountsCents = orders.reduce((sum, o) => sum + o.discountCents, 0);
  const totalTipsCents = orders.reduce((sum, o) => sum + o.tipCents, 0);
  const averageOrderCents = totalOrders > 0 ? Math.round(totalSalesCents / totalOrders) : 0;

  // Payment breakdown
  const paymentBreakdown = orders.reduce(
    (acc, order) => {
      order.payments.forEach((p) => {
        if (p.status === "CAPTURED") {
          acc[p.provider] = (acc[p.provider] || 0) + p.amountCents;
        }
      });
      return acc;
    },
    {} as Record<string, number>
  );

  // Top selling products
  const productSales: Record<string, { name: string; quantity: number; totalCents: number }> = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const key = item.productId || item.productName;
      if (!productSales[key]) {
        productSales[key] = {
          name: item.productName,
          quantity: 0,
          totalCents: 0,
        };
      }
      productSales[key].quantity += item.quantity;
      productSales[key].totalCents += item.unitPriceCents * item.quantity;
    });
  });

  const topProducts = Object.entries(productSales)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, 10);

  // Sales by time period
  const salesByPeriod: Record<string, { orders: number; salesCents: number }> = {};
  orders.forEach((order) => {
    if (!order.closedAt) return;
    let key: string;
    const d = new Date(order.closedAt);

    switch (groupBy) {
      case "hour":
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:00`;
        break;
      case "week":
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
        break;
      case "month":
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        break;
      default: // day
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    if (!salesByPeriod[key]) {
      salesByPeriod[key] = { orders: 0, salesCents: 0 };
    }
    salesByPeriod[key].orders += 1;
    salesByPeriod[key].salesCents += order.totalCents;
  });

  const salesTimeline = Object.entries(salesByPeriod)
    .map(([period, data]) => ({ period, ...data }))
    .sort((a, b) => a.period.localeCompare(b.period));

  return NextResponse.json({
    success: true,
    report: {
      dateRange: {
        start: dateStart,
        end: dateEnd,
        period,
      },
      summary: {
        totalOrders,
        totalSalesCents,
        totalTaxCents,
        totalDiscountsCents,
        totalTipsCents,
        averageOrderCents,
        netSalesCents: totalSalesCents - totalDiscountsCents,
      },
      paymentBreakdown,
      topProducts,
      salesTimeline,
    },
  });
}
