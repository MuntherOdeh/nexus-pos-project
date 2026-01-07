import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { isValidTenantSlug } from "@/lib/tenant-slug";
import { signPosToken } from "@/lib/pos/jwt";

export const dynamic = "force-dynamic";

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

const posLoginSchema = z.object({
  tenantSlug: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    const { success, remaining } = await limiter.check(ip, 10);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Remaining": remaining.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const parsed = posLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 400 });
    }

    const tenantSlug = parsed.data.tenantSlug.trim().toLowerCase();
    if (!isValidTenantSlug(tenantSlug)) {
      return NextResponse.json({ success: false, error: "Invalid tenant" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true, name: true },
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const user = await prisma.tenantUser.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        passwordHash: true,
      },
    });

    if (!user || !user.isActive || !user.passwordHash) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signPosToken({
      payload: {
        tenantSlug: tenant.slug,
        tenantUserId: user.id,
        role: user.role,
      },
      expiresIn: "24h",
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.posSession.create({
      data: {
        tenantUserId: user.id,
        token,
        expiresAt,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || "Unknown",
      },
    });

    await prisma.tenantUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const response = NextResponse.json(
      {
        success: true,
        tenant: { slug: tenant.slug, name: tenant.name },
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { status: 200 }
    );

    const rootDomain = process.env.TENANT_ROOT_DOMAIN || process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
    const cookieDomain =
      process.env.NODE_ENV === "production" && rootDomain && !rootDomain.includes("localhost")
        ? `.${rootDomain}`
        : undefined;

    response.cookies.set("pos-auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    return response;
  } catch (error) {
    console.error("POS login error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}

