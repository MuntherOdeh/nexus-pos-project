"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Globe, Mail, Phone, Sparkles, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from "@/components/ui";
import { getPublicTenantRootDomain, isValidTenantSlug, slugifyCompanyName } from "@/lib/tenant-slug";
import type { DemoSignupData } from "@/lib/validations";

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
  { value: "S1_5", label: "1–5" },
  { value: "S6_20", label: "6–20" },
  { value: "S21_50", label: "21–50" },
  { value: "S51_200", label: "51–200" },
  { value: "S201_1000", label: "201–1000" },
  { value: "S1000_PLUS", label: "1000+" },
];

const INDUSTRIES = [
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "CAFE", label: "Cafe" },
  { value: "BAKERY", label: "Bakery" },
  { value: "RETAIL", label: "Retail" },
  { value: "OTHER", label: "Other" },
];

type FieldErrors = Partial<Record<keyof DemoSignupData, string>>;

export default function SignupPage() {
  const router = useRouter();
  const rootDomain = useMemo(() => getPublicTenantRootDomain(), []);

  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

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
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof DemoSignupData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setSubmitError(null);
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

  return (
    <div className="min-h-screen relative overflow-hidden bg-neutral-950 text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-primary-500/30 blur-3xl rounded-full animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[620px] h-[620px] bg-secondary-500/25 blur-3xl rounded-full animate-pulse animation-delay-400" />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900/40" />
      </div>

      <div className="relative container-custom py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Left */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10">
                <Sparkles className="w-4 h-4 text-primary-300" />
                <span className="text-sm text-neutral-200">Launch your interactive POS demo</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
                Create your{" "}
                <span className="bg-gradient-to-r from-primary-300 via-emerald-200 to-secondary-300 bg-clip-text text-transparent">
                  NexusPoint
                </span>{" "}
                workspace
              </h1>
              <p className="text-lg text-neutral-300 max-w-xl">
                Restaurant, cafe, bakery, or retail — get a ready-to-click demo dashboard with invoices,
                inventory, warehouse, and payments in minutes.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid sm:grid-cols-2 gap-4"
            >
              {[
                { title: "Dashboard & KPIs", desc: "Sales, revenue, top items, trends." },
                { title: "Invoices", desc: "Draft, sent, paid, overdue — all tracked." },
                { title: "Inventory", desc: "Receipts, deliveries, stock levels." },
                { title: "Payments", desc: "Bank, PayPal, card connections (demo)." },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-colors"
                >
                  <div className="font-semibold text-white">{item.title}</div>
                  <div className="text-sm text-neutral-300 mt-1">{item.desc}</div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-2xl bg-gradient-to-r from-primary-600/20 to-secondary-600/20 border border-white/10 p-6"
            >
              <div className="text-sm text-neutral-300 mb-2">Your demo link</div>
              <div className="font-mono text-base md:text-lg break-all">
                {demoHost || `https://your-company.${rootDomain}`}
              </div>
              {slugHint && <div className="text-sm text-primary-200 mt-2">{slugHint}</div>}
              {isSlugAdjusted && (
                <div className="text-xs text-neutral-400 mt-1">
                  Tip: In production this runs on your subdomain. Locally, your demo opens at{" "}
                  <span className="font-mono">/t/{suggestedSlug}/welcome</span>.
                </div>
              )}
            </motion.div>
          </div>

          {/* Right - Form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Card variant="glass" className="bg-white/10 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Sign up</CardTitle>
                <div className="text-sm text-neutral-300">
                  Fill in your details — we&apos;ll generate your demo workspace.
                </div>
              </CardHeader>
              <CardContent>
                {submitError && (
                  <div className="mb-6 rounded-xl bg-red-500/10 border border-red-400/20 p-4 text-sm text-red-200">
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <Input
                      label="First name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Munther"
                      error={errors.firstName}
                      leftIcon={<User className="w-4 h-4" />}
                      required
                    />
                    <Input
                      label="Last name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Odeh"
                      error={errors.lastName}
                      leftIcon={<User className="w-4 h-4" />}
                      required
                    />
                  </div>

                  <Input
                    label="Company name"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Pizza"
                    error={errors.companyName}
                    leftIcon={<Building2 className="w-4 h-4" />}
                    required
                  />

                  <div className="grid sm:grid-cols-2 gap-6">
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@company.com"
                      error={errors.email}
                      leftIcon={<Mail className="w-4 h-4" />}
                      required
                    />
                    <Input
                      label="Phone"
                      name="phone"
                      type="tel"
                      value={formData.phone || ""}
                      onChange={handleChange}
                      placeholder="+971 50 000 0000"
                      error={errors.phone}
                      leftIcon={<Phone className="w-4 h-4" />}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
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
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <Select
                      label="Company size"
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleChange}
                      options={COMPANY_SIZES}
                      error={errors.companySize}
                      required
                    />
                    <Select
                      label="Business type"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      options={INDUSTRIES}
                      error={errors.industry}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
                    <Globe className="w-5 h-5" />
                    Create demo workspace
                    <ArrowRight className="w-5 h-5" />
                  </Button>

                  <div className="text-xs text-neutral-400">
                    By continuing you agree to our demo terms. No payment required for the demo workspace.
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
