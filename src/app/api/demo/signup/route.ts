import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { demoSignupSchema } from "@/lib/validations";
import { findAvailableTenantSlug } from "@/lib/tenants";
import { seedDemoTenantData } from "@/lib/pos/demo-seed";

export const dynamic = "force-dynamic";

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
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

    await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone ? phone.trim() : null,
        role: "OWNER",
      },
    });

    await seedDemoTenantData({
      prisma,
      tenantId: tenant.id,
      industry: tenant.industry,
      currency: tenant.currency,
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

    return NextResponse.json(
      {
        success: true,
        tenant,
        redirectUrl: `/t/${tenant.slug}/welcome`,
        isSlugAdjusted: !slugResult.isBaseAvailable,
        baseSlug: slugResult.baseSlug,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Demo signup error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
