"use client";

import React, { useMemo, useState, useTransition } from "react";
import { Building2, CreditCard, Globe, Link2, Sun, Moon, RefreshCw, Check } from "lucide-react";
import { POS_THEMES, type PosThemeKey } from "@/lib/pos/theme";
import { getPublicTenantRootDomain } from "@/lib/tenant-slug";
import { PosCard, PosCardContent, PosCardHeader } from "@/components/pos/PosCard";
import { StatusBadge } from "@/components/pos/StatusBadge";
import { usePosShell } from "@/components/pos/PosShell";

type PaymentConnectionRow = {
  provider: string;
  status: string;
  displayName: string;
  lastConnectedAt?: string | null;
};

const INDUSTRIES = [
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "CAFE", label: "Cafe" },
  { value: "BAKERY", label: "Bakery" },
  { value: "RETAIL", label: "Retail" },
  { value: "OTHER", label: "Other" },
];

function providerIcon(provider: string) {
  return CreditCard;
}

function providerLabel(provider: string): string {
  switch (provider) {
    case "BANK":
      return "Bank Transfer";
    case "PAYPAL":
      return "PayPal";
    case "CARD":
      return "Credit / Debit Cards";
    default:
      return provider;
  }
}

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

  const workspaceHost = `https://${tenant.slug}.${rootDomain}`;
  const isDark = theme === "DARK";

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

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-sm text-[var(--pos-muted)] mt-1">
          Customize your workspace preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Workspace Info */}
        <PosCard>
          <PosCardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--pos-accent)]/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[var(--pos-accent)]" />
              </div>
              <div>
                <div className="font-semibold">Workspace</div>
                <div className="text-xs text-[var(--pos-muted)]">{tenant.slug}</div>
              </div>
            </div>
          </PosCardHeader>
          <PosCardContent>
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
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { icon: Building2, label: "Company", value: tenant.name },
                { icon: Globe, label: "Country", value: tenant.country },
                { icon: RefreshCw, label: "Currency", value: tenant.currency },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-bg)] p-3 text-center">
                  <item.icon className="w-4 h-4 mx-auto text-[var(--pos-muted)] mb-1" />
                  <div className="text-[10px] text-[var(--pos-muted)] uppercase tracking-wide">{item.label}</div>
                  <div className="font-semibold text-sm mt-1 truncate">{item.value}</div>
                </div>
              ))}
            </div>
          </PosCardContent>
        </PosCard>

        {/* Business Type */}
        <PosCard>
          <PosCardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="font-semibold">Business Type</div>
                <div className="text-xs text-[var(--pos-muted)]">Select your industry</div>
              </div>
            </div>
          </PosCardHeader>
          <PosCardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INDUSTRIES.map((i) => (
                <button
                  key={i.value}
                  type="button"
                  onClick={() => updateIndustry(i.value)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    industry === i.value
                      ? "border-[var(--pos-accent)] bg-[var(--pos-accent)]/10 text-[var(--pos-accent)]"
                      : "border-[color:var(--pos-border)] hover:bg-[var(--pos-border)] text-[var(--pos-muted)] hover:text-[var(--pos-text)]"
                  }`}
                >
                  {i.label}
                  {industry === i.value && <span className="ml-1">✓</span>}
                </button>
              ))}
            </div>
            {saving === "industry" && (
              <div className="text-xs text-[var(--pos-muted)] mt-3 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-[var(--pos-muted)] border-t-[var(--pos-accent)] rounded-full animate-spin" />
                Saving...
              </div>
            )}
          </PosCardContent>
        </PosCard>
      </div>

      {/* Theme Selection */}
      <PosCard>
        <PosCardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                {isDark ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
              </div>
              <div>
                <div className="font-semibold">Appearance</div>
                <div className="text-xs text-[var(--pos-muted)]">Choose your preferred theme</div>
              </div>
            </div>
            <div className="text-sm text-[var(--pos-muted)]">
              Current: <span className="font-semibold text-[var(--pos-text)]">{POS_THEMES[theme].label}</span>
            </div>
          </div>
        </PosCardHeader>
        <PosCardContent>
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
                  className={`relative rounded-2xl border p-6 text-left transition-all ${
                    active
                      ? "border-[var(--pos-accent)] bg-[var(--pos-accent)]/5 ring-2 ring-[var(--pos-accent)]/20"
                      : "border-[color:var(--pos-border)] hover:border-[var(--pos-accent)]/50 hover:bg-[var(--pos-border)]"
                  }`}
                >
                  {active && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[var(--pos-accent)] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        isLightTheme ? "bg-gray-100" : "bg-slate-800"
                      }`}
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
                    className={`rounded-xl p-3 ${
                      isLightTheme ? "bg-white border border-gray-200" : "bg-slate-900 border border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-2 w-2 rounded-full ${isLightTheme ? "bg-gray-300" : "bg-slate-600"}`} />
                      <div className={`h-2 flex-1 rounded ${isLightTheme ? "bg-gray-200" : "bg-slate-700"}`} />
                    </div>
                    <div className="flex gap-2">
                      <div
                        className="h-6 w-16 rounded"
                        style={{ background: `linear-gradient(135deg, ${meta.accent}, ${meta.accent2})` }}
                      />
                      <div className={`h-6 flex-1 rounded ${isLightTheme ? "bg-gray-100" : "bg-slate-800"}`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {isPending && saving === null && (
            <div className="text-xs text-[var(--pos-muted)] mt-4 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-[var(--pos-muted)] border-t-[var(--pos-accent)] rounded-full animate-spin" />
              Applying theme...
            </div>
          )}
        </PosCardContent>
      </PosCard>

      {/* Payment Connections */}
      <PosCard>
        <PosCardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="font-semibold">Payment Methods</div>
              <div className="text-xs text-[var(--pos-muted)]">Configure payment options</div>
            </div>
          </div>
        </PosCardHeader>
        <PosCardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {connections.map((c) => {
              const Icon = providerIcon(c.provider);
              const isConnected = c.status === "CONNECTED";
              return (
                <div
                  key={c.provider}
                  className={`rounded-xl border p-5 transition-all ${
                    isConnected
                      ? "border-[var(--pos-accent)]/30 bg-[var(--pos-accent)]/5"
                      : "border-[color:var(--pos-border)] bg-[var(--pos-bg)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isConnected ? "bg-[var(--pos-accent)]/10" : "bg-[var(--pos-border)]"
                    }`}>
                      <Icon className={`w-5 h-5 ${isConnected ? "text-[var(--pos-accent)]" : "text-[var(--pos-muted)]"}`} />
                    </div>
                    <StatusBadge status={c.status} />
                  </div>

                  <div className="mb-4">
                    <div className="font-semibold">{providerLabel(c.provider)}</div>
                    <div className="text-xs text-[var(--pos-muted)] mt-1">{c.displayName}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleConnection(c.provider)}
                    disabled={saving === c.provider}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isConnected
                        ? "border border-red-500/30 text-red-500 hover:bg-red-500/10"
                        : "bg-[var(--pos-accent)] text-white hover:opacity-90"
                    }`}
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
                    <div className="text-xs text-[var(--pos-muted)] mt-3 text-center">
                      Last: {new Date(c.lastConnectedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </PosCardContent>
      </PosCard>
    </div>
  );
}
