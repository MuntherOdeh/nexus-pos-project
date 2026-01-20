// Status configuration constants for POS system

export const ORDER_STATUS_CONFIG = {
  OPEN: {
    label: "Open",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-500",
    borderClass: "border-blue-500/30",
  },
  IN_KITCHEN: {
    label: "In Kitchen",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-500",
    borderClass: "border-amber-500/30",
  },
  READY: {
    label: "Ready",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-500",
    borderClass: "border-emerald-500/30",
  },
  FOR_PAYMENT: {
    label: "For Payment",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-500",
    borderClass: "border-purple-500/30",
  },
  PAID: {
    label: "Paid",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-500",
    borderClass: "border-emerald-500/30",
  },
  CANCELLED: {
    label: "Cancelled",
    bgClass: "bg-red-500/10",
    textClass: "text-red-500",
    borderClass: "border-red-500/30",
  },
} as const;

export const ORDER_ITEM_STATUS_CONFIG = {
  NEW: {
    label: "New",
    bgClass: "bg-slate-500/10",
    textClass: "text-slate-400",
  },
  SENT: {
    label: "Sent",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-500",
  },
  READY: {
    label: "Ready",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-500",
  },
  SERVED: {
    label: "Served",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-500",
  },
  VOID: {
    label: "Void",
    bgClass: "bg-red-500/10",
    textClass: "text-red-500",
  },
} as const;

export const EMPLOYEE_ROLE_CONFIG = {
  OWNER: {
    label: "Owner",
    bgClass: "bg-purple-500/20",
    textClass: "text-purple-400",
  },
  ADMIN: {
    label: "Admin",
    bgClass: "bg-blue-500/20",
    textClass: "text-blue-400",
  },
  MANAGER: {
    label: "Manager",
    bgClass: "bg-emerald-500/20",
    textClass: "text-emerald-400",
  },
  STAFF: {
    label: "Staff",
    bgClass: "bg-cyan-500/20",
    textClass: "text-cyan-400",
  },
  KITCHEN: {
    label: "Kitchen",
    bgClass: "bg-orange-500/20",
    textClass: "text-orange-400",
  },
} as const;

export const TIME_CLOCK_STATUS_CONFIG = {
  CLOCKED_IN: {
    label: "Clocked In",
    bgClass: "bg-emerald-500/20",
    textClass: "text-emerald-400",
  },
  ON_BREAK: {
    label: "On Break",
    bgClass: "bg-amber-500/20",
    textClass: "text-amber-400",
  },
  CLOCKED_OUT: {
    label: "Clocked Out",
    bgClass: "bg-gray-500/20",
    textClass: "text-gray-400",
  },
} as const;

export const PAYMENT_STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-500",
  },
  AUTHORIZED: {
    label: "Authorized",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-500",
  },
  CAPTURED: {
    label: "Captured",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-500",
  },
  FAILED: {
    label: "Failed",
    bgClass: "bg-red-500/10",
    textClass: "text-red-500",
  },
  REFUNDED: {
    label: "Refunded",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-500",
  },
} as const;

export const INVOICE_STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    bgClass: "bg-slate-500/10",
    textClass: "text-slate-400",
  },
  SENT: {
    label: "Sent",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-500",
  },
  PAID: {
    label: "Paid",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-500",
  },
  OVERDUE: {
    label: "Overdue",
    bgClass: "bg-red-500/10",
    textClass: "text-red-500",
  },
  VOID: {
    label: "Void",
    bgClass: "bg-gray-500/10",
    textClass: "text-gray-400",
  },
} as const;

export const MOVEMENT_STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    bgClass: "bg-slate-500/10",
    textClass: "text-slate-400",
  },
  POSTED: {
    label: "Posted",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-500",
  },
  CANCELLED: {
    label: "Cancelled",
    bgClass: "bg-red-500/10",
    textClass: "text-red-500",
  },
} as const;

export const ALERT_SEVERITY_CONFIG = {
  LOW: {
    label: "Low",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-500",
  },
  MEDIUM: {
    label: "Medium",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-500",
  },
  HIGH: {
    label: "High",
    bgClass: "bg-orange-500/10",
    textClass: "text-orange-500",
  },
  CRITICAL: {
    label: "Critical",
    bgClass: "bg-red-500/10",
    textClass: "text-red-500",
  },
} as const;

// Helper function to get status config
export function getStatusConfig<T extends Record<string, { label: string; bgClass: string; textClass: string }>>(
  config: T,
  status: keyof T
): { label: string; bgClass: string; textClass: string } {
  return config[status] ?? { label: String(status), bgClass: "bg-gray-500/10", textClass: "text-gray-400" };
}
