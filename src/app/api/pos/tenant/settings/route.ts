import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/utils";
import { isValidTenantSlug } from "@/lib/tenant-slug";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  tenantSlug: z.string(),
  theme: z.enum(["LIGHT", "DARK", "EMERALD", "MIDNIGHT", "OCEAN", "SUNSET", "NEON", "ROYAL"]).optional(),
  industry: z.enum(["RESTAURANT", "CAFE", "BAKERY", "RETAIL", "OTHER"]).optional(),
});

// Map new theme names to database enum values
function mapThemeToDb(theme: string): "EMERALD" | "MIDNIGHT" | "OCEAN" | "SUNSET" | "NEON" | "ROYAL" {
  if (theme === "LIGHT") return "EMERALD";
  if (theme === "DARK") return "MIDNIGHT";
  return theme as "EMERALD" | "MIDNIGHT" | "OCEAN" | "SUNSET" | "NEON" | "ROYAL";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { tenantSlug, theme, industry } = parsed.data;
    if (!isValidTenantSlug(tenantSlug)) {
      return NextResponse.json({ success: false, error: "Invalid tenant slug" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        ...(theme ? { theme: mapThemeToDb(theme) } : {}),
        ...(industry ? { industry } : {}),
      },
      select: {
        slug: true,
        theme: true,
        industry: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "POS_TENANT_SETTINGS_UPDATE",
        entityType: "Tenant",
        entityId: tenant.id,
        details: JSON.stringify({
          theme: theme || null,
          industry: industry || null,
        }),
        ipAddress: sanitizeInput(request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous"),
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json({ success: true, tenant: updated });
  } catch (error) {
    console.error("POS tenant settings error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
