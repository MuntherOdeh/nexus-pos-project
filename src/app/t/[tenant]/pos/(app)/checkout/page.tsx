import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";
import { CheckoutView } from "@/components/pos/CheckoutView";

export const dynamic = "force-dynamic";

export default async function TenantCheckoutPage({ params }: { params: { tenant: string } }) {
  try {
    const tenant = await getTenantBySlug({ prisma, slug: params.tenant });
    if (!tenant) notFound();

    const [floors, categories, uncategorizedProducts, openOrders] = await Promise.all([
      prisma.posFloor.findMany({
        where: { tenantId: tenant.id },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          sortOrder: true,
          tables: {
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              capacity: true,
              x: true,
              y: true,
              width: true,
              height: true,
              shape: true,
            },
          },
        },
      }),
      prisma.productCategory.findMany({
        where: { tenantId: tenant.id, isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          sortOrder: true,
          products: {
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true, priceCents: true, currency: true, categoryId: true },
          },
        },
      }),
      prisma.product.findMany({
        where: { tenantId: tenant.id, isActive: true, categoryId: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true, priceCents: true, currency: true, categoryId: true },
      }),
      prisma.posOrder.findMany({
        where: { tenantId: tenant.id, status: { in: ["OPEN", "IN_KITCHEN", "READY", "FOR_PAYMENT"] } },
        orderBy: { openedAt: "desc" },
        take: 60,
        select: {
          id: true,
          tableId: true,
          status: true,
          orderNumber: true,
          totalCents: true,
          currency: true,
          openedAt: true,
        },
      }),
    ]);

    return (
      <CheckoutView
        tenant={{
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          currency: tenant.currency,
          industry: tenant.industry,
        }}
        floors={floors.map(f => ({
          ...f,
          tables: f.tables.map(t => ({
            ...t,
            shape: t.shape as "RECT" | "ROUND",
          })),
        }))}
        catalog={{
          categories,
          uncategorized: uncategorizedProducts,
        }}
        initialOpenOrders={openOrders.map((o) => ({
          id: o.id,
          tableId: o.tableId,
          status: o.status,
          orderNumber: o.orderNumber,
          totalCents: o.totalCents,
          currency: o.currency,
          openedAt: o.openedAt?.toISOString() ?? new Date().toISOString(),
        }))}
      />
    );
  } catch (error) {
    console.error("Checkout Page Error:", error);
    throw error;
  }
}

