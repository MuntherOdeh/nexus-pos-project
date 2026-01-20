import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional().nullable(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "KITCHEN"]).optional(),
  isActive: z.boolean().optional(),
});

// GET - Get employee details
export async function GET(
  request: NextRequest,
  context: { params: { tenant: string; employeeId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const employee = await prisma.tenantUser.findFirst({
    where: {
      id: context.params.employeeId,
      tenantId: auth.ctx.tenantId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      timeClockEntries: {
        take: 10,
        orderBy: { clockInAt: "desc" },
        select: {
          id: true,
          clockInAt: true,
          clockOutAt: true,
          breakMinutes: true,
          status: true,
        },
      },
    },
  });

  if (!employee) {
    return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, employee });
}

// PATCH - Update employee
export async function PATCH(
  request: NextRequest,
  context: { params: { tenant: string; employeeId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only owners/admins can update employees
  if (!["OWNER", "ADMIN"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.tenantUser.findFirst({
    where: {
      id: context.params.employeeId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
  }

  // Cannot change owner's role
  if (existing.role === "OWNER" && parsed.data.role) {
    return NextResponse.json(
      { success: false, error: "Cannot change owner's role" },
      { status: 400 }
    );
  }

  // Check email uniqueness if updating email
  if (parsed.data.email && parsed.data.email !== existing.email) {
    const emailExists = await prisma.tenantUser.findFirst({
      where: {
        tenantId: auth.ctx.tenantId,
        email: parsed.data.email,
        id: { not: context.params.employeeId },
      },
    });
    if (emailExists) {
      return NextResponse.json(
        { success: false, error: "An employee with this email already exists" },
        { status: 400 }
      );
    }
  }

  // Hash password if provided
  let passwordHash: string | undefined;
  if (parsed.data.password) {
    passwordHash = await hash(parsed.data.password, 12);
  }

  const employee = await prisma.tenantUser.update({
    where: { id: context.params.employeeId },
    data: {
      ...(parsed.data.firstName && { firstName: parsed.data.firstName }),
      ...(parsed.data.lastName && { lastName: parsed.data.lastName }),
      ...(parsed.data.email && { email: parsed.data.email }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      ...(passwordHash && { passwordHash }),
      ...(parsed.data.role && { role: parsed.data.role }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, employee });
}

// DELETE - Deactivate employee
export async function DELETE(
  request: NextRequest,
  context: { params: { tenant: string; employeeId: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only owners/admins can delete employees
  if (!["OWNER", "ADMIN"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const existing = await prisma.tenantUser.findFirst({
    where: {
      id: context.params.employeeId,
      tenantId: auth.ctx.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
  }

  // Cannot delete owner
  if (existing.role === "OWNER") {
    return NextResponse.json(
      { success: false, error: "Cannot delete the owner" },
      { status: 400 }
    );
  }

  // Soft delete
  await prisma.tenantUser.update({
    where: { id: context.params.employeeId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true, message: "Employee deactivated" });
}
