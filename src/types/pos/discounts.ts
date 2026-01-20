// Discount types for POS system

export type DiscountType =
  | "PERCENTAGE"
  | "FIXED"
  | "BOGO";

export type DiscountScope =
  | "ORDER"
  | "CATEGORY"
  | "PRODUCT";

export interface Discount {
  id: string;
  name: string;
  code: string | null;
  type: DiscountType;
  value: number;
  minOrderCents: number | null;
  maxUsageCount: number | null;
  usageCount: number;
  applicableTo: DiscountScope;
  categoryId: string | null;
  productId: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface DiscountSummary {
  id: string;
  name: string;
  code: string | null;
  type: DiscountType;
  value: number;
  isActive: boolean;
}

export interface AppliedDiscount {
  id: string;
  discountId: string;
  discount: DiscountSummary;
  orderId: string;
  amountCents: number;
  appliedAt: string;
}

export interface CreateDiscountInput {
  name: string;
  code?: string;
  type: DiscountType;
  value: number;
  minOrderCents?: number;
  maxUsageCount?: number;
  applicableTo?: DiscountScope;
  categoryId?: string;
  productId?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface UpdateDiscountInput extends Partial<CreateDiscountInput> {}
