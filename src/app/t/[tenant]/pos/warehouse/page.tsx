import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";
import { PosCard, PosCardContent, PosCardHeader } from "@/components/pos/PosCard";
import { formatMoney } from "@/lib/pos/format";

export default async function TenantWarehousePage({ params }: { params: { tenant: string } }) {
  const tenant = await getTenantBySlug({ prisma, slug: params.tenant });
  if (!tenant) notFound();

  const warehouses = await prisma.warehouse.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "asc" },
    include: {
      stockItems: {
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              priceCents: true,
              currency: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">Warehouse</h1>
        <p className="text-sm md:text-base text-[var(--pos-muted)] mt-2">
          Stock overview per warehouse (demo).
        </p>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        {warehouses.map((w) => {
          const totalOnHand = w.stockItems.reduce((sum, s) => sum + s.onHand, 0);
          const totalReserved = w.stockItems.reduce((sum, s) => sum + s.reserved, 0);
          const inventoryValueCents = w.stockItems.reduce(
            (sum, s) => sum + s.onHand * (s.product.priceCents || 0),
            0
          );
          const lowStock = w.stockItems.filter((s) => s.reorderPoint > 0 && s.onHand <= s.reorderPoint).length;

          return (
            <PosCard key={w.id}>
              <PosCardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">{w.name}</div>
                    <div className="text-xs text-[var(--pos-muted)]">Code: {w.code || "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[var(--pos-muted)]">Inventory value</div>
                    <div className="font-bold">
                      {formatMoney({ cents: inventoryValueCents, currency: tenant.currency })}
                    </div>
                  </div>
                </div>
              </PosCardHeader>
              <PosCardContent>
                <div className="grid sm:grid-cols-4 gap-3">
                  {[
                    { label: "Items", value: w.stockItems.length },
                    { label: "On hand", value: totalOnHand },
                    { label: "Reserved", value: totalReserved },
                    { label: "Low stock", value: lowStock },
                  ].map((k) => (
                    <div
                      key={k.label}
                      className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 p-4"
                    >
                      <div className="text-xs text-[var(--pos-muted)]">{k.label}</div>
                      <div className="font-bold mt-1">{k.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--pos-muted)]">
                        <th className="py-2 pr-4 font-medium">Product</th>
                        <th className="py-2 pr-4 font-medium">SKU</th>
                        <th className="py-2 pr-4 font-medium">On hand</th>
                        <th className="py-2 pr-4 font-medium">Reserved</th>
                        <th className="py-2 text-right font-medium">Unit price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {w.stockItems.map((s) => (
                        <tr key={`${w.id}-${s.id}`} className="border-t border-[color:var(--pos-border)]">
                          <td className="py-3 pr-4 font-semibold">{s.product.name}</td>
                          <td className="py-3 pr-4 font-mono text-xs text-[var(--pos-muted)]">{s.product.sku || "—"}</td>
                          <td className="py-3 pr-4">{s.onHand}</td>
                          <td className="py-3 pr-4">{s.reserved}</td>
                          <td className="py-3 text-right font-semibold">
                            {formatMoney({ cents: s.product.priceCents, currency: s.product.currency })}
                          </td>
                        </tr>
                      ))}
                      {w.stockItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-[var(--pos-muted)]">
                            No stock items.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </PosCardContent>
            </PosCard>
          );
        })}
        {warehouses.length === 0 && (
          <PosCard>
            <PosCardContent>
              <div className="text-sm text-[var(--pos-muted)]">No warehouses yet.</div>
            </PosCardContent>
          </PosCard>
        )}
      </div>
    </div>
  );
}

