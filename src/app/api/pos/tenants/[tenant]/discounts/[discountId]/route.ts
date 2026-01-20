import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const updateDiscountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().max(50).optional().nullable(),
  type: z.enum(["PERCENTAGE", "FIXED", "BOGO"]).optional(),
  value: z.number().int().min(0).optional(),
  minOrderCents: z.number().int().min(0).optional().nullable(),
  maxUsageCount: z.number().int().min(1).optional().nullable(),
  applicableTo: z.enum(["ORDER", "CATEGORY", "PRODUCT"]).optional(),
  categoryIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET - Get discount details
export async function GET(
  request: NextRequest,
  context: { params: { tenant: string; discountId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const discount = await prisma.discount.findFirst({
    where: {
      id: context.params.discountId,
      tenantId: auth.ctx.tenantId,
    },
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      value: true,
      minOrderCents: true,
      maxUsageCount: true,
      usageCount: true,
      applicableTo: true,
      categoryIds: true,
      productIds: true,
      startDate: true,
      endDate: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      appliedDiscounts: {
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderId: true,
          amountCents: true,
          createdAt: true,
        },
      },
    },
  });

  if (!discount) {
    return NextResponse.json({ success: false, error: "Discount not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, discount });
}

// PATCH - Update discount
export async function PATCH(
  request: NextRequest,
  context: { params: { tenant: string; discountId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only managers/admins can update discounts
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateDiscountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.discount.findFirst({
    where: {
      id: context.params.discountId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Discount not found" }, { status: 404 });
  }

  // Check code uniqueness if updating code
  if (parsed.data.code && parsed.data.code.toUpperCase() !== existing.code) {
    const codeExists = await prisma.discount.findFirst({
      where: {
        tenantId: auth.ctx.tenantId,
        code: parsed.data.code.toUpperCase(),
        id: { not: context.params.discountId },
      },
    });
    if (codeExists) {
      return NextResponse.json(
        { success: false, error: "A discount with this code already exists" },
        { status: 400 }
      );
    }
  }

  const discount = await prisma.discount.update({
    where: { id: context.params.discountId },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.code !== undefined && {
        code: parsed.data.code?.toUpperCase() || null,
      }),
      ...(parsed.data.type && { type: parsed.data.type }),
      ...(parsed.data.value !== undefined && { value: parsed.data.value }),
      ...(parsed.data.minOrderCents !== undefined && { minOrderCents: parsed.data.minOrderCents }),
      ...(parsed.data.maxUsageCount !== undefined && { maxUsageCount: parsed.data.maxUsageCount }),
      ...(parsed.data.applicableTo && { applicableTo: parsed.data.applicableTo }),
      ...(parsed.data.categoryIds && { categoryIds: parsed.data.categoryIds }),
      ...(parsed.data.productIds && { productIds: parsed.data.productIds }),
      ...(parsed.data.startDate !== undefined && {
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      }),
      ...(parsed.data.endDate !== undefined && {
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
    },
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      value: true,
      minOrderCents: true,
      maxUsageCount: true,
      usageCount: true,
      applicableTo: true,
      categoryIds: true,
      productIds: true,
      startDate: true,
      endDate: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, discount });
}

// DELETE - Delete discount
export async function DELETE(
  request: NextRequest,
  context: { params: { tenant: string; discountId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only managers/admins can delete discounts
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const existing = await prisma.discount.findFirst({
    where: {
      id: context.params.discountId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Discount not found" }, { status: 404 });
  }

  // Soft delete - just deactivate
  await prisma.discount.update({
    where: { id: context.params.discountId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true, message: "Discount deleted" });
}
