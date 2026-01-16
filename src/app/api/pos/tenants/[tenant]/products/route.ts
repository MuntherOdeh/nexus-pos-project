import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().max(50).optional().nullable(),
  priceCents: z.number().int().min(0),
  categoryId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  initialStock: z.number().int().min(0).optional().default(0),
  reorderPoint: z.number().int().min(0).optional().default(0),
});

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sku: z.string().max(50).optional().nullable(),
  priceCents: z.number().int().min(0).optional(),
  categoryId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const categoryId = request.nextUrl.searchParams.get("categoryId");
  const isActive = request.nextUrl.searchParams.get("isActive");

  const products = await prisma.product.findMany({
    where: {
      tenantId: auth.ctx.tenantId,
      ...(categoryId ? { categoryId } : {}),
      ...(isActive !== null ? { isActive: isActive === "true" } : {}),
    },
    orderBy: { name: "asc" },
    include: {
      category: { select: { id: true, name: true } },
      stockItems: {
        select: {
          onHand: true,
          reserved: true,
          reorderPoint: true,
          warehouse: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({ success: true, products });
}

export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only OWNER, ADMIN, MANAGER can create products
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json(
      { success: false, error: "You don't have permission to create products" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Check for duplicate product name
  const existingProduct = await prisma.product.findFirst({
    where: {
      tenantId: auth.ctx.tenantId,
      name: { equals: parsed.data.name, mode: "insensitive" },
    },
  });

  if (existingProduct) {
    return NextResponse.json(
      { success: false, error: "A product with this name already exists" },
      { status: 400 }
    );
  }

  // Validate category if provided
  if (parsed.data.categoryId) {
    const category = await prisma.productCategory.findFirst({
      where: { id: parsed.data.categoryId, tenantId: auth.ctx.tenantId },
    });
    if (!category) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }
  }

  // Create product with stock
  const product = await prisma.$transaction(async (tx) => {
    const newProduct = await tx.product.create({
      data: {
        tenantId: auth.ctx.tenantId,
        name: parsed.data.name,
        sku: parsed.data.sku || null,
        priceCents: parsed.data.priceCents,
        categoryId: parsed.data.categoryId || null,
        currency: auth.ctx.tenantCurrency,
        isActive: parsed.data.isActive ?? true,
      },
    });

    // Get or create default warehouse
    let warehouse = await tx.warehouse.findFirst({
      where: { tenantId: auth.ctx.tenantId },
      orderBy: { createdAt: "asc" },
    });

    if (!warehouse) {
      warehouse = await tx.warehouse.create({
        data: {
          tenantId: auth.ctx.tenantId,
          name: "Main Warehouse",
          code: "MAIN",
        },
      });
    }

    // Create stock item
    if (parsed.data.initialStock > 0 || parsed.data.reorderPoint > 0) {
      await tx.stockItem.create({
        data: {
          tenantId: auth.ctx.tenantId,
          warehouseId: warehouse.id,
          productId: newProduct.id,
          onHand: parsed.data.initialStock ?? 0,
          reserved: 0,
          reorderPoint: parsed.data.reorderPoint ?? 0,
        },
      });
    }

    return newProduct;
  });

  // Fetch complete product with relations
  const fullProduct = await prisma.product.findUnique({
    where: { id: product.id },
    include: {
      category: { select: { id: true, name: true } },
      stockItems: {
        select: {
          onHand: true,
          reserved: true,
          reorderPoint: true,
          warehouse: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({ success: true, product: fullProduct }, { status: 201 });
}
