"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Warehouse,
  Package,
  AlertTriangle,
  Plus,
  Search,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  TrendingDown,
  MoreVertical,
  RefreshCw,
  FileDown,
  Filter,
} from "lucide-react";
import { PosCard, PosCardContent, PosCardHeader } from "@/components/pos/PosCard";
import { useToast, StockSkeleton } from "@/components/pos";

type StockItem = {
  id: string;
  warehouseId: string;
  warehouse: { id: string; name: string; code: string | null };
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string | null;
    priceCents: number;
    category: { id: string; name: string } | null;
  };
  onHand: number;
  reserved: number;
  reorderPoint: number;
  available: number;
  isLowStock: boolean;
  stockValue: number;
};

type WarehouseInfo = {
  id: string;
  name: string;
  code: string | null;
  productCount: number;
  totalOnHand: number;
  totalAvailable: number;
};

type Alert = {
  id: string;
  severity: "critical" | "high" | "medium";
  warehouse: { id: string; name: string };
  product: { id: string; name: string; sku: string | null };
  onHand: number;
  reorderPoint: number;
  deficit: number;
};

export default function StockPage() {
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const toast = useToast();

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseInfo[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stock" | "warehouses" | "alerts" | "movements">("stock");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalOnHand: 0,
    totalValue: 0,
    lowStockCount: 0,
  });

  const fetchStock = useCallback(async () => {
    try {
      const warehouseParam = selectedWarehouse ? `&warehouseId=${selectedWarehouse}` : "";
      const lowStockParam = showLowStockOnly ? "&lowStockOnly=true" : "";
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";

      const res = await fetch(
        `/api/pos/tenants/${tenantSlug}/inventory/stock?${warehouseParam}${lowStockParam}${searchParam}`
      );
      const data = await res.json();
      if (data.success) {
        setStockItems(data.stockItems);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Failed to fetch stock:", error);
    }
  }, [tenantSlug, selectedWarehouse, showLowStockOnly, searchQuery]);

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await fetch(`/api/pos/tenants/${tenantSlug}/inventory/warehouses`);
      const data = await res.json();
      if (data.success) {
        setWarehouses(data.warehouses);
      }
    } catch (error) {
      console.error("Failed to fetch warehouses:", error);
    }
  }, [tenantSlug]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`/api/pos/tenants/${tenantSlug}/inventory/alerts`);
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
  }, [tenantSlug]);

  useEffect(() => {
    Promise.all([fetchStock(), fetchWarehouses(), fetchAlerts()]).finally(() =>
      setLoading(false)
    );
  }, [fetchStock, fetchWarehouses, fetchAlerts]);

  const formatMoney = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
    }).format(cents / 100);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-500 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case "medium":
        return "bg-amber-500/20 text-amber-500 border-amber-500/30";
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/30";
    }
  };

  if (loading) {
    return <StockSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Warehouse className="w-7 h-7 text-lime-500" />
            Inventory Management
          </h1>
          <p className="text-sm text-[var(--pos-muted)] mt-1">
            Track stock levels across warehouses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchStock();
              fetchAlerts();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--pos-border)] hover:bg-[var(--pos-border)]"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--pos-accent)] text-white font-semibold hover:opacity-90">
            <Plus className="w-4 h-4" />
            Add Stock
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PosCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-sm text-[var(--pos-muted)]">Total Items</div>
              <div className="text-xl font-bold">{summary.totalItems}</div>
            </div>
          </div>
        </PosCard>
        <PosCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <ArrowUpDown className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-sm text-[var(--pos-muted)]">Total On Hand</div>
              <div className="text-xl font-bold">{summary.totalOnHand.toLocaleString()}</div>
            </div>
          </div>
        </PosCard>
        <PosCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="text-sm text-[var(--pos-muted)]">Stock Value</div>
              <div className="text-xl font-bold">{formatMoney(summary.totalValue)}</div>
            </div>
          </div>
        </PosCard>
        <PosCard className={`p-4 ${summary.lowStockCount > 0 ? "border-amber-500/50" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-sm text-[var(--pos-muted)]">Low Stock Alerts</div>
              <div className="text-xl font-bold text-amber-500">{summary.lowStockCount}</div>
            </div>
          </div>
        </PosCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--pos-border)]">
        {[
          { key: "stock", label: "Stock Levels", icon: Package },
          { key: "warehouses", label: "Warehouses", icon: Warehouse },
          { key: "alerts", label: `Alerts (${alerts.length})`, icon: AlertTriangle },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors ${
              activeTab === tab.key
                ? "text-[var(--pos-accent)] border-b-2 border-[var(--pos-accent)]"
                : "text-[var(--pos-muted)] hover:text-[var(--pos-text)]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "stock" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pos-muted)]" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--pos-bg)] border border-[var(--pos-border)] focus:border-[var(--pos-accent)] focus:outline-none"
              />
            </div>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[var(--pos-bg)] border border-[var(--pos-border)] focus:border-[var(--pos-accent)] focus:outline-none"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
                showLowStockOnly
                  ? "border-amber-500 bg-amber-500/20 text-amber-500"
                  : "border-[var(--pos-border)] hover:border-[var(--pos-accent)]"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Low Stock Only
            </button>
          </div>

          {/* Stock Table */}
          <PosCard>
            <PosCardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--pos-muted)] border-b border-[var(--pos-border)]">
                      <th className="py-3 pr-4">Product</th>
                      <th className="py-3 pr-4">Warehouse</th>
                      <th className="py-3 pr-4 text-right">On Hand</th>
                      <th className="py-3 pr-4 text-right">Reserved</th>
                      <th className="py-3 pr-4 text-right">Available</th>
                      <th className="py-3 pr-4 text-right">Reorder Point</th>
                      <th className="py-3 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockItems.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-b border-[var(--pos-border)] ${
                          item.isLowStock ? "bg-amber-500/5" : ""
                        }`}
                      >
                        <td className="py-3 pr-4">
                          <div className="font-medium">{item.product.name}</div>
                          {item.product.sku && (
                            <div className="text-xs text-[var(--pos-muted)]">
                              SKU: {item.product.sku}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4">{item.warehouse.name}</td>
                        <td className="py-3 pr-4 text-right font-semibold">{item.onHand}</td>
                        <td className="py-3 pr-4 text-right text-[var(--pos-muted)]">
                          {item.reserved}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span
                            className={`font-semibold ${
                              item.available <= 0
                                ? "text-red-500"
                                : item.isLowStock
                                ? "text-amber-500"
                                : "text-emerald-500"
                            }`}
                          >
                            {item.available}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right text-[var(--pos-muted)]">
                          {item.reorderPoint}
                        </td>
                        <td className="py-3 text-right font-semibold">
                          {formatMoney(item.stockValue)}
                        </td>
                      </tr>
                    ))}
                    {stockItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[var(--pos-muted)]">
                          No stock items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </PosCardContent>
          </PosCard>
        </>
      )}

      {activeTab === "warehouses" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((warehouse) => (
            <PosCard key={warehouse.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-lime-500/20 flex items-center justify-center">
                    <Warehouse className="w-6 h-6 text-lime-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{warehouse.name}</h3>
                    {warehouse.code && (
                      <p className="text-sm text-[var(--pos-muted)]">{warehouse.code}</p>
                    )}
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-[var(--pos-border)]">
                  <MoreVertical className="w-4 h-4 text-[var(--pos-muted)]" />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-lg bg-[var(--pos-bg)]">
                  <div className="text-xs text-[var(--pos-muted)]">Products</div>
                  <div className="font-semibold">{warehouse.productCount}</div>
                </div>
                <div className="p-2 rounded-lg bg-[var(--pos-bg)]">
                  <div className="text-xs text-[var(--pos-muted)]">On Hand</div>
                  <div className="font-semibold">{warehouse.totalOnHand}</div>
                </div>
                <div className="p-2 rounded-lg bg-[var(--pos-bg)]">
                  <div className="text-xs text-[var(--pos-muted)]">Available</div>
                  <div className="font-semibold text-emerald-500">{warehouse.totalAvailable}</div>
                </div>
              </div>
            </PosCard>
          ))}

          {warehouses.length === 0 && (
            <div className="col-span-full text-center py-12 text-[var(--pos-muted)]">
              <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No warehouses found</p>
              <button className="mt-3 px-4 py-2 rounded-xl bg-[var(--pos-accent)] text-white font-semibold">
                Create Warehouse
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <PosCard
              key={alert.id}
              className={`p-4 border ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <AlertTriangle
                    className={`w-5 h-5 ${
                      alert.severity === "critical"
                        ? "text-red-500"
                        : alert.severity === "high"
                        ? "text-orange-500"
                        : "text-amber-500"
                    }`}
                  />
                  <div>
                    <h4 className="font-semibold">{alert.product?.name ?? "Unknown Product"}</h4>
                    <p className="text-sm text-[var(--pos-muted)]">
                      {alert.warehouse?.name ?? "Unknown"} • SKU: {alert.product?.sku || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {alert.onHand} / {alert.reorderPoint}
                  </div>
                  <div className="text-sm text-[var(--pos-muted)]">
                    Need {alert.deficit} more
                  </div>
                </div>
              </div>
            </PosCard>
          ))}

          {alerts.length === 0 && (
            <div className="text-center py-12 text-[var(--pos-muted)]">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No stock alerts</p>
              <p className="text-sm mt-1">All products are above reorder points</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
