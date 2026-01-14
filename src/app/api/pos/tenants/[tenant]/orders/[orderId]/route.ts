import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: { tenant: string; orderId: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const orderId = context.params.orderId;
  const order = await prisma.posOrder.findFirst({
    where: { id: orderId, tenantId: auth.ctx.tenantId },
    select: {
      id: true,
      status: true,
      orderNumber: true,
      notes: true,
      subtotalCents: true,
      discountCents: true,
      taxCents: true,
      totalCents: true,
      currency: true,
      openedAt: true,
      sentToKitchenAt: true,
      closedAt: true,
      table: { select: { id: true, name: true, capacity: true } },
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productId: true,
          productName: true,
          unitPriceCents: true,
          quantity: true,
          status: true,
          notes: true,
          discountPercent: true,
          createdAt: true,
        },
      },
      payments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          provider: true,
          status: true,
          amountCents: true,
          currency: true,
          processorRef: true,
          metadata: true,
          createdAt: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, order });
}

