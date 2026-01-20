import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const createCustomerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string()).optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

// GET - List customers with search
export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const search = request.nextUrl.searchParams.get("search")?.trim() || null;
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "50")));
  const sortBy = request.nextUrl.searchParams.get("sortBy") || "lastVisitAt";
  const sortOrder = request.nextUrl.searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
    isActive: true,
  };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        tags: true,
        loyaltyPoints: true,
        totalSpentCents: true,
        visitCount: true,
        lastVisitAt: true,
        createdAt: true,
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST - Create customer
export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Check for duplicate email
  if (parsed.data.email) {
    const existing = await prisma.customer.findFirst({
      where: {
        tenantId: auth.ctx.tenantId,
        email: parsed.data.email,
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A customer with this email already exists" },
        { status: 400 }
      );
    }
  }

  const customer = await prisma.customer.create({
    data: {
      tenantId: auth.ctx.tenantId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
      notes: parsed.data.notes || null,
      tags: parsed.data.tags || [],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      tags: true,
      loyaltyPoints: true,
      totalSpentCents: true,
      visitCount: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, customer }, { status: 201 });
}
