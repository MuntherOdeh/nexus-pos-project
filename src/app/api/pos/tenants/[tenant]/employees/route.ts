import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional().nullable(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "KITCHEN"]),
  isActive: z.boolean().optional(),
});

// GET - List employees
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const activeOnly = request.nextUrl.searchParams.get("activeOnly") === "true";
  const role = request.nextUrl.searchParams.get("role")?.trim().toUpperCase() || null;

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
  };

  if (activeOnly) {
    where.isActive = true;
  }

  if (role && ["OWNER", "ADMIN", "MANAGER", "STAFF", "KITCHEN"].includes(role)) {
    where.role = role;
  }

  const employees = await prisma.tenantUser.findMany({
    where,
    orderBy: [{ role: "asc" }, { firstName: "asc" }],
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
    },
  });

  return NextResponse.json({ success: true, employees });
}

// POST - Create employee
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only owners/admins can create employees
  if (!["OWNER", "ADMIN"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Check for duplicate email
  const existing = await prisma.tenantUser.findFirst({
    where: {
      tenantId: auth.ctx.tenantId,
      email: parsed.data.email,
    },
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "An employee with this email already exists" },
      { status: 400 }
    );
  }

  // Hash password if provided
  let passwordHash: string | null = null;
  if (parsed.data.password) {
    passwordHash = await hash(parsed.data.password, 12);
  }

  const employee = await prisma.tenantUser.create({
    data: {
      tenantId: auth.ctx.tenantId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash,
      role: parsed.data.role,
      isActive: parsed.data.isActive ?? true,
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

  return NextResponse.json({ success: true, employee }, { status: 201 });
}
