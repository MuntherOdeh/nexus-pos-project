"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Search,
  FileText,
  Plus,
  Download,
  Send,
  Eye,
  MoreHorizontal,
  Calendar,
  User,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Filter,
  ArrowUpDown,
  Mail,
  Printer,
  X,
  Info,
} from "lucide-react";
import { formatMoney } from "@/lib/pos/format";
import { cn } from "@/lib/utils";

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

const STATUS_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string; label: string }> = {
  DRAFT: { icon: FileText, color: "text-slate-500", bgColor: "bg-slate-500/10", label: "Draft" },
  SENT: { icon: Send, color: "text-blue-500", bgColor: "bg-blue-500/10", label: "Sent" },
  PAID: { icon: CheckCircle2, color: "text-primary-500", bgColor: "bg-primary-500/10", label: "Paid" },
  OVERDUE: { icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-500/10", label: "Overdue" },
  VOID: { icon: XCircle, color: "text-[var(--pos-muted)]", bgColor: "bg-[var(--pos-bg)]", label: "Void" },
};

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  const Icon = config.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
      config.bgColor, config.color
    )}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

export function InvoicesView({ invoices: initialInvoices, tenantSlug }: { invoices: InvoiceRow[]; tenantSlug: string }) {
  const [invoices, setInvoices] = useState<InvoiceRow[]>(initialInvoices);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "amount" | "customer">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [toast, setToast] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [toast]);

  const showMessage = (message: string) => {
    setToast(message);
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    setActionLoading(invoiceId);
    try {
      const response = await fetch(`/api/pos/tenants/${tenantSlug}/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setInvoices(prev => prev.map(inv =>
          inv.id === invoiceId ? { ...inv, status: newStatus } : inv
        ));
        showMessage(`Invoice ${newStatus === "SENT" ? "sent" : newStatus === "PAID" ? "marked as paid" : "updated"}`);
      } else {
        showMessage(data.error || "Failed to update invoice");
      }
    } catch {
      showMessage("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const exportInvoices = () => {
    // Export filtered invoices as CSV
    const filteredData = invoices.filter((inv) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q ||
        inv.number.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerEmail || "").toLowerCase().includes(q);
      const matchesStatus = status === "ALL" ? true : inv.status === status;
      return matchesQuery && matchesStatus;
    });

    const csv = [
      ["Invoice #", "Customer", "Email", "Status", "Issued", "Due", "Subtotal", "Tax", "Total"],
      ...filteredData.map(inv => [
        inv.number,
        inv.customerName,
        inv.customerEmail || "",
        inv.status,
        formatDate(inv.issuedAt),
        inv.dueAt ? formatDate(inv.dueAt) : "",
        (inv.subtotalCents / 100).toFixed(2),
        (inv.taxCents / 100).toFixed(2),
        (inv.totalCents / 100).toFixed(2),
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage("Invoices exported successfully");
  };

  const handleInvoiceCreated = (newInvoice: InvoiceRow) => {
    setInvoices(prev => [newInvoice, ...prev]);
    setShowCreateModal(false);
    showMessage("Invoice created successfully");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = invoices.filter((inv) => {
      const matchesQuery =
        !q ||
        inv.number.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerEmail || "").toLowerCase().includes(q);
      const matchesStatus = status === "ALL" ? true : inv.status === status;
      return matchesQuery && matchesStatus;
    });

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") {
        cmp = new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
      } else if (sortBy === "amount") {
        cmp = a.totalCents - b.totalCents;
      } else if (sortBy === "customer") {
        cmp = a.customerName.localeCompare(b.customerName);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [invoices, query, status, sortBy, sortDir]);

  const selected = useMemo(
    () => filtered.find((inv) => inv.id === selectedId) || null,
    [filtered, selectedId]
  );

  const stats = useMemo(() => {
    const draft = invoices.filter((i) => i.status === "DRAFT").length;
    const sent = invoices.filter((i) => i.status === "SENT").length;
    const paid = invoices.filter((i) => i.status === "PAID").length;
    const overdue = invoices.filter((i) => i.status === "OVERDUE").length;
    const totalPaid = invoices
      .filter((i) => i.status === "PAID")
      .reduce((sum, i) => sum + i.totalCents, 0);
    const totalOutstanding = invoices
      .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
      .reduce((sum, i) => sum + i.totalCents, 0);
    return { draft, sent, paid, overdue, totalPaid, totalOutstanding };
  }, [invoices]);

  const currency = invoices[0]?.currency || "USD";

  const toggleSort = (field: "date" | "amount" | "customer") => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)]">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Invoices</h1>
              <p className="text-sm text-[var(--pos-muted)]">
                {invoices.length} total invoices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportInvoices}
              className="px-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] font-medium flex items-center gap-2 hover:bg-[var(--pos-bg)] transition-colors"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 rounded-xl bg-primary-500 text-white font-semibold flex items-center gap-2 hover:bg-primary-600 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              New Invoice
            </button>
          </div>
        </div>

        {/* Stats */}
        {invoices.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4">
              <div className="flex items-center gap-2 text-[var(--pos-muted)] text-sm mb-1">
                <FileText className="w-4 h-4" />
                Draft
              </div>
              <div className="text-2xl font-bold">{stats.draft}</div>
            </div>
            <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4">
              <div className="flex items-center gap-2 text-blue-500 text-sm mb-1">
                <Send className="w-4 h-4" />
                Sent
              </div>
              <div className="text-2xl font-bold">{stats.sent}</div>
            </div>
            <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4">
              <div className="flex items-center gap-2 text-primary-500 text-sm mb-1">
                <CheckCircle2 className="w-4 h-4" />
                Paid
              </div>
              <div className="text-2xl font-bold text-primary-500">{formatMoney({ cents: stats.totalPaid, currency })}</div>
            </div>
            <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4">
              <div className="flex items-center gap-2 text-amber-500 text-sm mb-1">
                <Clock className="w-4 h-4" />
                Outstanding
              </div>
              <div className="text-2xl font-bold text-amber-500">{formatMoney({ cents: stats.totalOutstanding, currency })}</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 p-4 border-b border-[color:var(--pos-border)] bg-[var(--pos-bg)]">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pos-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search invoices, customers..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] text-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="VOID">Void</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Invoice List */}
        <div className="flex-1 overflow-auto border-r border-[color:var(--pos-border)]">
          {invoices.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 rounded-3xl bg-purple-500/10 flex items-center justify-center mb-6">
                <FileText className="w-12 h-12 text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Invoices Yet</h2>
              <p className="text-[var(--pos-muted)] max-w-md mb-6">
                Create your first invoice to start tracking payments and managing your business finances.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold flex items-center gap-2 hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create First Invoice
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <Search className="w-16 h-16 text-[var(--pos-muted)] mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Results</h3>
              <p className="text-[var(--pos-muted)]">No invoices match your search criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-[color:var(--pos-border)]">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-[var(--pos-muted)] bg-[var(--pos-bg)] sticky top-0">
                <div className="col-span-3">Invoice</div>
                <button onClick={() => toggleSort("customer")} className="col-span-3 flex items-center gap-1 hover:text-[var(--pos-text)]">
                  Customer
                  <ArrowUpDown className="w-3 h-3" />
                </button>
                <button onClick={() => toggleSort("date")} className="col-span-2 flex items-center gap-1 hover:text-[var(--pos-text)]">
                  Date
                  <ArrowUpDown className="w-3 h-3" />
                </button>
                <div className="col-span-2">Status</div>
                <button onClick={() => toggleSort("amount")} className="col-span-2 flex items-center gap-1 justify-end hover:text-[var(--pos-text)]">
                  Amount
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </div>

              {/* Invoice Rows */}
              {filtered.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => setSelectedId(inv.id)}
                  className={cn(
                    "w-full grid grid-cols-12 gap-4 px-4 py-4 text-left transition-colors hover:bg-[var(--pos-bg)]",
                    selectedId === inv.id && "bg-primary-500/5 border-l-4 border-l-primary-500"
                  )}
                >
                  <div className="col-span-3">
                    <div className="font-semibold">{inv.number}</div>
                    <div className="text-xs text-[var(--pos-muted)]">{inv.lines.length} items</div>
                  </div>
                  <div className="col-span-3">
                    <div className="font-medium truncate">{inv.customerName}</div>
                    {inv.customerEmail && (
                      <div className="text-xs text-[var(--pos-muted)] truncate">{inv.customerEmail}</div>
                    )}
                  </div>
                  <div className="col-span-2" suppressHydrationWarning>
                    <div className="text-sm">{formatDate(inv.issuedAt)}</div>
                    {inv.dueAt && (
                      <div className="text-xs text-[var(--pos-muted)]">Due: {formatDate(inv.dueAt)}</div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="font-bold text-lg">{formatMoney({ cents: inv.totalCents, currency: inv.currency })}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="w-[400px] flex-shrink-0 overflow-auto bg-[var(--pos-panel-solid)]">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <Eye className="w-16 h-16 text-[var(--pos-muted)] mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select an Invoice</h3>
              <p className="text-sm text-[var(--pos-muted)]">Click on an invoice to view details</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Invoice Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-[var(--pos-muted)] font-mono">{selected.number}</div>
                  <h2 className="text-xl font-bold mt-1">{selected.customerName}</h2>
                  {selected.customerEmail && (
                    <div className="text-sm text-[var(--pos-muted)] flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3" />
                      {selected.customerEmail}
                    </div>
                  )}
                </div>
                <StatusBadge status={selected.status} />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4" suppressHydrationWarning>
                  <div className="text-xs text-[var(--pos-muted)] flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3" />
                    Issued
                  </div>
                  <div className="font-semibold">{formatDate(selected.issuedAt)}</div>
                </div>
                <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4" suppressHydrationWarning>
                  <div className="text-xs text-[var(--pos-muted)] flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3" />
                    Due
                  </div>
                  <div className="font-semibold">{selected.dueAt ? formatDate(selected.dueAt) : "—"}</div>
                </div>
              </div>

              {/* Line Items */}
              <div className="rounded-xl border border-[color:var(--pos-border)] overflow-hidden">
                <div className="px-4 py-3 bg-[var(--pos-bg)] text-sm font-medium text-[var(--pos-muted)]">
                  Line Items
                </div>
                <div className="divide-y divide-[color:var(--pos-border)]">
                  {selected.lines.map((line, idx) => (
                    <div key={idx} className="px-4 py-3 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{line.description}</div>
                        <div className="text-xs text-[var(--pos-muted)] mt-1">
                          {line.quantity} x {formatMoney({ cents: line.unitPriceCents, currency: selected.currency })}
                        </div>
                      </div>
                      <div className="font-semibold">
                        {formatMoney({ cents: line.lineTotalCents, currency: selected.currency })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--pos-muted)]">Subtotal</span>
                  <span className="font-medium">{formatMoney({ cents: selected.subtotalCents, currency: selected.currency })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--pos-muted)]">Tax</span>
                  <span className="font-medium">{formatMoney({ cents: selected.taxCents, currency: selected.currency })}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-3 border-t border-[color:var(--pos-border)]">
                  <span>Total</span>
                  <span className="text-primary-500">{formatMoney({ cents: selected.totalCents, currency: selected.currency })}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-3 rounded-xl border border-[color:var(--pos-border)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--pos-bg)] transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={exportInvoices}
                  className="px-4 py-3 rounded-xl border border-[color:var(--pos-border)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--pos-bg)] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                {selected.status === "DRAFT" && (
                  <button
                    onClick={() => updateInvoiceStatus(selected.id, "SENT")}
                    disabled={actionLoading === selected.id}
                    className="col-span-2 px-4 py-3 rounded-xl bg-blue-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === selected.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Invoice
                  </button>
                )}
                {(selected.status === "SENT" || selected.status === "OVERDUE") && (
                  <button
                    onClick={() => updateInvoiceStatus(selected.id, "PAID")}
                    disabled={actionLoading === selected.id}
                    className="col-span-2 px-4 py-3 rounded-xl bg-primary-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === selected.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="px-6 py-3 rounded-2xl bg-[var(--pos-panel-solid)] border border-[color:var(--pos-border)] shadow-xl flex items-center gap-3">
            <Info className="w-5 h-5 text-primary-500" />
            <span className="font-medium">{toast}</span>
            <button onClick={() => setToast(null)} className="p-1 rounded-lg hover:bg-[var(--pos-border)]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <CreateInvoiceModal
          tenantSlug={tenantSlug}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleInvoiceCreated}
        />
      )}
    </div>
  );
}

// Create Invoice Modal Component
function CreateInvoiceModal({
  tenantSlug,
  onClose,
  onCreated,
}: {
  tenantSlug: string;
  onClose: () => void;
  onCreated: (invoice: InvoiceRow) => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [lines, setLines] = useState([{ description: "", quantity: 1, unitPriceCents: 0 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLine = () => {
    setLines([...lines, { description: "", quantity: 1, unitPriceCents: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: string, value: string | number) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const subtotal = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError("Customer name is required");
      return;
    }
    if (lines.some(l => !l.description.trim() || l.unitPriceCents <= 0)) {
      setError("All line items must have description and price");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/pos/tenants/${tenantSlug}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || null,
          lines: lines.map(l => ({
            description: l.description,
            quantity: l.quantity,
            unitPriceCents: l.unitPriceCents,
          })),
          taxPercent: 5,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onCreated({
          id: data.invoice.id,
          number: data.invoice.number,
          status: data.invoice.status,
          customerName: data.invoice.customerName,
          customerEmail: data.invoice.customerEmail,
          issuedAt: data.invoice.issuedAt,
          dueAt: data.invoice.dueAt,
          subtotalCents: data.invoice.subtotalCents,
          taxCents: data.invoice.taxCents,
          totalCents: data.invoice.totalCents,
          currency: data.invoice.currency,
          lines: data.invoice.lines.map((l: { description: string; quantity: number; unitPriceCents: number; lineTotalCents: number }) => ({
            description: l.description,
            quantity: l.quantity,
            unitPriceCents: l.unitPriceCents,
            lineTotalCents: l.lineTotalCents,
          })),
        });
      } else {
        setError(data.error || "Failed to create invoice");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--pos-panel-solid)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[color:var(--pos-border)] flex items-center justify-between">
          <h2 className="text-xl font-bold">Create Invoice</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--pos-bg)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Customer Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Customer Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                className="w-full px-4 py-3 rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] focus:border-primary-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@email.com"
                className="w-full px-4 py-3 rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold">Line Items</label>
              <button
                type="button"
                onClick={addLine}
                className="text-sm text-primary-500 hover:text-primary-400 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Line
              </button>
            </div>
            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => updateLine(index, "description", e.target.value)}
                    placeholder="Description"
                    className="flex-1 px-4 py-3 rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] focus:border-primary-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, "quantity", parseInt(e.target.value) || 1)}
                    min="1"
                    placeholder="Qty"
                    className="w-20 px-4 py-3 rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] focus:border-primary-500 focus:outline-none text-center"
                  />
                  <input
                    type="number"
                    value={line.unitPriceCents / 100}
                    onChange={(e) => updateLine(index, "unitPriceCents", Math.round(parseFloat(e.target.value) * 100) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    className="w-28 px-4 py-3 rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] focus:border-primary-500 focus:outline-none"
                  />
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="p-3 rounded-xl hover:bg-red-500/10 text-red-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--pos-muted)]">Subtotal</span>
              <span className="font-medium">{(subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--pos-muted)]">Tax (5%)</span>
              <span className="font-medium">{(tax / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-[color:var(--pos-border)]">
              <span>Total</span>
              <span className="text-primary-500">{(total / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-[color:var(--pos-border)] font-medium hover:bg-[var(--pos-bg)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Invoice
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
