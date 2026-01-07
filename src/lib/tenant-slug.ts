export const MAX_TENANT_SLUG_LENGTH = 63;

export function slugifyCompanyName(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ");

  const slug = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  return slug.slice(0, MAX_TENANT_SLUG_LENGTH).replace(/-+$/, "");
}

export function isValidTenantSlug(slug: string): boolean {
  if (!slug) return false;
  if (slug.length > MAX_TENANT_SLUG_LENGTH) return false;
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug);
}

export function buildTenantHost(slug: string, rootDomain: string): string {
  return `${slug}.${rootDomain}`;
}

export function getPublicTenantRootDomain(): string {
  return process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN || "nexuspoint.com";
}

