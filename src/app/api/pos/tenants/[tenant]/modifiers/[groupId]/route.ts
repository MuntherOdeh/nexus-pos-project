import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const updateModifierGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional(),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const addModifierSchema = z.object({
  name: z.string().min(1).max(100),
  priceCents: z.number().int().min(0).default(0),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// GET - Get modifier group details
export async function GET(
  request: NextRequest,
  context: { params: { tenant: string; groupId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const modifierGroup = await prisma.modifierGroup.findFirst({
    where: {
      id: context.params.groupId,
      tenantId: auth.ctx.tenantId,
    },
    select: {
      id: true,
      name: true,
      minSelections: true,
      maxSelections: true,
      isRequired: true,
      sortOrder: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      modifiers: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          priceCents: true,
          isDefault: true,
          sortOrder: true,
          isActive: true,
        },
      },
      productLinks: {
        select: {
          productId: true,
          product: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!modifierGroup) {
    return NextResponse.json({ success: false, error: "Modifier group not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, modifierGroup });
}

// PATCH - Update modifier group
export async function PATCH(
  request: NextRequest,
  context: { params: { tenant: string; groupId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateModifierGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.modifierGroup.findFirst({
    where: {
      id: context.params.groupId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Modifier group not found" }, { status: 404 });
  }

  // Check name uniqueness if updating name
  if (parsed.data.name && parsed.data.name !== existing.name) {
    const nameExists = await prisma.modifierGroup.findFirst({
      where: {
        tenantId: auth.ctx.tenantId,
        name: parsed.data.name,
        id: { not: context.params.groupId },
      },
    });
    if (nameExists) {
      return NextResponse.json(
        { success: false, error: "A modifier group with this name already exists" },
        { status: 400 }
      );
    }
  }

  const modifierGroup = await prisma.modifierGroup.update({
    where: { id: context.params.groupId },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.minSelections !== undefined && { minSelections: parsed.data.minSelections }),
      ...(parsed.data.maxSelections !== undefined && { maxSelections: parsed.data.maxSelections }),
      ...(parsed.data.isRequired !== undefined && { isRequired: parsed.data.isRequired }),
      ...(parsed.data.sortOrder !== undefined && { sortOrder: parsed.data.sortOrder }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
    },
    select: {
      id: true,
      name: true,
      minSelections: true,
      maxSelections: true,
      isRequired: true,
      sortOrder: true,
      isActive: true,
      modifiers: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          priceCents: true,
          isDefault: true,
          sortOrder: true,
          isActive: true,
        },
      },
    },
  });

  return NextResponse.json({ success: true, modifierGroup });
}

// POST - Add modifier to group
export async function POST(
  request: NextRequest,
  context: { params: { tenant: string; groupId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = addModifierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const group = await prisma.modifierGroup.findFirst({
    where: {
      id: context.params.groupId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!group) {
    return NextResponse.json({ success: false, error: "Modifier group not found" }, { status: 404 });
  }

  const modifier = await prisma.modifier.create({
    data: {
      groupId: context.params.groupId,
      name: parsed.data.name,
      priceCents: parsed.data.priceCents || 0,
      isDefault: parsed.data.isDefault ?? false,
      sortOrder: parsed.data.sortOrder ?? 0,
      isActive: parsed.data.isActive ?? true,
    },
    select: {
      id: true,
      name: true,
      priceCents: true,
      isDefault: true,
      sortOrder: true,
      isActive: true,
    },
  });

  return NextResponse.json({ success: true, modifier }, { status: 201 });
}

// DELETE - Delete modifier group
export async function DELETE(
  request: NextRequest,
  context: { params: { tenant: string; groupId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const existing = await prisma.modifierGroup.findFirst({
    where: {
      id: context.params.groupId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Modifier group not found" }, { status: 404 });
  }

  // Soft delete
  await prisma.modifierGroup.update({
    where: { id: context.params.groupId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true, message: "Modifier group deleted" });
}
