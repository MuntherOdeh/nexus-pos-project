import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const movementLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int(), // Positive for in, negative for out
});

const createMovementSchema = z.object({
  warehouseId: z.string().min(1),
  type: z.enum(["RECEIPT", "DELIVERY", "ADJUSTMENT", "TRANSFER"]),
  reference: z.string().min(1).max(100),
  notes: z.string().max(1000).optional().nullable(),
  lines: z.array(movementLineSchema).min(1),
  postImmediately: z.boolean().optional(), // If true, post movement immediately
  // For transfers
  destinationWarehouseId: z.string().optional(),
});

function generateReference(type: string): string {
  const prefix =
    type === "RECEIPT"
      ? "REC"
      : type === "DELIVERY"
        ? "DEL"
        : type === "ADJUSTMENT"
          ? "ADJ"
          : "TRF";
  const ts = Date.now().toString(36).toUpperCase();
  return `${prefix}-${ts}`;
}

// GET - List inventory movements
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const warehouseId = request.nextUrl.searchParams.get("warehouseId")?.trim() || null;
  const type = request.nextUrl.searchParams.get("type")?.trim().toUpperCase() || null;
  const status = request.nextUrl.searchParams.get("status")?.trim().toUpperCase() || null;
  const startDate = request.nextUrl.searchParams.get("startDate")?.trim() || null;
  const endDate = request.nextUrl.searchParams.get("endDate")?.trim() || null;

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
  };

  if (warehouseId) {
    where.warehouseId = warehouseId;
  }

  if (type && ["RECEIPT", "DELIVERY", "ADJUSTMENT", "TRANSFER"].includes(type)) {
    where.type = type;
  }

  if (status && ["DRAFT", "POSTED", "CANCELLED"].includes(status)) {
    where.status = status;
  }

  if (startDate) {
    where.createdAt = { ...((where.createdAt as object) || {}), gte: new Date(startDate) };
  }
  if (endDate) {
    where.createdAt = { ...((where.createdAt as object) || {}), lte: new Date(endDate) };
  }

  const movements = await prisma.inventoryMovement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      warehouseId: true,
      warehouse: { select: { name: true } },
      type: true,
      status: true,
      reference: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      lines: {
        select: {
          id: true,
          productId: true,
          product: { select: { name: true, sku: true } },
          quantity: true,
        },
      },
    },
  });

  // Add line count and total quantity
  const movementsWithSummary = movements.map((m) => ({
    ...m,
    lineCount: m.lines.length,
    totalQuantity: m.lines.reduce((sum, l) => sum + l.quantity, 0),
  }));

  return NextResponse.json({ success: true, movements: movementsWithSummary });
}

// POST - Create inventory movement
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createMovementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Verify warehouse belongs to tenant
  const warehouse = await prisma.warehouse.findFirst({
    where: {
      id: parsed.data.warehouseId,
      tenantId: auth.ctx.tenantId,
    },
  });
  if (!warehouse) {
    return NextResponse.json({ success: false, error: "Warehouse not found" }, { status: 404 });
  }

  // Verify destination warehouse for transfers
  if (parsed.data.type === "TRANSFER") {
    if (!parsed.data.destinationWarehouseId) {
      return NextResponse.json(
        { success: false, error: "Destination warehouse required for transfers" },
        { status: 400 }
      );
    }
    const destWarehouse = await prisma.warehouse.findFirst({
      where: {
        id: parsed.data.destinationWarehouseId,
        tenantId: auth.ctx.tenantId,
      },
    });
    if (!destWarehouse) {
      return NextResponse.json(
        { success: false, error: "Destination warehouse not found" },
        { status: 404 }
      );
    }
  }

  // Verify all products belong to tenant
  const productIds = parsed.data.lines.map((l) => l.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      tenantId: auth.ctx.tenantId,
    },
    select: { id: true },
  });
  const validProductIds = new Set(products.map((p) => p.id));

  const invalidProducts = productIds.filter((id) => !validProductIds.has(id));
  if (invalidProducts.length > 0) {
    return NextResponse.json(
      { success: false, error: `Products not found: ${invalidProducts.join(", ")}` },
      { status: 404 }
    );
  }

  // Create movement
  const movement = await prisma.inventoryMovement.create({
    data: {
      tenantId: auth.ctx.tenantId,
      warehouseId: parsed.data.warehouseId,
      type: parsed.data.type,
      status: "DRAFT",
      reference: parsed.data.reference || generateReference(parsed.data.type),
      notes: parsed.data.notes || null,
      lines: {
        create: parsed.data.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
      },
    },
    select: {
      id: true,
      warehouseId: true,
      warehouse: { select: { name: true } },
      type: true,
      status: true,
      reference: true,
      notes: true,
      createdAt: true,
      lines: {
        select: {
          id: true,
          productId: true,
          product: { select: { name: true, sku: true } },
          quantity: true,
        },
      },
    },
  });

  // Post immediately if requested
  if (parsed.data.postImmediately) {
    return await postMovement(
      movement.id,
      auth.ctx.tenantId,
      parsed.data.type,
      parsed.data.warehouseId,
      parsed.data.destinationWarehouseId || null,
      movement.lines
    );
  }

  return NextResponse.json({ success: true, movement }, { status: 201 });
}

// Helper to post movement and update stock
async function postMovement(
  movementId: string,
  tenantId: string,
  type: string,
  warehouseId: string,
  destinationWarehouseId: string | null,
  lines: Array<{ productId: string; quantity: number }>
) {
  // Update stock based on movement type
  const stockUpdates = lines.map((line) => {
    const quantityChange =
      type === "RECEIPT"
        ? line.quantity
        : type === "DELIVERY"
          ? -Math.abs(line.quantity)
          : type === "ADJUSTMENT"
            ? line.quantity
            : -Math.abs(line.quantity); // Transfer out

    return prisma.stockItem.upsert({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId: line.productId,
        },
      },
      update: {
        onHand: { increment: quantityChange },
      },
      create: {
        tenantId,
        warehouseId,
        productId: line.productId,
        onHand: Math.max(0, quantityChange),
        reorderPoint: 0,
      },
    });
  });

  // For transfers, also add to destination warehouse
  const transferUpdates =
    type === "TRANSFER" && destinationWarehouseId
      ? lines.map((line) =>
          prisma.stockItem.upsert({
            where: {
              warehouseId_productId: {
                warehouseId: destinationWarehouseId,
                productId: line.productId,
              },
            },
            update: {
              onHand: { increment: Math.abs(line.quantity) },
            },
            create: {
              tenantId,
              warehouseId: destinationWarehouseId,
              productId: line.productId,
              onHand: Math.abs(line.quantity),
              reorderPoint: 0,
            },
          })
        )
      : [];

  // Execute all updates in a transaction
  await prisma.$transaction([
    ...stockUpdates,
    ...transferUpdates,
    prisma.inventoryMovement.update({
      where: { id: movementId },
      data: { status: "POSTED" },
    }),
  ]);

  const postedMovement = await prisma.inventoryMovement.findUnique({
    where: { id: movementId },
    select: {
      id: true,
      warehouseId: true,
      warehouse: { select: { name: true } },
      type: true,
      status: true,
      reference: true,
      notes: true,
      createdAt: true,
      lines: {
        select: {
          id: true,
          productId: true,
          product: { select: { name: true, sku: true } },
          quantity: true,
        },
      },
    },
  });

  return NextResponse.json({ success: true, movement: postedMovement, posted: true });
}
