import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";
import { LogisticsView } from "@/components/pos/LogisticsView";

export default async function TenantLogisticsPage({ params }: { params: { tenant: string } }) {
  const tenant = await getTenantBySlug({ prisma, slug: params.tenant });
  if (!tenant) notFound();

  const movements = await prisma.inventoryMovement.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      warehouse: { select: { name: true } },
      lines: {
        include: {
          product: { select: { name: true, sku: true } },
        },
      },
    },
  });

  return (
    <LogisticsView
      movements={movements.map((m) => ({
        id: m.id,
        type: m.type,
        status: m.status,
        reference: m.reference,
        warehouseName: m.warehouse.name,
        notes: m.notes,
        createdAt: m.createdAt.toISOString(),
        lines: m.lines.map((l) => ({
          productName: l.product.name,
          sku: l.product.sku,
          quantity: l.quantity,
        })),
      }))}
    />
  );
}

