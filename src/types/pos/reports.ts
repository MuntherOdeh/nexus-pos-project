// Report types for POS system

export interface SalesReport {
  dateRange: {
    start: string;
    end: string;
    period: string;
  };
  summary: {
    totalOrders: number;
    totalSalesCents: number;
    totalTaxCents: number;
    totalDiscountsCents: number;
    totalTipsCents: number;
    averageOrderCents: number;
    netSalesCents: number;
  };
  paymentBreakdown: Record<string, number>;
  topProducts: TopProduct[];
  salesTimeline: TimelineEntry[];
}

export interface TopProduct {
  id: string;
  name: string;
  quantity: number;
  totalCents: number;
}

export interface TimelineEntry {
  period: string;
  orders: number;
  salesCents: number;
}

export interface ShiftSummary {
  id: string;
  employeeId: string;
  employee: {
    firstName: string;
    lastName: string;
  };
  startedAt: string;
  endedAt: string | null;
  totalOrders: number;
  totalSalesCents: number;
  totalTipsCents: number;
  cashDifferenceCents: number;
}

export interface DashboardStats {
  revenue7d: number;
  ordersCount7d: number;
  avgOrderValue: number;
  topSellingItems: TopProduct[];
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    totalCents: number;
    openedAt: string;
  }[];
  salesByDay: {
    date: string;
    cents: number;
  }[];
}

export type ReportPeriod =
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "year";

export type ReportGroupBy =
  | "hour"
  | "day"
  | "week"
  | "month";
