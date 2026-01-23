import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";
import { getTenantSlugFromHost } from "@/lib/tenant-slug";
import { PosShell } from "@/components/pos/PosShell";
import { getPosThemeClass } from "@/lib/pos/theme";

export default async function TenantPosAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  const tenant = await getTenantBySlug({ prisma, slug: params.tenant });
  if (!tenant) notFound();

  const token = cookies().get("pos-auth-token")?.value;
  if (!token) {
    const hostTenant = getTenantSlugFromHost(headers().get("host"));
    redirect(hostTenant ? "/login" : `/t/${tenant.slug}/pos/login`);
  }

  const session = await prisma.posSession.findUnique({
    where: { token },
    include: {
      tenantUser: {
        select: {
          id: true,
          tenantId: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  if (
    !session ||
    !session.tenantUser ||
    session.expiresAt <= new Date() ||
    !session.tenantUser.isActive ||
    session.tenantUser.tenantId !== tenant.id
  ) {
    const hostTenant = getTenantSlugFromHost(headers().get("host"));
    redirect(hostTenant ? "/login" : `/t/${tenant.slug}/pos/login`);
  }

  // Apply theme class server-side to prevent flash on page load
  const initialThemeClass = getPosThemeClass(tenant.theme);

  return (
    <div className={`pos-theme ${initialThemeClass}`} data-pos-theme-wrapper>
      <PosShell
        tenant={{
          slug: tenant.slug,
          name: tenant.name,
          industry: tenant.industry,
          theme: tenant.theme,
        }}
        user={{
          id: session.tenantUser.id,
          email: session.tenantUser.email,
          firstName: session.tenantUser.firstName,
          lastName: session.tenantUser.lastName,
          role: session.tenantUser.role,
        }}
        initialThemeClass={initialThemeClass}
      >
        {children}
      </PosShell>
    </div>
  );
}

