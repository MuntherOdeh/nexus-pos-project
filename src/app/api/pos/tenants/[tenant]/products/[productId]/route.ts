import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sku: z.string().max(50).optional().nullable(),
  priceCents: z.number().int().min(0).optional(),
  categoryId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: { tenant: string; productId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const product = await prisma.product.findFirst({
    where: {
      id: context.params.productId,
      tenantId: auth.ctx.tenantId,
    },
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

  if (!product) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, product });
}

export async function PATCH(
  request: NextRequest,
  context: { params: { tenant: string; productId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only OWNER, ADMIN, MANAGER can update products
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json(
      { success: false, error: "You don't have permission to update products" },
      { status: 403 }
    );
  }

  const product = await prisma.product.findFirst({
    where: {
      id: context.params.productId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!product) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Check for duplicate product name if updating name
  if (parsed.data.name && parsed.data.name !== product.name) {
    const existingProduct = await prisma.product.findFirst({
      where: {
        tenantId: auth.ctx.tenantId,
        name: { equals: parsed.data.name, mode: "insensitive" },
        id: { not: product.id },
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: "A product with this name already exists" },
        { status: 400 }
      );
    }
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

  const updatedProduct = await prisma.product.update({
    where: { id: context.params.productId },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.sku !== undefined && { sku: parsed.data.sku }),
      ...(parsed.data.priceCents !== undefined && { priceCents: parsed.data.priceCents }),
      ...(parsed.data.categoryId !== undefined && { categoryId: parsed.data.categoryId }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
    },
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

  return NextResponse.json({ success: true, product: updatedProduct });
}

export async function DELETE(
  request: NextRequest,
  context: { params: { tenant: string; productId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only OWNER, ADMIN can delete products
  if (!["OWNER", "ADMIN"].includes(auth.ctx.user.role)) {
    return NextResponse.json(
      { success: false, error: "You don't have permission to delete products" },
      { status: 403 }
    );
  }

  const product = await prisma.product.findFirst({
    where: {
      id: context.params.productId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!product) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  await prisma.product.delete({
    where: { id: context.params.productId },
  });

  return NextResponse.json({ success: true, message: "Product deleted" });
}
