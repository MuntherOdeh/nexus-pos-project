import React from "react";
import { cn } from "@/lib/utils";

export function PosCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[color:var(--pos-border)] bg-[var(--pos-panel)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PosCardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-5 border-b border-[color:var(--pos-border)]", className)}>{children}</div>;
}

export function PosCardContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

