"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Tag,
  Plus,
  Search,
  Percent,
  DollarSign,
  Calendar,
  MoreVertical,
  Copy,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { PosCard, PosCardContent, PosCardHeader } from "@/components/pos/PosCard";
import { useToast, DiscountsSkeleton } from "@/components/pos";
import type { Discount } from "@/types/pos";

export default function DiscountsPage() {
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const toast = useToast();

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [newDiscount, setNewDiscount] = useState<{
    name: string;
    code: string;
    type: "PERCENTAGE" | "FIXED" | "BOGO";
    value: number;
    minOrderCents: number;
    isActive: boolean;
  }>({
    name: "",
    code: "",
    type: "PERCENTAGE",
    value: 0,
    minOrderCents: 0,
    isActive: true,
  });

  const fetchDiscounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/pos/tenants/${tenantSlug}/discounts`);
      const data = await res.json();
      if (data.success) {
        setDiscounts(data.discounts);
      }
    } catch (error) {
      console.error("Failed to fetch discounts:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/pos/tenants/${tenantSlug}/discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDiscount.name,
          code: newDiscount.code || null,
          type: newDiscount.type,
          value: newDiscount.type === "PERCENTAGE" ? newDiscount.value * 100 : newDiscount.value * 100,
          minOrderCents: newDiscount.minOrderCents * 100 || null,
          isActive: newDiscount.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDiscounts();
        setShowAddModal(false);
        setNewDiscount({
          name: "",
          code: "",
          type: "PERCENTAGE",
          value: 0,
          minOrderCents: 0,
          isActive: true,
        });
        toast.success("Discount created successfully");
      } else {
        toast.error(data.error || "Failed to create discount");
      }
    } catch (error) {
      console.error("Failed to create discount:", error);
      toast.error("Network error. Please try again.");
    }
  };

  const handleToggleActive = async (discount: Discount) => {
    try {
      const res = await fetch(`/api/pos/tenants/${tenantSlug}/discounts/${discount.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !discount.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDiscounts();
        toast.success(discount.isActive ? "Discount deactivated" : "Discount activated");
      } else {
        toast.error(data.error || "Failed to update discount");
      }
    } catch (error) {
      console.error("Failed to toggle discount:", error);
      toast.error("Network error. Please try again.");
    }
  };

  const handleDelete = async (discountId: string) => {
    try {
      const res = await fetch(`/api/pos/tenants/${tenantSlug}/discounts/${discountId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchDiscounts();
        toast.success("Discount deleted");
      } else {
        toast.error(data.error || "Failed to delete discount");
      }
    } catch (error) {
      console.error("Failed to delete discount:", error);
      toast.error("Network error. Please try again.");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatValue = (discount: Discount) => {
    if (discount.type === "PERCENTAGE") {
      return `${(discount.value / 100).toFixed(0)}%`;
    } else if (discount.type === "FIXED") {
      return `AED ${(discount.value / 100).toFixed(2)}`;
    } else {
      return "Buy 1 Get 1";
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "PERCENTAGE":
        return "bg-blue-500/20 text-blue-400";
      case "FIXED":
        return "bg-emerald-500/20 text-emerald-400";
      case "BOGO":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const filteredDiscounts = discounts.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.code && d.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeDiscounts = filteredDiscounts.filter((d) => d.isActive);
  const inactiveDiscounts = filteredDiscounts.filter((d) => !d.isActive);

  if (loading) {
    return <DiscountsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Tag className="w-7 h-7 text-rose-500" />
            Discounts & Promotions
          </h1>
          <p className="text-sm text-[var(--pos-muted)] mt-1">
            Create and manage discount codes
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--pos-accent)] text-white font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Create Discount
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <PosCard className="p-4">
          <div className="text-sm text-[var(--pos-muted)]">Active Discounts</div>
          <div className="text-2xl font-bold mt-1 text-emerald-500">
            {activeDiscounts.length}
          </div>
        </PosCard>
        <PosCard className="p-4">
          <div className="text-sm text-[var(--pos-muted)]">Total Used</div>
          <div className="text-2xl font-bold mt-1">
            {discounts.reduce((sum, d) => sum + d.usageCount, 0)}
          </div>
        </PosCard>
        <PosCard className="p-4">
          <div className="text-sm text-[var(--pos-muted)]">Percentage Off</div>
          <div className="text-2xl font-bold mt-1">
            {discounts.filter((d) => d.type === "PERCENTAGE").length}
          </div>
        </PosCard>
        <PosCard className="p-4">
          <div className="text-sm text-[var(--pos-muted)]">Fixed Amount</div>
          <div className="text-2xl font-bold mt-1">
            {discounts.filter((d) => d.type === "FIXED").length}
          </div>
        </PosCard>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pos-muted)]" />
        <input
          type="text"
          placeholder="Search discounts by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--pos-bg)] border border-[var(--pos-border)] focus:border-[var(--pos-accent)] focus:outline-none"
        />
      </div>

      {/* Discounts List */}
      <div className="space-y-4">
        {activeDiscounts.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--pos-muted)] mb-3">Active Discounts</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeDiscounts.map((discount) => (
                <PosCard key={discount.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{discount.name}</h3>
                      {discount.code && (
                        <div className="flex items-center gap-2 mt-1">
                          <code className="px-2 py-1 rounded bg-[var(--pos-bg)] text-sm font-mono">
                            {discount.code}
                          </code>
                          <button
                            onClick={() => copyCode(discount.code!)}
                            className="p-1 rounded hover:bg-[var(--pos-border)]"
                          >
                            {copiedCode === discount.code ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-[var(--pos-muted)]" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(discount)}
                        className="p-2 rounded-lg hover:bg-[var(--pos-border)]"
                        title="Deactivate"
                      >
                        <X className="w-4 h-4 text-[var(--pos-muted)]" />
                      </button>
                      <button
                        onClick={() => handleDelete(discount.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getTypeBadge(discount.type)}`}>
                        {discount.type}
                      </span>
                      <span className="text-lg font-bold text-[var(--pos-accent)]">
                        {formatValue(discount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--pos-muted)]">
                    <span>Used {discount.usageCount} times</span>
                    {discount.maxUsageCount && (
                      <span>Max: {discount.maxUsageCount}</span>
                    )}
                  </div>
                </PosCard>
              ))}
            </div>
          </div>
        )}

        {inactiveDiscounts.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--pos-muted)] mb-3">Inactive Discounts</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveDiscounts.map((discount) => (
                <PosCard key={discount.id} className="p-4 opacity-60">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{discount.name}</h3>
                      {discount.code && (
                        <code className="px-2 py-1 rounded bg-[var(--pos-bg)] text-sm font-mono mt-1 inline-block">
                          {discount.code}
                        </code>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleActive(discount)}
                      className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-500 text-sm font-semibold"
                    >
                      Activate
                    </button>
                  </div>
                  <div className="mt-3 text-sm">
                    {formatValue(discount)} off
                  </div>
                </PosCard>
              ))}
            </div>
          </div>
        )}
      </div>

      {filteredDiscounts.length === 0 && (
        <div className="text-center py-12 text-[var(--pos-muted)]">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No discounts found</p>
          <p className="text-sm mt-1">Create your first discount to get started</p>
        </div>
      )}

      {/* Add Discount Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--pos-bg2)] rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-[var(--pos-border)] flex items-center justify-between">
              <h2 className="text-xl font-bold">Create Discount</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-[var(--pos-border)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={newDiscount.name}
                  onChange={(e) => setNewDiscount({ ...newDiscount, name: e.target.value })}
                  placeholder="Summer Sale"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--pos-bg)] border border-[var(--pos-border)] focus:border-[var(--pos-accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Code (optional)</label>
                <input
                  type="text"
                  value={newDiscount.code}
                  onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER20"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--pos-bg)] border border-[var(--pos-border)] focus:border-[var(--pos-accent)] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["PERCENTAGE", "FIXED", "BOGO"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewDiscount({ ...newDiscount, type })}
                      className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                        newDiscount.type === type
                          ? "border-[var(--pos-accent)] bg-[var(--pos-accent)]/20 text-[var(--pos-accent)]"
                          : "border-[var(--pos-border)] hover:border-[var(--pos-accent)]"
                      }`}
                    >
                      {type === "PERCENTAGE" && <Percent className="w-4 h-4 inline mr-1" />}
                      {type === "FIXED" && <DollarSign className="w-4 h-4 inline mr-1" />}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  {newDiscount.type === "PERCENTAGE" ? "Percentage Off" : "Amount Off (AED)"}
                </label>
                <input
                  type="number"
                  value={newDiscount.value}
                  onChange={(e) => setNewDiscount({ ...newDiscount, value: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max={newDiscount.type === "PERCENTAGE" ? 100 : undefined}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--pos-bg)] border border-[var(--pos-border)] focus:border-[var(--pos-accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Minimum Order (AED)</label>
                <input
                  type="number"
                  value={newDiscount.minOrderCents}
                  onChange={(e) => setNewDiscount({ ...newDiscount, minOrderCents: parseFloat(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--pos-bg)] border border-[var(--pos-border)] focus:border-[var(--pos-accent)] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--pos-border)] font-semibold hover:bg-[var(--pos-border)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--pos-accent)] text-white font-semibold hover:opacity-90"
                >
                  Create Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
