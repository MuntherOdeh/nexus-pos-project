import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";
import { calculateOrderTotals, getDefaultTaxRate } from "@/lib/pos/order-totals";

export const dynamic = "force-dynamic";

const paySchema = z.object({
  provider: z.enum(["CASH", "BANK", "PAYPAL", "CARD"]),
  amountCents: z.coerce.number().int().min(1).optional(),
});

const orderSelect = {
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
    orderBy: { createdAt: "asc" as const },
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
    orderBy: { createdAt: "asc" as const },
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
};

export async function POST(request: NextRequest, context: { params: { tenant: string; orderId: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = paySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const orderId = context.params.orderId;
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.posOrder.findFirst({
      where: { id: orderId, tenantId: auth.ctx.tenantId },
      select: {
        id: true,
        status: true,
        currency: true,
        items: { select: { unitPriceCents: true, quantity: true, status: true, discountPercent: true } },
        payments: { select: { status: true, amountCents: true } },
      },
    });

    if (!order) return { ok: false as const, status: 404, error: "Order not found" };
    if (order.status === "CANCELLED") return { ok: false as const, status: 400, error: "Order is cancelled" };
    if (order.status === "PAID") {
      const existing = await tx.posOrder.findUnique({ where: { id: order.id }, select: orderSelect });
      return { ok: true as const, order: existing, changeDueCents: 0 };
    }

    const totals = calculateOrderTotals({ items: order.items, taxRate: getDefaultTaxRate() });
    const paidSoFar = order.payments
      .filter((p) => p.status === "CAPTURED")
      .reduce((sum, p) => sum + p.amountCents, 0);

    const outstanding = Math.max(0, totals.totalCents - paidSoFar);
    if (outstanding <= 0) {
      await tx.posOrder.update({
        where: { id: order.id },
        data: { ...totals, status: "PAID", closedAt: now, currency: auth.ctx.tenantCurrency },
      });

      const paidOrder = await tx.posOrder.findUnique({ where: { id: order.id }, select: orderSelect });
      return { ok: true as const, order: paidOrder, changeDueCents: 0 };
    }

    const requested = parsed.data.amountCents ?? outstanding;
    const amountCents = Math.min(requested, outstanding);
    const changeDueCents = parsed.data.provider === "CASH" && requested > outstanding ? requested - outstanding : 0;

    await tx.posPayment.create({
      data: {
        tenantId: auth.ctx.tenantId,
        orderId: order.id,
        provider: parsed.data.provider,
        status: "CAPTURED",
        amountCents,
        currency: auth.ctx.tenantCurrency,
        ...(changeDueCents > 0 ? { metadata: { receivedCents: requested, changeDueCents } } : {}),
      },
    });

    const newPaid = paidSoFar + amountCents;
    const nextStatus = newPaid >= totals.totalCents ? "PAID" : "FOR_PAYMENT";

    await tx.posOrder.update({
      where: { id: order.id },
      data: {
        ...totals,
        currency: auth.ctx.tenantCurrency,
        status: nextStatus,
        closedAt: nextStatus === "PAID" ? now : null,
      },
    });

    const updated = await tx.posOrder.findUnique({ where: { id: order.id }, select: orderSelect });

    return { ok: true as const, order: updated, changeDueCents };
  });

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, order: result.order, changeDueCents: result.changeDueCents });
}
