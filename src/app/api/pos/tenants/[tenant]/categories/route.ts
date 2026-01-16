import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const categories = await prisma.productCategory.findMany({
    where: { tenantId: auth.ctx.tenantId },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      sortOrder: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });

  return NextResponse.json({ success: true, categories });
}

export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only OWNER, ADMIN, MANAGER can create categories
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json(
      { success: false, error: "You don't have permission to create categories" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Check for duplicate category name
  const existingCategory = await prisma.productCategory.findFirst({
    where: {
      tenantId: auth.ctx.tenantId,
      name: { equals: parsed.data.name, mode: "insensitive" },
    },
  });

  if (existingCategory) {
    return NextResponse.json(
      { success: false, error: "A category with this name already exists" },
      { status: 400 }
    );
  }

  const category = await prisma.productCategory.create({
    data: {
      tenantId: auth.ctx.tenantId,
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder ?? 0,
      isActive: parsed.data.isActive ?? true,
    },
    select: {
      id: true,
      name: true,
      sortOrder: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });

  return NextResponse.json({ success: true, category }, { status: 201 });
}
