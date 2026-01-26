import { OrderListSkeleton } from "@/components/pos/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-[var(--pos-border)] rounded animate-pulse" />
          <div className="h-4 w-56 bg-[var(--pos-border)] rounded animate-pulse" />
        </div>
        <div className="h-10 w-24 bg-[var(--pos-border)] rounded-xl animate-pulse" />
      </div>
      <OrderListSkeleton count={6} />
    </div>
  );
}
