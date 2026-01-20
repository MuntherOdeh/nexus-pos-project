"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Reusable empty state component with icon, title, description, and optional action
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div className="w-20 h-20 rounded-2xl bg-[var(--pos-accent)]/10 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-[var(--pos-accent)]" />
      </div>
      <h3 className="text-xl font-semibold text-[var(--pos-text)] mb-2">
        {title}
      </h3>
      <p className="text-[var(--pos-muted)] max-w-md mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-3 rounded-xl bg-[var(--pos-accent)] text-white font-semibold hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Compact empty state for inline use
 */
export function EmptyStateCompact({
  icon: Icon,
  message,
  className,
}: {
  icon: LucideIcon;
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center text-[var(--pos-muted)]",
        className
      )}
    >
      <Icon className="w-12 h-12 mb-3 opacity-50" />
      <p>{message}</p>
    </div>
  );
}
