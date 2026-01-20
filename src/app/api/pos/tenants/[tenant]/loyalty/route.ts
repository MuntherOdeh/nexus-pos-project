import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const updateLoyaltySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  pointsPerDollar: z.number().int().min(0).optional(),
  pointsToRedeem: z.number().int().min(1).optional(),
  redeemValue: z.number().int().min(0).optional(), // In cents
  isActive: z.boolean().optional(),
});

const createTierSchema = z.object({
  name: z.string().min(1).max(100),
  minPoints: z.number().int().min(0),
  multiplier: z.number().min(0.1).max(10).optional(),
  benefits: z.string().max(1000).optional(),
  sortOrder: z.number().int().optional(),
});

// GET - Get loyalty program settings and tiers
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  let loyaltyProgram = await prisma.loyaltyProgram.findUnique({
    where: { tenantId: auth.ctx.tenantId },
    include: {
      tiers: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  // Create default program if doesn't exist
  if (!loyaltyProgram) {
    loyaltyProgram = await prisma.loyaltyProgram.create({
      data: {
        tenantId: auth.ctx.tenantId,
        name: "Loyalty Program",
        pointsPerDollar: 1,
        pointsToRedeem: 100,
        redeemValue: 100,
        isActive: false,
      },
      include: {
        tiers: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  return NextResponse.json({ success: true, loyaltyProgram });
}

// PATCH - Update loyalty program settings
export async function PATCH(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateLoyaltySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const loyaltyProgram = await prisma.loyaltyProgram.upsert({
    where: { tenantId: auth.ctx.tenantId },
    update: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.pointsPerDollar !== undefined && {
        pointsPerDollar: parsed.data.pointsPerDollar,
      }),
      ...(parsed.data.pointsToRedeem !== undefined && { pointsToRedeem: parsed.data.pointsToRedeem }),
      ...(parsed.data.redeemValue !== undefined && { redeemValue: parsed.data.redeemValue }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
    },
    create: {
      tenantId: auth.ctx.tenantId,
      name: parsed.data.name || "Loyalty Program",
      pointsPerDollar: parsed.data.pointsPerDollar ?? 1,
      pointsToRedeem: parsed.data.pointsToRedeem ?? 100,
      redeemValue: parsed.data.redeemValue ?? 100,
      isActive: parsed.data.isActive ?? false,
    },
    include: {
      tiers: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return NextResponse.json({ success: true, loyaltyProgram });
}

// POST - Add loyalty tier
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createTierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Get or create loyalty program
  let loyaltyProgram = await prisma.loyaltyProgram.findUnique({
    where: { tenantId: auth.ctx.tenantId },
  });

  if (!loyaltyProgram) {
    loyaltyProgram = await prisma.loyaltyProgram.create({
      data: {
        tenantId: auth.ctx.tenantId,
        name: "Loyalty Program",
        pointsPerDollar: 1,
        pointsToRedeem: 100,
        redeemValue: 100,
        isActive: false,
      },
    });
  }

  const tier = await prisma.loyaltyTier.create({
    data: {
      programId: loyaltyProgram.id,
      name: parsed.data.name,
      minPoints: parsed.data.minPoints,
      multiplier: parsed.data.multiplier ?? 1.0,
      benefits: parsed.data.benefits || null,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
    select: {
      id: true,
      name: true,
      minPoints: true,
      multiplier: true,
      benefits: true,
      sortOrder: true,
    },
  });

  return NextResponse.json({ success: true, tier }, { status: 201 });
}
