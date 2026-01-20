import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export async function POST(
  request: NextRequest,
  context: { params: { tenant: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only OWNER, ADMIN, MANAGER can load sample orders
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json(
      { success: false, error: "You don't have permission to load sample data" },
      { status: 403 }
    );
  }

  try {
    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.ctx.tenantId },
      select: { currency: true, industry: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Get some products to create orders with
    const products = await prisma.product.findMany({
      where: { tenantId: auth.ctx.tenantId, isActive: true },
      take: 10,
      select: { id: true, name: true, priceCents: true },
    });

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: "No products found. Please load sample products first." },
        { status: 400 }
      );
    }

    // Get tables if available
    const tables = await prisma.posTable.findMany({
      where: { tenantId: auth.ctx.tenantId, isActive: true },
      take: 5,
      select: { id: true },
    });

    // Get customers if available
    const customers = await prisma.customer.findMany({
      where: { tenantId: auth.ctx.tenantId, isActive: true },
      take: 3,
      select: { id: true },
    });

    const now = new Date();
    const statuses = ["OPEN", "IN_KITCHEN", "READY", "FOR_PAYMENT", "PAID"] as const;
    const ordersToCreate = 8;
    let ordersCreated = 0;

    for (let i = 0; i < ordersToCreate; i++) {
      const status = statuses[i % statuses.length];
      const isPaid = status === "PAID";
      const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
      const orderProducts = products.slice(0, itemCount);

      // Calculate totals
      let subtotalCents = 0;
      // Map order status to item status
      const getItemStatus = (orderStatus: string) => {
        if (orderStatus === "IN_KITCHEN") return "IN_PROGRESS" as const;
        if (orderStatus === "READY" || orderStatus === "FOR_PAYMENT" || orderStatus === "PAID") return "READY" as const;
        return "NEW" as const;
      };
      const itemStatus = getItemStatus(status);

      const orderItems = orderProducts.map((product) => {
        const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
        subtotalCents += product.priceCents * quantity;
        return {
          productId: product.id,
          productName: product.name,
          unitPriceCents: product.priceCents,
          quantity,
          status: itemStatus,
        };
      });

      const taxCents = Math.round(subtotalCents * 0.05); // 5% tax
      const totalCents = subtotalCents + taxCents;

      // Set timestamps based on status
      const openedAt = new Date(now.getTime() - (ordersToCreate - i) * 15 * 60 * 1000); // Stagger by 15 mins
      const sentToKitchenAt = ["IN_KITCHEN", "READY", "FOR_PAYMENT", "PAID"].includes(status)
        ? new Date(openedAt.getTime() + 2 * 60 * 1000)
        : null;
      const closedAt = isPaid ? new Date(openedAt.getTime() + 30 * 60 * 1000) : null;

      await prisma.posOrder.create({
        data: {
          tenantId: auth.ctx.tenantId,
          orderNumber: generateOrderNumber(),
          status,
          tableId: tables.length > 0 ? tables[i % tables.length].id : null,
          customerId: customers.length > 0 && i % 2 === 0 ? customers[i % customers.length].id : null,
          subtotalCents,
          taxCents,
          discountCents: 0,
          totalCents,
          currency: tenant.currency,
          openedAt,
          sentToKitchenAt,
          closedAt,
          openedById: auth.ctx.user.id,
          items: {
            create: orderItems,
          },
          payments: isPaid
            ? {
                create: {
                  tenantId: auth.ctx.tenantId,
                  provider: i % 2 === 0 ? "CASH" : "CARD",
                  amountCents: totalCents,
                  currency: tenant.currency,
                  status: "CAPTURED",
                },
              }
            : undefined,
        },
      });

      ordersCreated++;
    }

    return NextResponse.json({
      success: true,
      message: `Created ${ordersCreated} sample orders`,
      ordersCreated,
    });
  } catch (error) {
    console.error("Error creating sample orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create sample orders" },
      { status: 500 }
    );
  }
}
