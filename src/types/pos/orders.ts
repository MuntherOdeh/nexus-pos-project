// Order types for POS system

export type OrderStatus =
  | "OPEN"
  | "IN_KITCHEN"
  | "READY"
  | "FOR_PAYMENT"
  | "PAID"
  | "CANCELLED";

export type OrderItemStatus =
  | "NEW"
  | "SENT"
  | "IN_PROGRESS"
  | "READY"
  | "SERVED"
  | "VOID";

export type PaymentProvider =
  | "CASH"
  | "CARD"
  | "BANK"
  | "PAYPAL";

export type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "REFUNDED";

export interface PosOrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  discountPercent: number;
  notes: string | null;
  status: OrderItemStatus;
  sentToKitchenAt: string | null;
  readyAt: string | null;
}

export interface PosPayment {
  id: string;
  provider: PaymentProvider;
  amountCents: number;
  tipCents: number;
  status: PaymentStatus;
  reference: string | null;
  createdAt: string;
}

export interface PosOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  type: "DINE_IN" | "TAKEOUT" | "DELIVERY";
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  tipCents: number;
  currency: string;
  tableNumber: string | null;
  customerName: string | null;
  notes: string | null;
  openedAt: string;
  closedAt: string | null;
  items: PosOrderItem[];
  payments: PosPayment[];
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  type: "DINE_IN" | "TAKEOUT" | "DELIVERY";
  totalCents: number;
  currency: string;
  tableNumber: string | null;
  customerName: string | null;
  itemCount: number;
  openedAt: string;
}
