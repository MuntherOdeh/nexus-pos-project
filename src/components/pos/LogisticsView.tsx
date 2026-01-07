"use client";

import React, { useMemo, useState } from "react";
import { Search, Truck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PosCard, PosCardContent, PosCardHeader } from "@/components/pos/PosCard";
import { StatusBadge } from "@/components/pos/StatusBadge";

type MovementLine = {
  productName: string;
  sku?: string | null;
  quantity: number;
};

type MovementRow = {
  id: string;
  type: string;
  status: string;
  reference: string;
  warehouseName: string;
  notes?: string | null;
  createdAt: string;
  lines: MovementLine[];
};

function typeLabel(type: string): string {
  switch (type) {
    case "RECEIPT":
      return "Receipt";
    case "DELIVERY":
      return "Delivery";
    case "ADJUSTMENT":
      return "Adjustment";
    case "TRANSFER":
      return "Transfer";
    default:
      return type;
  }
}

export function LogisticsView({ movements }: { movements: MovementRow[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(movements[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return movements.filter((m) => {
      const matchesQuery = !q || m.reference.toLowerCase().includes(q) || m.warehouseName.toLowerCase().includes(q);
      const matchesType = type === "ALL" ? true : m.type === type;
      return matchesQuery && matchesType;
    });
  }, [movements, query, type]);

  const selected = useMemo(
    () => filtered.find((m) => m.id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  );

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <PosCard className="lg:col-span-3">
        <PosCardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Logistics</div>
              <div className="text-xs text-[var(--pos-muted)]">Receipts, deliveries, and adjustments</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pos-muted)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by reference or warehouse…"
                  className="w-full sm:w-72 pl-9 pr-4 py-2.5 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 text-sm text-[var(--pos-text)] placeholder:text-[var(--pos-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--pos-accent2)]"
                />
              </div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full sm:w-44 px-3 py-2.5 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 text-sm text-[var(--pos-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--pos-accent2)]"
              >
                {["ALL", "RECEIPT", "DELIVERY", "ADJUSTMENT", "TRANSFER"].map((t) => (
                  <option key={t} value={t}>
                    {t === "ALL" ? "All types" : typeLabel(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </PosCardHeader>

        <PosCardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--pos-muted)]">
                  <th className="py-2 pr-4 font-medium">Reference</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Warehouse</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`border-t border-[color:var(--pos-border)] cursor-pointer hover:bg-white/5 ${
                      m.id === selected?.id ? "bg-white/5" : ""
                    }`}
                  >
                    <td className="py-3 pr-4 font-mono text-xs">{m.reference}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[var(--pos-muted)]" />
                        <span className="font-semibold">{typeLabel(m.type)}</span>
                      </span>
                    </td>
                    <td className="py-3 pr-4">{m.warehouseName}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="py-3 text-right text-[var(--pos-muted)]">{formatDate(m.createdAt)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[var(--pos-muted)]">
                      No logistics records found.
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
          <div className="text-sm font-semibold">Movement details</div>
          <div className="text-xs text-[var(--pos-muted)]">Line items & notes</div>
        </PosCardHeader>
        <PosCardContent>
          {!selected ? (
            <div className="text-sm text-[var(--pos-muted)]">Select a record from the table.</div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-xs text-[var(--pos-muted)]">{selected.reference}</div>
                  <div className="text-lg font-bold mt-1">{typeLabel(selected.type)}</div>
                  <div className="text-xs text-[var(--pos-muted)] mt-1">
                    {selected.warehouseName} • {formatDate(selected.createdAt)}
                  </div>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              {selected.notes && (
                <div className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 p-4 text-sm">
                  <div className="text-xs text-[var(--pos-muted)] mb-1">Notes</div>
                  <div>{selected.notes}</div>
                </div>
              )}

              <div className="border border-[color:var(--pos-border)] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 text-xs text-[var(--pos-muted)] bg-white/5">Line items</div>
                <div className="divide-y divide-[color:var(--pos-border)]">
                  {selected.lines.map((line, idx) => (
                    <div key={`${line.productName}-${idx}`} className="px-4 py-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold">{line.productName}</div>
                        <div className="text-xs text-[var(--pos-muted)] mt-1 font-mono">{line.sku || "—"}</div>
                      </div>
                      <div className={`font-semibold ${line.quantity < 0 ? "text-rose-200" : "text-emerald-200"}`}>
                        {line.quantity}
                      </div>
                    </div>
                  ))}
                  {selected.lines.length === 0 && (
                    <div className="px-4 py-6 text-sm text-[var(--pos-muted)]">No line items.</div>
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

