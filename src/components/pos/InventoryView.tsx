"use client";

import React, { useMemo, useState } from "react";
import { Search, Tag } from "lucide-react";
import { formatMoney } from "@/lib/pos/format";
import { PosCard, PosCardContent, PosCardHeader } from "@/components/pos/PosCard";

type WarehouseStock = {
  warehouseName: string;
  onHand: number;
  reserved: number;
  reorderPoint: number;
};

type ProductRow = {
  id: string;
  name: string;
  sku?: string | null;
  priceCents: number;
  currency: string;
  isActive: boolean;
  onHand: number;
  reserved: number;
  reorderPoint: number;
  warehouses: WarehouseStock[];
};

export function InventoryView({ products }: { products: ProductRow[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(products[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q)
      );
    });
  }, [products, query]);

  const selected = useMemo(
    () => filtered.find((p) => p.id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  );

  const alerts = useMemo(() => {
    return filtered.filter((p) => p.reorderPoint > 0 && p.onHand <= p.reorderPoint).length;
  }, [filtered]);

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <PosCard className="lg:col-span-3">
        <PosCardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Inventory & Pricing</div>
              <div className="text-xs text-[var(--pos-muted)]">
                {filtered.length} items • {alerts} low stock alerts
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pos-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search items or SKU…"
                className="w-full sm:w-72 pl-9 pr-4 py-2.5 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 text-sm text-[var(--pos-text)] placeholder:text-[var(--pos-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--pos-accent2)]"
              />
            </div>
          </div>
        </PosCardHeader>

        <PosCardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--pos-muted)]">
                  <th className="py-2 pr-4 font-medium">Item</th>
                  <th className="py-2 pr-4 font-medium">SKU</th>
                  <th className="py-2 pr-4 font-medium">Price</th>
                  <th className="py-2 pr-4 font-medium">On hand</th>
                  <th className="py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const isLow = p.reorderPoint > 0 && p.onHand <= p.reorderPoint;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`border-t border-[color:var(--pos-border)] cursor-pointer hover:bg-white/5 ${
                        p.id === selected?.id ? "bg-white/5" : ""
                      }`}
                    >
                      <td className="py-3 pr-4">
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-[var(--pos-muted)] mt-0.5">
                          Reserved: {p.reserved}
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-[var(--pos-muted)]">{p.sku || "—"}</td>
                      <td className="py-3 pr-4 font-semibold">
                        {formatMoney({ cents: p.priceCents, currency: p.currency })}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={isLow ? "text-amber-200 font-semibold" : "font-semibold"}>
                          {p.onHand}
                        </span>
                        {p.reorderPoint > 0 && (
                          <span className="text-xs text-[var(--pos-muted)] ml-2">
                            / reorder {p.reorderPoint}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            isLow
                              ? "bg-amber-500/10 text-amber-200 border-amber-400/20"
                              : "bg-emerald-500/10 text-emerald-200 border-emerald-400/20"
                          }`}
                        >
                          {isLow ? "Low stock" : "OK"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[var(--pos-muted)]">
                      No items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </PosCardContent>
      </PosCard>

      <PosCard className="lg:col-span-2">
        <PosCardHeader>
          <div className="text-sm font-semibold">Item details</div>
          <div className="text-xs text-[var(--pos-muted)]">Warehouse view & pricing preview.</div>
        </PosCardHeader>
        <PosCardContent>
          {!selected ? (
            <div className="text-sm text-[var(--pos-muted)]">Select an item from the table.</div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-bold">{selected.name}</div>
                  <div className="text-xs text-[var(--pos-muted)] mt-1 font-mono">{selected.sku || "No SKU"}</div>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Tag className="w-4 h-4" style={{ color: "var(--pos-accent2)" }} />
                  {formatMoney({ cents: selected.priceCents, currency: selected.currency })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                {[
                  { label: "On hand", value: selected.onHand },
                  { label: "Reserved", value: selected.reserved },
                  { label: "Reorder", value: selected.reorderPoint || "—" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 p-4">
                    <div className="text-xs text-[var(--pos-muted)]">{item.label}</div>
                    <div className="font-semibold mt-1">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="border border-[color:var(--pos-border)] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 text-xs text-[var(--pos-muted)] bg-white/5">Warehouses</div>
                <div className="divide-y divide-[color:var(--pos-border)]">
                  {selected.warehouses.map((w) => (
                    <div key={w.warehouseName} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                      <div>
                        <div className="font-semibold">{w.warehouseName}</div>
                        <div className="text-xs text-[var(--pos-muted)] mt-0.5">
                          Reserved {w.reserved} • Reorder {w.reorderPoint || "—"}
                        </div>
                      </div>
                      <div className="font-semibold">{w.onHand}</div>
                    </div>
                  ))}
                  {selected.warehouses.length === 0 && (
                    <div className="px-4 py-6 text-sm text-[var(--pos-muted)]">No warehouse stock found.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </PosCardContent>
      </PosCard>
    </div>
  );
}

