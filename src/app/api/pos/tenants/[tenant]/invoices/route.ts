import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

// Schema for creating an invoice
const createInvoiceSchema = z.object({
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  lines: z.array(
    z.object({
      description: z.string().min(1).max(500),
      quantity: z.coerce.number().int().min(1).default(1),
      unitPriceCents: z.coerce.number().int().min(0),
      productId: z.string().optional().nullable(),
    })
  ).min(1, "At least one line item is required"),
  taxPercent: z.coerce.number().min(0).max(100).default(5),
});

// GET - List invoices
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 50;

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
  };

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { number: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        lines: {
          select: {
            id: true,
            description: true,
            quantity: true,
            unitPriceCents: true,
            lineTotalCents: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    invoices,
    pagination: {
      page,
      totalPages: Math.ceil(total / limit),
      total,
    },
  });
}

// POST - Create an invoice
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only allow managers to create invoices
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Calculate totals
  const subtotalCents = data.lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0
  );
  const taxCents = Math.round(subtotalCents * (data.taxPercent / 100));
  const totalCents = subtotalCents + taxCents;

  // Generate invoice number
  const count = await prisma.invoice.count({ where: { tenantId: auth.ctx.tenantId } });
  const invoiceNumber = `INV-${String(count + 1).padStart(6, "0")}`;

  try {
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: auth.ctx.tenantId,
        number: invoiceNumber,
        status: "DRAFT",
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        subtotalCents,
        taxCents,
        totalCents,
        currency: auth.ctx.tenantCurrency,
        lines: {
          create: data.lines.map((line) => ({
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            unitPriceCents: line.unitPriceCents,
            lineTotalCents: line.unitPriceCents * line.quantity,
          })),
        },
      },
      include: {
        lines: true,
      },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error("Failed to create invoice:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
