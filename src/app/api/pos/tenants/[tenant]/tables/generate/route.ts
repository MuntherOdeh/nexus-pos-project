import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

const generateTablesSchema = z.object({
  mainFloorCount: z.coerce.number().int().min(0).max(50).default(12),
  includeTerrace: z.boolean().default(true),
  terraceCount: z.coerce.number().int().min(0).max(30).default(6),
  clearExisting: z.boolean().default(false),
});

export async function POST(
  request: NextRequest,
  context: { params: { tenant: string } }
) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only OWNER, ADMIN, MANAGER can generate tables
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json(
      { success: false, error: "You don't have permission to manage tables" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = generateTablesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { mainFloorCount, includeTerrace, terraceCount, clearExisting } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Optionally clear existing floors and tables
      if (clearExisting) {
        await tx.posTable.deleteMany({
          where: { tenantId: auth.ctx.tenantId },
        });
        await tx.posFloor.deleteMany({
          where: { tenantId: auth.ctx.tenantId },
        });
      }

      // Check for existing floors
      const existingFloors = await tx.posFloor.findMany({
        where: { tenantId: auth.ctx.tenantId },
        select: { id: true, name: true },
      });

      let mainFloor = existingFloors.find((f) => f.name === "Main Floor");
      let terraceFloor = existingFloors.find((f) => f.name === "Terrace");

      // Create main floor if doesn't exist
      if (!mainFloor && mainFloorCount > 0) {
        mainFloor = await tx.posFloor.create({
          data: {
            tenantId: auth.ctx.tenantId,
            name: "Main Floor",
            sortOrder: 0,
          },
        });
      }

      // Create terrace floor if requested and doesn't exist
      if (includeTerrace && !terraceFloor && terraceCount > 0) {
        terraceFloor = await tx.posFloor.create({
          data: {
            tenantId: auth.ctx.tenantId,
            name: "Terrace",
            sortOrder: 10,
          },
        });
      }

      let tablesCreated = 0;

      // Generate main floor tables
      if (mainFloor && mainFloorCount > 0) {
        const mainTables = Array.from({ length: mainFloorCount }, (_, idx) => {
          const col = idx % 4;
          const row = Math.floor(idx / 4);
          return {
            tenantId: auth.ctx.tenantId,
            floorId: mainFloor!.id,
            name: `T${idx + 1}`,
            capacity: idx % 3 === 0 ? 6 : 4,
            x: 70 + col * 180,
            y: 70 + row * 150,
            width: 150,
            height: 110,
            shape: idx % 2 === 0 ? ("ROUND" as const) : ("RECT" as const),
            isActive: true,
          };
        });

        await tx.posTable.createMany({ data: mainTables });
        tablesCreated += mainTables.length;
      }

      // Generate terrace tables
      if (terraceFloor && includeTerrace && terraceCount > 0) {
        const terraceTables = Array.from({ length: terraceCount }, (_, idx) => {
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          return {
            tenantId: auth.ctx.tenantId,
            floorId: terraceFloor!.id,
            name: `P${idx + 1}`,
            capacity: 4,
            x: 90 + col * 200,
            y: 90 + row * 170,
            width: 160,
            height: 120,
            shape: "ROUND" as const,
            isActive: true,
          };
        });

        await tx.posTable.createMany({ data: terraceTables });
        tablesCreated += terraceTables.length;
      }

      return { tablesCreated };
    });

    return NextResponse.json({
      success: true,
      message: `Generated ${result.tablesCreated} tables`,
      tablesCreated: result.tablesCreated,
    });
  } catch (error) {
    console.error("Error generating tables:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate tables" },
      { status: 500 }
    );
  }
}
