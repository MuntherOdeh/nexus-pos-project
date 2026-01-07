import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";
import { calculateOrderTotals, getDefaultTaxRate } from "@/lib/pos/order-totals";
import { deriveOrderStatusFromItems } from "@/lib/pos/order-status";

export const dynamic = "force-dynamic";

const patchItemSchema = z
  .object({
    quantity: z.coerce.number().int().min(1).max(99).optional(),
    notes: z.string().max(500).nullable().optional(),
    status: z.enum(["NEW", "SENT", "IN_PROGRESS", "READY", "SERVED", "VOID"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "No changes provided" });

export async function PATCH(
  request: NextRequest,
  context: { params: { tenant: string; orderId: string; itemId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = patchItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const orderId = context.params.orderId;
  const itemId = context.params.itemId;

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

    const item = await tx.posOrderItem.findFirst({
      where: { id: itemId, orderId: order.id },
      select: { id: true, status: true },
    });

    if (!item) {
      return { ok: false as const, status: 404, error: "Item not found" };
    }

    if (item.status === "VOID" && parsed.data.status && parsed.data.status !== "VOID") {
      return { ok: false as const, status: 400, error: "Cannot modify a voided item" };
    }

    if ((parsed.data.quantity !== undefined || parsed.data.notes !== undefined) && item.status !== "NEW") {
      return { ok: false as const, status: 400, error: "Only NEW items can be edited" };
    }

    await tx.posOrderItem.update({
      where: { id: item.id },
      data: {
        ...(parsed.data.quantity !== undefined ? { quantity: parsed.data.quantity } : {}),
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes?.trim() || null } : {}),
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
      },
    });

    const itemsForTotals = await tx.posOrderItem.findMany({
      where: { orderId: order.id },
      select: { unitPriceCents: true, quantity: true, status: true },
    });

    const totals = calculateOrderTotals({ items: itemsForTotals, taxRate: getDefaultTaxRate() });
    const nextStatus = deriveOrderStatusFromItems({ items: itemsForTotals });

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

