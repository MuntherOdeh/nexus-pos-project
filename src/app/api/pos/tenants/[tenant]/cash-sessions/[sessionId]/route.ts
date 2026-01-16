import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const closeCashSessionSchema = z.object({
  closingCashCents: z.number().int().min(0),
  closingNotes: z.string().max(500).optional().nullable(),
});

export async function GET(
  request: NextRequest,
  context: { params: { tenant: string; sessionId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const session = await prisma.posCashSession.findFirst({
    where: {
      id: context.params.sessionId,
      tenantId: auth.ctx.tenantId,
    },
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

  if (!session) {
    return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, session });
}

export async function PATCH(
  request: NextRequest,
  context: { params: { tenant: string; sessionId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const session = await prisma.posCashSession.findFirst({
    where: {
      id: context.params.sessionId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!session) {
    return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
  }

  if (session.status === "CLOSED") {
    return NextResponse.json({ success: false, error: "Session is already closed" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = closeCashSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Calculate expected cash based on cash payments during the session
  const cashPayments = await prisma.posPayment.aggregate({
    where: {
      tenantId: auth.ctx.tenantId,
      provider: "CASH",
      status: "CAPTURED",
      createdAt: {
        gte: session.openedAt,
      },
    },
    _sum: {
      amountCents: true,
    },
  });

  const expectedCashCents = session.openingCashCents + (cashPayments._sum.amountCents || 0);
  const cashDifferenceCents = parsed.data.closingCashCents - expectedCashCents;

  const updatedSession = await prisma.posCashSession.update({
    where: { id: context.params.sessionId },
    data: {
      status: "CLOSED",
      closingCashCents: parsed.data.closingCashCents,
      expectedCashCents,
      cashDifferenceCents,
      closingNotes: parsed.data.closingNotes?.trim() || null,
      closedById: auth.ctx.user.id,
      closedAt: new Date(),
    },
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

  return NextResponse.json({ success: true, session: updatedSession });
}
