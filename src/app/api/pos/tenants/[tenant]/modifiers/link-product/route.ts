import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const linkSchema = z.object({
  productId: z.string().min(1),
  modifierGroupId: z.string().min(1),
  sortOrder: z.number().int().optional(),
});

const unlinkSchema = z.object({
  productId: z.string().min(1),
  modifierGroupId: z.string().min(1),
});

// POST - Link modifier group to product
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
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

  // Verify modifier group belongs to tenant
  const modifierGroup = await prisma.modifierGroup.findFirst({
    where: {
      id: parsed.data.modifierGroupId,
      tenantId: auth.ctx.tenantId,
    },
  });
  if (!modifierGroup) {
    return NextResponse.json({ success: false, error: "Modifier group not found" }, { status: 404 });
  }

  // Check if already linked
  const existing = await prisma.productModifierGroup.findFirst({
    where: {
      productId: parsed.data.productId,
      modifierGroupId: parsed.data.modifierGroupId,
    },
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "Product is already linked to this modifier group" },
      { status: 400 }
    );
  }

  const link = await prisma.productModifierGroup.create({
    data: {
      productId: parsed.data.productId,
      modifierGroupId: parsed.data.modifierGroupId,
      sortOrder: parsed.data.sortOrder || 0,
    },
    select: {
      id: true,
      productId: true,
      modifierGroupId: true,
      sortOrder: true,
      product: { select: { id: true, name: true } },
      modifierGroup: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, link }, { status: 201 });
}

// DELETE - Unlink modifier group from product
export async function DELETE(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = unlinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
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

  const link = await prisma.productModifierGroup.findFirst({
    where: {
      productId: parsed.data.productId,
      modifierGroupId: parsed.data.modifierGroupId,
    },
  });
  if (!link) {
    return NextResponse.json({ success: false, error: "Link not found" }, { status: 404 });
  }

  await prisma.productModifierGroup.delete({
    where: { id: link.id },
  });

  return NextResponse.json({ success: true, message: "Link removed" });
}
