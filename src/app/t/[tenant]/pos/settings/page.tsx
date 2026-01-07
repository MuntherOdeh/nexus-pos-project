import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";
import { SettingsView } from "@/components/pos/SettingsView";

export default async function TenantSettingsPage({ params }: { params: { tenant: string } }) {
  const tenant = await getTenantBySlug({ prisma, slug: params.tenant });
  if (!tenant) notFound();

  const connections = await prisma.paymentConnection.findMany({
    where: { tenantId: tenant.id },
    select: {
      provider: true,
      status: true,
      displayName: true,
      lastConnectedAt: true,
    },
  });

  const byProvider = new Map(connections.map((c) => [c.provider, c]));
  const normalized = (["BANK", "PAYPAL", "CARD"] as const).map((provider) => {
    const c = byProvider.get(provider);
    return {
      provider,
      status: c?.status ?? "DISCONNECTED",
      displayName:
        c?.displayName ??
        (provider === "BANK"
          ? "Bank Transfer"
          : provider === "PAYPAL"
          ? "PayPal"
          : "Credit / Debit Cards"),
      lastConnectedAt: c?.lastConnectedAt?.toISOString() ?? null,
    };
  });

  return (
    <SettingsView
      tenant={{
        slug: tenant.slug,
        name: tenant.name,
        industry: tenant.industry,
        theme: tenant.theme,
        country: tenant.country,
        language: tenant.language,
        currency: tenant.currency,
      }}
      paymentConnections={normalized}
    />
  );
}

