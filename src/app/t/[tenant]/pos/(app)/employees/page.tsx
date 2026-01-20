"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Users,
  Clock,
  Search,
  MoreVertical,
  Play,
  Square,
  Coffee,
  UserPlus,
  X,
  Mail,
  User,
  Shield,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { PosCard, PosCardContent, PosCardHeader } from "@/components/pos/PosCard";
import { useToast, EmployeesSkeleton } from "@/components/pos";
import { EMPLOYEE_ROLE_CONFIG, TIME_CLOCK_STATUS_CONFIG } from "@/lib/pos/constants";
import type { Employee, TimeClockEntry } from "@/types/pos";

const ROLES = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "STAFF", label: "Staff/Cashier" },
  { value: "KITCHEN", label: "Kitchen" },
];

export default function EmployeesPage() {
  const toast = useToast();
  const params = useParams();
  const tenantSlug = params.tenant as string;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeClockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"employees" | "timeclock">("employees");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [myStatus, setMyStatus] = useState<TimeClockEntry | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "STAFF",
    password: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch(`/api/pos/tenants/${tenantSlug}/employees`);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  }, [tenantSlug]);

  const fetchTimeEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/pos/tenants/${tenantSlug}/time-clock`);
      const data = await res.json();
      if (data.success) {
        setTimeEntries(data.entries);
        const activeEntry = data.entries.find(
          (e: TimeClockEntry) => e.status !== "CLOCKED_OUT"
        );
        setMyStatus(activeEntry || null);
      }
    } catch (error) {
      console.error("Failed to fetch time entries:", error);
    }
  }, [tenantSlug]);

  useEffect(() => {
    Promise.all([fetchEmployees(), fetchTimeEntries()]).finally(() =>
      setLoading(false)
    );
  }, [fetchEmployees, fetchTimeEntries]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuId]);

  const handleClockIn = async () => {
    try {
      const res = await fetch(`/api/pos/tenants/${tenantSlug}/time-clock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        fetchTimeEntries();
        toast.success("Clocked in successfully");
      } else {
        toast.error(data.error || "Failed to clock in");
      }
    } catch (error) {
      console.error("Failed to clock in:", error);
      toast.error("Network error. Please try again.");
    }
  };

  const handleClockOut = async () => {
    try {
      const res = await fetch(`/api/pos/tenants/${tenantSlug}/time-clock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clock_out" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTimeEntries();
        toast.success("Clocked out successfully");
      } else {
        toast.error(data.error || "Failed to clock out");
      }
    } catch (error) {
      console.error("Failed to clock out:", error);
      toast.error("Network error. Please try again.");
    }
  };

  const handleStartBreak = async () => {
    try {
      const res = await fetch(`/api/pos/tenants/${tenantSlug}/time-clock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_break" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTimeEntries();
        toast.success("Break started");
      } else {
        toast.error(data.error || "Failed to start break");
      }
    } catch (error) {
      console.error("Failed to start break:", error);
      toast.error("Network error. Please try again.");
    }
  };

  const handleEndBreak = async () => {
    try {
      const res = await fetch(`/api/pos/tenants/${tenantSlug}/time-clock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end_break", breakMinutes: 15 }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTimeEntries();
        toast.success("Break ended");
      } else {
        toast.error(data.error || "Failed to end break");
      }
    } catch (error) {
      console.error("Failed to end break:", error);
      toast.error("Network error. Please try again.");
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email address";
    }
    if (!editingEmployee && !formData.password) {
      errors.password = "Password is required";
    }
    if (formData.password && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/pos/tenants/${tenantSlug}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Employee added successfully");
        setShowAddModal(false);
        resetForm();
        fetchEmployees();
      } else {
        toast.error(data.error || "Failed to add employee");
        if (data.details) {
          setFormErrors(data.details);
        }
      }
    } catch (error) {
      console.error("Failed to add employee:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/pos/tenants/${tenantSlug}/employees/${editingEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          ...(formData.password ? { password: formData.password } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Employee updated successfully");
        setShowEditModal(false);
        setEditingEmployee(null);
        resetForm();
        fetchEmployees();
      } else {
        toast.error(data.error || "Failed to update employee");
      }
    } catch (error) {
      console.error("Failed to update employee:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (employee: Employee) => {
    try {
      const res = await fetch(`/api/pos/tenants/${tenantSlug}/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !employee.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Employee ${employee.isActive ? "deactivated" : "activated"}`);
        fetchEmployees();
      } else {
        toast.error(data.error || "Failed to update employee");
      }
    } catch (error) {
      console.error("Failed to toggle employee:", error);
      toast.error("Network error. Please try again.");
    }
    setOpenMenuId(null);
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "STAFF",
      password: "",
    });
    setFormErrors({});
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      role: employee.role,
      password: "",
    });
    setFormErrors({});
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    const config = EMPLOYEE_ROLE_CONFIG[role as keyof typeof EMPLOYEE_ROLE_CONFIG];
    return config ? `${config.bgClass} ${config.textClass}` : "bg-gray-500/20 text-gray-400";
  };

  const getStatusBadge = (status: string) => {
    const config = TIME_CLOCK_STATUS_CONFIG[status as keyof typeof TIME_CLOCK_STATUS_CONFIG];
    return config ? `${config.bgClass} ${config.textClass}` : "bg-gray-500/20 text-gray-400";
  };

  if (loading) {
    return <EmployeesSkeleton />;
  }

  const EmployeeFormModal = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--pos-panel-solid)] shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[var(--pos-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-indigo-500" />
            </div>
            <h2 className="text-lg font-bold">{isEdit ? "Edit Employee" : "Add Employee"}</h2>
          </div>
          <button
            onClick={() => {
              isEdit ? setShowEditModal(false) : setShowAddModal(false);
              setEditingEmployee(null);
              resetForm();
            }}
            className="p-2 rounded-xl hover:bg-[var(--pos-border)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={isEdit ? handleEditEmployee : handleAddEmployee} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--pos-muted)] mb-1.5">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pos-muted)]" />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--pos-border)] bg-[var(--pos-bg)] focus:border-[var(--pos-accent)] focus:outline-none"
                  placeholder="John"
                />
              </div>
              {formErrors.firstName && (
                <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--pos-muted)] mb-1.5">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pos-muted)]" />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--pos-border)] bg-[var(--pos-bg)] focus:border-[var(--pos-accent)] focus:outline-none"
                  placeholder="Doe"
                />
              </div>
              {formErrors.lastName && (
                <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--pos-muted)] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pos-muted)]" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--pos-border)] bg-[var(--pos-bg)] focus:border-[var(--pos-accent)] focus:outline-none"
                placeholder="john@example.com"
              />
            </div>
            {formErrors.email && (
              <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--pos-muted)] mb-1.5">
              Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pos-muted)]" />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--pos-border)] bg-[var(--pos-bg)] focus:border-[var(--pos-accent)] focus:outline-none appearance-none"
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--pos-muted)] mb-1.5">
              {isEdit ? "New Password (leave empty to keep current)" : "Password"}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--pos-border)] bg-[var(--pos-bg)] focus:border-[var(--pos-accent)] focus:outline-none"
              placeholder={isEdit ? "Leave empty to keep current" : "Min 6 characters"}
            />
            {formErrors.password && (
              <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-[var(--pos-accent)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : isEdit ? "Update Employee" : "Add Employee"}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-500" />
            Employees
          </h1>
          <p className="text-sm text-[var(--pos-muted)] mt-1">
            Manage staff and track time
          </p>
        </div>

        {/* Time Clock Quick Actions */}
        <div className="flex items-center gap-2">
          {!myStatus ? (
            <button
              onClick={handleClockIn}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
            >
              <Play className="w-4 h-4" />
              Clock In
            </button>
          ) : myStatus.status === "CLOCKED_IN" ? (
            <>
              <button
                onClick={handleStartBreak}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 font-semibold hover:bg-amber-500/30 transition-colors"
              >
                <Coffee className="w-4 h-4" />
                Break
              </button>
              <button
                onClick={handleClockOut}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
              >
                <Square className="w-4 h-4" />
                Clock Out
              </button>
            </>
          ) : myStatus.status === "ON_BREAK" ? (
            <button
              onClick={handleEndBreak}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
            >
              <Play className="w-4 h-4" />
              End Break
            </button>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--pos-border)]">
        <button
          onClick={() => setActiveTab("employees")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "employees"
              ? "text-[var(--pos-accent)] border-b-2 border-[var(--pos-accent)]"
              : "text-[var(--pos-muted)] hover:text-[var(--pos-text)]"
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Employees ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab("timeclock")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "timeclock"
              ? "text-[var(--pos-accent)] border-b-2 border-[var(--pos-accent)]"
              : "text-[var(--pos-muted)] hover:text-[var(--pos-text)]"
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Time Clock
        </button>
      </div>

      {activeTab === "employees" && (
        <>
          {/* Search & Add */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pos-muted)] group-focus-within:text-[var(--pos-accent)] transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-[var(--pos-bg)] border-2 border-[var(--pos-border)] focus:border-[var(--pos-accent)] focus:outline-none focus:ring-4 focus:ring-[var(--pos-accent)]/10 transition-all duration-200 shadow-sm hover:border-[var(--pos-accent)]/50"
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--pos-accent)] text-white font-semibold hover:opacity-90 transition-opacity"
            >
              <UserPlus className="w-5 h-5" />
              Add Employee
            </button>
          </div>

          {/* Employees Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <PosCard key={employee.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--pos-accent)]/20 flex items-center justify-center text-lg font-bold text-[var(--pos-accent)]">
                      {employee.firstName[0]}
                      {employee.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-sm text-[var(--pos-muted)]">
                        {employee.email}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === employee.id ? null : employee.id);
                      }}
                      className="p-2 rounded-lg hover:bg-[var(--pos-border)] transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-[var(--pos-muted)]" />
                    </button>
                    {openMenuId === employee.id && (
                      <div className="absolute right-0 top-10 w-48 rounded-xl bg-[var(--pos-panel-solid)] border border-[var(--pos-border)] shadow-xl z-50 py-1">
                        <button
                          onClick={() => openEditModal(employee)}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-[var(--pos-border)] transition-colors"
                        >
                          <Edit3 className="w-4 h-4 text-[var(--pos-muted)]" />
                          <span>Edit Employee</span>
                        </button>
                        <button
                          onClick={() => handleToggleActive(employee)}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-[var(--pos-border)] transition-colors"
                        >
                          {employee.isActive ? (
                            <>
                              <ToggleLeft className="w-4 h-4 text-amber-500" />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-500" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-semibold ${getRoleBadgeColor(
                      employee.role
                    )}`}
                  >
                    {employee.role}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      employee.isActive
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {employee.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </PosCard>
            ))}
            {filteredEmployees.length === 0 && (
              <div className="col-span-full py-12 text-center text-[var(--pos-muted)]">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No employees found</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "timeclock" && (
        <div className="space-y-4">
          {/* Current Status */}
          {myStatus && (
            <PosCard className="p-4 border-2 border-[var(--pos-accent)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--pos-muted)]">Your Status</p>
                  <p className="text-lg font-semibold">
                    {myStatus.status === "CLOCKED_IN"
                      ? "Working"
                      : myStatus.status === "ON_BREAK"
                      ? "On Break"
                      : "Clocked Out"}
                  </p>
                  <p className="text-sm text-[var(--pos-muted)]">
                    Since {new Date(myStatus.clockInAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[var(--pos-accent)]">
                    {myStatus.hoursWorked.toFixed(1)}h
                  </p>
                  <p className="text-sm text-[var(--pos-muted)]">Hours Today</p>
                </div>
              </div>
            </PosCard>
          )}

          {/* Time Entries Table */}
          <PosCard>
            <PosCardHeader>
              <h3 className="font-semibold">Recent Time Entries</h3>
            </PosCardHeader>
            <PosCardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--pos-muted)] border-b border-[var(--pos-border)]">
                      <th className="py-3 pr-4">Employee</th>
                      <th className="py-3 pr-4">Clock In</th>
                      <th className="py-3 pr-4">Clock Out</th>
                      <th className="py-3 pr-4">Break</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 text-right">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-[var(--pos-border)]"
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[var(--pos-accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--pos-accent)]">
                              {entry.employee.firstName[0]}
                              {entry.employee.lastName[0]}
                            </div>
                            <span>
                              {entry.employee.firstName} {entry.employee.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          {new Date(entry.clockInAt).toLocaleString()}
                        </td>
                        <td className="py-3 pr-4">
                          {entry.clockOutAt
                            ? new Date(entry.clockOutAt).toLocaleString()
                            : "-"}
                        </td>
                        <td className="py-3 pr-4">{entry.breakMinutes}m</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusBadge(
                              entry.status
                            )}`}
                          >
                            {entry.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 text-right font-semibold">
                          {entry.hoursWorked.toFixed(1)}h
                        </td>
                      </tr>
                    ))}
                    {timeEntries.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-[var(--pos-muted)]"
                        >
                          No time entries yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </PosCardContent>
          </PosCard>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && <EmployeeFormModal />}

      {/* Edit Employee Modal */}
      {showEditModal && <EmployeeFormModal isEdit />}
    </div>
  );
}
