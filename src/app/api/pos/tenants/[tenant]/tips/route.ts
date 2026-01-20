import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const addTipSchema = z.object({
  orderId: z.string().min(1),
  amountCents: z.number().int().min(0),
  employeeId: z.string().optional().nullable(),
  paymentId: z.string().optional().nullable(),
});

// GET - Get tips (filtered by employee, date range, etc.)
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const employeeId = request.nextUrl.searchParams.get("employeeId")?.trim() || null;
  const startDate = request.nextUrl.searchParams.get("startDate")?.trim() || null;
  const endDate = request.nextUrl.searchParams.get("endDate")?.trim() || null;

  // Only managers/admins can view all tips
  const canViewAll = ["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role);

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
  };

  // If not manager, only show own tips
  if (!canViewAll) {
    where.employeeId = auth.ctx.user.id;
  } else if (employeeId) {
    where.employeeId = employeeId;
  }

  if (startDate) {
    where.createdAt = { ...((where.createdAt as object) || {}), gte: new Date(startDate) };
  }
  if (endDate) {
    where.createdAt = { ...((where.createdAt as object) || {}), lte: new Date(endDate) };
  }

  const tips = await prisma.tip.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      orderId: true,
      order: { select: { orderNumber: true } },
      employeeId: true,
      employee: { select: { id: true, firstName: true, lastName: true } },
      amountCents: true,
      paymentId: true,
      createdAt: true,
    },
  });

  // Calculate totals
  const totalCents = tips.reduce((sum, t) => sum + t.amountCents, 0);

  return NextResponse.json({
    success: true,
    tips,
    summary: {
      count: tips.length,
      totalCents,
    },
  });
}

// POST - Add tip to order
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = addTipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Verify order exists and belongs to tenant
  const order = await prisma.posOrder.findFirst({
    where: {
      id: parsed.data.orderId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  // Verify employee if provided
  if (parsed.data.employeeId) {
    const employee = await prisma.tenantUser.findFirst({
      where: {
        id: parsed.data.employeeId,
        tenantId: auth.ctx.tenantId,
      },
    });
    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }
  }

  const tip = await prisma.tip.create({
    data: {
      tenantId: auth.ctx.tenantId,
      orderId: parsed.data.orderId,
      employeeId: parsed.data.employeeId || null,
      amountCents: parsed.data.amountCents,
      paymentId: parsed.data.paymentId || null,
    },
    select: {
      id: true,
      orderId: true,
      order: { select: { orderNumber: true } },
      employeeId: true,
      employee: { select: { id: true, firstName: true, lastName: true } },
      amountCents: true,
      createdAt: true,
    },
  });

  // Update order tipCents
  await prisma.posOrder.update({
    where: { id: parsed.data.orderId },
    data: {
      tipCents: { increment: parsed.data.amountCents },
    },
  });

  return NextResponse.json({ success: true, tip }, { status: 201 });
}
