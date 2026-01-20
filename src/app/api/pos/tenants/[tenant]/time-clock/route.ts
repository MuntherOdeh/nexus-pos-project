import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const clockInSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
});

const clockOutSchema = z.object({
  breakMinutes: z.number().int().min(0).max(480).optional(),
  notes: z.string().max(500).optional().nullable(),
});

// GET - Get time clock entries (current user or all if manager/admin)
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const employeeId = request.nextUrl.searchParams.get("employeeId")?.trim() || null;
  const status = request.nextUrl.searchParams.get("status")?.trim().toUpperCase() || null;
  const startDate = request.nextUrl.searchParams.get("startDate")?.trim() || null;
  const endDate = request.nextUrl.searchParams.get("endDate")?.trim() || null;

  // Only managers/admins can view other employees' time clock entries
  const canViewAll = ["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role);
  const targetEmployeeId = employeeId && canViewAll ? employeeId : auth.ctx.user.id;

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
  };

  // If not viewing all, filter by employee
  if (!canViewAll || employeeId) {
    where.employeeId = targetEmployeeId;
  }

  if (status && ["CLOCKED_IN", "ON_BREAK", "CLOCKED_OUT"].includes(status)) {
    where.status = status;
  }

  if (startDate) {
    where.clockInAt = { ...((where.clockInAt as object) || {}), gte: new Date(startDate) };
  }
  if (endDate) {
    where.clockInAt = { ...((where.clockInAt as object) || {}), lte: new Date(endDate) };
  }

  const entries = await prisma.timeClockEntry.findMany({
    where,
    orderBy: { clockInAt: "desc" },
    take: 100,
    select: {
      id: true,
      employeeId: true,
      employee: { select: { id: true, firstName: true, lastName: true, role: true } },
      clockInAt: true,
      clockOutAt: true,
      breakMinutes: true,
      notes: true,
      status: true,
      createdAt: true,
    },
  });

  // Calculate hours worked
  const entriesWithHours = entries.map((entry) => {
    let hoursWorked = 0;
    if (entry.clockOutAt) {
      const ms = entry.clockOutAt.getTime() - entry.clockInAt.getTime();
      hoursWorked = Math.max(0, (ms / 1000 / 60 - entry.breakMinutes) / 60);
    } else if (entry.status !== "CLOCKED_OUT") {
      const ms = Date.now() - entry.clockInAt.getTime();
      hoursWorked = Math.max(0, (ms / 1000 / 60 - entry.breakMinutes) / 60);
    }
    return { ...entry, hoursWorked: Math.round(hoursWorked * 100) / 100 };
  });

  return NextResponse.json({ success: true, entries: entriesWithHours });
}

// POST - Clock in
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = clockInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Check if already clocked in
  const existingEntry = await prisma.timeClockEntry.findFirst({
    where: {
      tenantId: auth.ctx.tenantId,
      employeeId: auth.ctx.user.id,
      status: { in: ["CLOCKED_IN", "ON_BREAK"] },
    },
  });

  if (existingEntry) {
    return NextResponse.json(
      { success: false, error: "Already clocked in. Please clock out first." },
      { status: 400 }
    );
  }

  const entry = await prisma.timeClockEntry.create({
    data: {
      tenantId: auth.ctx.tenantId,
      employeeId: auth.ctx.user.id,
      clockInAt: new Date(),
      notes: parsed.data.notes?.trim() || null,
      status: "CLOCKED_IN",
    },
    select: {
      id: true,
      employeeId: true,
      employee: { select: { id: true, firstName: true, lastName: true } },
      clockInAt: true,
      clockOutAt: true,
      breakMinutes: true,
      notes: true,
      status: true,
    },
  });

  return NextResponse.json({ success: true, entry });
}

// PATCH - Clock out or take break
export async function PATCH(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const action = body.action as string;

  // Find active entry
  const activeEntry = await prisma.timeClockEntry.findFirst({
    where: {
      tenantId: auth.ctx.tenantId,
      employeeId: auth.ctx.user.id,
      status: { in: ["CLOCKED_IN", "ON_BREAK"] },
    },
  });

  if (!activeEntry) {
    return NextResponse.json(
      { success: false, error: "Not clocked in. Please clock in first." },
      { status: 400 }
    );
  }

  if (action === "clock_out") {
    const parsed = clockOutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const entry = await prisma.timeClockEntry.update({
      where: { id: activeEntry.id },
      data: {
        clockOutAt: new Date(),
        breakMinutes: parsed.data.breakMinutes ?? activeEntry.breakMinutes,
        notes: parsed.data.notes?.trim() || activeEntry.notes,
        status: "CLOCKED_OUT",
      },
      select: {
        id: true,
        employeeId: true,
        employee: { select: { id: true, firstName: true, lastName: true } },
        clockInAt: true,
        clockOutAt: true,
        breakMinutes: true,
        notes: true,
        status: true,
      },
    });

    // Calculate hours worked
    const ms = entry.clockOutAt!.getTime() - entry.clockInAt.getTime();
    const hoursWorked = Math.max(0, (ms / 1000 / 60 - entry.breakMinutes) / 60);

    return NextResponse.json({
      success: true,
      entry: { ...entry, hoursWorked: Math.round(hoursWorked * 100) / 100 },
    });
  }

  if (action === "start_break") {
    if (activeEntry.status === "ON_BREAK") {
      return NextResponse.json({ success: false, error: "Already on break" }, { status: 400 });
    }

    const entry = await prisma.timeClockEntry.update({
      where: { id: activeEntry.id },
      data: { status: "ON_BREAK" },
      select: {
        id: true,
        employeeId: true,
        clockInAt: true,
        status: true,
      },
    });

    return NextResponse.json({ success: true, entry, breakStartedAt: new Date() });
  }

  if (action === "end_break") {
    if (activeEntry.status !== "ON_BREAK") {
      return NextResponse.json({ success: false, error: "Not on break" }, { status: 400 });
    }

    // Add break time (simplified - in production you'd track break start time)
    const breakMinutes = body.breakMinutes as number;
    const entry = await prisma.timeClockEntry.update({
      where: { id: activeEntry.id },
      data: {
        status: "CLOCKED_IN",
        breakMinutes: activeEntry.breakMinutes + (breakMinutes || 0),
      },
      select: {
        id: true,
        employeeId: true,
        clockInAt: true,
        breakMinutes: true,
        status: true,
      },
    });

    return NextResponse.json({ success: true, entry });
  }

  return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
}
