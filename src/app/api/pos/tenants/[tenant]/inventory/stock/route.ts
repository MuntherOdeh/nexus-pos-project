import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const setStockSchema = z.object({
  warehouseId: z.string().min(1),
  productId: z.string().min(1),
  onHand: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
});

const bulkSetStockSchema = z.object({
  warehouseId: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      onHand: z.number().int().min(0).optional(),
      reorderPoint: z.number().int().min(0).optional(),
    })
  ),
});

// GET - Get stock levels across all warehouses or specific warehouse
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const warehouseId = request.nextUrl.searchParams.get("warehouseId")?.trim() || null;
  const productId = request.nextUrl.searchParams.get("productId")?.trim() || null;
  const lowStockOnly = request.nextUrl.searchParams.get("lowStockOnly") === "true";
  const search = request.nextUrl.searchParams.get("search")?.trim() || null;

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
  };

  if (warehouseId) {
    where.warehouseId = warehouseId;
  }

  if (productId) {
    where.productId = productId;
  }

  if (search) {
    where.product = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const stockItems = await prisma.stockItem.findMany({
    where,
    orderBy: [{ warehouse: { name: "asc" } }, { product: { name: "asc" } }],
    select: {
      id: true,
      warehouseId: true,
      warehouse: { select: { id: true, name: true, code: true } },
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
  });

  // Add computed fields and filter low stock if requested
  let items = stockItems.map((item) => ({
    ...item,
    available: item.onHand - item.reserved,
    isLowStock: item.onHand <= item.reorderPoint,
    stockValue: item.onHand * item.product.priceCents,
  }));

  if (lowStockOnly) {
    items = items.filter((item) => item.isLowStock);
  }

  // Summary statistics
  const summary = {
    totalItems: items.length,
    totalOnHand: items.reduce((sum, i) => sum + i.onHand, 0),
    totalReserved: items.reduce((sum, i) => sum + i.reserved, 0),
    totalAvailable: items.reduce((sum, i) => sum + i.available, 0),
    totalValue: items.reduce((sum, i) => sum + i.stockValue, 0),
    lowStockCount: items.filter((i) => i.isLowStock).length,
  };

  return NextResponse.json({ success: true, stockItems: items, summary });
}

// POST - Set stock level for a product in a warehouse
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = setStockSchema.safeParse(body);
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

  // Verify product belongs to tenant
  const product = await prisma.product.findFirst({
    where: {
      id: parsed.data.productId,
      tenantId: auth.ctx.tenantId,
    },
  });
  if (!product) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  // Upsert stock item
  const stockItem = await prisma.stockItem.upsert({
    where: {
      warehouseId_productId: {
        warehouseId: parsed.data.warehouseId,
        productId: parsed.data.productId,
      },
    },
    update: {
      ...(parsed.data.onHand !== undefined && { onHand: parsed.data.onHand }),
      ...(parsed.data.reorderPoint !== undefined && { reorderPoint: parsed.data.reorderPoint }),
    },
    create: {
      tenantId: auth.ctx.tenantId,
      warehouseId: parsed.data.warehouseId,
      productId: parsed.data.productId,
      onHand: parsed.data.onHand ?? 0,
      reorderPoint: parsed.data.reorderPoint ?? 0,
    },
    select: {
      id: true,
      warehouseId: true,
      warehouse: { select: { name: true } },
      productId: true,
      product: { select: { name: true, sku: true } },
      onHand: true,
      reserved: true,
      reorderPoint: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    stockItem: {
      ...stockItem,
      available: stockItem.onHand - stockItem.reserved,
      isLowStock: stockItem.onHand <= stockItem.reorderPoint,
    },
  });
}

// PUT - Bulk set stock levels
export async function PUT(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bulkSetStockSchema.safeParse(body);
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

  // Verify all products belong to tenant
  const productIds = parsed.data.items.map((i) => i.productId);
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

  // Bulk upsert using transaction
  const results = await prisma.$transaction(
    parsed.data.items.map((item) =>
      prisma.stockItem.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: parsed.data.warehouseId,
            productId: item.productId,
          },
        },
        update: {
          ...(item.onHand !== undefined && { onHand: item.onHand }),
          ...(item.reorderPoint !== undefined && { reorderPoint: item.reorderPoint }),
        },
        create: {
          tenantId: auth.ctx.tenantId,
          warehouseId: parsed.data.warehouseId,
          productId: item.productId,
          onHand: item.onHand ?? 0,
          reorderPoint: item.reorderPoint ?? 0,
        },
        select: {
          id: true,
          productId: true,
          onHand: true,
          reorderPoint: true,
        },
      })
    )
  );

  return NextResponse.json({
    success: true,
    updated: results.length,
    stockItems: results,
  });
}
