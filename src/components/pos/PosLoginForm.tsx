"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";

export function PosLoginForm({
  tenant,
}: {
  tenant: { slug: string; name: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const isPathBased = pathname.startsWith("/t/");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/pos/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: tenant.slug,
          email,
          password,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        setError(data?.error || "Invalid email or password");
        return;
      }

      const fallback = isPathBased ? `/t/${tenant.slug}/pos` : "/";
      router.push(redirectTo || fallback);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-primary-500/25 blur-3xl rounded-full animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[620px] h-[620px] bg-secondary-500/20 blur-3xl rounded-full animate-pulse animation-delay-400" />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900/40" />
      </div>

      <div className="relative container-custom py-14 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          <Card variant="glass" className="bg-white/10 border-white/10">
            <CardHeader>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 w-fit">
                <Sparkles className="w-4 h-4 text-primary-300" />
                <span className="text-sm text-neutral-200">NexusPoint POS</span>
              </div>
              <CardTitle className="text-white mt-4">Sign in to {tenant.name}</CardTitle>
              <div className="text-sm text-neutral-300">
                Use your staff credentials to access the POS workspace.
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-6 rounded-xl bg-red-500/10 border border-red-400/20 p-4 text-sm text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />

                <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
                  Sign in
                  <ArrowRight className="w-5 h-5" />
                </Button>

                <div className="text-xs text-neutral-400">
                  If you just created this demo, use the password you set during signup.
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

