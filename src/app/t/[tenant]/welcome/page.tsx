import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";
import { WelcomeScreen } from "@/components/pos/WelcomeScreen";

export default async function TenantWelcomePage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getTenantBySlug({ prisma, slug: params.tenant });
  if (!tenant) notFound();

  return (
    <WelcomeScreen
      tenant={{
        slug: tenant.slug,
        name: tenant.name,
        industry: tenant.industry,
        theme: tenant.theme,
      }}
      redirectTo={`/t/${tenant.slug}/pos`}
    />
  );
}

