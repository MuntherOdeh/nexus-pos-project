import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: { tenant: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const [floors, tableCount] = await Promise.all([
    prisma.posFloor.findMany({
      where: { tenantId: auth.ctx.tenantId },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        _count: { select: { tables: true } },
      },
    }),
    prisma.posTable.count({
      where: { tenantId: auth.ctx.tenantId },
    }),
  ]);

  return NextResponse.json({
    success: true,
    floors: floors.map((f) => ({
      id: f.id,
      name: f.name,
      sortOrder: f.sortOrder,
      tableCount: f._count.tables,
    })),
    totalTables: tableCount,
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: { tenant: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only OWNER, ADMIN can delete all tables
  if (!["OWNER", "ADMIN"].includes(auth.ctx.user.role)) {
    return NextResponse.json(
      { success: false, error: "You don't have permission to delete tables" },
      { status: 403 }
    );
  }

  // Check for open orders on any table
  const openOrdersOnTables = await prisma.posOrder.count({
    where: {
      tenantId: auth.ctx.tenantId,
      tableId: { not: null },
      status: { in: ["OPEN", "IN_KITCHEN", "READY", "FOR_PAYMENT"] },
    },
  });

  if (openOrdersOnTables > 0) {
    return NextResponse.json(
      { success: false, error: "Cannot delete tables while there are open orders. Please close all orders first." },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.posTable.deleteMany({
        where: { tenantId: auth.ctx.tenantId },
      });
      await tx.posFloor.deleteMany({
        where: { tenantId: auth.ctx.tenantId },
      });
    });

    return NextResponse.json({
      success: true,
      message: "All tables and floors deleted",
    });
  } catch (error) {
    console.error("Error deleting tables:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete tables" },
      { status: 500 }
    );
  }
}
