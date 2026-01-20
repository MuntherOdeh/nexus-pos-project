// Inventory types for POS system

export type MovementType =
  | "RECEIPT"
  | "DELIVERY"
  | "ADJUSTMENT"
  | "TRANSFER";

export type MovementStatus =
  | "DRAFT"
  | "POSTED"
  | "CANCELLED";

export type AlertSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  priceCents: number;
  costCents: number | null;
  currency: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  sku: string | null;
  priceCents: number;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  productCount?: number;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export interface StockItem {
  id: string;
  warehouseId: string;
  warehouse: { id: string; name: string; code: string };
  productId: string;
  product: ProductSummary;
  onHand: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  isLowStock: boolean;
}

export interface StockAlert {
  id: string;
  product: ProductSummary;
  warehouse: { id: string; name: string; code: string };
  currentStock: number;
  reorderPoint: number;
  severity: AlertSeverity;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  warehouseId: string;
  warehouse: { id: string; name: string; code: string };
  type: MovementType;
  status: MovementStatus;
  reference: string;
  notes: string | null;
  createdAt: string;
  lines: InventoryMovementLine[];
}

export interface InventoryMovementLine {
  id: string;
  productId: string;
  product: ProductSummary;
  quantity: number;
}

export interface CreateMovementInput {
  warehouseId: string;
  type: MovementType;
  reference?: string;
  notes?: string;
  lines: { productId: string; quantity: number }[];
}
