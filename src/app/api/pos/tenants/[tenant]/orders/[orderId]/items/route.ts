import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";
import { calculateOrderTotals, getDefaultTaxRate } from "@/lib/pos/order-totals";

export const dynamic = "force-dynamic";

// Schema for adding items - supports both catalog products and custom items
const addItemSchema = z.discriminatedUnion("type", [
  // Catalog product
  z.object({
    type: z.literal("catalog").default("catalog"),
    productId: z.string().min(1),
    quantity: z.coerce.number().int().min(1).max(99).default(1),
    notes: z.string().max(500).optional().nullable(),
  }),
  // Custom item (no productId)
  z.object({
    type: z.literal("custom"),
    productName: z.string().min(1).max(200),
    unitPriceCents: z.coerce.number().int().min(1),
    quantity: z.coerce.number().int().min(1).max(99).default(1),
    notes: z.string().max(500).optional().nullable(),
  }),
]).or(
  // Legacy format: detect by presence of productId or productName
  z.object({
    productId: z.string().min(1).optional(),
    productName: z.string().min(1).max(200).optional(),
    unitPriceCents: z.coerce.number().int().min(1).optional(),
    quantity: z.coerce.number().int().min(1).max(99).default(1),
    notes: z.string().max(500).optional().nullable(),
  })
);

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

  const data = parsed.data;
  
  // Determine if this is a custom item or catalog product
  let itemName: string;
  let itemPrice: number;
  let productId: string | null = null;

  // Handle discriminated union or legacy format
  if ("type" in data && data.type === "custom") {
    // New custom item format
    itemName = data.productName;
    itemPrice = data.unitPriceCents;
  } else if ("type" in data && data.type === "catalog") {
    // New catalog format
    const product = await prisma.product.findFirst({
      where: { id: data.productId, tenantId: auth.ctx.tenantId, isActive: true },
      select: { id: true, name: true, priceCents: true },
    });
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }
    productId = product.id;
    itemName = product.name;
    itemPrice = product.priceCents;
  } else if ("productId" in data && data.productId) {
    // Legacy format with productId
    const product = await prisma.product.findFirst({
      where: { id: data.productId, tenantId: auth.ctx.tenantId, isActive: true },
      select: { id: true, name: true, priceCents: true },
    });
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }
    productId = product.id;
    itemName = product.name;
    itemPrice = product.priceCents;
  } else if ("productName" in data && data.productName && "unitPriceCents" in data && data.unitPriceCents) {
    // Legacy custom item format
    itemName = data.productName;
    itemPrice = data.unitPriceCents;
  } else {
    return NextResponse.json({ success: false, error: "Must provide productId or productName with unitPriceCents" }, { status: 400 });
  }

  const quantity = data.quantity;
  const notes = "notes" in data ? data.notes : null;
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
        productId: productId,
        productName: itemName,
        unitPriceCents: itemPrice,
        quantity: quantity,
        notes: notes?.trim() || null,
        status: "NEW",
      },
    });

    const itemsForTotals = await tx.posOrderItem.findMany({
      where: { orderId: order.id },
      select: { unitPriceCents: true, quantity: true, status: true, discountPercent: true },
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

