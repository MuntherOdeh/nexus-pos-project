import type { PrismaClient, Tenant } from "@prisma/client";
import { isValidTenantSlug, MAX_TENANT_SLUG_LENGTH, slugifyCompanyName } from "@/lib/tenant-slug";

export async function findAvailableTenantSlug(params: {
  prisma: PrismaClient;
  companyName?: string;
  desiredSlug?: string;
}): Promise<{ baseSlug: string; suggestedSlug: string; isBaseAvailable: boolean }> {
  const { prisma, companyName, desiredSlug } = params;

  const baseSlug = slugifyCompanyName(desiredSlug || companyName || "");
  if (!isValidTenantSlug(baseSlug)) {
    return { baseSlug, suggestedSlug: baseSlug, isBaseAvailable: false };
  }

  const existing = await prisma.tenant.findUnique({ where: { slug: baseSlug }, select: { id: true } });
  if (!existing) {
    return { baseSlug, suggestedSlug: baseSlug, isBaseAvailable: true };
  }

  for (let suffix = 2; suffix <= 50; suffix += 1) {
    const suffixText = `-${suffix}`;
    const trimmedBase = baseSlug.slice(0, Math.max(1, MAX_TENANT_SLUG_LENGTH - suffixText.length));
    const candidate = `${trimmedBase}${suffixText}`;
    const hit = await prisma.tenant.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!hit) {
      return { baseSlug, suggestedSlug: candidate, isBaseAvailable: false };
    }
  }

  const fallback = `${baseSlug.slice(0, 50)}-${Date.now().toString(36).slice(-4)}`.slice(0, MAX_TENANT_SLUG_LENGTH);
  return { baseSlug, suggestedSlug: fallback, isBaseAvailable: false };
}

export async function getTenantBySlug(params: {
  prisma: PrismaClient;
  slug: string;
}): Promise<Pick<Tenant, "id" | "name" | "slug" | "industry" | "theme" | "currency" | "country" | "language"> | null> {
  const { prisma, slug } = params;
  if (!isValidTenantSlug(slug)) return null;

  return prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      industry: true,
      theme: true,
      currency: true,
      country: true,
      language: true,
    },
  });
}

