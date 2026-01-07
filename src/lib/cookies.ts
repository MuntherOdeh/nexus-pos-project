import type { NextRequest } from "next/server";

function normalizeEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function getCookieDomainForTenantRoot(request: NextRequest): string | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;

  const rootDomain =
    normalizeEnvValue(process.env.TENANT_ROOT_DOMAIN) ||
    normalizeEnvValue(process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN);
  if (!rootDomain || rootDomain.includes("localhost")) return undefined;

  const host = request.headers.get("host");
  if (!host) return undefined;

  const hostname = host.split(":")[0].toLowerCase();
  const root = rootDomain.toLowerCase();

  if (hostname === root || hostname.endsWith(`.${root}`)) {
    return `.${root}`;
  }

  return undefined;
}

