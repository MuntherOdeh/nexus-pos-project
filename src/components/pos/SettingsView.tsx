"use client";

import React, { useMemo, useState, useTransition } from "react";
import {
  Building2,
  CreditCard,
  Globe,
  Link2,
  Sun,
  Moon,
  RefreshCw,
  Check,
  Printer,
  Receipt,
  Calculator,
  Settings,
  Users,
  ShoppingCart,
  DollarSign,
  Percent,
  Bell,
  Smartphone,
  Wifi,
  Clock,
  FileText,
  Shield,
  Database,
  Zap,
  ChevronRight,
  Store,
  Utensils,
  Coffee,
  Package,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Info,
  Keyboard,
  Barcode,
  Scale,
  Truck,
  Tag,
  Layers,
  PiggyBank,
  Plus,
  X,
  Edit3,
  Save,
} from "lucide-react";
import { POS_THEMES, type PosThemeKey } from "@/lib/pos/theme";
import { getPublicTenantRootDomain } from "@/lib/tenant-slug";
import { usePosShell } from "@/components/pos/PosShell";
import { cn } from "@/lib/utils";

type PaymentConnectionRow = {
  provider: string;
  status: string;
  displayName: string;
  lastConnectedAt?: string | null;
};

// ============================================================================
// TYPES
// ============================================================================

type SettingsSection = "general" | "pos" | "payment" | "receipt" | "tax" | "devices";

type POSConfig = {
  allowNegativeStock: boolean;
  requireCustomer: boolean;
  autoValidateOrders: boolean;
  showProductImages: boolean;
  showProductStock: boolean;
  enableTips: boolean;
  tipOptions: number[];
  enableLoyalty: boolean;
  loyaltyPointsPerCurrency: number;
  defaultOrderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  enableTableManagement: boolean;
  enableKitchenDisplay: boolean;
  enableMultiplePrices: boolean;
  sessionControl: "OPEN" | "CLOSING_CONTROL";
  cashControl: boolean;
  openingAmount: number;
};

type ReceiptConfig = {
  showLogo: boolean;
  headerText: string;
  footerText: string;
  showCashier: boolean;
  showOrderNumber: boolean;
  showDate: boolean;
  showTime: boolean;
  showTaxBreakdown: boolean;
  showPaymentMethod: boolean;
  paperSize: "58mm" | "80mm";
  autoPrint: boolean;
};

type TaxConfig = {
  id: string;
  name: string;
  rate: number;
  includedInPrice: boolean;
  isDefault: boolean;
};

const INDUSTRIES = [
  { value: "RESTAURANT", label: "Restaurant", icon: Utensils },
  { value: "CAFE", label: "Cafe", icon: Coffee },
  { value: "BAKERY", label: "Bakery", icon: Package },
  { value: "RETAIL", label: "Retail", icon: Store },
  { value: "OTHER", label: "Other", icon: Building2 },
];

// ============================================================================
// TOGGLE SWITCH COMPONENT
// ============================================================================

function Toggle({
  enabled,
  onChange,
  disabled = false,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={cn(
        "relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        enabled ? "bg-primary-500" : "bg-neutral-300 dark:bg-neutral-600",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          enabled && "translate-x-6"
        )}
      />
    </button>
  );
}

// ============================================================================
// SETTING ROW COMPONENT
// ============================================================================

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
  highlighted = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-xl transition-colors",
        highlighted ? "bg-primary-500/5 border border-primary-500/20" : "hover:bg-[var(--pos-bg)]"
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            highlighted ? "bg-primary-500/10" : "bg-[var(--pos-bg)]"
          )}
        >
          <Icon className={cn("w-5 h-5", highlighted ? "text-primary-500" : "text-[var(--pos-muted)]")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{title}</div>
          {description && (
            <div className="text-sm text-[var(--pos-muted)] truncate">{description}</div>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ============================================================================
// SECTION CARD COMPONENT
// ============================================================================

function SectionCard({
  icon: Icon,
  title,
  description,
  iconColor = "text-primary-500",
  iconBg = "bg-primary-500/10",
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  iconColor?: string;
  iconBg?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] overflow-hidden">
      <div className="p-5 border-b border-[color:var(--pos-border)]">
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconBg)}>
            <Icon className={cn("w-6 h-6", iconColor)} />
          </div>
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            {description && (
              <p className="text-sm text-[var(--pos-muted)]">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ============================================================================
// MAIN SETTINGS VIEW
// ============================================================================

export function SettingsView({
  tenant,
  paymentConnections,
}: {
  tenant: {
    slug: string;
    name: string;
    industry: string;
    theme: string;
    country: string;
    language: string;
    currency: string;
  };
  paymentConnections: PaymentConnectionRow[];
}) {
  const rootDomain = useMemo(() => getPublicTenantRootDomain(), []);
  const { tenantSlug, theme, setTheme, industry, setIndustry } = usePosShell();
  const [connections, setConnections] = useState<PaymentConnectionRow[]>(paymentConnections);
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [toast, setToast] = useState<string | null>(null);

  // POS Configuration State
  const [posConfig, setPosConfig] = useState<POSConfig>({
    allowNegativeStock: false,
    requireCustomer: false,
    autoValidateOrders: true,
    showProductImages: true,
    showProductStock: true,
    enableTips: true,
    tipOptions: [10, 15, 20],
    enableLoyalty: false,
    loyaltyPointsPerCurrency: 1,
    defaultOrderType: "DINE_IN",
    enableTableManagement: true,
    enableKitchenDisplay: true,
    enableMultiplePrices: false,
    sessionControl: "CLOSING_CONTROL",
    cashControl: true,
    openingAmount: 0,
  });

  // Receipt Configuration State
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>({
    showLogo: true,
    headerText: tenant.name,
    footerText: "Thank you for your visit!",
    showCashier: true,
    showOrderNumber: true,
    showDate: true,
    showTime: true,
    showTaxBreakdown: true,
    showPaymentMethod: true,
    paperSize: "80mm",
    autoPrint: true,
  });

  // Tax Configuration State
  const [taxes, setTaxes] = useState<TaxConfig[]>([
    { id: "1", name: "Standard VAT", rate: 20, includedInPrice: true, isDefault: true },
    { id: "2", name: "Reduced VAT", rate: 10, includedInPrice: true, isDefault: false },
    { id: "3", name: "Zero Rate", rate: 0, includedInPrice: true, isDefault: false },
  ]);
  const [editingTax, setEditingTax] = useState<TaxConfig | null>(null);

  const workspaceHost = `https://${tenant.slug}.${rootDomain}`;
  const isDark = theme === "DARK";

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const updateIndustry = (next: string) => {
    setIndustry(next);
    startTransition(async () => {
      setSaving("industry");
      try {
        await fetch("/api/pos/tenant/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantSlug, industry: next }),
        });
        showToast("Industry updated successfully");
      } finally {
        setSaving(null);
      }
    });
  };

  const toggleConnection = (provider: string) => {
    startTransition(async () => {
      setSaving(provider);
      try {
        const response = await fetch("/api/pos/tenant/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantSlug, provider, action: "TOGGLE" }),
        });
        const data = await response.json();
        if (response.ok && data?.success && data?.connection) {
          setConnections((prev) =>
            prev.map((c) => (c.provider === provider ? { ...c, ...data.connection } : c))
          );
          showToast(`${provider} ${data.connection.status === "CONNECTED" ? "connected" : "disconnected"}`);
        }
      } finally {
        setSaving(null);
      }
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(workspaceHost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updatePosConfig = <K extends keyof POSConfig>(key: K, value: POSConfig[K]) => {
    setPosConfig((prev) => ({ ...prev, [key]: value }));
    showToast("Settings saved");
  };

  const updateReceiptConfig = <K extends keyof ReceiptConfig>(key: K, value: ReceiptConfig[K]) => {
    setReceiptConfig((prev) => ({ ...prev, [key]: value }));
    showToast("Receipt settings saved");
  };

  const addTax = () => {
    const newTax: TaxConfig = {
      id: `tax-${Date.now()}`,
      name: "New Tax",
      rate: 0,
      includedInPrice: true,
      isDefault: false,
    };
    setTaxes((prev) => [...prev, newTax]);
    setEditingTax(newTax);
  };

  const saveTax = (tax: TaxConfig) => {
    setTaxes((prev) => prev.map((t) => (t.id === tax.id ? tax : t)));
    setEditingTax(null);
    showToast("Tax saved");
  };

  const deleteTax = (id: string) => {
    setTaxes((prev) => prev.filter((t) => t.id !== id));
    showToast("Tax deleted");
  };

  const setDefaultTax = (id: string) => {
    setTaxes((prev) =>
      prev.map((t) => ({ ...t, isDefault: t.id === id }))
    );
    showToast("Default tax updated");
  };

  // Navigation sections
  const sections = [
    { id: "general" as const, label: "General", icon: Settings },
    { id: "pos" as const, label: "Point of Sale", icon: ShoppingCart },
    { id: "payment" as const, label: "Payments", icon: CreditCard },
    { id: "receipt" as const, label: "Receipts", icon: Receipt },
    { id: "tax" as const, label: "Taxes", icon: Calculator },
    { id: "devices" as const, label: "Devices", icon: Printer },
  ];

  return (
    <div className="h-[calc(100vh-80px)] flex overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0 border-r border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] overflow-auto">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Settings</h1>
              <p className="text-xs text-[var(--pos-muted)]">Configure your POS</p>
            </div>
          </div>

          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                    isActive
                      ? "bg-primary-500 text-white shadow-lg"
                      : "hover:bg-[var(--pos-bg)] text-[var(--pos-text)]"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl space-y-6">
          {/* GENERAL SETTINGS */}
          {activeSection === "general" && (
            <>
              {/* Workspace Info */}
              <SectionCard
                icon={Building2}
                title="Workspace"
                description="Your business information"
                iconColor="text-primary-500"
                iconBg="bg-primary-500/10"
              >
                <div className="space-y-4">
                  <div className="rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-xs text-[var(--pos-muted)] mb-1">Workspace URL</div>
                        <div className="font-mono text-sm truncate">{workspaceHost}</div>
                      </div>
                      <button
                        className="flex-shrink-0 px-4 py-2 rounded-xl border border-[color:var(--pos-border)] hover:bg-[var(--pos-border)] text-sm font-medium transition-colors flex items-center gap-2"
                        onClick={copyToClipboard}
                      >
                        {copied ? <Check className="w-4 h-4 text-primary-500" /> : <Link2 className="w-4 h-4" />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { icon: Building2, label: "Company", value: tenant.name },
                      { icon: Globe, label: "Country", value: tenant.country },
                      { icon: DollarSign, label: "Currency", value: tenant.currency },
                      { icon: Globe, label: "Language", value: tenant.language },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] p-3 text-center"
                      >
                        <item.icon className="w-4 h-4 mx-auto text-[var(--pos-muted)] mb-1" />
                        <div className="text-[10px] text-[var(--pos-muted)] uppercase tracking-wide">
                          {item.label}
                        </div>
                        <div className="font-semibold text-sm mt-1 truncate">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>

              {/* Business Type */}
              <SectionCard
                icon={Store}
                title="Business Type"
                description="Select your industry for optimized features"
                iconColor="text-purple-500"
                iconBg="bg-purple-500/10"
              >
                <div className="grid grid-cols-5 gap-3">
                  {INDUSTRIES.map((i) => {
                    const Icon = i.icon;
                    const isActive = industry === i.value;
                    return (
                      <button
                        key={i.value}
                        type="button"
                        onClick={() => updateIndustry(i.value)}
                        className={cn(
                          "p-4 rounded-xl border text-center transition-all",
                          isActive
                            ? "border-primary-500 bg-primary-500/10 ring-2 ring-primary-500/20"
                            : "border-[color:var(--pos-border)] hover:border-primary-500/50 hover:bg-[var(--pos-bg)]"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-6 h-6 mx-auto mb-2",
                            isActive ? "text-primary-500" : "text-[var(--pos-muted)]"
                          )}
                        />
                        <div
                          className={cn(
                            "text-sm font-medium",
                            isActive ? "text-primary-500" : "text-[var(--pos-text)]"
                          )}
                        >
                          {i.label}
                        </div>
                        {isActive && (
                          <Check className="w-4 h-4 mx-auto mt-2 text-primary-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {saving === "industry" && (
                  <div className="text-xs text-[var(--pos-muted)] mt-4 flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-[var(--pos-muted)] border-t-primary-500 rounded-full animate-spin" />
                    Saving...
                  </div>
                )}
              </SectionCard>

              {/* Theme Selection */}
              <SectionCard
                icon={isDark ? Moon : Sun}
                title="Appearance"
                description="Choose your preferred theme"
                iconColor={isDark ? "text-indigo-500" : "text-amber-500"}
                iconBg={isDark ? "bg-indigo-500/10" : "bg-amber-500/10"}
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  {Object.entries(POS_THEMES).map(([key, meta]) => {
                    const k = key as PosThemeKey;
                    const active = k === theme;
                    const isLightTheme = k === "LIGHT";

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTheme(k)}
                        className={cn(
                          "relative rounded-2xl border p-6 text-left transition-all",
                          active
                            ? "border-primary-500 bg-primary-500/5 ring-2 ring-primary-500/20"
                            : "border-[color:var(--pos-border)] hover:border-primary-500/50 hover:bg-[var(--pos-bg)]"
                        )}
                      >
                        {active && (
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}

                        <div className="flex items-center gap-4 mb-4">
                          <div
                            className={cn(
                              "w-14 h-14 rounded-xl flex items-center justify-center",
                              isLightTheme ? "bg-gray-100" : "bg-slate-800"
                            )}
                          >
                            {isLightTheme ? (
                              <Sun className="w-7 h-7 text-amber-500" />
                            ) : (
                              <Moon className="w-7 h-7 text-indigo-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-lg">{meta.label}</div>
                            <div className="text-sm text-[var(--pos-muted)]">
                              {isLightTheme ? "Clean and bright interface" : "Easy on the eyes"}
                            </div>
                          </div>
                        </div>

                        {/* Theme Preview */}
                        <div
                          className={cn(
                            "rounded-xl p-3",
                            isLightTheme
                              ? "bg-white border border-gray-200"
                              : "bg-slate-900 border border-slate-700"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={cn(
                                "h-2 w-2 rounded-full",
                                isLightTheme ? "bg-gray-300" : "bg-slate-600"
                              )}
                            />
                            <div
                              className={cn(
                                "h-2 flex-1 rounded",
                                isLightTheme ? "bg-gray-200" : "bg-slate-700"
                              )}
                            />
                          </div>
                          <div className="flex gap-2">
                            <div
                              className="h-6 w-16 rounded"
                              style={{
                                background: `linear-gradient(135deg, ${meta.accent}, ${meta.accent2})`,
                              }}
                            />
                            <div
                              className={cn(
                                "h-6 flex-1 rounded",
                                isLightTheme ? "bg-gray-100" : "bg-slate-800"
                              )}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>
            </>
          )}

          {/* POS SETTINGS */}
          {activeSection === "pos" && (
            <>
              <SectionCard
                icon={ShoppingCart}
                title="Point of Sale"
                description="Configure your POS behavior"
                iconColor="text-blue-500"
                iconBg="bg-blue-500/10"
              >
                <div className="space-y-1 divide-y divide-[color:var(--pos-border)]">
                  <SettingRow
                    icon={Database}
                    title="Allow Negative Stock"
                    description="Sell items even when stock is zero"
                  >
                    <Toggle
                      enabled={posConfig.allowNegativeStock}
                      onChange={(v) => updatePosConfig("allowNegativeStock", v)}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Users}
                    title="Require Customer"
                    description="Customer must be selected for every order"
                  >
                    <Toggle
                      enabled={posConfig.requireCustomer}
                      onChange={(v) => updatePosConfig("requireCustomer", v)}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Zap}
                    title="Auto-Validate Orders"
                    description="Send orders to kitchen immediately"
                  >
                    <Toggle
                      enabled={posConfig.autoValidateOrders}
                      onChange={(v) => updatePosConfig("autoValidateOrders", v)}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Package}
                    title="Show Product Images"
                    description="Display product images in POS grid"
                  >
                    <Toggle
                      enabled={posConfig.showProductImages}
                      onChange={(v) => updatePosConfig("showProductImages", v)}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Layers}
                    title="Show Stock Levels"
                    description="Display available stock on products"
                  >
                    <Toggle
                      enabled={posConfig.showProductStock}
                      onChange={(v) => updatePosConfig("showProductStock", v)}
                    />
                  </SettingRow>
                </div>
              </SectionCard>

              <SectionCard
                icon={Utensils}
                title="Restaurant Features"
                description="Table management and kitchen display"
                iconColor="text-orange-500"
                iconBg="bg-orange-500/10"
              >
                <div className="space-y-1 divide-y divide-[color:var(--pos-border)]">
                  <SettingRow
                    icon={Layers}
                    title="Table Management"
                    description="Enable floor plan and table assignments"
                    highlighted={posConfig.enableTableManagement}
                  >
                    <Toggle
                      enabled={posConfig.enableTableManagement}
                      onChange={(v) => updatePosConfig("enableTableManagement", v)}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Bell}
                    title="Kitchen Display System"
                    description="Send orders to kitchen screen"
                    highlighted={posConfig.enableKitchenDisplay}
                  >
                    <Toggle
                      enabled={posConfig.enableKitchenDisplay}
                      onChange={(v) => updatePosConfig("enableKitchenDisplay", v)}
                    />
                  </SettingRow>

                  <SettingRow icon={ShoppingCart} title="Default Order Type" description="Preselected order type">
                    <select
                      value={posConfig.defaultOrderType}
                      onChange={(e) =>
                        updatePosConfig("defaultOrderType", e.target.value as POSConfig["defaultOrderType"])
                      }
                      className="px-4 py-2 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="DINE_IN">Dine In</option>
                      <option value="TAKEAWAY">Takeaway</option>
                      <option value="DELIVERY">Delivery</option>
                    </select>
                  </SettingRow>
                </div>
              </SectionCard>

              <SectionCard
                icon={PiggyBank}
                title="Session & Cash Control"
                description="Manage POS sessions and cash drawer"
                iconColor="text-green-500"
                iconBg="bg-green-500/10"
              >
                <div className="space-y-1 divide-y divide-[color:var(--pos-border)]">
                  <SettingRow icon={Clock} title="Session Control" description="How sessions are managed">
                    <select
                      value={posConfig.sessionControl}
                      onChange={(e) =>
                        updatePosConfig("sessionControl", e.target.value as POSConfig["sessionControl"])
                      }
                      className="px-4 py-2 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="OPEN">Open (No closing control)</option>
                      <option value="CLOSING_CONTROL">Closing Control (Count cash at close)</option>
                    </select>
                  </SettingRow>

                  <SettingRow
                    icon={DollarSign}
                    title="Cash Control"
                    description="Track cash in drawer at open/close"
                    highlighted={posConfig.cashControl}
                  >
                    <Toggle
                      enabled={posConfig.cashControl}
                      onChange={(v) => updatePosConfig("cashControl", v)}
                    />
                  </SettingRow>
                </div>
              </SectionCard>

              <SectionCard
                icon={Percent}
                title="Tips & Loyalty"
                description="Configure tips and customer loyalty"
                iconColor="text-amber-500"
                iconBg="bg-amber-500/10"
              >
                <div className="space-y-1 divide-y divide-[color:var(--pos-border)]">
                  <SettingRow
                    icon={DollarSign}
                    title="Enable Tips"
                    description="Allow customers to add tips"
                    highlighted={posConfig.enableTips}
                  >
                    <Toggle
                      enabled={posConfig.enableTips}
                      onChange={(v) => updatePosConfig("enableTips", v)}
                    />
                  </SettingRow>

                  {posConfig.enableTips && (
                    <SettingRow icon={Percent} title="Tip Options" description="Suggested tip percentages">
                      <div className="flex items-center gap-2">
                        {posConfig.tipOptions.map((tip, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-lg bg-primary-500/10 text-primary-500 text-sm font-medium"
                          >
                            {tip}%
                          </span>
                        ))}
                      </div>
                    </SettingRow>
                  )}

                  <SettingRow
                    icon={Tag}
                    title="Loyalty Program"
                    description="Enable customer loyalty points"
                    highlighted={posConfig.enableLoyalty}
                  >
                    <Toggle
                      enabled={posConfig.enableLoyalty}
                      onChange={(v) => updatePosConfig("enableLoyalty", v)}
                    />
                  </SettingRow>
                </div>
              </SectionCard>
            </>
          )}

          {/* PAYMENT SETTINGS */}
          {activeSection === "payment" && (
            <SectionCard
              icon={CreditCard}
              title="Payment Methods"
              description="Configure accepted payment options"
              iconColor="text-blue-500"
              iconBg="bg-blue-500/10"
            >
              <div className="grid md:grid-cols-3 gap-4">
                {connections.map((c) => {
                  const isConnected = c.status === "CONNECTED";
                  return (
                    <div
                      key={c.provider}
                      className={cn(
                        "rounded-xl border p-5 transition-all",
                        isConnected
                          ? "border-primary-500/30 bg-primary-500/5"
                          : "border-[color:var(--pos-border)] bg-[var(--pos-bg)]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            isConnected ? "bg-primary-500/10" : "bg-[var(--pos-border)]"
                          )}
                        >
                          <CreditCard
                            className={cn(
                              "w-5 h-5",
                              isConnected ? "text-primary-500" : "text-[var(--pos-muted)]"
                            )}
                          />
                        </div>
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-semibold",
                            isConnected
                              ? "bg-primary-500/10 text-primary-500"
                              : "bg-[var(--pos-border)] text-[var(--pos-muted)]"
                          )}
                        >
                          {isConnected ? "Connected" : "Disconnected"}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="font-semibold">{c.displayName}</div>
                        <div className="text-xs text-[var(--pos-muted)] mt-1 capitalize">
                          {c.provider.toLowerCase().replace("_", " ")}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleConnection(c.provider)}
                        disabled={saving === c.provider}
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                          isConnected
                            ? "border border-red-500/30 text-red-500 hover:bg-red-500/10"
                            : "bg-primary-500 text-white hover:opacity-90"
                        )}
                      >
                        {saving === c.provider ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Processing...
                          </span>
                        ) : isConnected ? (
                          "Disconnect"
                        ) : (
                          "Connect"
                        )}
                      </button>

                      {c.lastConnectedAt && (
                        <div className="text-xs text-[var(--pos-muted)] mt-3 text-center" suppressHydrationWarning>
                          Last: {new Date(c.lastConnectedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[var(--pos-muted)]">
                    <span className="font-medium text-[var(--pos-text)]">Note:</span> Cash payments are
                    always available. Card and digital payments require connecting to a payment provider.
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* RECEIPT SETTINGS */}
          {activeSection === "receipt" && (
            <>
              <SectionCard
                icon={Receipt}
                title="Receipt Configuration"
                description="Customize your receipt layout"
                iconColor="text-purple-500"
                iconBg="bg-purple-500/10"
              >
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Settings */}
                  <div className="space-y-1 divide-y divide-[color:var(--pos-border)]">
                    <SettingRow icon={Building2} title="Show Logo" description="Display company logo">
                      <Toggle
                        enabled={receiptConfig.showLogo}
                        onChange={(v) => updateReceiptConfig("showLogo", v)}
                      />
                    </SettingRow>

                    <SettingRow icon={Users} title="Show Cashier" description="Display cashier name">
                      <Toggle
                        enabled={receiptConfig.showCashier}
                        onChange={(v) => updateReceiptConfig("showCashier", v)}
                      />
                    </SettingRow>

                    <SettingRow icon={FileText} title="Show Order Number" description="Display order #">
                      <Toggle
                        enabled={receiptConfig.showOrderNumber}
                        onChange={(v) => updateReceiptConfig("showOrderNumber", v)}
                      />
                    </SettingRow>

                    <SettingRow icon={Clock} title="Show Date & Time" description="Display timestamp">
                      <Toggle
                        enabled={receiptConfig.showDate}
                        onChange={(v) => updateReceiptConfig("showDate", v)}
                      />
                    </SettingRow>

                    <SettingRow icon={Calculator} title="Tax Breakdown" description="Show tax details">
                      <Toggle
                        enabled={receiptConfig.showTaxBreakdown}
                        onChange={(v) => updateReceiptConfig("showTaxBreakdown", v)}
                      />
                    </SettingRow>

                    <SettingRow icon={CreditCard} title="Payment Method" description="Show how paid">
                      <Toggle
                        enabled={receiptConfig.showPaymentMethod}
                        onChange={(v) => updateReceiptConfig("showPaymentMethod", v)}
                      />
                    </SettingRow>

                    <SettingRow icon={Printer} title="Auto-Print" description="Print after payment">
                      <Toggle
                        enabled={receiptConfig.autoPrint}
                        onChange={(v) => updateReceiptConfig("autoPrint", v)}
                      />
                    </SettingRow>

                    <SettingRow icon={Scale} title="Paper Size" description="Receipt paper width">
                      <select
                        value={receiptConfig.paperSize}
                        onChange={(e) =>
                          updateReceiptConfig("paperSize", e.target.value as ReceiptConfig["paperSize"])
                        }
                        className="px-4 py-2 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="58mm">58mm (Narrow)</option>
                        <option value="80mm">80mm (Standard)</option>
                      </select>
                    </SettingRow>
                  </div>

                  {/* Preview */}
                  <div>
                    <div className="text-sm font-medium text-[var(--pos-muted)] mb-3">Preview</div>
                    <div className="bg-white text-black rounded-lg p-4 font-mono text-xs shadow-lg max-w-[280px] mx-auto">
                      {receiptConfig.showLogo && (
                        <div className="text-center mb-3 pb-3 border-b border-dashed border-gray-300">
                          <div className="text-lg font-bold">{receiptConfig.headerText || tenant.name}</div>
                        </div>
                      )}

                      <div className="space-y-1 mb-3 text-gray-600">
                        {receiptConfig.showOrderNumber && <div>Order #: 00123</div>}
                        {receiptConfig.showDate && (
                          <div>
                            01/09/2026
                            {receiptConfig.showTime && " 2:30 PM"}
                          </div>
                        )}
                        {receiptConfig.showCashier && <div>Cashier: John Doe</div>}
                      </div>

                      <div className="border-t border-dashed border-gray-300 my-3" />

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>2x Coffee</span>
                          <span>$8.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>1x Croissant</span>
                          <span>$3.50</span>
                        </div>
                      </div>

                      <div className="border-t border-dashed border-gray-300 my-3" />

                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>$11.50</span>
                        </div>
                        {receiptConfig.showTaxBreakdown && (
                          <div className="flex justify-between text-gray-600">
                            <span>Tax (10%)</span>
                            <span>$1.15</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold pt-2 border-t border-gray-300">
                          <span>TOTAL</span>
                          <span>$12.65</span>
                        </div>
                      </div>

                      {receiptConfig.showPaymentMethod && (
                        <div className="mt-3 pt-3 border-t border-dashed border-gray-300 text-gray-600">
                          Paid by: Cash
                        </div>
                      )}

                      {receiptConfig.footerText && (
                        <div className="text-center mt-3 pt-3 border-t border-dashed border-gray-300 text-gray-500">
                          {receiptConfig.footerText}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                icon={FileText}
                title="Receipt Text"
                description="Customize header and footer messages"
                iconColor="text-indigo-500"
                iconBg="bg-indigo-500/10"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--pos-muted)] mb-2">
                      Header Text
                    </label>
                    <input
                      type="text"
                      value={receiptConfig.headerText}
                      onChange={(e) => updateReceiptConfig("headerText", e.target.value)}
                      placeholder="Company Name"
                      className="w-full px-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--pos-muted)] mb-2">
                      Footer Text
                    </label>
                    <input
                      type="text"
                      value={receiptConfig.footerText}
                      onChange={(e) => updateReceiptConfig("footerText", e.target.value)}
                      placeholder="Thank you message"
                      className="w-full px-4 py-3 rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* TAX SETTINGS */}
          {activeSection === "tax" && (
            <SectionCard
              icon={Calculator}
              title="Tax Configuration"
              description="Manage tax rates for your products"
              iconColor="text-green-500"
              iconBg="bg-green-500/10"
            >
              <div className="space-y-4">
                {taxes.map((tax) => (
                  <div
                    key={tax.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all",
                      tax.isDefault
                        ? "border-primary-500/30 bg-primary-500/5"
                        : "border-[color:var(--pos-border)] bg-[var(--pos-bg)]"
                    )}
                  >
                    {editingTax?.id === tax.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-[var(--pos-muted)] mb-1">Name</label>
                            <input
                              type="text"
                              value={editingTax.name}
                              onChange={(e) => setEditingTax({ ...editingTax, name: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-[var(--pos-muted)] mb-1">Rate (%)</label>
                            <input
                              type="number"
                              value={editingTax.rate}
                              onChange={(e) =>
                                setEditingTax({ ...editingTax, rate: parseFloat(e.target.value) || 0 })
                              }
                              className="w-full px-3 py-2 rounded-lg border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editingTax.includedInPrice}
                              onChange={(e) =>
                                setEditingTax({ ...editingTax, includedInPrice: e.target.checked })
                              }
                              className="rounded border-[color:var(--pos-border)] text-primary-500 focus:ring-primary-500"
                            />
                            Included in price
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingTax(null)}
                              className="px-4 py-2 rounded-lg border border-[color:var(--pos-border)] text-sm font-medium hover:bg-[var(--pos-border)]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveTax(editingTax)}
                              className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
                              tax.isDefault ? "bg-primary-500 text-white" : "bg-[var(--pos-border)]"
                            )}
                          >
                            {tax.rate}%
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{tax.name}</span>
                              {tax.isDefault && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-primary-500/10 text-primary-500 font-medium">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-[var(--pos-muted)]">
                              {tax.includedInPrice ? "Included in price" : "Added to price"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!tax.isDefault && (
                            <button
                              onClick={() => setDefaultTax(tax.id)}
                              className="px-3 py-1.5 rounded-lg border border-[color:var(--pos-border)] text-xs font-medium hover:bg-[var(--pos-bg)]"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => setEditingTax(tax)}
                            className="p-2 rounded-lg hover:bg-[var(--pos-bg)]"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {!tax.isDefault && (
                            <button
                              onClick={() => deleteTax(tax.id)}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={addTax}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-[color:var(--pos-border)] hover:border-primary-500 hover:bg-primary-500/5 transition-all flex items-center justify-center gap-2 text-[var(--pos-muted)] hover:text-primary-500"
                >
                  <Plus className="w-5 h-5" />
                  Add Tax Rate
                </button>
              </div>
            </SectionCard>
          )}

          {/* DEVICE SETTINGS */}
          {activeSection === "devices" && (
            <>
              <SectionCard
                icon={Printer}
                title="Receipt Printer"
                description="Configure your receipt printer"
                iconColor="text-slate-500"
                iconBg="bg-slate-500/10"
              >
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--pos-bg)] flex items-center justify-center mx-auto mb-4">
                    <Printer className="w-8 h-8 text-[var(--pos-muted)]" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No Printer Connected</h3>
                  <p className="text-sm text-[var(--pos-muted)] max-w-md mx-auto mb-4">
                    Connect a receipt printer to automatically print receipts after each sale.
                  </p>
                  <button className="px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 flex items-center gap-2 mx-auto">
                    <Plus className="w-5 h-5" />
                    Add Printer
                  </button>
                </div>
              </SectionCard>

              <SectionCard
                icon={Barcode}
                title="Barcode Scanner"
                description="Configure barcode scanning"
                iconColor="text-indigo-500"
                iconBg="bg-indigo-500/10"
              >
                <div className="space-y-1 divide-y divide-[color:var(--pos-border)]">
                  <SettingRow
                    icon={Keyboard}
                    title="Keyboard Mode"
                    description="Scanner acts as keyboard input"
                    highlighted
                  >
                    <span className="px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 text-sm font-medium">
                      Active
                    </span>
                  </SettingRow>

                  <SettingRow
                    icon={Zap}
                    title="Auto-Add Products"
                    description="Add scanned products to cart automatically"
                  >
                    <Toggle enabled={true} onChange={() => {}} />
                  </SettingRow>
                </div>
              </SectionCard>

              <SectionCard
                icon={Scale}
                title="Weighing Scale"
                description="Configure scale for weighted products"
                iconColor="text-orange-500"
                iconBg="bg-orange-500/10"
              >
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--pos-bg)] flex items-center justify-center mx-auto mb-4">
                    <Scale className="w-8 h-8 text-[var(--pos-muted)]" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No Scale Connected</h3>
                  <p className="text-sm text-[var(--pos-muted)] max-w-md mx-auto mb-4">
                    Connect a weighing scale to sell products by weight.
                  </p>
                  <button className="px-6 py-3 rounded-xl border border-[color:var(--pos-border)] font-medium hover:bg-[var(--pos-bg)] flex items-center gap-2 mx-auto">
                    <Plus className="w-5 h-5" />
                    Add Scale
                  </button>
                </div>
              </SectionCard>
            </>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-xl bg-neutral-900 text-white shadow-lg flex items-center gap-3 animate-slide-up">
          <Check className="w-5 h-5 text-primary-500" />
          {toast}
        </div>
      )}
    </div>
  );
}
