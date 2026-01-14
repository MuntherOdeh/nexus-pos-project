import type { PosOrderItemStatus } from "@prisma/client";

export function isBillableItemStatus(status: PosOrderItemStatus): boolean {
  return status !== "VOID";
}

export function calculateOrderTotals(params: {
  items: Array<{ 
    unitPriceCents: number; 
    quantity: number; 
    status: PosOrderItemStatus;
    discountPercent?: number | null;
  }>;
  taxRate: number;
}): { subtotalCents: number; taxCents: number; totalCents: number; discountCents: number } {
  let subtotalBeforeDiscount = 0;
  let totalDiscountCents = 0;

  for (const item of params.items) {
    if (!isBillableItemStatus(item.status)) continue;
    
    const lineTotal = item.unitPriceCents * item.quantity;
    const discountPercent = item.discountPercent ?? 0;
    const itemDiscount = Math.round(lineTotal * discountPercent / 100);
    
    subtotalBeforeDiscount += lineTotal;
    totalDiscountCents += itemDiscount;
  }

  const subtotalCents = subtotalBeforeDiscount - totalDiscountCents;
  const taxCents = Math.round(subtotalCents * params.taxRate);
  const totalCents = subtotalCents + taxCents;

  return { subtotalCents, taxCents, totalCents, discountCents: totalDiscountCents };
}

export function getDefaultTaxRate(): number {
  return 0.05;
}

