import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { demoSignupSchema } from "@/lib/validations";
import { findAvailableTenantSlug } from "@/lib/tenants";
import { seedDemoTenantData } from "@/lib/pos/demo-seed";
import { signPosToken } from "@/lib/pos/jwt";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getCookieDomainForTenantRoot } from "@/lib/cookies";

export const dynamic = "force-dynamic";

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    const { success, remaining } = await limiter.check(ip, 5);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": remaining.toString(),
            "Retry-After": "60",
          },
        }
      );
    }

    const body = await request.json();
    const validationResult = demoSignupSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      companyName,
      email,
      phone,
      country,
      language,
      companySize,
      industry,
      password,
      desiredSlug,
    } = validationResult.data;

    const slugResult = await findAvailableTenantSlug({
      prisma,
      companyName,
      desiredSlug,
    });

    if (!slugResult.suggestedSlug) {
      return NextResponse.json(
        { success: false, error: "Unable to generate a valid demo link. Please adjust your company name." },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: companyName.trim(),
        slug: slugResult.suggestedSlug,
        country: country.trim(),
        language: language.trim(),
        companySize,
        industry,
        ownerFirstName: firstName.trim(),
        ownerLastName: lastName.trim(),
        ownerEmail: email.trim().toLowerCase(),
        ownerPhone: phone ? phone.trim() : null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        industry: true,
        theme: true,
        currency: true,
      },
    });

    const passwordHash = await bcrypt.hash(password, 12);

    const tenantUser = await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone ? phone.trim() : null,
        passwordHash,
        role: "OWNER",
      },
      select: { id: true, role: true },
    });

    await seedDemoTenantData({
      prisma,
      tenantId: tenant.id,
      industry: tenant.industry,
      currency: tenant.currency,
    });

    const token = await signPosToken({
      payload: {
        tenantSlug: tenant.slug,
        tenantUserId: tenantUser.id,
        role: tenantUser.role,
      },
      expiresIn: "7d",
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.posSession.create({
      data: {
        tenantUserId: tenantUser.id,
        token,
        expiresAt,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || "Unknown",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "DEMO_SIGNUP",
        entityType: "Tenant",
        entityId: tenant.id,
        details: JSON.stringify({
          tenantSlug: tenant.slug,
          ownerEmail: email,
          industry,
          companySize,
        }),
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        tenant,
        redirectUrl: `/t/${tenant.slug}/welcome`,
        isSlugAdjusted: !slugResult.isBaseAvailable,
        baseSlug: slugResult.baseSlug,
      },
      { status: 201 }
    );

    const cookieDomain = getCookieDomainForTenantRoot(request);

    response.cookies.set("pos-auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    const looksLikeDatabaseIssue =
      message.includes("DATABASE_URL") ||
      message.includes("Can't reach database server") ||
      message.includes("P1001") ||
      message.includes("P1008") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ENOTFOUND") ||
      message.includes("ETIMEDOUT");

    const userFacingError = looksLikeDatabaseIssue
      ? "Database connection failed. On Vercel you must use a hosted Postgres DATABASE_URL (localhost won't work)."
      : "An error occurred. Please try again later.";

    console.error(`[demo-signup:${requestId}]`, error);
    return NextResponse.json(
      { success: false, error: userFacingError, requestId },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
