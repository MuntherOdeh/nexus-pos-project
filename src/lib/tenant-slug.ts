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

export function getTenantRootDomain(): string {
  return process.env.TENANT_ROOT_DOMAIN || process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN || "nexuspoint.com";
}

export function getPublicTenantRootDomain(): string {
  return process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN || "nexuspoint.com";
}

export function getTenantSlugFromHost(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  const rootDomain = getTenantRootDomain().toLowerCase();

  if (hostname === rootDomain || hostname === `www.${rootDomain}`) return null;

  if (hostname.endsWith(`.${rootDomain}`)) {
    const subdomain = hostname.slice(0, -1 * (`.${rootDomain}`.length));
    if (isValidTenantSlug(subdomain)) return subdomain;
  }

  if (hostname.endsWith(".localhost")) {
    const subdomain = hostname.slice(0, -".localhost".length);
    if (isValidTenantSlug(subdomain)) return subdomain;
  }

  return null;
}
