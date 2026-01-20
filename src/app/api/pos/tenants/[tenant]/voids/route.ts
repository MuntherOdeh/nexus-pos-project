import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const createVoidSchema = z.object({
  orderId: z.string().min(1),
  type: z.enum(["VOID", "REFUND", "ITEM_VOID", "PARTIAL_REFUND"]),
  reason: z.string().min(1).max(500),
  amountCents: z.number().int().min(0),
  itemIds: z.array(z.string()).optional(), // For item-level voids
});

// GET - Get void/refund records
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only managers/admins can view void/refund history
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type")?.trim().toUpperCase() || null;
  const startDate = request.nextUrl.searchParams.get("startDate")?.trim() || null;
  const endDate = request.nextUrl.searchParams.get("endDate")?.trim() || null;
  const orderId = request.nextUrl.searchParams.get("orderId")?.trim() || null;

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
  };

  if (type && ["VOID", "REFUND", "ITEM_VOID", "PARTIAL_REFUND"].includes(type)) {
    where.type = type;
  }

  if (orderId) {
    where.orderId = orderId;
  }

  if (startDate) {
    where.createdAt = { ...((where.createdAt as object) || {}), gte: new Date(startDate) };
  }
  if (endDate) {
    where.createdAt = { ...((where.createdAt as object) || {}), lte: new Date(endDate) };
  }

  const voidRefunds = await prisma.voidRefund.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      orderId: true,
      order: { select: { orderNumber: true, totalCents: true } },
      type: true,
      reason: true,
      amountCents: true,
      approvedById: true,
      approvedBy: { select: { id: true, firstName: true, lastName: true } },
      createdById: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      createdAt: true,
    },
  });

  // Calculate totals
  const totals = voidRefunds.reduce(
    (acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + v.amountCents;
      acc.total += v.amountCents;
      return acc;
    },
    { total: 0 } as Record<string, number>
  );

  return NextResponse.json({
    success: true,
    voidRefunds,
    summary: {
      count: voidRefunds.length,
      totals,
    },
  });
}

// POST - Create void/refund
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = createVoidSchema.safeParse(body);
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

  // Full voids/refunds require manager approval
  const requiresApproval = ["VOID", "REFUND"].includes(parsed.data.type);
  const isManager = ["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role);

  // Staff can only do item voids up to certain amount
  if (!isManager && parsed.data.type !== "ITEM_VOID") {
    return NextResponse.json(
      { success: false, error: "Only managers can process full voids/refunds" },
      { status: 403 }
    );
  }

  const voidRefund = await prisma.voidRefund.create({
    data: {
      tenantId: auth.ctx.tenantId,
      orderId: parsed.data.orderId,
      type: parsed.data.type,
      reason: parsed.data.reason,
      amountCents: parsed.data.amountCents,
      createdById: auth.ctx.user.id,
      approvedById: requiresApproval && isManager ? auth.ctx.user.id : null,
    },
    select: {
      id: true,
      orderId: true,
      order: { select: { orderNumber: true } },
      type: true,
      reason: true,
      amountCents: true,
      approvedById: true,
      createdById: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      createdAt: true,
    },
  });

  // Update order if full void
  if (parsed.data.type === "VOID") {
    await prisma.posOrder.update({
      where: { id: parsed.data.orderId },
      data: { status: "CANCELLED" },
    });
  }

  // Void specific items if item void
  if (parsed.data.type === "ITEM_VOID" && parsed.data.itemIds?.length) {
    await prisma.posOrderItem.updateMany({
      where: {
        id: { in: parsed.data.itemIds },
        orderId: parsed.data.orderId,
      },
      data: { status: "VOID" },
    });
  }

  return NextResponse.json({ success: true, voidRefund }, { status: 201 });
}
