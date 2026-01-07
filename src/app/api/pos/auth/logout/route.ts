import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCookieDomainForTenantRoot } from "@/lib/cookies";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("pos-auth-token")?.value;

    if (token) {
      await prisma.posSession.deleteMany({ where: { token } });
    }

    const response = NextResponse.json({ success: true }, { status: 200 });

    const cookieDomain = getCookieDomainForTenantRoot(request);

    response.cookies.set("pos-auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    return response;
  } catch (error) {
    console.error("POS logout error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
