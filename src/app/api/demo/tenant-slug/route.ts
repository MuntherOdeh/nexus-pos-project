import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { findAvailableTenantSlug } from "@/lib/tenants";

export const dynamic = "force-dynamic";

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 1000,
});

export async function GET(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    const { success, remaining } = await limiter.check(ip, 30);
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

    const companyName = request.nextUrl.searchParams.get("companyName") || "";
    const desiredSlug = request.nextUrl.searchParams.get("slug") || undefined;

    const result = await findAvailableTenantSlug({
      prisma,
      companyName,
      desiredSlug,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Tenant slug error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
