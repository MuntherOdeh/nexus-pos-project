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
  const createdProducts = [];

  for (const item of catalog) {
    const product = await prisma.product.create({
      data: {
        tenantId,
        name: item.name,
        sku: item.sku,
        priceCents: item.priceCents,
        currency,
        isActive: true,
      },
    });
    createdProducts.push({ ...product, seed: item });
  }

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

  const customers = [
    { name: "Al Ain Catering", email: "ops@alaincatering.example" },
    { name: "Downtown Coffee Club", email: "hello@coffeeclub.example" },
    { name: "Sunset Retail", email: "finance@sunsetretail.example" },
  ];

  const invoiceStatuses: InvoiceStatus[] = ["PAID", "SENT", "OVERDUE", "DRAFT"];

  for (let i = 0; i < 7; i += 1) {
    const customer = customers[i % customers.length];
    const status = invoiceStatuses[i % invoiceStatuses.length];
    const issuedAt = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const lineCount = randomInt(2, Math.min(4, createdProducts.length));
    const picked = createdProducts
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, lineCount);

    const lines = picked.map((product) => {
      const quantity = randomInt(1, 3);
      const unitPriceCents = product.priceCents;
      const lineTotalCents = unitPriceCents * quantity;
      return {
        productId: product.id,
        description: product.name,
        quantity,
        unitPriceCents,
        lineTotalCents,
      };
    });

    const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
    const taxCents = Math.round(subtotalCents * 0.05);
    const totalCents = centsSum(subtotalCents, taxCents);

    await prisma.invoice.create({
      data: {
        tenantId,
        number: makeInvoiceNumber(),
        status,
        customerName: customer.name,
        customerEmail: customer.email,
        issuedAt,
        dueAt: new Date(issuedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
        subtotalCents,
        taxCents,
        totalCents,
        currency,
        lines: {
          create: lines.map((line) => ({
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            unitPriceCents: line.unitPriceCents,
            lineTotalCents: line.lineTotalCents,
          })),
        },
      },
    });
  }
}

