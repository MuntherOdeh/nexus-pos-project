import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { PosOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const createOrderSchema = z.object({
  tableId: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

function makeOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `POS-${ts}-${rand}`;
}

const ORDER_STATUS_VALUES = ["OPEN", "IN_KITCHEN", "READY", "FOR_PAYMENT", "PAID", "CANCELLED"] as const;
const orderStatusSchema = z.enum(ORDER_STATUS_VALUES);
type OrderStatus = z.infer<typeof orderStatusSchema>;
const OPEN_STATUSES: PosOrderStatus[] = ["OPEN", "IN_KITCHEN", "READY", "FOR_PAYMENT"];

function parseStatusIn(value: string): OrderStatus[] | null {
  const values = value
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  if (values.length === 0) return null;

  const parsed: OrderStatus[] = [];
  for (const v of values) {
    const result = orderStatusSchema.safeParse(v);
    if (!result.success) return null;
    parsed.push(result.data);
  }

  return parsed;
}

export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const tableId = request.nextUrl.searchParams.get("tableId")?.trim() || null;
  const status = request.nextUrl.searchParams.get("status")?.trim() || null;
  const statusIn = request.nextUrl.searchParams.get("statusIn")?.trim() || null;

  let statusFilter: { in: OrderStatus[] } | OrderStatus;

  if (statusIn) {
    const parsed = parseStatusIn(statusIn);
    if (!parsed) {
      return NextResponse.json({ success: false, error: "Invalid statusIn" }, { status: 400 });
    }
    statusFilter = { in: parsed };
  } else if (status) {
    const parsed = orderStatusSchema.safeParse(status.toUpperCase());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }
    statusFilter = parsed.data;
  } else {
    statusFilter = { in: OPEN_STATUSES };
  }

  const where = {
    tenantId: auth.ctx.tenantId,
    ...(tableId ? { tableId } : {}),
    status: statusFilter,
  };

  const orders = await prisma.posOrder.findMany({
    where,
    orderBy: { openedAt: "desc" },
    take: tableId ? 1 : 30,
    select: {
      id: true,
      status: true,
      orderNumber: true,
      notes: true,
      subtotalCents: true,
      discountCents: true,
      taxCents: true,
      totalCents: true,
      currency: true,
      openedAt: true,
      sentToKitchenAt: true,
      closedAt: true,
      tableId: true,
      table: { select: { id: true, name: true } },
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productId: true,
          productName: true,
          unitPriceCents: true,
          quantity: true,
          status: true,
          notes: true,
          discountPercent: true,
        },
      },
    },
  });

  return NextResponse.json({ success: true, orders });
}

export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const tableId = parsed.data.tableId || null;
  if (tableId) {
    const table = await prisma.posTable.findFirst({
      where: { id: tableId, tenantId: auth.ctx.tenantId, isActive: true },
      select: { id: true },
    });
    if (!table) {
      return NextResponse.json({ success: false, error: "Table not found" }, { status: 404 });
    }

    const existing = await prisma.posOrder.findFirst({
      where: {
        tenantId: auth.ctx.tenantId,
        tableId,
        status: { in: OPEN_STATUSES },
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ success: true, orderId: existing.id, reused: true }, { status: 200 });
    }
  }

  const order = await prisma.posOrder.create({
    data: {
      tenantId: auth.ctx.tenantId,
      tableId,
      openedById: auth.ctx.user.id,
      status: "OPEN",
      orderNumber: makeOrderNumber(),
      notes: parsed.data.notes?.trim() || null,
      currency: auth.ctx.tenantCurrency,
    },
    select: {
      id: true,
      status: true,
      orderNumber: true,
      notes: true,
      subtotalCents: true,
      discountCents: true,
      taxCents: true,
      totalCents: true,
      currency: true,
      openedAt: true,
      sentToKitchenAt: true,
      closedAt: true,
      tableId: true,
      table: { select: { id: true, name: true } },
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productId: true,
          productName: true,
          unitPriceCents: true,
          quantity: true,
          status: true,
          notes: true,
          discountPercent: true,
        },
      },
    },
  });

  return NextResponse.json({ success: true, order });
}
