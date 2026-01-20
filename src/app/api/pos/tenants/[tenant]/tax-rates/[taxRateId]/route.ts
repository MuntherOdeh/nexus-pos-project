import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const updateTaxRateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  rate: z.number().int().min(0).max(10000).optional(),
  isDefault: z.boolean().optional(),
  isInclusive: z.boolean().optional(),
  appliesTo: z.enum(["ALL", "CATEGORIES", "DINE_IN", "TAKEOUT"]).optional(),
  categoryIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// GET - Get tax rate details
export async function GET(
  request: NextRequest,
  context: { params: { tenant: string; taxRateId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const taxRate = await prisma.taxRate.findFirst({
    where: {
      id: context.params.taxRateId,
      tenantId: auth.ctx.tenantId,
    },
    select: {
      id: true,
      name: true,
      rate: true,
      isDefault: true,
      isInclusive: true,
      appliesTo: true,
      categoryIds: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!taxRate) {
    return NextResponse.json({ success: false, error: "Tax rate not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, taxRate });
}

// PATCH - Update tax rate
export async function PATCH(
  request: NextRequest,
  context: { params: { tenant: string; taxRateId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateTaxRateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.taxRate.findFirst({
    where: {
      id: context.params.taxRateId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Tax rate not found" }, { status: 404 });
  }

  // Check name uniqueness if updating name
  if (parsed.data.name && parsed.data.name !== existing.name) {
    const nameExists = await prisma.taxRate.findFirst({
      where: {
        tenantId: auth.ctx.tenantId,
        name: parsed.data.name,
        id: { not: context.params.taxRateId },
      },
    });
    if (nameExists) {
      return NextResponse.json(
        { success: false, error: "A tax rate with this name already exists" },
        { status: 400 }
      );
    }
  }

  // If setting as default, unset other defaults
  if (parsed.data.isDefault) {
    await prisma.taxRate.updateMany({
      where: {
        tenantId: auth.ctx.tenantId,
        isDefault: true,
        id: { not: context.params.taxRateId },
      },
      data: { isDefault: false },
    });
  }

  const taxRate = await prisma.taxRate.update({
    where: { id: context.params.taxRateId },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.rate !== undefined && { rate: parsed.data.rate }),
      ...(parsed.data.isDefault !== undefined && { isDefault: parsed.data.isDefault }),
      ...(parsed.data.isInclusive !== undefined && { isInclusive: parsed.data.isInclusive }),
      ...(parsed.data.appliesTo && { appliesTo: parsed.data.appliesTo }),
      ...(parsed.data.categoryIds && { categoryIds: parsed.data.categoryIds }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
    },
    select: {
      id: true,
      name: true,
      rate: true,
      isDefault: true,
      isInclusive: true,
      appliesTo: true,
      categoryIds: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, taxRate });
}

// DELETE - Delete tax rate
export async function DELETE(
  request: NextRequest,
  context: { params: { tenant: string; taxRateId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const existing = await prisma.taxRate.findFirst({
    where: {
      id: context.params.taxRateId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Tax rate not found" }, { status: 404 });
  }

  // Soft delete
  await prisma.taxRate.update({
    where: { id: context.params.taxRateId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true, message: "Tax rate deleted" });
}
