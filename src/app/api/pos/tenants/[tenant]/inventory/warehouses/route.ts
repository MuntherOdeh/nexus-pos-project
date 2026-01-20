import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const createWarehouseSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().max(20).optional().nullable(),
});

// GET - List warehouses with stock summary
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const warehouses = await prisma.warehouse.findMany({
    where: { tenantId: auth.ctx.tenantId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      createdAt: true,
      _count: {
        select: { stockItems: true },
      },
      stockItems: {
        select: {
          onHand: true,
          reserved: true,
        },
      },
    },
  });

  // Calculate totals for each warehouse
  const warehousesWithTotals = warehouses.map((w) => ({
    id: w.id,
    name: w.name,
    code: w.code,
    createdAt: w.createdAt,
    productCount: w._count.stockItems,
    totalOnHand: w.stockItems.reduce((sum, s) => sum + s.onHand, 0),
    totalReserved: w.stockItems.reduce((sum, s) => sum + s.reserved, 0),
    totalAvailable: w.stockItems.reduce((sum, s) => sum + (s.onHand - s.reserved), 0),
  }));

  return NextResponse.json({ success: true, warehouses: warehousesWithTotals });
}

// POST - Create warehouse
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createWarehouseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Check for duplicate name
  const existing = await prisma.warehouse.findFirst({
    where: {
      tenantId: auth.ctx.tenantId,
      name: parsed.data.name,
    },
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "A warehouse with this name already exists" },
      { status: 400 }
    );
  }

  const warehouse = await prisma.warehouse.create({
    data: {
      tenantId: auth.ctx.tenantId,
      name: parsed.data.name,
      code: parsed.data.code || null,
    },
    select: {
      id: true,
      name: true,
      code: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, warehouse }, { status: 201 });
}
