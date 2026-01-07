import type { PosOrderItemStatus, PosOrderStatus } from "@prisma/client";

export const POS_OPEN_ORDER_STATUSES = ["OPEN", "IN_KITCHEN", "READY", "FOR_PAYMENT"] as const;

export function deriveOrderStatusFromItems(params: {
  items: Array<{ status: PosOrderItemStatus }>;
}): PosOrderStatus {
  const billable = params.items.filter((item) => item.status !== "VOID");
  if (billable.length === 0) return "OPEN";

  const hasKitchenWork = billable.some(
    (item) => item.status === "SENT" || item.status === "IN_PROGRESS"
  );
  if (hasKitchenWork) return "IN_KITCHEN";

  const allServed = billable.every((item) => item.status === "SERVED");
  if (allServed) return "FOR_PAYMENT";

  const allReadyOrServed = billable.every(
    (item) => item.status === "READY" || item.status === "SERVED"
  );
  if (allReadyOrServed) return "READY";

  return "OPEN";
}

