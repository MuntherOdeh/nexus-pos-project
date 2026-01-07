import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidTenantSlug } from "@/lib/tenant-slug";

export type PosAuthContext = {
  tenantId: string;
  tenantSlug: string;
  tenantCurrency: string;
  user: {
    id: string;
    role: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

export async function requirePosAuth(
  request: NextRequest,
  tenantSlugRaw: string
): Promise<
  | { ok: true; ctx: PosAuthContext }
  | { ok: false; status: number; error: string }
> {
  const tenantSlug = tenantSlugRaw.trim().toLowerCase();
  if (!isValidTenantSlug(tenantSlug)) {
    return { ok: false, status: 400, error: "Invalid tenant" };
  }

  const token = request.cookies.get("pos-auth-token")?.value;
  if (!token) {
    return { ok: false, status: 401, error: "Authentication required" };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true, currency: true },
  });

  if (!tenant) {
    return { ok: false, status: 404, error: "Tenant not found" };
  }

  const session = await prisma.posSession.findUnique({
    where: { token },
    include: {
      tenantUser: {
        select: {
          id: true,
          tenantId: true,
          role: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    return { ok: false, status: 401, error: "Invalid or expired session" };
  }

  if (!session.tenantUser.isActive) {
    return { ok: false, status: 403, error: "Account is disabled" };
  }

  if (session.tenantUser.tenantId !== tenant.id) {
    return { ok: false, status: 403, error: "Tenant mismatch" };
  }

  return {
    ok: true,
    ctx: {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantCurrency: tenant.currency,
      user: {
        id: session.tenantUser.id,
        role: session.tenantUser.role,
        email: session.tenantUser.email,
        firstName: session.tenantUser.firstName,
        lastName: session.tenantUser.lastName,
      },
    },
  };
}
