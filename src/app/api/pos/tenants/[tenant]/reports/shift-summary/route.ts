import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

// GET - Get shift summary (for closing cash session)
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim() || null;

  if (!sessionId) {
    return NextResponse.json({ success: false, error: "sessionId is required" }, { status: 400 });
  }

  // Verify cash session exists and belongs to tenant
  const cashSession = await prisma.posCashSession.findFirst({
    where: {
      id: sessionId,
      tenantId: auth.ctx.tenantId,
    },
    select: {
      id: true,
      openedAt: true,
      closedAt: true,
      status: true,
      openingCashCents: true,
      openedBy: { select: { firstName: true, lastName: true } },
    },
  });

  if (!cashSession) {
    return NextResponse.json({ success: false, error: "Cash session not found" }, { status: 404 });
  }

  // Get all orders during this session
  const sessionStart = cashSession.openedAt;
  const sessionEnd = cashSession.closedAt || new Date();

  const orders = await prisma.posOrder.findMany({
    where: {
      tenantId: auth.ctx.tenantId,
      openedAt: {
        gte: sessionStart,
        lte: sessionEnd,
      },
      status: { in: ["PAID", "CANCELLED"] },
    },
    include: {
      payments: true,
      items: true,
      appliedDiscounts: true,
      tips: true,
      voidRefunds: true,
    },
  });

  // Calculate summary
  const paidOrders = orders.filter((o) => o.status === "PAID");
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");

  const totalSalesCents = paidOrders.reduce((sum, o) => sum + o.totalCents, 0);
  const totalTaxCents = paidOrders.reduce((sum, o) => sum + o.taxCents, 0);
  const totalDiscountsCents = paidOrders.reduce((sum, o) => sum + o.discountCents, 0);
  const totalTipsCents = paidOrders.reduce((sum, o) => sum + o.tipCents, 0);

  // Payment breakdown
  const cashPaymentsCents = paidOrders.reduce(
    (sum, o) =>
      sum +
      o.payments
        .filter((p) => p.provider === "CASH" && p.status === "CAPTURED")
        .reduce((s, p) => s + p.amountCents, 0),
    0
  );
  const cardPaymentsCents = paidOrders.reduce(
    (sum, o) =>
      sum +
      o.payments
        .filter((p) => p.provider === "CARD" && p.status === "CAPTURED")
        .reduce((s, p) => s + p.amountCents, 0),
    0
  );
  const otherPaymentsCents = paidOrders.reduce(
    (sum, o) =>
      sum +
      o.payments
        .filter((p) => !["CASH", "CARD"].includes(p.provider) && p.status === "CAPTURED")
        .reduce((s, p) => s + p.amountCents, 0),
    0
  );

  // Void/refund totals
  const voidRefunds = orders.flatMap((o) => o.voidRefunds);
  const totalRefundsCents = voidRefunds.reduce((sum, v) => sum + v.amountCents, 0);
  const voidCount = voidRefunds.length;

  // Item count
  const itemCount = paidOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

  // Average order value
  const orderCount = paidOrders.length;
  const averageOrderCents = orderCount > 0 ? Math.round(totalSalesCents / orderCount) : 0;

  // Expected cash = opening cash + cash payments - cash refunds
  const expectedCashCents = cashSession.openingCashCents + cashPaymentsCents;

  const summary = {
    sessionId: cashSession.id,
    sessionStart,
    sessionEnd,
    openedBy: cashSession.openedBy,
    openingCashCents: cashSession.openingCashCents,

    // Sales
    totalSalesCents,
    totalTaxCents,
    totalDiscountsCents,
    totalTipsCents,
    totalRefundsCents,

    // Payment breakdown
    cashPaymentsCents,
    cardPaymentsCents,
    otherPaymentsCents,

    // Counts
    orderCount,
    cancelledOrderCount: cancelledOrders.length,
    itemCount,
    voidCount,

    // Averages
    averageOrderCents,

    // Cash drawer
    expectedCashCents,
  };

  return NextResponse.json({ success: true, summary });
}

// POST - Save shift summary when closing
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { sessionId, ...summaryData } = body;

  if (!sessionId) {
    return NextResponse.json({ success: false, error: "sessionId is required" }, { status: 400 });
  }

  // Verify cash session exists and belongs to tenant
  const cashSession = await prisma.posCashSession.findFirst({
    where: {
      id: sessionId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!cashSession) {
    return NextResponse.json({ success: false, error: "Cash session not found" }, { status: 404 });
  }

  // Check if summary already exists
  const existingSummary = await prisma.shiftSummary.findFirst({
    where: { cashSessionId: sessionId },
  });

  if (existingSummary) {
    // Update existing
    const summary = await prisma.shiftSummary.update({
      where: { id: existingSummary.id },
      data: {
        totalSalesCents: summaryData.totalSalesCents || 0,
        totalTaxCents: summaryData.totalTaxCents || 0,
        totalDiscountsCents: summaryData.totalDiscountsCents || 0,
        totalRefundsCents: summaryData.totalRefundsCents || 0,
        totalTipsCents: summaryData.totalTipsCents || 0,
        cashPaymentsCents: summaryData.cashPaymentsCents || 0,
        cardPaymentsCents: summaryData.cardPaymentsCents || 0,
        otherPaymentsCents: summaryData.otherPaymentsCents || 0,
        orderCount: summaryData.orderCount || 0,
        itemCount: summaryData.itemCount || 0,
        voidCount: summaryData.voidCount || 0,
        averageOrderCents: summaryData.averageOrderCents || 0,
      },
    });
    return NextResponse.json({ success: true, summary });
  }

  // Create new summary
  const summary = await prisma.shiftSummary.create({
    data: {
      tenantId: auth.ctx.tenantId,
      cashSessionId: sessionId,
      totalSalesCents: summaryData.totalSalesCents || 0,
      totalTaxCents: summaryData.totalTaxCents || 0,
      totalDiscountsCents: summaryData.totalDiscountsCents || 0,
      totalRefundsCents: summaryData.totalRefundsCents || 0,
      totalTipsCents: summaryData.totalTipsCents || 0,
      cashPaymentsCents: summaryData.cashPaymentsCents || 0,
      cardPaymentsCents: summaryData.cardPaymentsCents || 0,
      otherPaymentsCents: summaryData.otherPaymentsCents || 0,
      orderCount: summaryData.orderCount || 0,
      itemCount: summaryData.itemCount || 0,
      voidCount: summaryData.voidCount || 0,
      averageOrderCents: summaryData.averageOrderCents || 0,
    },
  });

  return NextResponse.json({ success: true, summary }, { status: 201 });
}
