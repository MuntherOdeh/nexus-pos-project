import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";
import { calculateOrderTotals, getDefaultTaxRate } from "@/lib/pos/order-totals";
import { deriveOrderStatusFromItems } from "@/lib/pos/order-status";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: { tenant: string; orderId: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const orderId = context.params.orderId;
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.posOrder.findFirst({
      where: { id: orderId, tenantId: auth.ctx.tenantId },
      select: { id: true, status: true, sentToKitchenAt: true },
    });

    if (!order) return { ok: false as const, status: 404, error: "Order not found" };
    if (order.status === "PAID" || order.status === "CANCELLED") {
      return { ok: false as const, status: 400, error: "Order is closed" };
    }

    await tx.posOrderItem.updateMany({
      where: { orderId: order.id, status: "NEW" },
      data: { status: "SENT" },
    });

    const itemsForTotals = await tx.posOrderItem.findMany({
      where: { orderId: order.id },
      select: { unitPriceCents: true, quantity: true, status: true, discountPercent: true },
    });

    const billableCount = itemsForTotals.filter((item) => item.status !== "VOID").length;
    if (billableCount === 0) {
      return { ok: false as const, status: 400, error: "Order has no billable items" };
    }

    const totals = calculateOrderTotals({ items: itemsForTotals, taxRate: getDefaultTaxRate() });
    const derivedStatus = deriveOrderStatusFromItems({ items: itemsForTotals });
    const status = derivedStatus === "OPEN" ? "IN_KITCHEN" : derivedStatus;

    await tx.posOrder.update({
      where: { id: order.id },
      data: {
        ...totals,
        currency: auth.ctx.tenantCurrency,
        status,
        sentToKitchenAt: order.sentToKitchenAt ?? now,
      },
    });

    const updated = await tx.posOrder.findUnique({
      where: { id: order.id },
      select: {
        id: true,
        status: true,
        orderNumber: true,
        notes: true,
        subtotalCents: true,
        discountCents: true,
        taxCents: true,
        totalCents: true,
        currency: true,
        openedAt: true,
        sentToKitchenAt: true,
        closedAt: true,
        table: { select: { id: true, name: true, capacity: true } },
        items: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            productId: true,
            productName: true,
            unitPriceCents: true,
            quantity: true,
            status: true,
            notes: true,
            discountPercent: true,
            createdAt: true,
          },
        },
        payments: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            provider: true,
            status: true,
            amountCents: true,
            currency: true,
            processorRef: true,
            metadata: true,
            createdAt: true,
          },
        },
      },
    });

    return { ok: true as const, order: updated };
  });

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, order: result.order });
}
