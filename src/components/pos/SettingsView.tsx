"use client";

import React, { useMemo, useState, useTransition } from "react";
import { Building2, CreditCard, Globe, Link2, Palette, RefreshCw } from "lucide-react";
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

  const workspaceHost = `https://${tenant.slug}.${rootDomain}`;

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">Settings</h1>
        <p className="text-sm md:text-base text-[var(--pos-muted)] mt-2">
          Customize your POS demo workspace — theme, business type, and payments.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <PosCard className="lg:col-span-2">
          <PosCardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">Workspace</div>
                <div className="text-xs text-[var(--pos-muted)]">Your Odoo-style link</div>
              </div>
              <div className="text-xs text-[var(--pos-muted)] font-mono">{tenant.slug}</div>
            </div>
          </PosCardHeader>
          <PosCardContent>
            <div className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-[var(--pos-muted)] mb-2">Workspace link</div>
                  <div className="font-mono text-sm md:text-base break-all">{workspaceHost}</div>
                  <div className="text-xs text-[var(--pos-muted)] mt-2">
                    Local demo: <span className="font-mono">/t/{tenant.slug}/pos</span>
                  </div>
                </div>
                <button
                  className="px-4 py-2 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-sm font-semibold inline-flex items-center gap-2"
                  onClick={() => navigator.clipboard.writeText(workspaceHost)}
                >
                  <Link2 className="w-4 h-4" />
                  Copy
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              {[
                { icon: Building2, label: "Company", value: tenant.name },
                { icon: Globe, label: "Country", value: tenant.country },
                { icon: RefreshCw, label: "Currency", value: tenant.currency },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-xs text-[var(--pos-muted)]">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                  <div className="font-semibold mt-2">{item.value}</div>
                </div>
              ))}
            </div>
          </PosCardContent>
        </PosCard>

        <PosCard>
          <PosCardHeader>
            <div className="text-sm font-semibold">Business type</div>
            <div className="text-xs text-[var(--pos-muted)]">Restaurant, cafe, bakery…</div>
          </PosCardHeader>
          <PosCardContent>
            <select
              value={industry}
              onChange={(e) => updateIndustry(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 text-sm text-[var(--pos-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--pos-accent2)]"
            >
              {INDUSTRIES.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
            <div className="text-xs text-[var(--pos-muted)] mt-3">
              Changes what the demo highlights (menus, flows, etc.).
            </div>
            {saving === "industry" && <div className="text-xs text-[var(--pos-muted)] mt-2">Saving…</div>}
          </PosCardContent>
        </PosCard>
      </div>

      <PosCard>
        <PosCardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Themes</div>
              <div className="text-xs text-[var(--pos-muted)]">Pick a look your team will love.</div>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-[var(--pos-muted)]">
              <Palette className="w-4 h-4" />
              Current: <span className="font-semibold text-[var(--pos-text)]">{POS_THEMES[theme].label}</span>
            </div>
          </div>
        </PosCardHeader>
        <PosCardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(POS_THEMES).map(([key, meta]) => {
              const k = key as PosThemeKey;
              const active = k === theme;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(k)}
                  className={`rounded-2xl border p-5 text-left transition-colors ${
                    active ? "border-white/20 bg-white/10" : "border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div
                    className="h-10 rounded-2xl mb-4"
                    style={{ background: `linear-gradient(135deg, ${meta.accent}, ${meta.accent2})` }}
                  />
                  <div className="font-semibold">{meta.label}</div>
                  <div className="text-xs text-[var(--pos-muted)] mt-1">
                    {active ? "Selected" : "Click to apply"}
                  </div>
                </button>
              );
            })}
          </div>
          {isPending && saving === null && <div className="text-xs text-[var(--pos-muted)] mt-3">Saving…</div>}
        </PosCardContent>
      </PosCard>

      <PosCard>
        <PosCardHeader>
          <div className="text-sm font-semibold">Payments</div>
          <div className="text-xs text-[var(--pos-muted)]">Connect bank, PayPal, or cards (demo toggles).</div>
        </PosCardHeader>
        <PosCardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {connections.map((c) => {
              const Icon = providerIcon(c.provider);
              return (
                <div
                  key={c.provider}
                  className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{providerLabel(c.provider)}</div>
                      <div className="text-xs text-[var(--pos-muted)] mt-1">{c.displayName}</div>
                    </div>
                    <Icon className="w-5 h-5 text-[var(--pos-muted)]" />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <StatusBadge status={c.status} />
                    <button
                      type="button"
                      onClick={() => toggleConnection(c.provider)}
                      className="px-4 py-2 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-sm font-semibold"
                      disabled={saving === c.provider}
                    >
                      {saving === c.provider ? "Saving…" : c.status === "CONNECTED" ? "Disconnect" : "Connect"}
                    </button>
                  </div>

                  {c.lastConnectedAt && (
                    <div className="text-xs text-[var(--pos-muted)] mt-3">
                      Last connected: {new Date(c.lastConnectedAt).toLocaleString()}
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

