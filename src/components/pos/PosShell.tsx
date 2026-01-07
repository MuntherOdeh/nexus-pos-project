"use client";

import React, { createContext, useContext, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  Receipt,
  Settings,
  Truck,
  Warehouse,
  Menu,
  X,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { POS_THEMES, type PosThemeKey, normalizePosTheme } from "@/lib/pos/theme";

type TenantShell = {
  slug: string;
  name: string;
  industry: string;
  theme: string;
};

type PosShellContextValue = {
  tenantSlug: string;
  theme: PosThemeKey;
  setTheme: (next: PosThemeKey) => void;
  industry: string;
  setIndustry: (next: string) => void;
};

const PosShellContext = createContext<PosShellContextValue | null>(null);

export function usePosShell(): PosShellContextValue {
  const value = useContext(PosShellContext);
  if (!value) {
    throw new Error("usePosShell must be used within PosShell");
  }
  return value;
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href.endsWith("/pos")) {
    return pathname === href || pathname === `${href}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PosShell({
  tenant,
  children,
}: {
  tenant: TenantShell;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPathBased = pathname.startsWith("/t/");
  const base = isPathBased ? `/t/${tenant.slug}/pos` : "";
  const marketingUrl = process.env.NEXT_PUBLIC_APP_URL || "/";

  const [theme, setTheme] = useState<PosThemeKey>(() => normalizePosTheme(tenant.theme));
  const [industry, setIndustry] = useState<string>(tenant.industry);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const themeClass = useMemo(() => POS_THEMES[theme].className, [theme]);

  const navItems = useMemo(
    () => [
      { href: isPathBased ? base : "/", label: "Dashboard", icon: LayoutDashboard },
      { href: isPathBased ? `${base}/invoices` : "/invoices", label: "Invoices", icon: Receipt },
      { href: isPathBased ? `${base}/inventory` : "/inventory", label: "Inventory", icon: Boxes },
      { href: isPathBased ? `${base}/logistics` : "/logistics", label: "Logistics", icon: Truck },
      { href: isPathBased ? `${base}/warehouse` : "/warehouse", label: "Warehouse", icon: Warehouse },
      { href: isPathBased ? `${base}/settings` : "/settings", label: "Settings", icon: Settings },
    ],
    [base, isPathBased]
  );

  const updateTheme = (next: PosThemeKey) => {
    setTheme(next);
    startTransition(async () => {
      try {
        await fetch("/api/pos/tenant/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantSlug: tenant.slug, theme: next }),
        });
      } catch {
        // Ignore demo failures
      }
    });
  };

  return (
    <PosShellContext.Provider
      value={{
        tenantSlug: tenant.slug,
        theme,
        setTheme: updateTheme,
        industry,
        setIndustry,
      }}
    >
      <div
        className={cn(
          "pos-theme",
          themeClass,
          "min-h-screen bg-[var(--pos-bg)] text-[var(--pos-text)]"
        )}
      >
        <div className="min-h-screen flex">
          {/* Mobile backdrop */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={cn(
              "fixed lg:static inset-y-0 left-0 z-50 w-80 max-w-[85vw] border-r border-[color:var(--pos-border)] bg-[var(--pos-bg2)]/80 backdrop-blur-xl",
              "transform transition-transform duration-300",
              isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}
          >
          <div className="p-6 border-b border-[color:var(--pos-border)] flex items-center justify-between">
            <Link href={isPathBased ? base : "/"} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: "linear-gradient(135deg, var(--pos-accent), var(--pos-accent2))",
                }}
              >
                <span className="font-bold text-black/80">N</span>
              </div>
              <div className="leading-tight">
                <div className="font-display font-bold text-lg">NexusPoint POS</div>
                <div className="text-xs text-[var(--pos-muted)]">{tenant.name}</div>
              </div>
            </Link>
              <button
                className="lg:hidden p-2 rounded-xl hover:bg-white/5 border border-[color:var(--pos-border)]"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors",
                      active
                        ? "bg-white/10 border-white/10"
                        : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10"
                    )}
                  >
                    <Icon
                      className={cn("w-5 h-5", active ? "text-[var(--pos-accent2)]" : "text-[var(--pos-muted)]")}
                    />
                    <span className={cn("font-semibold", active ? "text-white" : "text-[var(--pos-text)]")}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[color:var(--pos-border)] mt-auto">
              <div className="rounded-2xl border border-[color:var(--pos-border)] bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Palette className="w-4 h-4" style={{ color: "var(--pos-accent)" }} />
                  Theme
                </div>
                <select
                  className="mt-3 w-full rounded-xl border border-[color:var(--pos-border)] bg-[var(--pos-panel-solid)] px-3 py-2 text-sm"
                  value={theme}
                  onChange={(e) => updateTheme(e.target.value as PosThemeKey)}
                >
                  {Object.entries(POS_THEMES).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>
                {isPending && <div className="mt-2 text-xs text-[var(--pos-muted)]">Saving…</div>}
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <header className="sticky top-0 z-30 border-b border-[color:var(--pos-border)] bg-[var(--pos-bg)]/70 backdrop-blur-xl">
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    className="lg:hidden p-2 rounded-xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10"
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Open menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <div className="leading-tight">
                    <div className="font-semibold">Demo Workspace</div>
                    <div className="text-xs text-[var(--pos-muted)] font-mono">{tenant.slug}</div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-3">
                <div
                  className="px-3 py-2 rounded-2xl border bg-white/5 text-xs"
                  style={{ borderColor: "var(--pos-border)" }}
                >
                  <span className="text-[var(--pos-muted)]">Business:</span>{" "}
                  <span className="font-semibold">{industry}</span>
                </div>
                <a
                  href={marketingUrl}
                  className="px-3 py-2 rounded-2xl border border-[color:var(--pos-border)] bg-white/5 hover:bg-white/10 text-xs font-semibold"
                >
                  Back to website
                </a>
              </div>
            </div>
          </header>

            <main className="p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </div>
    </PosShellContext.Provider>
  );
}
