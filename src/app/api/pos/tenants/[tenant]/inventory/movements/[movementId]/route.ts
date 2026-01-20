import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const updateMovementSchema = z.object({
  reference: z.string().min(1).max(100).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

// GET - Get movement details
export async function GET(
  request: NextRequest,
  context: { params: { tenant: string; movementId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const movement = await prisma.inventoryMovement.findFirst({
    where: {
      id: context.params.movementId,
      tenantId: auth.ctx.tenantId,
    },
    select: {
      id: true,
      warehouseId: true,
      warehouse: { select: { id: true, name: true, code: true } },
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
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              priceCents: true,
            },
          },
          quantity: true,
        },
      },
    },
  });

  if (!movement) {
    return NextResponse.json({ success: false, error: "Movement not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, movement });
}

// PATCH - Update movement (only if DRAFT)
export async function PATCH(
  request: NextRequest,
  context: { params: { tenant: string; movementId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateMovementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.inventoryMovement.findFirst({
    where: {
      id: context.params.movementId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Movement not found" }, { status: 404 });
  }

  if (existing.status !== "DRAFT") {
    return NextResponse.json(
      { success: false, error: "Can only update draft movements" },
      { status: 400 }
    );
  }

  const movement = await prisma.inventoryMovement.update({
    where: { id: context.params.movementId },
    data: {
      ...(parsed.data.reference && { reference: parsed.data.reference }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    },
    select: {
      id: true,
      type: true,
      status: true,
      reference: true,
      notes: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ success: true, movement });
}

// POST - Post or cancel movement
export async function POST(
  request: NextRequest,
  context: { params: { tenant: string; movementId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const action = body.action as string;

  const movement = await prisma.inventoryMovement.findFirst({
    where: {
      id: context.params.movementId,
      tenantId: auth.ctx.tenantId,
    },
    include: {
      lines: true,
    },
  });

  if (!movement) {
    return NextResponse.json({ success: false, error: "Movement not found" }, { status: 404 });
  }

  if (action === "post") {
    if (movement.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: "Can only post draft movements" },
        { status: 400 }
      );
    }

    // Check stock availability for deliveries and transfers
    if (movement.type === "DELIVERY" || movement.type === "TRANSFER") {
      const stockItems = await prisma.stockItem.findMany({
        where: {
          warehouseId: movement.warehouseId,
          productId: { in: movement.lines.map((l) => l.productId) },
        },
      });
      const stockMap = new Map(stockItems.map((s) => [s.productId, s.onHand]));

      for (const line of movement.lines) {
        const currentStock = stockMap.get(line.productId) || 0;
        const requiredQty = Math.abs(line.quantity);
        if (currentStock < requiredQty) {
          return NextResponse.json(
            {
              success: false,
              error: `Insufficient stock for product ${line.productId}. Available: ${currentStock}, Required: ${requiredQty}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Update stock based on movement type
    const stockUpdates = movement.lines.map((line) => {
      const quantityChange =
        movement.type === "RECEIPT"
          ? line.quantity
          : movement.type === "DELIVERY"
            ? -Math.abs(line.quantity)
            : movement.type === "ADJUSTMENT"
              ? line.quantity
              : -Math.abs(line.quantity);

      return prisma.stockItem.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: movement.warehouseId,
            productId: line.productId,
          },
        },
        update: {
          onHand: { increment: quantityChange },
        },
        create: {
          tenantId: auth.ctx.tenantId,
          warehouseId: movement.warehouseId,
          productId: line.productId,
          onHand: Math.max(0, quantityChange),
          reorderPoint: 0,
        },
      });
    });

    // Execute all updates
    await prisma.$transaction([
      ...stockUpdates,
      prisma.inventoryMovement.update({
        where: { id: context.params.movementId },
        data: { status: "POSTED" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Movement posted successfully",
      status: "POSTED",
    });
  }

  if (action === "cancel") {
    if (movement.status === "CANCELLED") {
      return NextResponse.json({ success: false, error: "Movement already cancelled" }, { status: 400 });
    }

    // If posted, reverse the stock changes
    if (movement.status === "POSTED") {
      const stockReversals = movement.lines.map((line) => {
        const quantityChange =
          movement.type === "RECEIPT"
            ? -line.quantity
            : movement.type === "DELIVERY"
              ? Math.abs(line.quantity)
              : movement.type === "ADJUSTMENT"
                ? -line.quantity
                : Math.abs(line.quantity);

        return prisma.stockItem.update({
          where: {
            warehouseId_productId: {
              warehouseId: movement.warehouseId,
              productId: line.productId,
            },
          },
          data: {
            onHand: { increment: quantityChange },
          },
        });
      });

      await prisma.$transaction([
        ...stockReversals,
        prisma.inventoryMovement.update({
          where: { id: context.params.movementId },
          data: { status: "CANCELLED" },
        }),
      ]);
    } else {
      await prisma.inventoryMovement.update({
        where: { id: context.params.movementId },
        data: { status: "CANCELLED" },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Movement cancelled",
      status: "CANCELLED",
    });
  }

  return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
}

// DELETE - Delete draft movement
export async function DELETE(
  request: NextRequest,
  context: { params: { tenant: string; movementId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const existing = await prisma.inventoryMovement.findFirst({
    where: {
      id: context.params.movementId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Movement not found" }, { status: 404 });
  }

  if (existing.status !== "DRAFT") {
    return NextResponse.json(
      { success: false, error: "Can only delete draft movements. Cancel posted movements instead." },
      { status: 400 }
    );
  }

  await prisma.inventoryMovement.delete({
    where: { id: context.params.movementId },
  });

  return NextResponse.json({ success: true, message: "Movement deleted" });
}
