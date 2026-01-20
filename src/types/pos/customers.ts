// Customer types for POS system

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  tags: string[];
  loyaltyPoints: number;
  totalSpentCents: number;
  visitCount: number;
  lastVisitAt: string | null;
  createdAt: string;
}

export interface CustomerSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  loyaltyPoints: number;
  visitCount: number;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: "EARN" | "REDEEM" | "ADJUSTMENT" | "EXPIRE";
  points: number;
  description: string | null;
  orderId: string | null;
  createdAt: string;
}

export interface LoyaltyProgram {
  id: string;
  name: string;
  pointsPerDollar: number;
  redemptionRate: number;
  isActive: boolean;
}

export interface CreateCustomerInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  tags?: string[];
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  loyaltyPoints?: number;
}
