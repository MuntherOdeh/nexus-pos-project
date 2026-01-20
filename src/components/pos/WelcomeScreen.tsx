"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Store,
  UtensilsCrossed,
  Coffee,
  Cake,
  BarChart3,
  ShoppingCart,
  Receipt,
  Package,
  Users,
  CreditCard,
  Check,
  Zap,
  ShoppingBag,
  TrendingUp,
  Clock,
  ChefHat
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getPosThemeClass } from "@/lib/pos/theme";
import { cn } from "@/lib/utils";

const INTRO_DURATION_MS = 6000;

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
    case "RETAIL":
      return ShoppingBag;
    default:
      return Store;
  }
}

function getIndustryGradient(industry: string) {
  switch (industry) {
    case "RESTAURANT":
      return "from-orange-500 to-red-500";
    case "CAFE":
      return "from-amber-500 to-orange-500";
    case "BAKERY":
      return "from-yellow-500 to-amber-500";
    case "RETAIL":
      return "from-blue-500 to-indigo-500";
    default:
      return "from-primary-500 to-emerald-500";
  }
}

const LOADING_STEPS = [
  { icon: BarChart3, label: "Setting up dashboard", subtext: "KPIs and analytics" },
  { icon: ShoppingCart, label: "Preparing checkout", subtext: "Point of sale ready" },
  { icon: Package, label: "Loading inventory", subtext: "Stock management" },
  { icon: Receipt, label: "Configuring invoices", subtext: "Billing system" },
  { icon: Users, label: "Customer profiles", subtext: "CRM ready" },
  { icon: CreditCard, label: "Finalizing setup", subtext: "Almost there..." },
];

const FEATURES_PREVIEW = [
  { icon: Zap, label: "Fast POS", desc: "Quick checkout" },
  { icon: BarChart3, label: "Dashboard", desc: "Real-time KPIs" },
  { icon: Receipt, label: "Invoices", desc: "Professional billing" },
  { icon: Package, label: "Inventory", desc: "Stock tracking" },
  { icon: ChefHat, label: "Kitchen", desc: "KDS display" },
  { icon: TrendingUp, label: "Reports", desc: "Sales insights" },
];

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
  const industryGradient = useMemo(() => getIndustryGradient(tenant.industry), [tenant.industry]);

  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    const startedAt = Date.now();
    let raf = 0;

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, Math.round((elapsed / INTRO_DURATION_MS) * 100));
      setProgress(pct);

      // Update current step based on progress
      const stepIndex = Math.min(
        LOADING_STEPS.length - 1,
        Math.floor((pct / 100) * LOADING_STEPS.length)
      );
      setCurrentStep(stepIndex);

      // Show features at 50% progress
      if (pct >= 50 && !showFeatures) {
        setShowFeatures(true);
      }

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
  }, [router, redirectTo, tenant.slug, showFeatures]);

  return (
    <div className={`pos-theme ${themeClass} min-h-screen relative overflow-hidden`}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, var(--pos-bg) 0%, var(--pos-bg2) 50%, var(--pos-bg) 100%)",
          }}
        />

        {/* Animated orbs */}
        <motion.div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: "var(--pos-accent)", opacity: 0.15 }}
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ background: "var(--pos-accent2)", opacity: 0.12 }}
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ background: "var(--pos-accent)", opacity: 0.08 }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(var(--pos-border) 1px, transparent 1px),
              linear-gradient(90deg, var(--pos-border) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm"
            style={{
              borderColor: "var(--pos-border)",
              background: "rgba(var(--pos-panel-rgb), 0.8)",
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "var(--pos-accent)" }} />
            <span className="text-sm" style={{ color: "var(--pos-text)" }}>
              Setting up your workspace
            </span>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-3xl"
        >
          {/* Header Card */}
          <div
            className="rounded-3xl border p-8 backdrop-blur-xl shadow-2xl mb-6"
            style={{
              background: "var(--pos-panel)",
              borderColor: "var(--pos-border)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
            }}
          >
            <div className="flex items-center gap-6">
              {/* Industry Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
                className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0",
                  "bg-gradient-to-br", industryGradient
                )}
              >
                <IndustryIcon className="w-10 h-10 text-white" />
              </motion.div>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-3xl md:text-4xl font-display font-bold truncate"
                  style={{ color: "var(--pos-text)" }}
                >
                  {tenant.name}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-base mt-1"
                  style={{ color: "var(--pos-muted)" }}
                >
                  Your {tenant.industry.toLowerCase().replace("_", " ")} POS workspace is almost ready
                </motion.p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3"
                  >
                    {React.createElement(LOADING_STEPS[currentStep].icon, {
                      className: "w-5 h-5",
                      style: { color: "var(--pos-accent)" }
                    })}
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--pos-text)" }}>
                        {LOADING_STEPS[currentStep].label}
                      </div>
                      <div className="text-xs" style={{ color: "var(--pos-muted)" }}>
                        {LOADING_STEPS[currentStep].subtext}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div className="text-2xl font-bold font-mono" style={{ color: "var(--pos-accent)" }}>
                  {progress}%
                </div>
              </div>

              <div
                className="h-3 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <motion.div
                  className="h-full rounded-full relative overflow-hidden"
                  style={{
                    background: `linear-gradient(90deg, var(--pos-accent), var(--pos-accent2))`,
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.15 }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                    }}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              </div>

              {/* Step indicators */}
              <div className="flex justify-between mt-4">
                {LOADING_STEPS.map((step, index) => {
                  const isCompleted = index < currentStep;
                  const isCurrent = index === currentStep;
                  return (
                    <motion.div
                      key={step.label}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                        isCompleted && "bg-gradient-to-br from-primary-500 to-emerald-500",
                        isCurrent && "ring-2 ring-offset-2 ring-offset-[var(--pos-bg)]",
                        !isCompleted && !isCurrent && "opacity-30"
                      )}
                      style={{
                        background: isCompleted
                          ? undefined
                          : isCurrent
                            ? "var(--pos-accent)"
                            : "rgba(255,255,255,0.1)",
                        // @ts-expect-error ringColor is valid CSS custom property
                        "--tw-ring-color": isCurrent ? "var(--pos-accent)" : undefined,
                      }}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <step.icon className="w-4 h-4 text-white" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <AnimatePresence>
            {showFeatures && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-3 md:grid-cols-6 gap-3"
              >
                {FEATURES_PREVIEW.map((feature, index) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.08 }}
                    className="rounded-xl border p-3 text-center backdrop-blur-sm"
                    style={{
                      background: "rgba(var(--pos-panel-rgb), 0.6)",
                      borderColor: "var(--pos-border)",
                    }}
                  >
                    <feature.icon
                      className="w-6 h-6 mx-auto mb-2"
                      style={{ color: "var(--pos-accent)" }}
                    />
                    <div className="text-xs font-medium truncate" style={{ color: "var(--pos-text)" }}>
                      {feature.label}
                    </div>
                    <div className="text-[10px] truncate" style={{ color: "var(--pos-muted)" }}>
                      {feature.desc}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bottom Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center gap-4 text-xs"
          style={{ color: "var(--pos-muted)" }}
        >
          <span className="font-mono">
            Workspace: <span style={{ color: "var(--pos-text)" }}>{tenant.slug}</span>
          </span>
          <span className="w-1 h-1 rounded-full" style={{ background: "var(--pos-muted)" }} />
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Auto-redirecting to dashboard
          </span>
          <ArrowRight className="w-3 h-3 animate-pulse" />
        </motion.div>
      </div>
    </div>
  );
}
