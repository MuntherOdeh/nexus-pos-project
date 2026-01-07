import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: { tenant: string; orderId: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const orderId = context.params.orderId;
  const order = await prisma.posOrder.findFirst({
    where: { id: orderId, tenantId: auth.ctx.tenantId },
    select: { id: true, status: true },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  if (order.status === "PAID") {
    return NextResponse.json({ success: false, error: "Paid orders cannot be cancelled" }, { status: 400 });
  }

  const updated = await prisma.posOrder.update({
    where: { id: order.id },
    data: { status: "CANCELLED", closedAt: new Date() },
    select: { id: true, status: true },
  });

  return NextResponse.json({ success: true, order: updated });
}

