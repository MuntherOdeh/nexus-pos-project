import type { PosOrderItemStatus } from "@prisma/client";

export function isBillableItemStatus(status: PosOrderItemStatus): boolean {
  return status !== "VOID";
}

export function calculateOrderTotals(params: {
  items: Array<{ unitPriceCents: number; quantity: number; status: PosOrderItemStatus }>;
  taxRate: number;
}): { subtotalCents: number; taxCents: number; totalCents: number } {
  const subtotalCents = params.items.reduce((sum, item) => {
    if (!isBillableItemStatus(item.status)) return sum;
    return sum + item.unitPriceCents * item.quantity;
  }, 0);

  const taxCents = Math.round(subtotalCents * params.taxRate);
  const totalCents = subtotalCents + taxCents;

  return { subtotalCents, taxCents, totalCents };
}

export function getDefaultTaxRate(): number {
  return 0.05;
}

