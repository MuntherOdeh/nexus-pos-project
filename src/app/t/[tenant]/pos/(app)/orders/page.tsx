import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";
import { ActiveOrdersView } from "@/components/pos/ActiveOrdersView";

export const dynamic = "force-dynamic";

export default async function TenantOrdersPage({ params }: { params: { tenant: string } }) {
  const tenant = await getTenantBySlug({ prisma, slug: params.tenant });
  if (!tenant) notFound();

  // Get user role from session
  const token = cookies().get("pos-auth-token")?.value;
  let userRole = "STAFF";

  if (token) {
    const session = await prisma.posSession.findUnique({
      where: { token },
      include: {
        tenantUser: { select: { role: true } },
      },
    });
    if (session?.tenantUser) {
      userRole = session.tenantUser.role;
    }
  }

  const orders = await prisma.posOrder.findMany({
    where: {
      tenantId: tenant.id,
      status: { in: ["OPEN", "IN_KITCHEN", "READY", "FOR_PAYMENT"] },
    },
    orderBy: { openedAt: "desc" },
    take: 100,
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
      tableId: true,
      table: { select: { id: true, name: true } },
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productName: true,
          quantity: true,
          unitPriceCents: true,
          status: true,
          notes: true,
        },
      },
    },
  });

  return (
    <ActiveOrdersView
      tenant={{
        slug: tenant.slug,
        name: tenant.name,
        currency: tenant.currency,
      }}
      initialOrders={orders.map((o) => ({
        ...o,
        openedAt: o.openedAt?.toISOString() ?? new Date().toISOString(),
        sentToKitchenAt: o.sentToKitchenAt?.toISOString() || null,
        closedAt: o.closedAt?.toISOString() || null,
      }))}
      userRole={userRole}
    />
  );
}
