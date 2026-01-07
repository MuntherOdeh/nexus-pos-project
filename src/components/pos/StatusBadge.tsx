import React from "react";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  OPEN: { label: "Open", className: "bg-white/5 text-[var(--pos-muted)] border-[color:var(--pos-border)]" },
  IN_KITCHEN: { label: "In kitchen", className: "bg-amber-500/10 text-amber-200 border-amber-400/20" },
  FOR_PAYMENT: { label: "For payment", className: "bg-sky-500/10 text-sky-200 border-sky-400/20" },
  READY: { label: "Ready", className: "bg-emerald-500/10 text-emerald-200 border-emerald-400/20" },

  NEW: { label: "New", className: "bg-white/5 text-[var(--pos-muted)] border-[color:var(--pos-border)]" },
  IN_PROGRESS: { label: "In progress", className: "bg-amber-500/10 text-amber-200 border-amber-400/20" },
  SERVED: { label: "Served", className: "bg-emerald-500/10 text-emerald-200 border-emerald-400/20" },

  DRAFT: { label: "Draft", className: "bg-white/5 text-[var(--pos-muted)] border-[color:var(--pos-border)]" },
  SENT: { label: "Sent", className: "bg-sky-500/10 text-sky-200 border-sky-400/20" },
  PAID: { label: "Paid", className: "bg-emerald-500/10 text-emerald-200 border-emerald-400/20" },
  OVERDUE: { label: "Overdue", className: "bg-rose-500/10 text-rose-200 border-rose-400/20" },
  VOID: { label: "Void", className: "bg-white/5 text-[var(--pos-muted)] border-[color:var(--pos-border)]" },

  CONNECTED: { label: "Connected", className: "bg-emerald-500/10 text-emerald-200 border-emerald-400/20" },
  DISCONNECTED: { label: "Not connected", className: "bg-white/5 text-[var(--pos-muted)] border-[color:var(--pos-border)]" },
  PENDING: { label: "Pending", className: "bg-amber-500/10 text-amber-200 border-amber-400/20" },
  AUTHORIZED: { label: "Authorized", className: "bg-amber-500/10 text-amber-200 border-amber-400/20" },
  CAPTURED: { label: "Captured", className: "bg-emerald-500/10 text-emerald-200 border-emerald-400/20" },
  FAILED: { label: "Failed", className: "bg-rose-500/10 text-rose-200 border-rose-400/20" },
  REFUNDED: { label: "Refunded", className: "bg-white/5 text-[var(--pos-muted)] border-[color:var(--pos-border)]" },

  POSTED: { label: "Posted", className: "bg-emerald-500/10 text-emerald-200 border-emerald-400/20" },
  CANCELLED: { label: "Cancelled", className: "bg-white/5 text-[var(--pos-muted)] border-[color:var(--pos-border)]" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const meta = STATUS_STYLES[status] || {
    label: status,
    className: "bg-white/5 text-[var(--pos-muted)] border-[color:var(--pos-border)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
        meta.className,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
