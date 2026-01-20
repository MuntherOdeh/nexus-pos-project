import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const applyDiscountSchema = z.object({
  discountId: z.string().optional(),
  discountCode: z.string().optional(),
  // Manual discount (no code)
  manualDiscount: z
    .object({
      name: z.string().min(1),
      type: z.enum(["PERCENTAGE", "FIXED"]),
      value: z.number().int().min(0),
    })
    .optional(),
});

// POST - Apply discount to order
export async function POST(
  request: NextRequest,
  context: { params: { tenant: string; orderId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = applyDiscountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Verify order exists and is open
  const order = await prisma.posOrder.findFirst({
    where: {
      id: context.params.orderId,
      tenantId: auth.ctx.tenantId,
    },
    include: {
      items: true,
      appliedDiscounts: true,
    },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  if (order.status === "PAID" || order.status === "CANCELLED") {
    return NextResponse.json(
      { success: false, error: "Cannot apply discount to a closed order" },
      { status: 400 }
    );
  }

  let discountName: string;
  let discountType: "PERCENTAGE" | "FIXED" | "BOGO";
  let discountValue: number;
  let discountId: string | null = null;
  let amountCents: number;

  if (parsed.data.manualDiscount) {
    // Manual discount (manager only)
    if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
      return NextResponse.json(
        { success: false, error: "Only managers can apply manual discounts" },
        { status: 403 }
      );
    }

    discountName = parsed.data.manualDiscount.name;
    discountType = parsed.data.manualDiscount.type;
    discountValue = parsed.data.manualDiscount.value;

    if (discountType === "PERCENTAGE") {
      // Value is in basis points (1000 = 10%)
      amountCents = Math.round((order.subtotalCents * discountValue) / 10000);
    } else {
      // Fixed amount in cents
      amountCents = Math.min(discountValue, order.subtotalCents);
    }
  } else {
    // Find discount by ID or code
    const discountWhere: Record<string, unknown> = {
      tenantId: auth.ctx.tenantId,
      isActive: true,
    };

    if (parsed.data.discountId) {
      discountWhere.id = parsed.data.discountId;
    } else if (parsed.data.discountCode) {
      discountWhere.code = parsed.data.discountCode.toUpperCase();
    } else {
      return NextResponse.json(
        { success: false, error: "Provide discountId, discountCode, or manualDiscount" },
        { status: 400 }
      );
    }

    const discount = await prisma.discount.findFirst({
      where: discountWhere,
    });

    if (!discount) {
      return NextResponse.json({ success: false, error: "Discount not found or inactive" }, { status: 404 });
    }

    // Check validity
    const now = new Date();
    if (discount.startDate && discount.startDate > now) {
      return NextResponse.json({ success: false, error: "Discount not yet active" }, { status: 400 });
    }
    if (discount.endDate && discount.endDate < now) {
      return NextResponse.json({ success: false, error: "Discount has expired" }, { status: 400 });
    }
    if (discount.maxUsageCount && discount.usageCount >= discount.maxUsageCount) {
      return NextResponse.json(
        { success: false, error: "Discount usage limit reached" },
        { status: 400 }
      );
    }
    if (discount.minOrderCents && order.subtotalCents < discount.minOrderCents) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum order of ${(discount.minOrderCents / 100).toFixed(2)} required`,
        },
        { status: 400 }
      );
    }

    // Check if already applied
    const alreadyApplied = order.appliedDiscounts.some((d) => d.discountId === discount.id);
    if (alreadyApplied) {
      return NextResponse.json(
        { success: false, error: "Discount already applied to this order" },
        { status: 400 }
      );
    }

    discountId = discount.id;
    discountName = discount.name;
    discountType = discount.type;
    discountValue = discount.value;

    // Calculate amount based on applicability
    let applicableSubtotal = order.subtotalCents;

    if (discount.applicableTo === "CATEGORY" && discount.categoryIds.length > 0) {
      // Only apply to items in specified categories
      const products = await prisma.product.findMany({
        where: {
          id: { in: order.items.map((i) => i.productId).filter(Boolean) as string[] },
          categoryId: { in: discount.categoryIds },
        },
        select: { id: true },
      });
      const productIds = new Set(products.map((p) => p.id));
      applicableSubtotal = order.items
        .filter((i) => i.productId && productIds.has(i.productId))
        .reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
    } else if (discount.applicableTo === "PRODUCT" && discount.productIds.length > 0) {
      // Only apply to specified products
      applicableSubtotal = order.items
        .filter((i) => i.productId && discount.productIds.includes(i.productId))
        .reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
    }

    if (discountType === "PERCENTAGE") {
      amountCents = Math.round((applicableSubtotal * discountValue) / 10000);
    } else if (discountType === "BOGO") {
      // BOGO - apply 50% to applicable items (simplified)
      amountCents = Math.round(applicableSubtotal / 2);
    } else {
      amountCents = Math.min(discountValue, applicableSubtotal);
    }

    // Increment usage count
    await prisma.discount.update({
      where: { id: discount.id },
      data: { usageCount: { increment: 1 } },
    });
  }

  // Create applied discount record
  const appliedDiscount = await prisma.appliedDiscount.create({
    data: {
      orderId: context.params.orderId,
      discountId,
      name: discountName,
      type: discountType,
      value: discountValue,
      amountCents,
    },
    select: {
      id: true,
      name: true,
      type: true,
      value: true,
      amountCents: true,
      createdAt: true,
    },
  });

  // Update order totals
  const totalDiscountCents = order.discountCents + amountCents;
  const newTotal = order.subtotalCents - totalDiscountCents + order.taxCents;

  await prisma.posOrder.update({
    where: { id: context.params.orderId },
    data: {
      discountCents: totalDiscountCents,
      totalCents: Math.max(0, newTotal),
    },
  });

  return NextResponse.json({
    success: true,
    appliedDiscount,
    orderTotals: {
      subtotalCents: order.subtotalCents,
      discountCents: totalDiscountCents,
      taxCents: order.taxCents,
      totalCents: Math.max(0, newTotal),
    },
  });
}

// DELETE - Remove discount from order
export async function DELETE(
  request: NextRequest,
  context: { params: { tenant: string; orderId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const appliedDiscountId = body.appliedDiscountId as string;

  if (!appliedDiscountId) {
    return NextResponse.json(
      { success: false, error: "appliedDiscountId is required" },
      { status: 400 }
    );
  }

  const order = await prisma.posOrder.findFirst({
    where: {
      id: context.params.orderId,
      tenantId: auth.ctx.tenantId,
    },
    include: {
      appliedDiscounts: true,
    },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  if (order.status === "PAID" || order.status === "CANCELLED") {
    return NextResponse.json(
      { success: false, error: "Cannot remove discount from a closed order" },
      { status: 400 }
    );
  }

  const appliedDiscount = order.appliedDiscounts.find((d) => d.id === appliedDiscountId);
  if (!appliedDiscount) {
    return NextResponse.json({ success: false, error: "Applied discount not found" }, { status: 404 });
  }

  // Delete the applied discount
  await prisma.appliedDiscount.delete({
    where: { id: appliedDiscountId },
  });

  // Decrement discount usage count if it was a coded discount
  if (appliedDiscount.discountId) {
    await prisma.discount.update({
      where: { id: appliedDiscount.discountId },
      data: { usageCount: { decrement: 1 } },
    });
  }

  // Update order totals
  const newDiscountCents = order.discountCents - appliedDiscount.amountCents;
  const newTotal = order.subtotalCents - newDiscountCents + order.taxCents;

  await prisma.posOrder.update({
    where: { id: context.params.orderId },
    data: {
      discountCents: Math.max(0, newDiscountCents),
      totalCents: Math.max(0, newTotal),
    },
  });

  return NextResponse.json({
    success: true,
    message: "Discount removed",
    orderTotals: {
      subtotalCents: order.subtotalCents,
      discountCents: Math.max(0, newDiscountCents),
      taxCents: order.taxCents,
      totalCents: Math.max(0, newTotal),
    },
  });
}
