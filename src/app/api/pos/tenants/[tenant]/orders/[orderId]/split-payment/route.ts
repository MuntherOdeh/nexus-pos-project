import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";
import { calculateOrderTotals, getDefaultTaxRate } from "@/lib/pos/order-totals";

export const dynamic = "force-dynamic";

const splitEquallySchema = z.object({
  type: z.literal("equally"),
  numberOfPeople: z.number().int().min(2).max(50),
});

const splitByAmountSchema = z.object({
  type: z.literal("by_amount"),
  splits: z.array(
    z.object({
      label: z.string().max(50).optional(), // e.g., "Person 1", "John"
      amountCents: z.number().int().min(0),
    })
  ).min(1),
});

const splitByItemsSchema = z.object({
  type: z.literal("by_items"),
  splits: z.array(
    z.object({
      label: z.string().max(50).optional(),
      itemIds: z.array(z.string()).min(1),
    })
  ).min(1),
});

const payPartSchema = z.object({
  splitIndex: z.number().int().min(0),
  provider: z.enum(["CASH", "BANK", "PAYPAL", "CARD"]),
  amountCents: z.number().int().min(1).optional(), // For overpayment (cash)
  tip: z.number().int().min(0).optional(),
});

const splitPaymentSchema = z.discriminatedUnion("type", [
  splitEquallySchema,
  splitByAmountSchema,
  splitByItemsSchema,
]);

// GET - Get current split payment state for an order
export async function GET(
  request: NextRequest,
  context: { params: { tenant: string; orderId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const order = await prisma.posOrder.findFirst({
    where: {
      id: context.params.orderId,
      tenantId: auth.ctx.tenantId,
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      subtotalCents: true,
      discountCents: true,
      taxCents: true,
      totalCents: true,
      tipCents: true,
      currency: true,
      items: {
        select: {
          id: true,
          productName: true,
          unitPriceCents: true,
          quantity: true,
          status: true,
        },
      },
      payments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          provider: true,
          status: true,
          amountCents: true,
          metadata: true,
          createdAt: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  const paidCents = order.payments
    .filter((p) => p.status === "CAPTURED")
    .reduce((sum, p) => sum + p.amountCents, 0);

  const outstandingCents = Math.max(0, order.totalCents + order.tipCents - paidCents);

  return NextResponse.json({
    success: true,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotalCents: order.subtotalCents,
      discountCents: order.discountCents,
      taxCents: order.taxCents,
      totalCents: order.totalCents,
      tipCents: order.tipCents,
      grandTotalCents: order.totalCents + order.tipCents,
      currency: order.currency,
      items: order.items,
    },
    payments: order.payments,
    summary: {
      paidCents,
      outstandingCents,
      paymentCount: order.payments.filter((p) => p.status === "CAPTURED").length,
      isFullyPaid: outstandingCents === 0,
    },
  });
}

// POST - Calculate split or process split payment
export async function POST(
  request: NextRequest,
  context: { params: { tenant: string; orderId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();

  // Check if this is a payment action
  if (body.action === "pay") {
    return handlePayPart(auth, context.params.orderId, body);
  }

  // Otherwise, it's a split calculation
  const parsed = splitPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const order = await prisma.posOrder.findFirst({
    where: {
      id: context.params.orderId,
      tenantId: auth.ctx.tenantId,
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalCents: true,
      tipCents: true,
      currency: true,
      items: {
        select: {
          id: true,
          productName: true,
          unitPriceCents: true,
          quantity: true,
          status: true,
        },
      },
      payments: {
        select: {
          status: true,
          amountCents: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  if (order.status === "PAID") {
    return NextResponse.json({ success: false, error: "Order is already paid" }, { status: 400 });
  }

  if (order.status === "CANCELLED") {
    return NextResponse.json({ success: false, error: "Order is cancelled" }, { status: 400 });
  }

  const paidCents = order.payments
    .filter((p) => p.status === "CAPTURED")
    .reduce((sum, p) => sum + p.amountCents, 0);

  const grandTotal = order.totalCents + order.tipCents;
  const outstandingCents = Math.max(0, grandTotal - paidCents);

  if (outstandingCents === 0) {
    return NextResponse.json({ success: false, error: "Order is already fully paid" }, { status: 400 });
  }

  let splits: Array<{ label: string; amountCents: number; itemIds?: string[] }>;

  switch (parsed.data.type) {
    case "equally": {
      const perPerson = Math.floor(outstandingCents / parsed.data.numberOfPeople);
      const remainder = outstandingCents % parsed.data.numberOfPeople;

      splits = Array.from({ length: parsed.data.numberOfPeople }, (_, i) => ({
        label: `Person ${i + 1}`,
        amountCents: perPerson + (i === 0 ? remainder : 0), // First person pays remainder
      }));
      break;
    }

    case "by_amount": {
      const totalSplit = parsed.data.splits.reduce((sum, s) => sum + s.amountCents, 0);
      if (totalSplit < outstandingCents) {
        return NextResponse.json(
          {
            success: false,
            error: `Split amounts total ${totalSplit} but outstanding is ${outstandingCents}`,
          },
          { status: 400 }
        );
      }

      splits = parsed.data.splits.map((s, i) => ({
        label: s.label || `Person ${i + 1}`,
        amountCents: s.amountCents,
      }));
      break;
    }

    case "by_items": {
      // Validate all item IDs exist in the order
      const orderItemIds = new Set(order.items.map((i) => i.id));
      const allItemIds = parsed.data.splits.flatMap((s) => s.itemIds);
      const invalidIds = allItemIds.filter((id) => !orderItemIds.has(id));

      if (invalidIds.length > 0) {
        return NextResponse.json(
          { success: false, error: `Invalid item IDs: ${invalidIds.join(", ")}` },
          { status: 400 }
        );
      }

      // Calculate each split based on items
      const itemMap = new Map(order.items.map((i) => [i.id, i]));

      splits = parsed.data.splits.map((s, i) => {
        const itemTotal = s.itemIds.reduce((sum, itemId) => {
          const item = itemMap.get(itemId)!;
          return sum + item.unitPriceCents * item.quantity;
        }, 0);

        // Add proportional share of tax and tips
        const proportion = itemTotal / order.totalCents;
        const proportionalTax = Math.round(order.tipCents * proportion);

        return {
          label: s.label || `Person ${i + 1}`,
          amountCents: itemTotal + proportionalTax,
          itemIds: s.itemIds,
        };
      });
      break;
    }
  }

  return NextResponse.json({
    success: true,
    splitType: parsed.data.type,
    grandTotalCents: grandTotal,
    outstandingCents,
    splits: splits.map((s, i) => ({
      index: i,
      ...s,
      isPaid: false,
    })),
  });
}

// Helper function to handle paying a split portion
async function handlePayPart(
  auth: { ok: true; ctx: { tenantId: string; user: { id: string }; tenantCurrency: string } },
  orderId: string,
  body: unknown
) {
  const parsed = payPartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.posOrder.findFirst({
      where: { id: orderId, tenantId: auth.ctx.tenantId },
      select: {
        id: true,
        status: true,
        currency: true,
        totalCents: true,
        tipCents: true,
        items: { select: { unitPriceCents: true, quantity: true, status: true, discountPercent: true } },
        payments: { select: { status: true, amountCents: true } },
      },
    });

    if (!order) return { ok: false as const, status: 404, error: "Order not found" };
    if (order.status === "CANCELLED") return { ok: false as const, status: 400, error: "Order is cancelled" };
    if (order.status === "PAID") return { ok: false as const, status: 400, error: "Order is already paid" };

    const totals = calculateOrderTotals({ items: order.items, taxRate: getDefaultTaxRate() });
    const grandTotal = totals.totalCents + order.tipCents;

    const paidSoFar = order.payments
      .filter((p) => p.status === "CAPTURED")
      .reduce((sum, p) => sum + p.amountCents, 0);

    const outstanding = Math.max(0, grandTotal - paidSoFar);
    if (outstanding <= 0) {
      return { ok: false as const, status: 400, error: "Order is already fully paid" };
    }

    const requestedAmount = parsed.data.amountCents || outstanding;
    const amountCents = Math.min(requestedAmount, outstanding);
    const tipAmount = parsed.data.tip || 0;
    const changeDueCents =
      parsed.data.provider === "CASH" && requestedAmount > outstanding
        ? requestedAmount - outstanding
        : 0;

    // Create payment
    await tx.posPayment.create({
      data: {
        tenantId: auth.ctx.tenantId,
        orderId: order.id,
        provider: parsed.data.provider,
        status: "CAPTURED",
        amountCents,
        currency: auth.ctx.tenantCurrency,
        metadata: {
          splitIndex: parsed.data.splitIndex,
          ...(changeDueCents > 0 ? { receivedCents: requestedAmount, changeDueCents } : {}),
          ...(tipAmount > 0 ? { tipCents: tipAmount } : {}),
        },
      },
    });

    // Add tip if provided
    if (tipAmount > 0) {
      await tx.posOrder.update({
        where: { id: order.id },
        data: { tipCents: { increment: tipAmount } },
      });

      await tx.tip.create({
        data: {
          tenantId: auth.ctx.tenantId,
          orderId: order.id,
          amountCents: tipAmount,
        },
      });
    }

    // Check if fully paid
    const newPaid = paidSoFar + amountCents;
    const newGrandTotal = grandTotal + tipAmount;
    const nextStatus = newPaid >= newGrandTotal ? "PAID" : "FOR_PAYMENT";

    await tx.posOrder.update({
      where: { id: order.id },
      data: {
        ...totals,
        currency: auth.ctx.tenantCurrency,
        status: nextStatus,
        closedAt: nextStatus === "PAID" ? now : null,
      },
    });

    return {
      ok: true as const,
      payment: {
        amountCents,
        provider: parsed.data.provider,
        tipCents: tipAmount,
        changeDueCents,
      },
      remainingCents: Math.max(0, newGrandTotal - newPaid),
      isFullyPaid: nextStatus === "PAID",
    };
  });

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    success: true,
    payment: result.payment,
    remainingCents: result.remainingCents,
    isFullyPaid: result.isFullyPaid,
  });
}
