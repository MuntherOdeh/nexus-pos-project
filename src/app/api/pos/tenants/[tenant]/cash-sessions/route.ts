import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const openCashSessionSchema = z.object({
  openingCashCents: z.number().int().min(0),
  notes: z.string().max(500).optional().nullable(),
});

const closeCashSessionSchema = z.object({
  closingCashCents: z.number().int().min(0),
  closingNotes: z.string().max(500).optional().nullable(),
});

export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const status = request.nextUrl.searchParams.get("status")?.toUpperCase() as "OPEN" | "CLOSED" | undefined;

  const where = {
    tenantId: auth.ctx.tenantId,
    ...(status === "OPEN" || status === "CLOSED" ? { status } : {}),
  };

  const sessions = await prisma.posCashSession.findMany({
    where,
    orderBy: { openedAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      openingCashCents: true,
      closingCashCents: true,
      expectedCashCents: true,
      cashDifferenceCents: true,
      currency: true,
      notes: true,
      closingNotes: true,
      openedAt: true,
      closedAt: true,
      openedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      closedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Get current open session for this user
  const currentSession = await prisma.posCashSession.findFirst({
    where: {
      tenantId: auth.ctx.tenantId,
      status: "OPEN",
    },
    orderBy: { openedAt: "desc" },
    select: {
      id: true,
      status: true,
      openingCashCents: true,
      currency: true,
      notes: true,
      openedAt: true,
      openedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  return NextResponse.json({ success: true, sessions, currentSession });
}

export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Check if there's already an open session
  const existingOpen = await prisma.posCashSession.findFirst({
    where: {
      tenantId: auth.ctx.tenantId,
      status: "OPEN",
    },
  });

  if (existingOpen) {
    return NextResponse.json(
      { success: false, error: "There is already an open cash session. Please close it before opening a new one." },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = openCashSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const session = await prisma.posCashSession.create({
    data: {
      tenantId: auth.ctx.tenantId,
      openedById: auth.ctx.user.id,
      status: "OPEN",
      openingCashCents: parsed.data.openingCashCents,
      currency: auth.ctx.tenantCurrency,
      notes: parsed.data.notes?.trim() || null,
    },
    select: {
      id: true,
      status: true,
      openingCashCents: true,
      currency: true,
      notes: true,
      openedAt: true,
      openedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  return NextResponse.json({ success: true, session });
}
