import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";
import { KdsView } from "@/components/pos/KdsView";

export const dynamic = "force-dynamic";

export default async function TenantKdsPage({ params }: { params: { tenant: string } }) {
  const tenant = await getTenantBySlug({ prisma, slug: params.tenant });
  if (!tenant) notFound();

  const orders = await prisma.posOrder.findMany({
    where: { tenantId: tenant.id, status: { in: ["IN_KITCHEN", "READY", "FOR_PAYMENT"] } },
    orderBy: { openedAt: "asc" },
    take: 60,
    select: {
      id: true,
      status: true,
      orderNumber: true,
      openedAt: true,
      sentToKitchenAt: true,
      table: { select: { id: true, name: true } },
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productName: true,
          quantity: true,
          status: true,
          notes: true,
          createdAt: true,
        },
      },
    },
  });

  return (
    <KdsView
      tenant={{ slug: tenant.slug, name: tenant.name, currency: tenant.currency }}
      initialOrders={orders.map((o) => ({
        id: o.id,
        status: o.status,
        orderNumber: o.orderNumber,
        openedAt: o.openedAt?.toISOString() ?? new Date().toISOString(),
        sentToKitchenAt: o.sentToKitchenAt?.toISOString() ?? null,
        table: o.table,
        items: o.items.map((i) => ({
          id: i.id,
          productName: i.productName,
          quantity: i.quantity,
          status: i.status,
          notes: i.notes,
          createdAt: i.createdAt?.toISOString() ?? new Date().toISOString(),
        })),
      }))}
    />
  );
}

