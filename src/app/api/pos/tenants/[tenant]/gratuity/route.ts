import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const updateGratuitySchema = z.object({
  minPartySize: z.number().int().min(1).optional(),
  gratuityRate: z.number().int().min(0).max(5000).optional(), // Basis points (max 50%)
  isActive: z.boolean().optional(),
});

// GET - Get auto-gratuity settings
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  let gratuitySetting = await prisma.gratuitySetting.findUnique({
    where: { tenantId: auth.ctx.tenantId },
  });

  // Create default settings if doesn't exist
  if (!gratuitySetting) {
    gratuitySetting = await prisma.gratuitySetting.create({
      data: {
        tenantId: auth.ctx.tenantId,
        minPartySize: 6,
        gratuityRate: 1800, // 18%
        isActive: false,
      },
    });
  }

  return NextResponse.json({ success: true, gratuitySetting });
}

// PATCH - Update auto-gratuity settings
export async function PATCH(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateGratuitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const gratuitySetting = await prisma.gratuitySetting.upsert({
    where: { tenantId: auth.ctx.tenantId },
    update: {
      ...(parsed.data.minPartySize !== undefined && { minPartySize: parsed.data.minPartySize }),
      ...(parsed.data.gratuityRate !== undefined && { gratuityRate: parsed.data.gratuityRate }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
    },
    create: {
      tenantId: auth.ctx.tenantId,
      minPartySize: parsed.data.minPartySize ?? 6,
      gratuityRate: parsed.data.gratuityRate ?? 1800,
      isActive: parsed.data.isActive ?? false,
    },
  });

  return NextResponse.json({ success: true, gratuitySetting });
}
