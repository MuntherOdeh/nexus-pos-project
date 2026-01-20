import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

// GET - Get low stock alerts and out of stock items
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const warehouseId = request.nextUrl.searchParams.get("warehouseId")?.trim() || null;

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
  };

  if (warehouseId) {
    where.warehouseId = warehouseId;
  }

  // Get all stock items
  const stockItems = await prisma.stockItem.findMany({
    where,
    select: {
      id: true,
      warehouseId: true,
      warehouse: { select: { id: true, name: true } },
      productId: true,
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          priceCents: true,
          isActive: true,
          category: { select: { id: true, name: true } },
        },
      },
      onHand: true,
      reserved: true,
      reorderPoint: true,
      updatedAt: true,
    },
  });

  // Categorize alerts
  const outOfStock = stockItems.filter(
    (item) => item.product.isActive && item.onHand === 0
  );

  const lowStock = stockItems.filter(
    (item) =>
      item.product.isActive &&
      item.onHand > 0 &&
      item.onHand <= item.reorderPoint
  );

  const criticalStock = stockItems.filter(
    (item) =>
      item.product.isActive &&
      item.onHand > 0 &&
      item.reorderPoint > 0 &&
      item.onHand <= item.reorderPoint * 0.5
  );

  // Products without stock records (might be missing from inventory)
  const productsWithStock = new Set(stockItems.map((s) => s.productId));
  const allActiveProducts = await prisma.product.findMany({
    where: {
      tenantId: auth.ctx.tenantId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      sku: true,
    },
  });

  const productsNotTracked = allActiveProducts.filter(
    (p) => !productsWithStock.has(p.id)
  );

  // Format alerts
  const formatAlert = (item: (typeof stockItems)[0], severity: string) => ({
    id: item.id,
    severity,
    warehouse: item.warehouse,
    product: item.product,
    onHand: item.onHand,
    available: item.onHand - item.reserved,
    reorderPoint: item.reorderPoint,
    deficit: item.reorderPoint - item.onHand,
    lastUpdated: item.updatedAt,
  });

  const alerts = [
    ...outOfStock.map((item) => formatAlert(item, "critical")),
    ...criticalStock.map((item) => formatAlert(item, "high")),
    ...lowStock
      .filter((item) => !criticalStock.includes(item))
      .map((item) => formatAlert(item, "medium")),
  ].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (
      severityOrder[a.severity as keyof typeof severityOrder] -
      severityOrder[b.severity as keyof typeof severityOrder]
    );
  });

  return NextResponse.json({
    success: true,
    alerts,
    summary: {
      outOfStockCount: outOfStock.length,
      lowStockCount: lowStock.length,
      criticalCount: criticalStock.length,
      notTrackedCount: productsNotTracked.length,
    },
    productsNotTracked,
  });
}
