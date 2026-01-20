"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Globe,
  Lock,
  Mail,
  Phone,
  Sparkles,
  User,
  UtensilsCrossed,
  Coffee,
  Croissant,
  ShoppingBag,
  Store,
  Check,
  Zap,
  BarChart3,
  Receipt,
  Package,
  CreditCard
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from "@/components/ui";
import { getPublicTenantRootDomain, isValidTenantSlug, slugifyCompanyName } from "@/lib/tenant-slug";
import type { DemoSignupData } from "@/lib/validations";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { value: "AE", label: "United Arab Emirates" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "QA", label: "Qatar" },
  { value: "OM", label: "Oman" },
  { value: "KW", label: "Kuwait" },
  { value: "BH", label: "Bahrain" },
  { value: "JO", label: "Jordan" },
  { value: "EG", label: "Egypt" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
];

const COMPANY_SIZES = [
  { value: "S1_5", label: "1–5 employees" },
  { value: "S6_20", label: "6–20 employees" },
  { value: "S21_50", label: "21–50 employees" },
  { value: "S51_200", label: "51–200 employees" },
  { value: "S201_1000", label: "201–1000 employees" },
  { value: "S1000_PLUS", label: "1000+ employees" },
];

type IndustryType = "RESTAURANT" | "CAFE" | "BAKERY" | "RETAIL" | "OTHER";

const BUSINESS_TYPES: Array<{
  value: IndustryType;
  label: string;
  icon: typeof UtensilsCrossed;
  description: string;
  gradient: string;
  lightGradient: string;
  features: string[];
}> = [
  {
    value: "RESTAURANT",
    label: "Restaurant",
    icon: UtensilsCrossed,
    description: "Full-service dining, fast food, or food truck",
    gradient: "from-orange-500 to-red-500",
    lightGradient: "from-orange-500/20 to-red-500/20",
    features: ["Table management", "Kitchen display", "Split bills"]
  },
  {
    value: "CAFE",
    label: "Cafe & Coffee Shop",
    icon: Coffee,
    description: "Coffee shops, tea houses, juice bars",
    gradient: "from-amber-500 to-orange-500",
    lightGradient: "from-amber-500/20 to-orange-500/20",
    features: ["Quick orders", "Loyalty rewards", "Modifiers"]
  },
  {
    value: "BAKERY",
    label: "Bakery",
    icon: Croissant,
    description: "Bakeries, patisseries, dessert shops",
    gradient: "from-yellow-500 to-amber-500",
    lightGradient: "from-yellow-500/20 to-amber-500/20",
    features: ["Pre-orders", "Daily specials", "Stock alerts"]
  },
  {
    value: "RETAIL",
    label: "Retail Store",
    icon: ShoppingBag,
    description: "Boutiques, grocery, electronics, general retail",
    gradient: "from-blue-500 to-indigo-500",
    lightGradient: "from-blue-500/20 to-indigo-500/20",
    features: ["Barcode scanning", "Inventory", "Multi-location"]
  },
  {
    value: "OTHER",
    label: "Other Business",
    icon: Store,
    description: "Services, salons, or any other business",
    gradient: "from-purple-500 to-pink-500",
    lightGradient: "from-purple-500/20 to-pink-500/20",
    features: ["Flexible setup", "Custom products", "Appointments"]
  },
];

type FieldErrors = Partial<Record<keyof DemoSignupData | "confirmPassword", string>>;

export default function SignupPage() {
  const router = useRouter();
  const rootDomain = useMemo(() => getPublicTenantRootDomain(), []);

  const [step, setStep] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmPassword, setConfirmPassword] = useState("");

  const [formData, setFormData] = useState<DemoSignupData>({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phone: "",
    country: "AE",
    language: "en",
    companySize: "S1_5",
    industry: "RESTAURANT",
    password: "",
    desiredSlug: "",
  });

  const baseSlug = useMemo(() => slugifyCompanyName(formData.companyName), [formData.companyName]);
  const [suggestedSlug, setSuggestedSlug] = useState<string>("");
  const [isSlugAdjusted, setIsSlugAdjusted] = useState(false);
  const [slugHint, setSlugHint] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setSuggestedSlug(baseSlug);
    setIsSlugAdjusted(false);
    setSlugHint(null);

    if (!baseSlug) return;
    if (!isValidTenantSlug(baseSlug)) {
      setSlugHint("Use a shorter company name to generate a valid link.");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/demo/tenant-slug?companyName=${encodeURIComponent(formData.companyName)}`,
          { method: "GET", signal: controller.signal }
        );
        if (!response.ok) return;
        const data: { success: boolean; suggestedSlug: string; isBaseAvailable: boolean } = await response.json();
        if (!data.success) return;
        setSuggestedSlug(data.suggestedSlug);
        setIsSlugAdjusted(!data.isBaseAvailable);
        setSlugHint(!data.isBaseAvailable ? "That link is taken — we prepared the next best one." : null);
      } catch {
        // Ignore
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [baseSlug, formData.companyName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "confirmPassword") {
      setConfirmPassword(value);
      if (errors.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
      }
      setSubmitError(null);
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitError(null);
  };

  const selectBusinessType = (type: IndustryType) => {
    setFormData((prev) => ({ ...prev, industry: type }));
    setStep(2);
  };

  const validateForm = (): boolean => {
    const nextErrors: FieldErrors = {};

    if (!formData.firstName.trim()) nextErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) nextErrors.lastName = "Last name is required";
    if (!formData.companyName.trim()) nextErrors.companyName = "Company name is required";
    if (!formData.email.trim()) nextErrors.email = "Email is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Please enter a valid email address";
    }
    if (!formData.country) nextErrors.country = "Country is required";
    if (!formData.language) nextErrors.language = "Language is required";
    if (!formData.companySize) nextErrors.companySize = "Company size is required";
    if (!formData.industry) nextErrors.industry = "Business type is required";
    if (!formData.password) nextErrors.password = "Password is required";
    if (formData.password && formData.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password && confirmPassword !== formData.password) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    if (!suggestedSlug || !isValidTenantSlug(suggestedSlug)) {
      nextErrors.companyName = "Please enter a company name that can generate a valid link";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/demo/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          desiredSlug: suggestedSlug,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        setSubmitError(data?.error || "Something went wrong. Please try again.");
        if (data?.details) {
          const apiErrors: FieldErrors = {};
          for (const key of Object.keys(data.details)) {
            const field = key as keyof DemoSignupData;
            const msg = Array.isArray(data.details[key]) ? data.details[key][0] : undefined;
            if (msg) apiErrors[field] = msg;
          }
          setErrors((prev) => ({ ...prev, ...apiErrors }));
        }
        return;
      }

      router.push(data.redirectUrl || `/t/${data.tenant?.slug}/welcome`);
      router.refresh();
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const demoHost = suggestedSlug ? `https://${suggestedSlug}.${rootDomain}` : "";
  const selectedType = BUSINESS_TYPES.find(t => t.value === formData.industry);

  return (
    <div className="min-h-screen relative overflow-hidden bg-neutral-950 text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-primary-500/30 blur-3xl rounded-full animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[620px] h-[620px] bg-secondary-500/25 blur-3xl rounded-full animate-pulse animation-delay-400" />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900/40" />
      </div>

      <div className="relative container-custom py-8 lg:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 mb-6">
            <Sparkles className="w-4 h-4 text-primary-300" />
            <span className="text-sm text-neutral-200">Get started in seconds</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight">
            {step === 1 ? (
              <>
                What type of business do you run?
              </>
            ) : (
              <>
                Create your{" "}
                <span className="bg-gradient-to-r from-primary-300 via-emerald-200 to-secondary-300 bg-clip-text text-transparent">
                  NexusPoint
                </span>{" "}
                workspace
              </>
            )}
          </h1>
          <p className="text-lg text-neutral-400 mt-3 max-w-2xl mx-auto">
            {step === 1
              ? "Select your business type to get a tailored POS experience with pre-loaded products and settings"
              : "Fill in your details and we'll set up your personalized demo in seconds"
            }
          </p>
        </motion.div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2].map((s) => (
            <button
              key={s}
              onClick={() => s < step && setStep(s)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                s === step
                  ? "bg-primary-500 text-white"
                  : s < step
                    ? "bg-white/20 text-white cursor-pointer hover:bg-white/30"
                    : "bg-white/5 text-neutral-500 cursor-not-allowed"
              )}
            >
              {s < step ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">
                  {s}
                </span>
              )}
              <span className="text-sm font-medium">
                {s === 1 ? "Business Type" : "Details"}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Business Type Selection */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {BUSINESS_TYPES.map((type, index) => {
                  const Icon = type.icon;
                  const isSelected = formData.industry === type.value;

                  return (
                    <motion.button
                      key={type.value}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => selectBusinessType(type.value)}
                      className={cn(
                        "relative group rounded-2xl p-6 text-left transition-all duration-300",
                        "border-2 hover:scale-[1.02]",
                        isSelected
                          ? "bg-gradient-to-br " + type.lightGradient + " border-white/30"
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all",
                        "bg-gradient-to-br", type.gradient
                      )}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-bold mb-1">{type.label}</h3>
                      <p className="text-sm text-neutral-400 mb-4">{type.description}</p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2">
                        {type.features.map((feature) => (
                          <span
                            key={feature}
                            className="px-2 py-1 rounded-lg bg-white/10 text-xs text-neutral-300"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Arrow */}
                      <div className={cn(
                        "absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        "bg-white/10 group-hover:bg-white/20"
                      )}>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Features Preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-12 max-w-4xl mx-auto"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-neutral-200">What you get with your demo</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Zap, label: "Point of Sale", desc: "Fast checkout" },
                    { icon: BarChart3, label: "Dashboard", desc: "Real-time KPIs" },
                    { icon: Receipt, label: "Invoices", desc: "Professional billing" },
                    { icon: Package, label: "Inventory", desc: "Stock management" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="rounded-xl bg-white/5 border border-white/10 p-4 text-center"
                    >
                      <item.icon className="w-6 h-6 mx-auto mb-2 text-primary-400" />
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-neutral-500">{item.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-5 gap-8 items-start max-w-6xl mx-auto"
            >
              {/* Left - Preview */}
              <div className="lg:col-span-2 space-y-6">
                {/* Selected Business Type */}
                {selectedType && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "rounded-2xl p-5 border border-white/20",
                      "bg-gradient-to-br", selectedType.lightGradient
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        "bg-gradient-to-br", selectedType.gradient
                      )}>
                        <selectedType.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">{selectedType.label}</div>
                        <button
                          onClick={() => setStep(1)}
                          className="text-xs text-primary-300 hover:underline"
                        >
                          Change type
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedType.features.map((f) => (
                        <span key={f} className="px-2 py-0.5 rounded bg-white/10 text-xs text-neutral-300">
                          {f}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Demo Link Preview */}
                <div className="rounded-2xl bg-gradient-to-r from-primary-600/20 to-secondary-600/20 border border-white/10 p-5">
                  <div className="text-sm text-neutral-300 mb-2">Your demo workspace URL</div>
                  <div className="font-mono text-sm break-all text-white">
                    {demoHost || `https://your-company.${rootDomain}`}
                  </div>
                  {slugHint && <div className="text-xs text-primary-200 mt-2">{slugHint}</div>}
                </div>

                {/* Features */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <div className="text-sm font-medium mb-4 text-neutral-200">Included in your demo</div>
                  <div className="space-y-3">
                    {[
                      { icon: Zap, text: "Point of Sale with products" },
                      { icon: BarChart3, text: "Dashboard with KPIs" },
                      { icon: Receipt, text: "Invoice management" },
                      { icon: Package, text: "Inventory tracking" },
                      { icon: CreditCard, text: "Payment connections" },
                    ].map((item) => (
                      <div key={item.text} className="flex items-center gap-3 text-sm text-neutral-400">
                        <item.icon className="w-4 h-4 text-primary-400" />
                        {item.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right - Form */}
              <div className="lg:col-span-3">
                <Card variant="glass" className="bg-white/10 border-white/10">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setStep(1)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <CardTitle className="text-white">Your details</CardTitle>
                        <div className="text-sm text-neutral-400">
                          Set up your account and workspace
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {submitError && (
                      <div className="mb-6 rounded-xl bg-red-500/10 border border-red-400/20 p-4 text-sm text-red-200">
                        {submitError}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <Input
                          label="First name"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="First name"
                          error={errors.firstName}
                          leftIcon={<User className="w-4 h-4" />}
                          required
                        />
                        <Input
                          label="Last name"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Last name"
                          error={errors.lastName}
                          leftIcon={<User className="w-4 h-4" />}
                          required
                        />
                      </div>

                      <Input
                        label="Business name"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Your business name"
                        error={errors.companyName}
                        leftIcon={<Building2 className="w-4 h-4" />}
                        required
                      />

                      <div className="grid sm:grid-cols-2 gap-5">
                        <Input
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Email address"
                          error={errors.email}
                          leftIcon={<Mail className="w-4 h-4" />}
                          required
                        />
                        <Input
                          label="Phone (optional)"
                          name="phone"
                          type="tel"
                          value={formData.phone || ""}
                          onChange={handleChange}
                          placeholder="Phone number"
                          error={errors.phone}
                          leftIcon={<Phone className="w-4 h-4" />}
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <Input
                          label="Password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Min 8 characters"
                          error={errors.password as string | undefined}
                          leftIcon={<Lock className="w-4 h-4" />}
                          required
                        />
                        <Input
                          label="Confirm password"
                          name="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={handleChange}
                          placeholder="Re-enter password"
                          error={errors.confirmPassword as string | undefined}
                          leftIcon={<Lock className="w-4 h-4" />}
                          required
                        />
                      </div>

                      <div className="grid sm:grid-cols-3 gap-5">
                        <Select
                          label="Country"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          options={COUNTRIES}
                          error={errors.country}
                          required
                        />
                        <Select
                          label="Language"
                          name="language"
                          value={formData.language}
                          onChange={handleChange}
                          options={LANGUAGES}
                          error={errors.language}
                          required
                        />
                        <Select
                          label="Team size"
                          name="companySize"
                          value={formData.companySize}
                          onChange={handleChange}
                          options={COMPANY_SIZES}
                          error={errors.companySize}
                          required
                        />
                      </div>

                      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
                        <Globe className="w-5 h-5" />
                        Create my demo workspace
                        <ArrowRight className="w-5 h-5" />
                      </Button>

                      <div className="text-xs text-neutral-500 text-center">
                        By continuing you agree to our demo terms. No payment required.
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
