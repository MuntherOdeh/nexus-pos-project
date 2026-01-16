import type {
  PrismaClient,
  TenantIndustry,
  InvoiceStatus,
  InventoryMovementStatus,
  InventoryMovementType,
} from "@prisma/client";

type SeedProduct = {
  name: string;
  sku: string;
  priceCents: number;
  initialStock: number;
  reorderPoint: number;
};

const seedCatalog: Record<TenantIndustry, SeedProduct[]> = {
  RESTAURANT: [
    { name: "Margherita Pizza", sku: "RST-PIZ-001", priceCents: 3500, initialStock: 120, reorderPoint: 25 },
    { name: "Chicken Shawarma", sku: "RST-SHW-002", priceCents: 2200, initialStock: 160, reorderPoint: 30 },
    { name: "Lentil Soup", sku: "RST-SUP-003", priceCents: 1800, initialStock: 80, reorderPoint: 15 },
    { name: "Fresh Juice", sku: "RST-JUI-004", priceCents: 1500, initialStock: 200, reorderPoint: 40 },
    { name: "Dessert Box", sku: "RST-DES-005", priceCents: 2600, initialStock: 60, reorderPoint: 12 },
  ],
  CAFE: [
    { name: "Espresso", sku: "CAF-ESP-001", priceCents: 1200, initialStock: 300, reorderPoint: 80 },
    { name: "Cappuccino", sku: "CAF-CAP-002", priceCents: 1600, initialStock: 260, reorderPoint: 70 },
    { name: "Iced Latte", sku: "CAF-LAT-003", priceCents: 1900, initialStock: 240, reorderPoint: 60 },
    { name: "Croissant", sku: "CAF-CRO-004", priceCents: 1400, initialStock: 90, reorderPoint: 20 },
    { name: "Cheesecake Slice", sku: "CAF-CHS-005", priceCents: 2100, initialStock: 55, reorderPoint: 12 },
  ],
  BAKERY: [
    { name: "Sourdough Loaf", sku: "BAK-SOU-001", priceCents: 1800, initialStock: 70, reorderPoint: 15 },
    { name: "Baguette", sku: "BAK-BAG-002", priceCents: 900, initialStock: 120, reorderPoint: 25 },
    { name: "Cinnamon Roll", sku: "BAK-CIN-003", priceCents: 1100, initialStock: 90, reorderPoint: 20 },
    { name: "Chocolate Muffin", sku: "BAK-MUF-004", priceCents: 1000, initialStock: 110, reorderPoint: 25 },
    { name: "Birthday Cake", sku: "BAK-CAK-005", priceCents: 8500, initialStock: 18, reorderPoint: 5 },
  ],
  RETAIL: [
    { name: "Wireless Mouse", sku: "RTL-MOU-001", priceCents: 6500, initialStock: 35, reorderPoint: 8 },
    { name: "USB-C Cable", sku: "RTL-CAB-002", priceCents: 2500, initialStock: 80, reorderPoint: 20 },
    { name: "Phone Case", sku: "RTL-CAS-003", priceCents: 4500, initialStock: 60, reorderPoint: 15 },
    { name: "Power Bank", sku: "RTL-PWB-004", priceCents: 9900, initialStock: 25, reorderPoint: 6 },
    { name: "Bluetooth Speaker", sku: "RTL-SPK-005", priceCents: 14500, initialStock: 18, reorderPoint: 4 },
  ],
  OTHER: [
    { name: "Standard Item", sku: "GEN-001", priceCents: 2500, initialStock: 100, reorderPoint: 20 },
    { name: "Premium Item", sku: "GEN-002", priceCents: 7500, initialStock: 40, reorderPoint: 10 },
    { name: "Service Fee", sku: "GEN-003", priceCents: 1500, initialStock: 999, reorderPoint: 0 },
  ],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeInvoiceNumber(): string {
  return `INV-${new Date().getFullYear()}-${randomInt(10000, 99999)}`;
}

function centsSum(...values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

function inferCategoryName(industry: TenantIndustry, product: SeedProduct): string {
  const name = product.name.toLowerCase();

  switch (industry) {
    case "RESTAURANT": {
      if (name.includes("pizza")) return "Pizzas";
      if (name.includes("juice") || name.includes("drink")) return "Drinks";
      if (name.includes("dessert") || name.includes("cake")) return "Desserts";
      if (name.includes("soup") || name.includes("salad")) return "Starters";
      return "Mains";
    }
    case "CAFE": {
      if (name.includes("espresso") || name.includes("latte") || name.includes("cappuccino")) return "Coffee";
      if (name.includes("croissant") || name.includes("cheesecake") || name.includes("slice")) return "Pastries";
      return "Other";
    }
    case "BAKERY": {
      if (name.includes("cake")) return "Cakes";
      if (name.includes("roll") || name.includes("muffin") || name.includes("croissant")) return "Pastries";
      return "Bread";
    }
    case "RETAIL": {
      if (name.includes("cable")) return "Cables";
      if (name.includes("mouse") || name.includes("speaker") || name.includes("power")) return "Electronics";
      return "Accessories";
    }
    default:
      return "General";
  }
}

function getPosTaxRate(): number {
  return 0.05; // UAE VAT default for demo
}

export async function seedDemoTenantData(params: {
  prisma: PrismaClient;
  tenantId: string;
  industry: TenantIndustry;
  currency?: string;
}): Promise<void> {
  const { prisma, tenantId, industry, currency = "AED" } = params;

  const warehouse = await prisma.warehouse.create({
    data: {
      tenantId,
      name: "Main Warehouse",
      code: "MAIN",
    },
  });

  const catalog = seedCatalog[industry] ?? seedCatalog.OTHER;

  // Categories (used by POS menu + inventory grouping)
  const categoryNames = Array.from(new Set(catalog.map((item) => inferCategoryName(industry, item))));
  const categories = await Promise.all(
    categoryNames.map((name, index) =>
      prisma.productCategory.create({
        data: {
          tenantId,
          name,
          sortOrder: index * 10,
          isActive: true,
        },
      })
    )
  );
  const categoryIdByName = new Map(categories.map((c) => [c.name, c.id]));

  const createdProducts = [];

  for (const item of catalog) {
    const categoryName = inferCategoryName(industry, item);
    const product = await prisma.product.create({
      data: {
        tenantId,
        categoryId: categoryIdByName.get(categoryName),
        name: item.name,
        sku: item.sku,
        priceCents: item.priceCents,
        currency,
        isActive: true,
      },
    });
    createdProducts.push({ ...product, seed: item });
  }

  // Floors + tables (restaurant-style POS)
  const floorMain = await prisma.posFloor.create({
    data: {
      tenantId,
      name: "Main Floor",
      sortOrder: 0,
    },
  });

  const floorSecondary = await prisma.posFloor.create({
    data: {
      tenantId,
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
          const name = `T${idx + 1}`;
          return {
            name,
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
          const name = `P${idx + 1}`;
          return {
            name,
            capacity: 4,
            x: 90 + col * 200,
            y: 90 + row * 170,
            width: 160,
            height: 120,
            shape: "ROUND" as const,
          };
        });

  await prisma.posTable.createMany({
    data: mainTables.map((t) => ({
      tenantId,
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

  await prisma.posTable.createMany({
    data: secondaryTables.map((t) => ({
      tenantId,
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

  for (const product of createdProducts) {
    await prisma.stockItem.create({
      data: {
        tenantId,
        warehouseId: warehouse.id,
        productId: product.id,
        onHand: product.seed.initialStock,
        reserved: randomInt(0, Math.min(5, product.seed.initialStock)),
        reorderPoint: product.seed.reorderPoint,
      },
    });
  }

  await prisma.paymentConnection.createMany({
    data: [
      {
        tenantId,
        provider: "BANK",
        status: "DISCONNECTED",
        displayName: "Bank Transfer",
      },
      {
        tenantId,
        provider: "PAYPAL",
        status: "DISCONNECTED",
        displayName: "PayPal",
      },
      {
        tenantId,
        provider: "CARD",
        status: "DISCONNECTED",
        displayName: "Credit / Debit Cards",
      },
    ],
  });

  // No demo orders are created - start fresh for each tenant

  const movementTemplates: Array<{
    type: InventoryMovementType;
    status: InventoryMovementStatus;
    reference: string;
    notes?: string;
  }> = [
    { type: "RECEIPT", status: "POSTED", reference: `RCV-${randomInt(1000, 9999)}`, notes: "Initial stock receipt" },
    { type: "DELIVERY", status: "POSTED", reference: `DLV-${randomInt(1000, 9999)}`, notes: "Sample customer delivery" },
    { type: "ADJUSTMENT", status: "DRAFT", reference: `ADJ-${randomInt(1000, 9999)}`, notes: "Stock count pending approval" },
  ];

  for (const movementTemplate of movementTemplates) {
    const movement = await prisma.inventoryMovement.create({
      data: {
        tenantId,
        warehouseId: warehouse.id,
        type: movementTemplate.type,
        status: movementTemplate.status,
        reference: movementTemplate.reference,
        notes: movementTemplate.notes,
      },
    });

    const lineCount = randomInt(2, Math.min(4, createdProducts.length));
    const picked = createdProducts
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, lineCount);

    for (const product of picked) {
      const quantity = movementTemplate.type === "DELIVERY" ? -randomInt(1, 5) : randomInt(1, 10);
      await prisma.inventoryMovementLine.create({
        data: {
          movementId: movement.id,
          productId: product.id,
          quantity,
        },
      });
    }
  }

  // Note: No demo invoices or orders are created.
  // Dashboard will start empty, showing real data only after users create orders.
  // This prevents the issue of showing "same data" for every new POS instance.
}
