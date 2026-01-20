"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, Building2, Sparkles, AlertCircle } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";

export default function SignInPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const tenantSlug = workspace.trim().toLowerCase().replace(/\s+/g, "-");

    if (!tenantSlug) {
      setError("Please enter your workspace name");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/pos/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        if (response.status === 401) {
          setError("Invalid email or password");
        } else if (response.status === 429) {
          setError("Too many attempts. Please try again later.");
        } else {
          setError(data?.error || "Invalid credentials. Please check your workspace, email, and password.");
        }
        return;
      }

      // Redirect to the POS dashboard
      router.push(`/t/${tenantSlug}/pos`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-primary-500/20 blur-3xl rounded-full animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[620px] h-[620px] bg-secondary-500/15 blur-3xl rounded-full animate-pulse" style={{ animationDelay: "400ms" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-600/5 blur-3xl rounded-full" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Card variant="glass" className="bg-white/10 border-white/10 backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 w-fit mx-auto mb-4">
                <Sparkles className="w-4 h-4 text-primary-300" />
                <span className="text-sm text-neutral-200">NexusPoint POS</span>
              </div>
              <CardTitle className="text-white text-2xl">Welcome back</CardTitle>
              <p className="text-neutral-400 mt-2">
                Sign in to your workspace to continue
              </p>
            </CardHeader>
            <CardContent>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 rounded-xl bg-red-500/10 border border-red-400/20 p-4 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Input
                    label="Workspace"
                    name="workspace"
                    type="text"
                    value={workspace}
                    onChange={(e) => setWorkspace(e.target.value)}
                    placeholder="your-company-name"
                    leftIcon={<Building2 className="w-4 h-4" />}
                    required
                  />
                  <p className="mt-1.5 text-xs text-neutral-500">The name you used when signing up</p>
                </div>

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

                <Button
                  type="submit"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full mt-2"
                >
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-sm text-neutral-400">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="text-primary-400 hover:text-primary-300 font-medium">
                    Get started free
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Back to home link */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Back to homepage
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
