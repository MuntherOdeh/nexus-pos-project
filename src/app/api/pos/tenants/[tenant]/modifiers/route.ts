import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const modifierSchema = z.object({
  name: z.string().min(1).max(100),
  priceCents: z.number().int().min(0).default(0),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const createModifierGroupSchema = z.object({
  name: z.string().min(1).max(100),
  minSelections: z.number().int().min(0).default(0),
  maxSelections: z.number().int().min(1).default(1),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  modifiers: z.array(modifierSchema).optional(),
});

// GET - List modifier groups with modifiers
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const activeOnly = request.nextUrl.searchParams.get("activeOnly") === "true";
  const productId = request.nextUrl.searchParams.get("productId")?.trim() || null;

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
  };

  if (activeOnly) {
    where.isActive = true;
  }

  // If productId is provided, get only modifier groups linked to that product
  if (productId) {
    const productLinks = await prisma.productModifierGroup.findMany({
      where: { productId },
      select: { modifierGroupId: true },
    });
    where.id = { in: productLinks.map((l) => l.modifierGroupId) };
  }

  const modifierGroups = await prisma.modifierGroup.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      minSelections: true,
      maxSelections: true,
      isRequired: true,
      sortOrder: true,
      isActive: true,
      createdAt: true,
      modifiers: {
        where: activeOnly ? { isActive: true } : {},
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

  return NextResponse.json({ success: true, modifierGroups });
}

// POST - Create modifier group with modifiers
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only managers/admins can create modifier groups
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createModifierGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Check for duplicate name
  const existing = await prisma.modifierGroup.findFirst({
    where: {
      tenantId: auth.ctx.tenantId,
      name: parsed.data.name,
    },
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "A modifier group with this name already exists" },
      { status: 400 }
    );
  }

  const modifierGroup = await prisma.modifierGroup.create({
    data: {
      tenantId: auth.ctx.tenantId,
      name: parsed.data.name,
      minSelections: parsed.data.minSelections || 0,
      maxSelections: parsed.data.maxSelections || 1,
      isRequired: parsed.data.isRequired ?? false,
      sortOrder: parsed.data.sortOrder || 0,
      isActive: parsed.data.isActive ?? true,
      modifiers: parsed.data.modifiers
        ? {
            create: parsed.data.modifiers.map((m, idx) => ({
              name: m.name,
              priceCents: m.priceCents || 0,
              isDefault: m.isDefault ?? false,
              sortOrder: m.sortOrder ?? idx,
              isActive: m.isActive ?? true,
            })),
          }
        : undefined,
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

  return NextResponse.json({ success: true, modifierGroup }, { status: 201 });
}
