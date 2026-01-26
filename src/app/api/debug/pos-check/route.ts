import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tenantSlug = url.searchParams.get("tenant") || "refill";

  try {
    // Check tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true, name: true, theme: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found", slug: tenantSlug });
    }

    // Check auth token
    const token = cookies().get("pos-auth-token")?.value;
    if (!token) {
      return NextResponse.json({
        tenant,
        auth: "No token found",
        session: null,
      });
    }

    // Check session
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

    if (!session) {
      return NextResponse.json({
        tenant,
        auth: "Token found but session not found",
        token: token.slice(0, 10) + "...",
      });
    }

    // Check session validity
    const now = new Date();
    const isExpired = session.expiresAt <= now;
    const isActive = session.tenantUser?.isActive ?? false;
    const isSameTenant = session.tenantUser?.tenantId === tenant.id;

    return NextResponse.json({
      tenant,
      auth: "Token and session found",
      session: {
        expiresAt: session.expiresAt.toISOString(),
        isExpired,
        user: session.tenantUser ? {
          id: session.tenantUser.id,
          email: session.tenantUser.email,
          isActive,
          tenantId: session.tenantUser.tenantId,
          isSameTenant,
        } : null,
      },
      valid: !isExpired && isActive && isSameTenant,
    });
  } catch (error) {
    return NextResponse.json({
      error: "Error checking",
      message: (error as Error).message,
      stack: (error as Error).stack,
    }, { status: 500 });
  }
}
