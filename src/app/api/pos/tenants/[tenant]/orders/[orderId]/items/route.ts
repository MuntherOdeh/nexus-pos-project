import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";
import { calculateOrderTotals, getDefaultTaxRate } from "@/lib/pos/order-totals";

export const dynamic = "force-dynamic";

const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  notes: z.string().max(500).optional().nullable(),
});

export async function POST(request: NextRequest, context: { params: { tenant: string; orderId: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, tenantId: auth.ctx.tenantId, isActive: true },
    select: { id: true, name: true, priceCents: true, currency: true },
  });

  if (!product) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  const orderId = context.params.orderId;

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.posOrder.findFirst({
      where: { id: orderId, tenantId: auth.ctx.tenantId },
      select: { id: true, status: true },
    });

    if (!order) {
      return { ok: false as const, status: 404, error: "Order not found" };
    }

    if (order.status === "PAID" || order.status === "CANCELLED") {
      return { ok: false as const, status: 400, error: "Order is closed" };
    }

    await tx.posOrderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        productName: product.name,
        unitPriceCents: product.priceCents,
        quantity: parsed.data.quantity,
        notes: parsed.data.notes?.trim() || null,
        status: "NEW",
      },
    });

    const itemsForTotals = await tx.posOrderItem.findMany({
      where: { orderId: order.id },
      select: { unitPriceCents: true, quantity: true, status: true },
    });

    const totals = calculateOrderTotals({ items: itemsForTotals, taxRate: getDefaultTaxRate() });
    const nextStatus = order.status === "READY" || order.status === "FOR_PAYMENT" ? "OPEN" : order.status;

    await tx.posOrder.update({
      where: { id: order.id },
      data: {
        ...totals,
        currency: auth.ctx.tenantCurrency,
        status: nextStatus,
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

