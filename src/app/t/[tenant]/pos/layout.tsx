import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";
import { PosShell } from "@/components/pos/PosShell";

export default async function TenantPosLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  const tenant = await getTenantBySlug({ prisma, slug: params.tenant });
  if (!tenant) notFound();

  return (
    <PosShell
      tenant={{
        slug: tenant.slug,
        name: tenant.name,
        industry: tenant.industry,
        theme: tenant.theme,
      }}
    >
      {children}
    </PosShell>
  );
}

