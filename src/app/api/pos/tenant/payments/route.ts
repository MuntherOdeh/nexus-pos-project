import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isValidTenantSlug } from "@/lib/tenant-slug";

export const dynamic = "force-dynamic";

const paymentsSchema = z.object({
  tenantSlug: z.string(),
  provider: z.enum(["BANK", "PAYPAL", "CARD"]),
  action: z.enum(["CONNECT", "DISCONNECT", "TOGGLE"]).default("TOGGLE"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = paymentsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { tenantSlug, provider, action } = parsed.data;
    if (!isValidTenantSlug(tenantSlug)) {
      return NextResponse.json({ success: false, error: "Invalid tenant slug" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug }, select: { id: true } });
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    const existing = await prisma.paymentConnection.findUnique({
      where: { tenantId_provider: { tenantId: tenant.id, provider } },
    });

    const currentStatus = existing?.status ?? "DISCONNECTED";
    const nextStatus =
      action === "CONNECT"
        ? "CONNECTED"
        : action === "DISCONNECT"
        ? "DISCONNECTED"
        : currentStatus === "CONNECTED"
        ? "DISCONNECTED"
        : "CONNECTED";

    const connection = await prisma.paymentConnection.upsert({
      where: { tenantId_provider: { tenantId: tenant.id, provider } },
      update: {
        status: nextStatus,
        lastConnectedAt: nextStatus === "CONNECTED" ? new Date() : null,
      },
      create: {
        tenantId: tenant.id,
        provider,
        status: nextStatus,
        displayName:
          provider === "BANK"
            ? "Bank Transfer"
            : provider === "PAYPAL"
            ? "PayPal"
            : "Credit / Debit Cards",
        lastConnectedAt: nextStatus === "CONNECTED" ? new Date() : null,
      },
      select: {
        provider: true,
        status: true,
        displayName: true,
        lastConnectedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      connection: {
        ...connection,
        lastConnectedAt: connection.lastConnectedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("POS payments error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
