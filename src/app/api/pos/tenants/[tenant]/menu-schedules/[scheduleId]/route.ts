import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const updateMenuScheduleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:MM").optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:MM").optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  priceAdjustment: z.number().int().optional(),
  categoryIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// GET - Get menu schedule details
export async function GET(
  request: NextRequest,
  context: { params: { tenant: string; scheduleId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const schedule = await prisma.menuSchedule.findFirst({
    where: {
      id: context.params.scheduleId,
      tenantId: auth.ctx.tenantId,
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
      updatedAt: true,
    },
  });

  if (!schedule) {
    return NextResponse.json({ success: false, error: "Menu schedule not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, schedule });
}

// PATCH - Update menu schedule
export async function PATCH(
  request: NextRequest,
  context: { params: { tenant: string; scheduleId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateMenuScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.menuSchedule.findFirst({
    where: {
      id: context.params.scheduleId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Menu schedule not found" }, { status: 404 });
  }

  const schedule = await prisma.menuSchedule.update({
    where: { id: context.params.scheduleId },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.startTime && { startTime: parsed.data.startTime }),
      ...(parsed.data.endTime && { endTime: parsed.data.endTime }),
      ...(parsed.data.daysOfWeek && { daysOfWeek: parsed.data.daysOfWeek }),
      ...(parsed.data.priceAdjustment !== undefined && {
        priceAdjustment: parsed.data.priceAdjustment,
      }),
      ...(parsed.data.categoryIds && { categoryIds: parsed.data.categoryIds }),
      ...(parsed.data.productIds && { productIds: parsed.data.productIds }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
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

  return NextResponse.json({ success: true, schedule });
}

// DELETE - Delete menu schedule
export async function DELETE(
  request: NextRequest,
  context: { params: { tenant: string; scheduleId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const existing = await prisma.menuSchedule.findFirst({
    where: {
      id: context.params.scheduleId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Menu schedule not found" }, { status: 404 });
  }

  await prisma.menuSchedule.delete({
    where: { id: context.params.scheduleId },
  });

  return NextResponse.json({ success: true, message: "Menu schedule deleted" });
}
