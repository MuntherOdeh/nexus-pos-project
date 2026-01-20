import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const updateWarehouseSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().max(20).optional().nullable(),
});

// GET - Get warehouse details with stock items
export async function GET(
  request: NextRequest,
  context: { params: { tenant: string; warehouseId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const warehouse = await prisma.warehouse.findFirst({
    where: {
      id: context.params.warehouseId,
      tenantId: auth.ctx.tenantId,
    },
    select: {
      id: true,
      name: true,
      code: true,
      createdAt: true,
      updatedAt: true,
      stockItems: {
        orderBy: { product: { name: "asc" } },
        select: {
          id: true,
          productId: true,
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              priceCents: true,
              category: { select: { id: true, name: true } },
            },
          },
          onHand: true,
          reserved: true,
          reorderPoint: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!warehouse) {
    return NextResponse.json({ success: false, error: "Warehouse not found" }, { status: 404 });
  }

  // Add available and low stock flag
  const stockItemsWithStatus = warehouse.stockItems.map((item) => ({
    ...item,
    available: item.onHand - item.reserved,
    isLowStock: item.onHand <= item.reorderPoint,
  }));

  return NextResponse.json({
    success: true,
    warehouse: {
      ...warehouse,
      stockItems: stockItemsWithStatus,
    },
  });
}

// PATCH - Update warehouse
export async function PATCH(
  request: NextRequest,
  context: { params: { tenant: string; warehouseId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateWarehouseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.warehouse.findFirst({
    where: {
      id: context.params.warehouseId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Warehouse not found" }, { status: 404 });
  }

  // Check name uniqueness if updating name
  if (parsed.data.name && parsed.data.name !== existing.name) {
    const nameExists = await prisma.warehouse.findFirst({
      where: {
        tenantId: auth.ctx.tenantId,
        name: parsed.data.name,
        id: { not: context.params.warehouseId },
      },
    });
    if (nameExists) {
      return NextResponse.json(
        { success: false, error: "A warehouse with this name already exists" },
        { status: 400 }
      );
    }
  }

  const warehouse = await prisma.warehouse.update({
    where: { id: context.params.warehouseId },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.code !== undefined && { code: parsed.data.code }),
    },
    select: {
      id: true,
      name: true,
      code: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, warehouse });
}

// DELETE - Delete warehouse (only if empty)
export async function DELETE(
  request: NextRequest,
  context: { params: { tenant: string; warehouseId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const existing = await prisma.warehouse.findFirst({
    where: {
      id: context.params.warehouseId,
      tenantId: auth.ctx.tenantId,
    },
    include: {
      _count: { select: { stockItems: true } },
    },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Warehouse not found" }, { status: 404 });
  }

  // Check if warehouse has stock
  if (existing._count.stockItems > 0) {
    return NextResponse.json(
      { success: false, error: "Cannot delete warehouse with stock items. Transfer or remove stock first." },
      { status: 400 }
    );
  }

  await prisma.warehouse.delete({
    where: { id: context.params.warehouseId },
  });

  return NextResponse.json({ success: true, message: "Warehouse deleted" });
}
