import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";

export default async function TenantRootPage({ params }: { params: { tenant: string } }) {
  const tenant = await getTenantBySlug({ prisma, slug: params.tenant });
  if (!tenant) notFound();

  redirect(`/t/${tenant.slug}/pos`);
}

