import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const createTaxRateSchema = z.object({
  name: z.string().min(1).max(100),
  rate: z.number().int().min(0).max(10000), // Basis points (e.g., 500 = 5%)
  isDefault: z.boolean().optional(),
  isInclusive: z.boolean().optional(),
  appliesTo: z.enum(["ALL", "CATEGORIES", "DINE_IN", "TAKEOUT"]).optional(),
  categoryIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// GET - List tax rates
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const activeOnly = request.nextUrl.searchParams.get("activeOnly") === "true";

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
  };

  if (activeOnly) {
    where.isActive = true;
  }

  const taxRates = await prisma.taxRate.findMany({
    where,
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      rate: true,
      isDefault: true,
      isInclusive: true,
      appliesTo: true,
      categoryIds: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, taxRates });
}

// POST - Create tax rate
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only managers/admins can create tax rates
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createTaxRateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Check for duplicate name
  const existing = await prisma.taxRate.findFirst({
    where: {
      tenantId: auth.ctx.tenantId,
      name: parsed.data.name,
    },
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "A tax rate with this name already exists" },
      { status: 400 }
    );
  }

  // If setting as default, unset other defaults
  if (parsed.data.isDefault) {
    await prisma.taxRate.updateMany({
      where: {
        tenantId: auth.ctx.tenantId,
        isDefault: true,
      },
      data: { isDefault: false },
    });
  }

  const taxRate = await prisma.taxRate.create({
    data: {
      tenantId: auth.ctx.tenantId,
      name: parsed.data.name,
      rate: parsed.data.rate,
      isDefault: parsed.data.isDefault ?? false,
      isInclusive: parsed.data.isInclusive ?? false,
      appliesTo: parsed.data.appliesTo || "ALL",
      categoryIds: parsed.data.categoryIds || [],
      isActive: parsed.data.isActive ?? true,
    },
    select: {
      id: true,
      name: true,
      rate: true,
      isDefault: true,
      isInclusive: true,
      appliesTo: true,
      categoryIds: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, taxRate }, { status: 201 });
}
