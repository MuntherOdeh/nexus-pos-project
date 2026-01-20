"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  UserCircle,
  Search,
  Plus,
  Phone,
  Mail,
  Award,
  ShoppingBag,
  Calendar,
  MoreVertical,
  X,
  Star,
} from "lucide-react";
import { PosCard, PosCardContent, PosCardHeader } from "@/components/pos/PosCard";
import { useToast, CustomersSkeleton } from "@/components/pos";
import type { Customer } from "@/types/pos";

export default function CustomersPage() {
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const toast = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const fetchCustomers = useCallback(async () => {
    try {
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const res = await fetch(
        `/api/pos/tenants/${tenantSlug}/customers?page=${pagination.page}${searchParam}`
      );
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, pagination.page, searchQuery]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchCustomers]);

  const handleAddLoyaltyPoints = async (customerId: string, points: number) => {
    try {
      const res = await fetch(
        `/api/pos/tenants/${tenantSlug}/customers/${customerId}/loyalty`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "BONUS", points, description: "Manual bonus" }),
        }
      );
      const data = await res.json();
      if (data.success) {
        fetchCustomers();
        if (selectedCustomer?.id === customerId) {
          setSelectedCustomer({ ...selectedCustomer, loyaltyPoints: data.newBalance });
        }
      }
    } catch (error) {
      console.error("Failed to add loyalty points:", error);
    }
  };

  const formatMoney = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
    }).format(cents / 100);
  };

  if (loading) {
    return <CustomersSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <UserCircle className="w-7 h-7 text-teal-500" />
            Customers
          </h1>
          <p className="text-sm text-[var(--pos-muted)] mt-1">
            Manage your customer database and loyalty
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--pos-accent)] text-white font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <PosCard className="p-4">
          <div className="text-sm text-[var(--pos-muted)]">Total Customers</div>
          <div className="text-2xl font-bold mt-1">{pagination.total}</div>
        </PosCard>
        <PosCard className="p-4">
          <div className="text-sm text-[var(--pos-muted)]">Active Today</div>
          <div className="text-2xl font-bold mt-1">
            {customers.filter((c) => {
              if (!c.lastVisitAt) return false;
              const today = new Date().toDateString();
              return new Date(c.lastVisitAt).toDateString() === today;
            }).length}
          </div>
        </PosCard>
        <PosCard className="p-4">
          <div className="text-sm text-[var(--pos-muted)]">Avg. Spend</div>
          <div className="text-2xl font-bold mt-1">
            {formatMoney(
              customers.length > 0
                ? customers.reduce((sum, c) => sum + c.totalSpentCents, 0) / customers.length
                : 0
            )}
          </div>
        </PosCard>
        <PosCard className="p-4">
          <div className="text-sm text-[var(--pos-muted)]">Total Points Issued</div>
          <div className="text-2xl font-bold mt-1">
            {customers.reduce((sum, c) => sum + c.loyaltyPoints, 0).toLocaleString()}
          </div>
        </PosCard>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pos-muted)]" />
        <input
          type="text"
          placeholder="Search customers by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--pos-bg)] border border-[var(--pos-border)] focus:border-[var(--pos-accent)] focus:outline-none"
        />
      </div>

      {/* Customers Table */}
      <div className="rounded-xl border border-[var(--pos-border)] bg-[var(--pos-panel)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-[var(--pos-muted)] border-b border-[var(--pos-border)] bg-[var(--pos-bg)]">
                <th className="py-3 px-4 font-medium">#</th>
                <th className="py-3 px-4 font-medium">Customer</th>
                <th className="py-3 px-4 font-medium">Contact</th>
                <th className="py-3 px-4 font-medium text-center">Points</th>
                <th className="py-3 px-4 font-medium text-center">Visits</th>
                <th className="py-3 px-4 font-medium text-right">Total Spent</th>
                <th className="py-3 px-4 font-medium">Tags</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className="border-b border-[var(--pos-border)] last:border-b-0 cursor-pointer hover:bg-[var(--pos-bg)] transition-colors"
                >
                  <td className="py-3 px-4 text-[var(--pos-muted)] text-sm">
                    {(pagination.page - 1) * 20 + index + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {customer.firstName[0]}{customer.lastName[0]}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="text-xs text-[var(--pos-muted)]">
                          Since {new Date(customer.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      {customer.email && (
                        <div className="text-sm flex items-center gap-1.5 text-[var(--pos-muted)]">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[180px]">{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="text-sm flex items-center gap-1.5 text-[var(--pos-muted)]">
                          <Phone className="w-3.5 h-3.5" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-semibold">
                      <Star className="w-3.5 h-3.5" />
                      {customer.loyaltyPoints.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold">{customer.visitCount}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-emerald-500">
                      {formatMoney(customer.totalSpentCents)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-xs bg-[var(--pos-accent)]/20 text-[var(--pos-accent)]"
                        >
                          {tag}
                        </span>
                      ))}
                      {customer.tags.length > 2 && (
                        <span className="text-xs text-[var(--pos-muted)]">+{customer.tags.length - 2}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {customers.length === 0 && (
        <div className="text-center py-12 text-[var(--pos-muted)]">
          <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No customers found</p>
          <p className="text-sm mt-1">Start adding customers to build your database</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            className="px-4 py-2 rounded-lg border border-[var(--pos-border)] disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--pos-muted)]">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            className="px-4 py-2 rounded-lg border border-[var(--pos-border)] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--pos-bg2)] rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--pos-border)] flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
                  {selectedCustomer.firstName[0]}
                  {selectedCustomer.lastName[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </h2>
                  <p className="text-sm text-[var(--pos-muted)]">
                    Customer since{" "}
                    {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-lg hover:bg-[var(--pos-border)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Contact Info */}
              <div className="space-y-2">
                {selectedCustomer.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-[var(--pos-muted)]" />
                    {selectedCustomer.email}
                  </div>
                )}
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-[var(--pos-muted)]" />
                    {selectedCustomer.phone}
                  </div>
                )}
                {selectedCustomer.dateOfBirth && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-[var(--pos-muted)]" />
                    {new Date(selectedCustomer.dateOfBirth).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--pos-bg)] text-center">
                  <Award className="w-6 h-6 mx-auto text-amber-500" />
                  <div className="text-2xl font-bold mt-2">
                    {selectedCustomer.loyaltyPoints}
                  </div>
                  <div className="text-xs text-[var(--pos-muted)]">Loyalty Points</div>
                  <button
                    onClick={() => handleAddLoyaltyPoints(selectedCustomer.id, 100)}
                    className="mt-2 px-3 py-1 text-xs rounded-lg bg-amber-500/20 text-amber-500 hover:bg-amber-500/30"
                  >
                    + Add 100 Points
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-[var(--pos-bg)] text-center">
                  <ShoppingBag className="w-6 h-6 mx-auto text-emerald-500" />
                  <div className="text-2xl font-bold mt-2">
                    {formatMoney(selectedCustomer.totalSpentCents)}
                  </div>
                  <div className="text-xs text-[var(--pos-muted)]">Total Spent</div>
                  <div className="text-xs text-[var(--pos-muted)] mt-2">
                    {selectedCustomer.visitCount} visits
                  </div>
                </div>
              </div>

              {/* Tags */}
              {selectedCustomer.tags.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-sm bg-[var(--pos-accent)]/20 text-[var(--pos-accent)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
