import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const updateCustomerSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string()).optional(),
  loyaltyPoints: z.number().int().min(0).optional(),
});

// GET - Get customer details with order history
export async function GET(
  request: NextRequest,
  context: { params: { tenant: string; customerId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: context.params.customerId,
      tenantId: auth.ctx.tenantId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      notes: true,
      tags: true,
      loyaltyPoints: true,
      totalSpentCents: true,
      visitCount: true,
      lastVisitAt: true,
      isActive: true,
      createdAt: true,
      orders: {
        take: 10,
        orderBy: { openedAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          totalCents: true,
          status: true,
          openedAt: true,
          closedAt: true,
        },
      },
      loyaltyTransactions: {
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          points: true,
          description: true,
          createdAt: true,
        },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, customer });
}

// PATCH - Update customer
export async function PATCH(
  request: NextRequest,
  context: { params: { tenant: string; customerId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = updateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Check customer exists
  const existing = await prisma.customer.findFirst({
    where: {
      id: context.params.customerId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
  }

  // Check email uniqueness if updating email
  if (parsed.data.email && parsed.data.email !== existing.email) {
    const emailExists = await prisma.customer.findFirst({
      where: {
        tenantId: auth.ctx.tenantId,
        email: parsed.data.email,
        id: { not: context.params.customerId },
      },
    });
    if (emailExists) {
      return NextResponse.json(
        { success: false, error: "A customer with this email already exists" },
        { status: 400 }
      );
    }
  }

  const customer = await prisma.customer.update({
    where: { id: context.params.customerId },
    data: {
      ...(parsed.data.firstName && { firstName: parsed.data.firstName }),
      ...(parsed.data.lastName && { lastName: parsed.data.lastName }),
      ...(parsed.data.email !== undefined && { email: parsed.data.email }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      ...(parsed.data.dateOfBirth !== undefined && {
        dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
      }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
      ...(parsed.data.tags && { tags: parsed.data.tags }),
      ...(parsed.data.loyaltyPoints !== undefined && { loyaltyPoints: parsed.data.loyaltyPoints }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      notes: true,
      tags: true,
      loyaltyPoints: true,
      totalSpentCents: true,
      visitCount: true,
      lastVisitAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, customer });
}

// DELETE - Soft delete customer
export async function DELETE(
  request: NextRequest,
  context: { params: { tenant: string; customerId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only managers/admins can delete customers
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const existing = await prisma.customer.findFirst({
    where: {
      id: context.params.customerId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
  }

  await prisma.customer.update({
    where: { id: context.params.customerId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true, message: "Customer deleted" });
}
