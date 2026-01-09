"use client";

import React, { createContext, useContext, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  ChefHat,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
  Bell,
  Search,
  HelpCircle,
  Home,
  Plus,
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
  user,
  children,
}: {
  tenant: TenantShell;
  user?: { id: string; email: string; firstName: string; lastName: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isPathBased = pathname.startsWith("/t/");
  const base = isPathBased ? `/t/${tenant.slug}/pos` : "";
  const marketingUrl = process.env.NEXT_PUBLIC_APP_URL || "/";

  const [theme, setTheme] = useState<PosThemeKey>(() => normalizePosTheme(tenant.theme));
  const [industry, setIndustry] = useState<string>(tenant.industry);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const themeClass = useMemo(() => POS_THEMES[theme].className, [theme]);
  const isDark = theme === "DARK";

  // Navigation items - removed Warehouse
  const navItems = useMemo(
    () => [
      { href: isPathBased ? base : "/", label: "Dashboard", icon: LayoutDashboard, color: "text-blue-500" },
      { href: isPathBased ? `${base}/checkout` : "/checkout", label: "Point of Sale", icon: ShoppingCart, color: "text-emerald-500" },
      { href: isPathBased ? `${base}/kds` : "/kds", label: "Kitchen Display", icon: ChefHat, color: "text-orange-500" },
      { href: isPathBased ? `${base}/invoices` : "/invoices", label: "Invoices", icon: Receipt, color: "text-purple-500" },
      { href: isPathBased ? `${base}/inventory` : "/inventory", label: "Products", icon: Boxes, color: "text-pink-500" },
      { href: isPathBased ? `${base}/logistics` : "/logistics", label: "Logistics", icon: Truck, color: "text-amber-500" },
    ],
    [base, isPathBased]
  );

  const settingsItem = useMemo(
    () => ({ href: isPathBased ? `${base}/settings` : "/settings", label: "Settings", icon: Settings }),
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

  const toggleTheme = () => {
    updateTheme(isDark ? "LIGHT" : "DARK");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/pos/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    } finally {
      const loginHref = isPathBased ? `/t/${tenant.slug}/pos/login` : "/login";
      router.push(loginHref);
      router.refresh();
    }
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
          "min-h-screen bg-[var(--pos-bg)] text-[var(--pos-text)] transition-colors duration-300"
        )}
      >
        <div className="min-h-screen flex">
          {/* Mobile backdrop */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={cn(
              "fixed lg:static inset-y-0 left-0 z-50 flex flex-col",
              "border-r border-[color:var(--pos-border)] bg-[var(--pos-bg2)] shadow-xl lg:shadow-none",
              "transform transition-all duration-300 ease-in-out",
              isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
              isSidebarCollapsed ? "w-20" : "w-72"
            )}
          >
            {/* Logo Header */}
            <div className={cn(
              "h-16 flex items-center border-b border-[color:var(--pos-border)]",
              isSidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
            )}>
              <Link href={isPathBased ? base : "/"} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, var(--pos-accent), var(--pos-accent2))",
                  }}
                >
                  <span className="font-bold text-white text-lg">N</span>
                </div>
                {!isSidebarCollapsed && (
                  <div className="leading-tight">
                    <div className="font-bold text-base">NexusPoint</div>
                    <div className="text-xs text-[var(--pos-muted)]">POS System</div>
                  </div>
                )}
              </Link>
              <button
                className={cn(
                  "lg:hidden p-2 rounded-lg hover:bg-[var(--pos-border)] transition-colors",
                  isSidebarCollapsed && "hidden"
                )}
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions */}
            {!isSidebarCollapsed && (
              <div className="px-4 py-3 border-b border-[color:var(--pos-border)]">
                <Link
                  href={isPathBased ? `${base}/checkout` : "/checkout"}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, var(--pos-accent), var(--pos-accent2))",
                  }}
                >
                  <Plus className="w-5 h-5" />
                  New Sale
                </Link>
              </div>
            )}

            {/* Search */}
            {!isSidebarCollapsed && (
              <div className="px-4 py-3 border-b border-[color:var(--pos-border)]">
                <div className="flex items-center gap-2">
                  <button className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--pos-bg)] border border-[color:var(--pos-border)] text-sm text-[var(--pos-muted)] hover:border-[var(--pos-accent)] transition-colors">
                    <Search className="w-4 h-4" />
                    <span>Search...</span>
                    <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[var(--pos-border)] text-[var(--pos-muted)]">⌘K</kbd>
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <div className={cn("space-y-1", isSidebarCollapsed && "space-y-2")}>
                {navItems.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl transition-all duration-200",
                        isSidebarCollapsed ? "justify-center p-3" : "px-4 py-3",
                        active
                          ? "bg-[var(--pos-accent)]/10 text-[var(--pos-accent)] font-semibold"
                          : "text-[var(--pos-muted)] hover:bg-[var(--pos-border)] hover:text-[var(--pos-text)]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5 flex-shrink-0 transition-colors",
                          active ? "text-[var(--pos-accent)]" : item.color
                        )}
                      />
                      {!isSidebarCollapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {active && (
                            <div className="w-2 h-2 rounded-full bg-[var(--pos-accent)]" />
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Bottom Section */}
            <div className="border-t border-[color:var(--pos-border)] p-3 space-y-2">
              {/* Settings Link */}
              <Link
                href={settingsItem.href}
                onClick={() => setIsSidebarOpen(false)}
                title={isSidebarCollapsed ? settingsItem.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl transition-all duration-200",
                  isSidebarCollapsed ? "justify-center p-3" : "px-4 py-3",
                  isActivePath(pathname, settingsItem.href)
                    ? "bg-[var(--pos-accent)]/10 text-[var(--pos-accent)] font-semibold"
                    : "text-[var(--pos-muted)] hover:bg-[var(--pos-border)] hover:text-[var(--pos-text)]"
                )}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Settings</span>}
              </Link>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                title={isSidebarCollapsed ? `Switch to ${isDark ? "Light" : "Dark"} mode` : undefined}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl transition-all duration-200",
                  isSidebarCollapsed ? "justify-center p-3" : "px-4 py-3",
                  "text-[var(--pos-muted)] hover:bg-[var(--pos-border)] hover:text-[var(--pos-text)]"
                )}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 flex-shrink-0 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 flex-shrink-0 text-indigo-500" />
                )}
                {!isSidebarCollapsed && (
                  <>
                    <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                    {isPending && (
                      <div className="ml-auto w-4 h-4 border-2 border-[var(--pos-muted)] border-t-[var(--pos-accent)] rounded-full animate-spin" />
                    )}
                  </>
                )}
              </button>

              {/* Collapse Toggle - Desktop Only */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={cn(
                  "hidden lg:flex w-full items-center gap-3 rounded-xl transition-all duration-200",
                  isSidebarCollapsed ? "justify-center p-3" : "px-4 py-3",
                  "text-[var(--pos-muted)] hover:bg-[var(--pos-border)] hover:text-[var(--pos-text)]"
                )}
              >
                <ChevronRight className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform",
                  isSidebarCollapsed ? "rotate-0" : "rotate-180"
                )} />
                {!isSidebarCollapsed && <span>Collapse</span>}
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Top Header */}
            <header className="sticky top-0 z-30 h-16 border-b border-[color:var(--pos-border)] bg-[var(--pos-bg2)]/80 backdrop-blur-xl">
              <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
                {/* Left Side */}
                <div className="flex items-center gap-3">
                  <button
                    className="lg:hidden p-2 rounded-xl border border-[color:var(--pos-border)] hover:bg-[var(--pos-border)] transition-colors"
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Open menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>

                  {/* Breadcrumb / Workspace Info */}
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--pos-bg)] border border-[color:var(--pos-border)]">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-medium">{tenant.name}</span>
                    </div>
                    <span className="hidden md:inline text-[var(--pos-muted)]">/</span>
                    <span className="hidden md:inline text-sm text-[var(--pos-muted)] capitalize">
                      {industry.toLowerCase().replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Right Side - Actions */}
                <div className="flex items-center gap-2">
                  {/* Help Button */}
                  <button className="p-2 rounded-xl border border-[color:var(--pos-border)] hover:bg-[var(--pos-border)] transition-colors text-[var(--pos-muted)] hover:text-[var(--pos-text)]">
                    <HelpCircle className="w-5 h-5" />
                  </button>

                  {/* Notifications */}
                  <button className="p-2 rounded-xl border border-[color:var(--pos-border)] hover:bg-[var(--pos-border)] transition-colors text-[var(--pos-muted)] hover:text-[var(--pos-text)] relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                  </button>

                  {/* User Info & Logout */}
                  {user && (
                    <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-[color:var(--pos-border)]">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-[var(--pos-muted)]">{user.role}</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="p-2 rounded-xl border border-[color:var(--pos-border)] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition-all"
                        title="Logout"
                      >
                        <LogOut className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Back to Website */}
                  <a
                    href={marketingUrl}
                    className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl border border-[color:var(--pos-border)] hover:bg-[var(--pos-border)] text-sm font-medium text-[var(--pos-muted)] hover:text-[var(--pos-text)] transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 p-4 lg:p-6 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
    </PosShellContext.Provider>
  );
}
