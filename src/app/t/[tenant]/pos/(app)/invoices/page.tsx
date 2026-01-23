import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";
import { InvoicesView } from "@/components/pos/InvoicesView";

export default async function TenantInvoicesPage({ params }: { params: { tenant: string } }) {
  const tenant = await getTenantBySlug({ prisma, slug: params.tenant });
  if (!tenant) notFound();

  const invoices = await prisma.invoice.findMany({
    where: { tenantId: tenant.id },
    orderBy: { issuedAt: "desc" },
    take: 60,
    include: {
      lines: {
        select: {
          description: true,
          quantity: true,
          unitPriceCents: true,
          lineTotalCents: true,
        },
      },
    },
  });

  return (
    <InvoicesView
      tenantSlug={tenant.slug}
      invoices={invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        customerName: inv.customerName,
        customerEmail: inv.customerEmail,
        issuedAt: inv.issuedAt?.toISOString() ?? new Date().toISOString(),
        dueAt: inv.dueAt?.toISOString() ?? null,
        subtotalCents: inv.subtotalCents,
        taxCents: inv.taxCents,
        totalCents: inv.totalCents,
        currency: inv.currency,
        lines: inv.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPriceCents: l.unitPriceCents,
          lineTotalCents: l.lineTotalCents,
        })),
      }))}
    />
  );
}
