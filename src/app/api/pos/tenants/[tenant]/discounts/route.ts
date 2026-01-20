import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const createDiscountSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().max(50).optional().nullable(),
  type: z.enum(["PERCENTAGE", "FIXED", "BOGO"]),
  value: z.number().int().min(0), // Cents for FIXED, basis points for PERCENTAGE
  minOrderCents: z.number().int().min(0).optional().nullable(),
  maxUsageCount: z.number().int().min(1).optional().nullable(),
  applicableTo: z.enum(["ORDER", "CATEGORY", "PRODUCT"]).optional(),
  categoryIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET - List discounts
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const activeOnly = request.nextUrl.searchParams.get("activeOnly") === "true";
  const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase() || null;

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
  };

  if (activeOnly) {
    where.isActive = true;
    where.OR = [
      { endDate: null },
      { endDate: { gte: new Date() } },
    ];
    where.AND = [
      {
        OR: [
          { startDate: null },
          { startDate: { lte: new Date() } },
        ],
      },
    ];
  }

  if (code) {
    where.code = code;
  }

  const discounts = await prisma.discount.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      value: true,
      minOrderCents: true,
      maxUsageCount: true,
      usageCount: true,
      applicableTo: true,
      categoryIds: true,
      productIds: true,
      startDate: true,
      endDate: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, discounts });
}

// POST - Create discount
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only managers/admins can create discounts
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createDiscountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Check for duplicate code
  if (parsed.data.code) {
    const existing = await prisma.discount.findFirst({
      where: {
        tenantId: auth.ctx.tenantId,
        code: parsed.data.code.toUpperCase(),
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A discount with this code already exists" },
        { status: 400 }
      );
    }
  }

  const discount = await prisma.discount.create({
    data: {
      tenantId: auth.ctx.tenantId,
      name: parsed.data.name,
      code: parsed.data.code?.toUpperCase() || null,
      type: parsed.data.type,
      value: parsed.data.value,
      minOrderCents: parsed.data.minOrderCents || null,
      maxUsageCount: parsed.data.maxUsageCount || null,
      applicableTo: parsed.data.applicableTo || "ORDER",
      categoryIds: parsed.data.categoryIds || [],
      productIds: parsed.data.productIds || [],
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      isActive: parsed.data.isActive ?? true,
    },
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      value: true,
      minOrderCents: true,
      maxUsageCount: true,
      usageCount: true,
      applicableTo: true,
      categoryIds: true,
      productIds: true,
      startDate: true,
      endDate: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, discount }, { status: 201 });
}
