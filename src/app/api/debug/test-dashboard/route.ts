import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";
import { formatMoney, formatCompactNumber } from "@/lib/pos/format";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tenantSlug = url.searchParams.get("tenant") || "refill";

  const steps: { step: string; success: boolean; error?: string; data?: unknown }[] = [];

  try {
    // Step 1: Get tenant
    steps.push({ step: "Getting tenant", success: false });
    const tenant = await getTenantBySlug({ prisma, slug: tenantSlug });
    if (!tenant) {
      steps[steps.length - 1].error = "Tenant not found";
      return NextResponse.json({ steps, success: false });
    }
    steps[steps.length - 1].success = true;
    steps[steps.length - 1].data = { id: tenant.id, slug: tenant.slug, name: tenant.name };

    const now = new Date();
    const sevenDaysAgo = addDays(startOfDay(now), -6);
    const today = startOfDay(now);

    // Step 2: Paid orders aggregate
    steps.push({ step: "Fetching paid orders aggregate", success: false });
    const paidOrdersAgg = await prisma.posOrder.aggregate({
      where: {
        tenantId: tenant.id,
        status: "PAID",
        closedAt: { gte: sevenDaysAgo },
      },
      _sum: { totalCents: true },
      _count: { _all: true },
    });
    steps[steps.length - 1].success = true;
    steps[steps.length - 1].data = paidOrdersAgg;

    // Step 3: Active orders count
    steps.push({ step: "Fetching active orders count", success: false });
    const activeOrdersCount = await prisma.posOrder.count({
      where: {
        tenantId: tenant.id,
        status: { in: ["OPEN", "IN_KITCHEN", "READY", "FOR_PAYMENT"] },
      },
    });
    steps[steps.length - 1].success = true;
    steps[steps.length - 1].data = { count: activeOrdersCount };

    // Step 4: Today orders aggregate
    steps.push({ step: "Fetching today orders aggregate", success: false });
    const todayOrdersAgg = await prisma.posOrder.aggregate({
      where: {
        tenantId: tenant.id,
        status: "PAID",
        closedAt: { gte: today },
      },
      _sum: { totalCents: true },
      _count: { _all: true },
    });
    steps[steps.length - 1].success = true;
    steps[steps.length - 1].data = todayOrdersAgg;

    // Step 5: Stock items
    steps.push({ step: "Fetching stock items", success: false });
    const stockItems = await prisma.stockItem.findMany({
      where: { tenantId: tenant.id, reorderPoint: { gt: 0 } },
      select: { onHand: true, reorderPoint: true },
    });
    steps[steps.length - 1].success = true;
    steps[steps.length - 1].data = { count: stockItems.length };

    // Step 6: Recent orders
    steps.push({ step: "Fetching recent orders", success: false });
    const recentOrders = await prisma.posOrder.findMany({
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
    });
    steps[steps.length - 1].success = true;
    steps[steps.length - 1].data = { count: recentOrders.length, sample: recentOrders[0] };

    // Step 7: Orders for chart
    steps.push({ step: "Fetching chart orders", success: false });
    const orders7d = await prisma.posOrder.findMany({
      where: {
        tenantId: tenant.id,
        status: "PAID",
        closedAt: { gte: sevenDaysAgo },
      },
      select: { closedAt: true, totalCents: true },
    });
    steps[steps.length - 1].success = true;
    steps[steps.length - 1].data = { count: orders7d.length };

    // Step 8: Active cash session
    steps.push({ step: "Fetching active cash session", success: false });
    const activeCashSession = await prisma.posCashSession.findFirst({
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
    });
    steps[steps.length - 1].success = true;
    steps[steps.length - 1].data = activeCashSession;

    // Step 9: Test formatMoney
    steps.push({ step: "Testing formatMoney", success: false });
    const testFormat = formatMoney({ cents: 1000, currency: tenant.currency });
    steps[steps.length - 1].success = true;
    steps[steps.length - 1].data = { result: testFormat };

    // Step 10: Test formatCompactNumber
    steps.push({ step: "Testing formatCompactNumber", success: false });
    const testCompact = formatCompactNumber(activeOrdersCount);
    steps[steps.length - 1].success = true;
    steps[steps.length - 1].data = { result: testCompact };

    // Step 11: Test rendering data transformation
    steps.push({ step: "Testing data transformation", success: false });
    const revenue7d = paidOrdersAgg._sum.totalCents ?? 0;
    const ordersCount7d = paidOrdersAgg._count._all ?? 0;
    const todayRevenue = todayOrdersAgg._sum.totalCents ?? 0;
    const todayOrdersCount = todayOrdersAgg._count._all ?? 0;
    const lowStockAlerts = stockItems.filter((item) => item.onHand <= item.reorderPoint).length;

    // Test order rendering
    const orderRenderTest = recentOrders.map((order) => ({
      orderNumber: order.orderNumber?.slice(-10) ?? "—",
      tableName: order.table?.name || "Quick Sale",
      itemCount: order._count?.items ?? 0,
      total: formatMoney({ cents: order.totalCents ?? 0, currency: order.currency }),
    }));

    // Test cash session rendering
    const cashSessionRenderTest = activeCashSession
      ? {
          openingCash: formatMoney({ cents: activeCashSession.openingCashCents, currency: activeCashSession.currency }),
          openedBy: activeCashSession.openedBy?.firstName ?? "Unknown",
        }
      : null;

    steps[steps.length - 1].success = true;
    steps[steps.length - 1].data = {
      revenue7d,
      ordersCount7d,
      todayRevenue,
      todayOrdersCount,
      lowStockAlerts,
      orderRenderTest,
      cashSessionRenderTest,
    };

    return NextResponse.json({
      success: true,
      steps,
      summary: {
        tenant: tenant.name,
        revenue7d: formatMoney({ cents: revenue7d, currency: tenant.currency }),
        activeOrders: activeOrdersCount,
        lowStockAlerts,
        recentOrdersCount: recentOrders.length,
        hasCashSession: !!activeCashSession,
      },
    });
  } catch (error) {
    const lastStep = steps[steps.length - 1];
    if (lastStep && !lastStep.success) {
      lastStep.error = (error as Error).message;
      lastStep.data = { stack: (error as Error).stack };
    }
    return NextResponse.json({
      success: false,
      steps,
      error: {
        message: (error as Error).message,
        stack: (error as Error).stack,
      },
    }, { status: 500 });
  }
}
