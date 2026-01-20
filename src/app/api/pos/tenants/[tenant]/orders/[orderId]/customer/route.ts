import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const setCustomerSchema = z.object({
  customerId: z.string().min(1),
});

// POST - Set customer on order
export async function POST(
  request: NextRequest,
  context: { params: { tenant: string; orderId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = setCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Verify order exists
  const order = await prisma.posOrder.findFirst({
    where: {
      id: context.params.orderId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  // Verify customer exists
  const customer = await prisma.customer.findFirst({
    where: {
      id: parsed.data.customerId,
      tenantId: auth.ctx.tenantId,
      isActive: true,
    },
  });

  if (!customer) {
    return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
  }

  // Update order with customer
  const updatedOrder = await prisma.posOrder.update({
    where: { id: context.params.orderId },
    data: { customerId: parsed.data.customerId },
    select: {
      id: true,
      orderNumber: true,
      customerId: true,
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          loyaltyPoints: true,
        },
      },
    },
  });

  return NextResponse.json({ success: true, order: updatedOrder });
}

// DELETE - Remove customer from order
export async function DELETE(
  request: NextRequest,
  context: { params: { tenant: string; orderId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const order = await prisma.posOrder.findFirst({
    where: {
      id: context.params.orderId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  await prisma.posOrder.update({
    where: { id: context.params.orderId },
    data: { customerId: null },
  });

  return NextResponse.json({ success: true, message: "Customer removed from order" });
}
