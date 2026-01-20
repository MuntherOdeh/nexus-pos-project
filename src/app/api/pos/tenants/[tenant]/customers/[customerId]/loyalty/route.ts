import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const adjustPointsSchema = z.object({
  type: z.enum(["EARN", "REDEEM", "ADJUST", "BONUS"]),
  points: z.number().int(),
  description: z.string().max(500).optional(),
  orderId: z.string().optional(),
});

// POST - Add/redeem loyalty points
export async function POST(
  request: NextRequest,
  context: { params: { tenant: string; customerId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = adjustPointsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: context.params.customerId,
      tenantId: auth.ctx.tenantId,
      isActive: true,
    },
  });

  if (!customer) {
    return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
  }

  // For redemption, check if customer has enough points
  if (parsed.data.type === "REDEEM") {
    if (parsed.data.points > 0) {
      return NextResponse.json(
        { success: false, error: "Redemption points must be negative" },
        { status: 400 }
      );
    }
    if (customer.loyaltyPoints + parsed.data.points < 0) {
      return NextResponse.json(
        { success: false, error: "Insufficient loyalty points" },
        { status: 400 }
      );
    }
  }

  // Create transaction and update customer points
  const [transaction, updatedCustomer] = await prisma.$transaction([
    prisma.loyaltyTransaction.create({
      data: {
        customerId: context.params.customerId,
        type: parsed.data.type,
        points: parsed.data.points,
        orderId: parsed.data.orderId || null,
        description:
          parsed.data.description ||
          (parsed.data.type === "EARN"
            ? "Points earned"
            : parsed.data.type === "REDEEM"
              ? "Points redeemed"
              : parsed.data.type === "BONUS"
                ? "Bonus points"
                : "Points adjustment"),
      },
      select: {
        id: true,
        type: true,
        points: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.customer.update({
      where: { id: context.params.customerId },
      data: {
        loyaltyPoints: { increment: parsed.data.points },
      },
      select: {
        id: true,
        loyaltyPoints: true,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    transaction,
    newBalance: updatedCustomer.loyaltyPoints,
  });
}
