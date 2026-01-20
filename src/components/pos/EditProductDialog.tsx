"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Package,
  DollarSign,
  Tag,
  Hash,
  AlertCircle,
  Plus,
  Save,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

type ProductData = {
  id: string;
  name: string;
  sku?: string | null;
  priceCents: number;
  currency: string;
  categoryId?: string | null;
  onHand: number;
  reorderPoint: number;
};

type EditProductDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  currency: string;
  product: ProductData | null;
  onProductUpdated: () => void;
};

export function EditProductDialog({
  isOpen,
  onClose,
  tenantSlug,
  currency,
  product,
  onProductUpdated,
}: EditProductDialogProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      fetchCategories();
      // Pre-populate form with product data
      setName(product.name);
      setSku(product.sku || "");
      setPrice((product.priceCents / 100).toFixed(2));
      setCategoryId(product.categoryId || "");
      setError(null);
      setShowNewCategory(false);
      setNewCategoryName("");
    }
  }, [isOpen, product]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/pos/tenants/${tenantSlug}/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch {
      // Ignore
    }
  };

  const createCategory = async (categoryName: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/pos/tenants/${tenantSlug}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName }),
      });
      const data = await response.json();
      if (data.success && data.category) {
        return data.category.id;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product) return;

    if (!name.trim()) {
      setError("Product name is required");
      return;
    }

    const priceCents = Math.round(parseFloat(price || "0") * 100);
    if (isNaN(priceCents) || priceCents < 0) {
      setError("Please enter a valid price");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalCategoryId = categoryId;

      // Create new category if needed
      if (showNewCategory && newCategoryName.trim()) {
        const newCatId = await createCategory(newCategoryName.trim());
        if (newCatId) {
          finalCategoryId = newCatId;
        }
      }

      const response = await fetch(`/api/pos/tenants/${tenantSlug}/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim() || null,
          priceCents,
          categoryId: finalCategoryId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to update product");
        return;
      }

      onProductUpdated();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 bg-[var(--pos-panel-solid)] rounded-3xl shadow-2xl border border-[color:var(--pos-border)] overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[color:var(--pos-border)] sticky top-0 bg-[var(--pos-panel-solid)]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Edit Product</h2>
              <p className="text-sm text-[var(--pos-muted)]">Update product details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--pos-border)] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Package className="w-4 h-4 inline mr-2" />
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Margherita Pizza"
              className="w-full px-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Price ({currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Hash className="w-4 h-4 inline mr-2" />
              SKU (optional)
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g., PIZ-001"
              className="w-full px-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Tag className="w-4 h-4 inline mr-2" />
              Category
            </label>
            {!showNewCategory ? (
              <div className="space-y-2">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="text-sm text-primary-500 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Create new category
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name"
                  className="w-full px-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategory(false);
                    setNewCategoryName("");
                  }}
                  className="text-sm text-[var(--pos-muted)] hover:underline"
                >
                  Use existing category
                </button>
              </div>
            )}
          </div>

          {/* Current Stock Display */}
          <div className="rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--pos-muted)]">Current Stock</span>
              <span className="text-lg font-bold">{product.onHand} units</span>
            </div>
            <p className="text-xs text-[var(--pos-muted)] mt-1">
              Use &quot;Adjust Stock&quot; to modify inventory levels
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-[color:var(--pos-border)] font-semibold hover:bg-[var(--pos-border)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
