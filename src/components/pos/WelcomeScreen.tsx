"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Store, UtensilsCrossed, Coffee, Cake } from "lucide-react";
import { useRouter } from "next/navigation";
import { getPosThemeClass } from "@/lib/pos/theme";

const INTRO_DURATION_MS = 5600;

type TenantPreview = {
  slug: string;
  name: string;
  industry: string;
  theme: string;
};

function getIndustryIcon(industry: string) {
  switch (industry) {
    case "RESTAURANT":
      return UtensilsCrossed;
    case "CAFE":
      return Coffee;
    case "BAKERY":
      return Cake;
    default:
      return Store;
  }
}

export function WelcomeScreen({
  tenant,
  redirectTo,
}: {
  tenant: TenantPreview;
  redirectTo?: string;
}) {
  const router = useRouter();
  const themeClass = useMemo(() => getPosThemeClass(tenant.theme), [tenant.theme]);
  const IndustryIcon = useMemo(() => getIndustryIcon(tenant.industry), [tenant.industry]);

  const [progress, setProgress] = useState(0);
  const hasRedirected = useRef(false);

  useEffect(() => {
    const startedAt = Date.now();
    let raf = 0;

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, Math.round((elapsed / INTRO_DURATION_MS) * 100));
      setProgress(pct);

      if (elapsed >= INTRO_DURATION_MS && !hasRedirected.current) {
        hasRedirected.current = true;
        router.replace(redirectTo || `/t/${tenant.slug}/pos`);
        router.refresh();
        return;
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [router, redirectTo, tenant.slug]);

  return (
    <div className={`pos-theme ${themeClass} min-h-screen relative overflow-hidden`}>
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            background:
              "radial-gradient(1200px 600px at 20% 10%, var(--pos-accent) 0%, transparent 60%)," +
              "radial-gradient(900px 500px at 80% 30%, var(--pos-accent2) 0%, transparent 55%)," +
              "radial-gradient(1000px 600px at 50% 90%, rgba(148, 163, 184, 0.14) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, var(--pos-bg) 0%, var(--pos-bg2) 100%)",
          }}
        />
        <motion.div
          className="absolute -top-40 -left-40 w-[620px] h-[620px] rounded-full blur-3xl opacity-35"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, var(--pos-accent) 0%, transparent 60%)",
          }}
          animate={{ x: [0, 40, 0], y: [0, 25, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-48 -right-48 w-[720px] h-[720px] rounded-full blur-3xl opacity-30"
          style={{
            background:
              "radial-gradient(circle at 60% 50%, var(--pos-accent2) 0%, transparent 60%)",
          }}
          animate={{ x: [0, -35, 0], y: [0, -30, 0] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-2xl"
        >
            <div
            className="rounded-3xl border p-8 md:p-10 backdrop-blur-xl shadow-2xl"
            style={{
              background: "var(--pos-panel)",
              borderColor: "var(--pos-border)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
            }}
          >
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-3">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
                  style={{ borderColor: "var(--pos-border)", color: "var(--pos-text)" }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: "var(--pos-accent)" }} />
                  <span className="text-sm">Welcome to your demo</span>
                </div>
                <div className="text-3xl md:text-4xl font-display font-bold" style={{ color: "var(--pos-text)" }}>
                  {tenant.name}
                </div>
                <div className="text-sm md:text-base" style={{ color: "var(--pos-muted)" }}>
                  We&apos;re preparing a {tenant.industry.toLowerCase()}-ready POS workspace with dashboard, invoices,
                  inventory, and payments.
                </div>
              </div>

              <div
                className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl border"
                style={{
                  borderColor: "var(--pos-border)",
                  background: "rgba(15, 23, 42, 0.6)",
                }}
              >
                <IndustryIcon className="w-6 h-6" style={{ color: "var(--pos-accent2)" }} />
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <div className="flex items-center justify-between text-sm" style={{ color: "var(--pos-muted)" }}>
                <span>Loading demo experience</span>
                <span className="font-mono">{progress}%</span>
              </div>

              <div
                className="h-3 rounded-full overflow-hidden border"
                style={{ borderColor: "var(--pos-border)", background: "rgba(255,255,255,0.05)" }}
              >
                <motion.div
                  className="h-full"
                  style={{
                    background: "linear-gradient(90deg, var(--pos-accent), var(--pos-accent2))",
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.25 }}
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-3 pt-4">
                {[
                  { label: "KPIs & charts", value: "Ready" },
                  { label: "Invoices", value: "Synced" },
                  { label: "Inventory", value: "Prepared" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: "var(--pos-border)",
                      background: "rgba(15, 23, 42, 0.55)",
                    }}
                  >
                    <div className="text-xs" style={{ color: "var(--pos-muted)" }}>
                      {item.label}
                    </div>
                    <div className="text-sm font-semibold mt-1" style={{ color: "var(--pos-text)" }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs" style={{ color: "var(--pos-muted)" }}>
                <span className="font-mono">
                  Workspace: <span style={{ color: "var(--pos-text)" }}>{tenant.slug}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  Entering dashboard <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
