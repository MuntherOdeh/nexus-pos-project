import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenants";
import { getTenantSlugFromHost } from "@/lib/tenant-slug";
import { PosShell } from "@/components/pos/PosShell";
import { getPosThemeClass } from "@/lib/pos/theme";

// Helper to check if error is a Next.js navigation error (redirect/notFound)
function isNextNavigationError(error: unknown): boolean {
  if (error instanceof Error) {
    const digest = (error as Error & { digest?: string }).digest;
    return digest?.startsWith("NEXT_REDIRECT") || digest?.startsWith("NEXT_NOT_FOUND") || false;
  }
  return false;
}

export default async function TenantPosAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  try {
    console.log("[POS Layout] Starting for tenant:", params.tenant);

    const tenant = await getTenantBySlug({ prisma, slug: params.tenant });
    if (!tenant) {
      console.log("[POS Layout] Tenant not found:", params.tenant);
      notFound();
    }
    console.log("[POS Layout] Tenant found:", tenant.slug, tenant.id);

    const token = cookies().get("pos-auth-token")?.value;
    if (!token) {
      console.log("[POS Layout] No auth token, redirecting to login");
      const hostTenant = getTenantSlugFromHost(headers().get("host"));
      redirect(hostTenant ? "/login" : `/t/${tenant.slug}/pos/login`);
    }
    console.log("[POS Layout] Token found, looking up session");

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
    console.log("[POS Layout] Session lookup result:", session ? "found" : "not found");

    if (
      !session ||
      !session.tenantUser ||
      session.expiresAt <= new Date() ||
      !session.tenantUser.isActive ||
      session.tenantUser.tenantId !== tenant.id
    ) {
      console.log("[POS Layout] Session invalid, reason:", {
        noSession: !session,
        noTenantUser: !session?.tenantUser,
        expired: session?.expiresAt ? session.expiresAt <= new Date() : "N/A",
        inactive: session?.tenantUser ? !session.tenantUser.isActive : "N/A",
        wrongTenant: session?.tenantUser ? session.tenantUser.tenantId !== tenant.id : "N/A",
      });
      const hostTenant = getTenantSlugFromHost(headers().get("host"));
      redirect(hostTenant ? "/login" : `/t/${tenant.slug}/pos/login`);
    }
    console.log("[POS Layout] Session valid for user:", session.tenantUser.email);

    // Apply theme class server-side to prevent flash on page load
    const initialThemeClass = getPosThemeClass(tenant.theme);
    console.log("[POS Layout] Rendering with theme:", initialThemeClass);

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
  } catch (error) {
    // Don't log or interfere with Next.js navigation errors
    if (isNextNavigationError(error)) {
      throw error;
    }
    // Log actual errors for debugging in Vercel
    console.error("[POS Layout] ERROR:", error);
    console.error("[POS Layout] Error name:", (error as Error)?.name);
    console.error("[POS Layout] Error message:", (error as Error)?.message);
    console.error("[POS Layout] Error stack:", (error as Error)?.stack);
    throw error;
  }
}

