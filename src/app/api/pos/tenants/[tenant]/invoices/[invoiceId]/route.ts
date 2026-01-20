import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

// Schema for updating an invoice
const updateInvoiceSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"]).optional(),
  customerName: z.string().min(1).max(200).optional(),
  customerEmail: z.string().email().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
});

// GET - Get single invoice
export async function GET(
  request: NextRequest,
  context: { params: { tenant: string; invoiceId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: context.params.invoiceId,
      tenantId: auth.ctx.tenantId,
    },
    include: {
      lines: {
        select: {
          id: true,
          description: true,
          quantity: true,
          unitPriceCents: true,
          lineTotalCents: true,
          product: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, invoice });
}

// PATCH - Update invoice (status, customer info)
export async function PATCH(
  request: NextRequest,
  context: { params: { tenant: string; invoiceId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only allow managers to update invoices
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: context.params.invoiceId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!invoice) {
    return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (data.status) updateData.status = data.status;
  if (data.customerName) updateData.customerName = data.customerName;
  if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail;
  if (data.dueAt !== undefined) updateData.dueAt = data.dueAt ? new Date(data.dueAt) : null;

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: updateData,
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
  });

  return NextResponse.json({ success: true, invoice: updated });
}

// DELETE - Delete invoice (only drafts)
export async function DELETE(
  request: NextRequest,
  context: { params: { tenant: string; invoiceId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only allow managers to delete invoices
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: context.params.invoiceId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!invoice) {
    return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
  }

  // Only allow deleting drafts
  if (invoice.status !== "DRAFT") {
    return NextResponse.json(
      { success: false, error: "Can only delete draft invoices" },
      { status: 400 }
    );
  }

  await prisma.invoice.delete({ where: { id: invoice.id } });

  return NextResponse.json({ success: true, message: "Invoice deleted" });
}
