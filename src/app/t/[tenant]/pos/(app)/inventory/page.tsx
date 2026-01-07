import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";
import { InventoryView } from "@/components/pos/InventoryView";

export default async function TenantInventoryPage({ params }: { params: { tenant: string } }) {
  const tenant = await getTenantBySlug({ prisma, slug: params.tenant });
  if (!tenant) notFound();

  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    include: {
      stockItems: {
        select: {
          onHand: true,
          reserved: true,
          reorderPoint: true,
          warehouse: { select: { name: true } },
        },
      },
    },
  });

  return (
    <InventoryView
      products={products.map((p) => {
        const onHand = p.stockItems.reduce((sum, s) => sum + s.onHand, 0);
        const reserved = p.stockItems.reduce((sum, s) => sum + s.reserved, 0);
        const reorderPoint = p.stockItems.reduce((max, s) => Math.max(max, s.reorderPoint), 0);

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          priceCents: p.priceCents,
          currency: p.currency,
          isActive: p.isActive,
          onHand,
          reserved,
          reorderPoint,
          warehouses: p.stockItems.map((s) => ({
            warehouseName: s.warehouse.name,
            onHand: s.onHand,
            reserved: s.reserved,
            reorderPoint: s.reorderPoint,
          })),
        };
      })}
    />
  );
}
