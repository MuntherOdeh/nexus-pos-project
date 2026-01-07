"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatMoney } from "@/lib/pos/format";
import { formatDate } from "@/lib/utils";
import { PosCard, PosCardContent, PosCardHeader } from "@/components/pos/PosCard";
import { StatusBadge } from "@/components/pos/StatusBadge";

type InvoiceLine = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

type InvoiceRow = {
  id: string;
  number: string;
  status: string;
  customerName: string;
  customerEmail?: string | null;
  issuedAt: string;
  dueAt?: string | null;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  lines: InvoiceLine[];
};

export function InvoicesView({ invoices }: { invoices: InvoiceRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(invoices[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesQuery =
        !q ||
        inv.number.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerEmail || "").toLowerCase().includes(q);
      const matchesStatus = status === "ALL" ? true : inv.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [invoices, query, status]);

  const selected = useMemo(
    () => filtered.find((inv) => inv.id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  );

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, inv) => {
        acc.count += 1;
        acc.totalCents += inv.totalCents;
        return acc;
      },
      { count: 0, totalCents: 0 }
    );
  }, [filtered]);

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <PosCard className="lg:col-span-3">
        <PosCardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Invoices</div>
              <div className="text-xs text-[var(--pos-muted)]">
                {totals.count} invoices • {formatMoney({ cents: totals.totalCents, currency: invoices[0]?.currency || "AED" })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pos-muted)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search invoice, customer, email…"
                  className="w-full sm:w-72 pl-9 pr-4 py-2.5 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 text-sm text-[var(--pos-text)] placeholder:text-[var(--pos-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--pos-accent2)]"
                />
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full sm:w-44 px-3 py-2.5 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 text-sm text-[var(--pos-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--pos-accent2)]"
              >
                {["ALL", "DRAFT", "SENT", "PAID", "OVERDUE", "VOID"].map((s) => (
                  <option key={s} value={s}>
                    {s === "ALL" ? "All statuses" : s}
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
                  <th className="py-2 pr-4 font-medium">Invoice</th>
                  <th className="py-2 pr-4 font-medium">Customer</th>
                  <th className="py-2 pr-4 font-medium">Issued</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedId(inv.id)}
                    className={`border-t border-[color:var(--pos-border)] cursor-pointer hover:bg-white/5 ${
                      inv.id === selected?.id ? "bg-white/5" : ""
                    }`}
                  >
                    <td className="py-3 pr-4 font-mono text-xs">{inv.number}</td>
                    <td className="py-3 pr-4">{inv.customerName}</td>
                    <td className="py-3 pr-4">{formatDate(inv.issuedAt)}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-3 text-right font-semibold">
                      {formatMoney({ cents: inv.totalCents, currency: inv.currency })}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[var(--pos-muted)]">
                      No invoices match your filters.
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
          <div className="text-sm font-semibold">Invoice details</div>
          <div className="text-xs text-[var(--pos-muted)]">Select an invoice to preview line items.</div>
        </PosCardHeader>
        <PosCardContent>
          {!selected ? (
            <div className="text-sm text-[var(--pos-muted)]">Select an invoice from the table.</div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-xs text-[var(--pos-muted)]">{selected.number}</div>
                  <div className="text-lg font-bold mt-1">{selected.customerName}</div>
                  {selected.customerEmail && (
                    <div className="text-xs text-[var(--pos-muted)] mt-1">{selected.customerEmail}</div>
                  )}
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 p-4">
                  <div className="text-xs text-[var(--pos-muted)]">Issued</div>
                  <div className="font-semibold mt-1">{formatDate(selected.issuedAt)}</div>
                </div>
                <div className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 p-4">
                  <div className="text-xs text-[var(--pos-muted)]">Due</div>
                  <div className="font-semibold mt-1">{selected.dueAt ? formatDate(selected.dueAt) : "—"}</div>
                </div>
              </div>

              <div className="border border-[color:var(--pos-border)] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 text-xs text-[var(--pos-muted)] bg-white/5">Line items</div>
                <div className="divide-y divide-[color:var(--pos-border)]">
                  {selected.lines.map((line, idx) => (
                    <div key={`${line.description}-${idx}`} className="px-4 py-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold">{line.description}</div>
                        <div className="text-xs text-[var(--pos-muted)] mt-1">
                          {line.quantity} × {formatMoney({ cents: line.unitPriceCents, currency: selected.currency })}
                        </div>
                      </div>
                      <div className="font-semibold">
                        {formatMoney({ cents: line.lineTotalCents, currency: selected.currency })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-[var(--pos-muted)]">
                  <span>Subtotal</span>
                  <span className="text-[var(--pos-text)] font-semibold">
                    {formatMoney({ cents: selected.subtotalCents, currency: selected.currency })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[var(--pos-muted)]">
                  <span>Tax</span>
                  <span className="text-[var(--pos-text)] font-semibold">
                    {formatMoney({ cents: selected.taxCents, currency: selected.currency })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--pos-muted)]">Total</span>
                  <span className="text-[var(--pos-text)] font-bold text-lg">
                    {formatMoney({ cents: selected.totalCents, currency: selected.currency })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </PosCardContent>
      </PosCard>
    </div>
  );
}

