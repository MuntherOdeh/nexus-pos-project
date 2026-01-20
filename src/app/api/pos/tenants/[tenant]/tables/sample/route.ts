import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: { tenant: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only OWNER, ADMIN, MANAGER can load sample tables
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json(
      { success: false, error: "You don't have permission to manage tables" },
      { status: 403 }
    );
  }

  // Check if tables already exist
  const existingTables = await prisma.posTable.count({
    where: { tenantId: auth.ctx.tenantId },
  });

  if (existingTables > 0) {
    return NextResponse.json(
      { success: false, error: "Tables already exist. Clear them first or use the generate endpoint." },
      { status: 400 }
    );
  }

  // Get tenant industry
  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.ctx.tenantId },
    select: { industry: true },
  });

  if (!tenant) {
    return NextResponse.json(
      { success: false, error: "Tenant not found" },
      { status: 404 }
    );
  }

  const industry = tenant.industry;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create main floor
      const floorMain = await tx.posFloor.create({
        data: {
          tenantId: auth.ctx.tenantId,
          name: "Main Floor",
          sortOrder: 0,
        },
      });

      // Create secondary floor (Terrace for restaurant/cafe, Storefront for retail)
      const floorSecondary = await tx.posFloor.create({
        data: {
          tenantId: auth.ctx.tenantId,
          name: industry === "RETAIL" ? "Storefront" : "Terrace",
          sortOrder: 10,
        },
      });

      const mainTables =
        industry === "RETAIL"
          ? [
              { name: "Counter 1", capacity: 1, x: 80, y: 80, width: 220, height: 120, shape: "RECT" as const },
            ]
          : Array.from({ length: 12 }, (_, idx) => {
              const col = idx % 4;
              const row = Math.floor(idx / 4);
              return {
                name: `T${idx + 1}`,
                capacity: idx % 3 === 0 ? 6 : 4,
                x: 70 + col * 180,
                y: 70 + row * 150,
                width: 150,
                height: 110,
                shape: idx % 2 === 0 ? ("ROUND" as const) : ("RECT" as const),
              };
            });

      const secondaryTables =
        industry === "RETAIL"
          ? [
              { name: "Counter 2", capacity: 1, x: 100, y: 120, width: 220, height: 120, shape: "RECT" as const },
            ]
          : Array.from({ length: 6 }, (_, idx) => {
              const col = idx % 3;
              const row = Math.floor(idx / 3);
              return {
                name: `P${idx + 1}`,
                capacity: 4,
                x: 90 + col * 200,
                y: 90 + row * 170,
                width: 160,
                height: 120,
                shape: "ROUND" as const,
              };
            });

      await tx.posTable.createMany({
        data: mainTables.map((t) => ({
          tenantId: auth.ctx.tenantId,
          floorId: floorMain.id,
          name: t.name,
          capacity: t.capacity,
          x: t.x,
          y: t.y,
          width: t.width,
          height: t.height,
          shape: t.shape,
          isActive: true,
        })),
      });

      await tx.posTable.createMany({
        data: secondaryTables.map((t) => ({
          tenantId: auth.ctx.tenantId,
          floorId: floorSecondary.id,
          name: t.name,
          capacity: t.capacity,
          x: t.x,
          y: t.y,
          width: t.width,
          height: t.height,
          shape: t.shape,
          isActive: true,
        })),
      });

      return {
        floorsCreated: 2,
        tablesCreated: mainTables.length + secondaryTables.length,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Loaded ${result.tablesCreated} sample tables in ${result.floorsCreated} floors`,
      ...result,
    });
  } catch (error) {
    console.error("Error loading sample tables:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load sample tables" },
      { status: 500 }
    );
  }
}
