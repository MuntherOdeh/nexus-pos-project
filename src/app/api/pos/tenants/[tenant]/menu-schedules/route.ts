import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const createMenuScheduleSchema = z.object({
  name: z.string().min(1).max(100),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:MM"),
  daysOfWeek: z.array(z.number().int().min(0).max(6)), // 0 = Sunday
  priceAdjustment: z.number().int(), // Basis points (negative for discount)
  categoryIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// GET - List menu schedules (happy hours, etc.)
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const activeOnly = request.nextUrl.searchParams.get("activeOnly") === "true";
  const activeNow = request.nextUrl.searchParams.get("activeNow") === "true";

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
  };

  if (activeOnly) {
    where.isActive = true;
  }

  const schedules = await prisma.menuSchedule.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      startTime: true,
      endTime: true,
      daysOfWeek: true,
      priceAdjustment: true,
      categoryIds: true,
      productIds: true,
      isActive: true,
      createdAt: true,
    },
  });

  // Filter by currently active if requested
  let filteredSchedules = schedules;
  if (activeNow) {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    filteredSchedules = schedules.filter((s) => {
      if (!s.isActive) return false;
      if (!s.daysOfWeek.includes(currentDay)) return false;

      // Check time range
      if (s.startTime <= s.endTime) {
        // Normal range (e.g., 14:00 to 18:00)
        return currentTime >= s.startTime && currentTime <= s.endTime;
      } else {
        // Overnight range (e.g., 22:00 to 02:00)
        return currentTime >= s.startTime || currentTime <= s.endTime;
      }
    });
  }

  return NextResponse.json({ success: true, schedules: filteredSchedules });
}

// POST - Create menu schedule
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createMenuScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const schedule = await prisma.menuSchedule.create({
    data: {
      tenantId: auth.ctx.tenantId,
      name: parsed.data.name,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      daysOfWeek: parsed.data.daysOfWeek,
      priceAdjustment: parsed.data.priceAdjustment,
      categoryIds: parsed.data.categoryIds || [],
      productIds: parsed.data.productIds || [],
      isActive: parsed.data.isActive ?? true,
    },
    select: {
      id: true,
      name: true,
      startTime: true,
      endTime: true,
      daysOfWeek: true,
      priceAdjustment: true,
      categoryIds: true,
      productIds: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, schedule }, { status: 201 });
}
