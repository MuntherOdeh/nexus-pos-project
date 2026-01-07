import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";
import { PosLoginForm } from "@/components/pos/PosLoginForm";

export default async function PosLoginPage({ params }: { params: { tenant: string } }) {
  const tenant = await getTenantBySlug({ prisma, slug: params.tenant });
  if (!tenant) notFound();

  return <PosLoginForm tenant={{ slug: tenant.slug, name: tenant.name }} />;
}

