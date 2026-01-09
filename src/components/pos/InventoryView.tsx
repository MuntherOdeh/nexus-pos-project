"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Package,
  Plus,
  Tag,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Trash2,
  Filter,
  ArrowUpDown,
  Eye,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Box,
  Layers,
} from "lucide-react";
import { formatMoney } from "@/lib/pos/format";
import { cn } from "@/lib/utils";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [sortBy, setSortBy] = useState<"name" | "stock" | "price">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = products.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q);

      if (filter === "low") {
        return matchesQuery && p.reorderPoint > 0 && p.onHand <= p.reorderPoint && p.onHand > 0;
      }
      if (filter === "out") {
        return matchesQuery && p.onHand <= 0;
      }
      return matchesQuery;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "stock") cmp = a.onHand - b.onHand;
      else if (sortBy === "price") cmp = a.priceCents - b.priceCents;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [products, query, filter, sortBy, sortDir]);

  const selected = useMemo(
    () => filtered.find((p) => p.id === selectedId) || null,
    [filtered, selectedId]
  );

  const stats = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter((p) => p.reorderPoint > 0 && p.onHand <= p.reorderPoint && p.onHand > 0).length;
    const outOfStock = products.filter((p) => p.onHand <= 0).length;
    const totalValue = products.reduce((sum, p) => sum + p.priceCents * p.onHand, 0);
    return { total, lowStock, outOfStock, totalValue };
  }, [products]);

  const currency = products[0]?.currency || "USD";

  const toggleSort = (field: "name" | "stock" | "price") => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const getStockStatus = (product: ProductRow) => {
    if (product.onHand <= 0) {
      return { label: "Out of Stock", color: "text-red-500", bg: "bg-red-500/10", icon: AlertTriangle };
    }
    if (product.reorderPoint > 0 && product.onHand <= product.reorderPoint) {
      return { label: "Low Stock", color: "text-amber-500", bg: "bg-amber-500/10", icon: TrendingDown };
    }
    return { label: "In Stock", color: "text-primary-500", bg: "bg-primary-500/10", icon: CheckCircle2 };
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)]">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Products & Inventory</h1>
              <p className="text-sm text-[var(--pos-muted)]">
                {products.length} products in catalog
              </p>
            </div>
          </div>

          <button className="px-5 py-3 rounded-xl bg-primary-500 text-white font-semibold flex items-center gap-2 hover:bg-primary-600 transition-colors shadow-lg">
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>

        {/* Stats */}
        {products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4">
              <div className="flex items-center gap-2 text-[var(--pos-muted)] text-sm mb-1">
                <Box className="w-4 h-4" />
                Total Products
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4">
              <div className="flex items-center gap-2 text-amber-500 text-sm mb-1">
                <TrendingDown className="w-4 h-4" />
                Low Stock
              </div>
              <div className="text-2xl font-bold text-amber-500">{stats.lowStock}</div>
            </div>
            <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4">
              <div className="flex items-center gap-2 text-red-500 text-sm mb-1">
                <AlertTriangle className="w-4 h-4" />
                Out of Stock
              </div>
              <div className="text-2xl font-bold text-red-500">{stats.outOfStock}</div>
            </div>
            <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4">
              <div className="flex items-center gap-2 text-primary-500 text-sm mb-1">
                <BarChart3 className="w-4 h-4" />
                Inventory Value
              </div>
              <div className="text-2xl font-bold text-primary-500">{formatMoney({ cents: stats.totalValue, currency })}</div>
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
              placeholder="Search products or SKU..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] text-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "low", "out"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-3 rounded-xl font-medium transition-colors",
                  filter === f
                    ? "bg-primary-500 text-white"
                    : "border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] hover:bg-[var(--pos-bg)]"
                )}
              >
                {f === "all" ? "All" : f === "low" ? "Low Stock" : "Out of Stock"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Product List */}
        <div className="flex-1 overflow-auto border-r border-[color:var(--pos-border)]">
          {products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 rounded-3xl bg-pink-500/10 flex items-center justify-center mb-6">
                <Package className="w-12 h-12 text-pink-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Products Yet</h2>
              <p className="text-[var(--pos-muted)] max-w-md mb-6">
                Add products to your catalog to start selling and managing inventory.
              </p>
              <button className="px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold flex items-center gap-2 hover:bg-primary-600 transition-colors">
                <Plus className="w-5 h-5" />
                Add First Product
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <Search className="w-16 h-16 text-[var(--pos-muted)] mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Results</h3>
              <p className="text-[var(--pos-muted)]">No products match your search criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-[color:var(--pos-border)]">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-[var(--pos-muted)] bg-[var(--pos-bg)] sticky top-0">
                <button onClick={() => toggleSort("name")} className="col-span-4 flex items-center gap-1 hover:text-[var(--pos-text)]">
                  Product
                  <ArrowUpDown className="w-3 h-3" />
                </button>
                <div className="col-span-2">SKU</div>
                <button onClick={() => toggleSort("price")} className="col-span-2 flex items-center gap-1 hover:text-[var(--pos-text)]">
                  Price
                  <ArrowUpDown className="w-3 h-3" />
                </button>
                <button onClick={() => toggleSort("stock")} className="col-span-2 flex items-center gap-1 hover:text-[var(--pos-text)]">
                  Stock
                  <ArrowUpDown className="w-3 h-3" />
                </button>
                <div className="col-span-2 text-right">Status</div>
              </div>

              {/* Product Rows */}
              {filtered.map((product) => {
                const status = getStockStatus(product);
                const StatusIcon = status.icon;

                return (
                  <button
                    key={product.id}
                    onClick={() => setSelectedId(product.id)}
                    className={cn(
                      "w-full grid grid-cols-12 gap-4 px-4 py-4 text-left transition-colors hover:bg-[var(--pos-bg)]",
                      selectedId === product.id && "bg-primary-500/5 border-l-4 border-l-primary-500"
                    )}
                  >
                    <div className="col-span-4">
                      <div className="font-semibold">{product.name}</div>
                      {product.reorderPoint > 0 && (
                        <div className="text-xs text-[var(--pos-muted)]">Reorder at: {product.reorderPoint}</div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className="font-mono text-sm text-[var(--pos-muted)]">{product.sku || "—"}</span>
                    </div>
                    <div className="col-span-2">
                      <div className="font-bold">{formatMoney({ cents: product.priceCents, currency: product.currency })}</div>
                    </div>
                    <div className="col-span-2">
                      <div className={cn("font-bold text-lg", status.color)}>{product.onHand}</div>
                      {product.reserved > 0 && (
                        <div className="text-xs text-[var(--pos-muted)]">{product.reserved} reserved</div>
                      )}
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
                        status.bg, status.color
                      )}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="w-[400px] flex-shrink-0 overflow-auto bg-[var(--pos-panel-solid)]">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <Eye className="w-16 h-16 text-[var(--pos-muted)] mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Product</h3>
              <p className="text-sm text-[var(--pos-muted)]">Click on a product to view details</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Product Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm text-[var(--pos-muted)] font-mono">{selected.sku || "No SKU"}</div>
                  <h2 className="text-xl font-bold mt-1">{selected.name}</h2>
                </div>
                {(() => {
                  const status = getStockStatus(selected);
                  const StatusIcon = status.icon;
                  return (
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
                      status.bg, status.color
                    )}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </span>
                  );
                })()}
              </div>

              {/* Price */}
              <div className="rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 p-6 text-white">
                <div className="text-sm opacity-80 mb-1">Selling Price</div>
                <div className="text-3xl font-bold">
                  {formatMoney({ cents: selected.priceCents, currency: selected.currency })}
                </div>
              </div>

              {/* Stock Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4 text-center">
                  <div className="text-xs text-[var(--pos-muted)] mb-1">On Hand</div>
                  <div className="text-2xl font-bold">{selected.onHand}</div>
                </div>
                <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4 text-center">
                  <div className="text-xs text-[var(--pos-muted)] mb-1">Reserved</div>
                  <div className="text-2xl font-bold">{selected.reserved}</div>
                </div>
                <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4 text-center">
                  <div className="text-xs text-[var(--pos-muted)] mb-1">Reorder</div>
                  <div className="text-2xl font-bold">{selected.reorderPoint || "—"}</div>
                </div>
              </div>

              {/* Warehouses */}
              <div className="rounded-xl border border-[color:var(--pos-border)] overflow-hidden">
                <div className="px-4 py-3 bg-[var(--pos-bg)] text-sm font-medium text-[var(--pos-muted)] flex items-center gap-2">
                  <Warehouse className="w-4 h-4" />
                  Stock by Warehouse
                </div>
                <div className="divide-y divide-[color:var(--pos-border)]">
                  {selected.warehouses.length > 0 ? (
                    selected.warehouses.map((w) => (
                      <div key={w.warehouseName} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-medium">{w.warehouseName}</div>
                          <div className="text-xs text-[var(--pos-muted)]">
                            Reserved: {w.reserved} | Reorder: {w.reorderPoint || "—"}
                          </div>
                        </div>
                        <div className={cn(
                          "text-xl font-bold",
                          w.onHand <= 0 ? "text-red-500" :
                          w.reorderPoint > 0 && w.onHand <= w.reorderPoint ? "text-amber-500" :
                          "text-primary-500"
                        )}>
                          {w.onHand}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-sm text-[var(--pos-muted)] text-center">
                      No warehouse data available
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button className="px-4 py-3 rounded-xl border border-[color:var(--pos-border)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--pos-bg)] transition-colors">
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button className="px-4 py-3 rounded-xl border border-[color:var(--pos-border)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--pos-bg)] transition-colors">
                  <Layers className="w-4 h-4" />
                  Adjust Stock
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
