import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const startPrepSchema = z.object({
  orderId: z.string().min(1),
});

const completePrepSchema = z.object({
  prepTimeLogId: z.string().min(1),
});

// GET - Get prep time statistics
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const startDate = request.nextUrl.searchParams.get("startDate")?.trim() || null;
  const endDate = request.nextUrl.searchParams.get("endDate")?.trim() || null;

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
    completedAt: { not: null },
  };

  if (startDate) {
    where.sentAt = { ...((where.sentAt as object) || {}), gte: new Date(startDate) };
  }
  if (endDate) {
    where.sentAt = { ...((where.sentAt as object) || {}), lte: new Date(endDate) };
  }

  const prepTimeLogs = await prisma.prepTimeLog.findMany({
    where,
    orderBy: { sentAt: "desc" },
    take: 100,
    select: {
      id: true,
      orderId: true,
      order: { select: { orderNumber: true } },
      sentAt: true,
      startedAt: true,
      completedAt: true,
      prepTimeSeconds: true,
      itemCount: true,
    },
  });

  // Calculate statistics
  const completedLogs = prepTimeLogs.filter((l) => l.prepTimeSeconds !== null);
  const prepTimes = completedLogs.map((l) => l.prepTimeSeconds!);

  const avgPrepTimeSeconds =
    prepTimes.length > 0 ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length) : 0;
  const minPrepTimeSeconds = prepTimes.length > 0 ? Math.min(...prepTimes) : 0;
  const maxPrepTimeSeconds = prepTimes.length > 0 ? Math.max(...prepTimes) : 0;

  // Orders currently in progress
  const inProgress = await prisma.prepTimeLog.findMany({
    where: {
      tenantId: auth.ctx.tenantId,
      startedAt: { not: null },
      completedAt: null,
    },
    select: {
      id: true,
      orderId: true,
      order: { select: { orderNumber: true } },
      sentAt: true,
      startedAt: true,
      itemCount: true,
    },
  });

  return NextResponse.json({
    success: true,
    statistics: {
      totalOrders: completedLogs.length,
      avgPrepTimeSeconds,
      minPrepTimeSeconds,
      maxPrepTimeSeconds,
      avgPrepTimeMinutes: Math.round(avgPrepTimeSeconds / 60 * 10) / 10,
    },
    inProgress,
    recentLogs: prepTimeLogs.slice(0, 20),
  });
}

// POST - Start prep (when kitchen begins working on order)
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const action = body.action as string;

  if (action === "start") {
    const parsed = startPrepSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Find existing prep log for this order
    const existingLog = await prisma.prepTimeLog.findFirst({
      where: {
        orderId: parsed.data.orderId,
        tenantId: auth.ctx.tenantId,
        completedAt: null,
      },
    });

    if (existingLog) {
      if (existingLog.startedAt) {
        return NextResponse.json(
          { success: false, error: "Prep already started for this order" },
          { status: 400 }
        );
      }

      // Update existing log
      const log = await prisma.prepTimeLog.update({
        where: { id: existingLog.id },
        data: { startedAt: new Date() },
        select: {
          id: true,
          orderId: true,
          sentAt: true,
          startedAt: true,
        },
      });

      return NextResponse.json({ success: true, prepTimeLog: log });
    }

    // No log exists, create one (shouldn't normally happen, but handle it)
    const order = await prisma.posOrder.findFirst({
      where: {
        id: parsed.data.orderId,
        tenantId: auth.ctx.tenantId,
      },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const log = await prisma.prepTimeLog.create({
      data: {
        tenantId: auth.ctx.tenantId,
        orderId: parsed.data.orderId,
        sentAt: order.sentToKitchenAt || new Date(),
        startedAt: new Date(),
        itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
      },
      select: {
        id: true,
        orderId: true,
        sentAt: true,
        startedAt: true,
      },
    });

    return NextResponse.json({ success: true, prepTimeLog: log });
  }

  if (action === "complete") {
    const parsed = completePrepSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const log = await prisma.prepTimeLog.findFirst({
      where: {
        id: parsed.data.prepTimeLogId,
        tenantId: auth.ctx.tenantId,
      },
    });

    if (!log) {
      return NextResponse.json({ success: false, error: "Prep log not found" }, { status: 404 });
    }

    if (log.completedAt) {
      return NextResponse.json(
        { success: false, error: "Prep already completed" },
        { status: 400 }
      );
    }

    const completedAt = new Date();
    const prepTimeSeconds = log.startedAt
      ? Math.round((completedAt.getTime() - log.startedAt.getTime()) / 1000)
      : Math.round((completedAt.getTime() - log.sentAt.getTime()) / 1000);

    const updatedLog = await prisma.prepTimeLog.update({
      where: { id: parsed.data.prepTimeLogId },
      data: {
        completedAt,
        prepTimeSeconds,
      },
      select: {
        id: true,
        orderId: true,
        order: { select: { orderNumber: true } },
        sentAt: true,
        startedAt: true,
        completedAt: true,
        prepTimeSeconds: true,
        itemCount: true,
      },
    });

    return NextResponse.json({ success: true, prepTimeLog: updatedLog });
  }

  return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
}
