"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  Sparkles,
  ArrowRight,
  Zap,
  Building2,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui";

const plans = [
  {
    name: "Starter",
    icon: Zap,
    description: "Perfect for small cafes and food trucks",
    price: "299",
    period: "/month",
    popular: false,
    features: [
      "1 POS terminal",
      "Basic inventory tracking",
      "Daily sales reports",
      "Email support",
      "Cloud backup",
      "Mobile app access",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Professional",
    icon: Rocket,
    description: "Ideal for restaurants and retail stores",
    price: "599",
    period: "/month",
    popular: true,
    features: [
      "Up to 5 POS terminals",
      "Advanced inventory management",
      "Real-time analytics dashboard",
      "Kitchen display system",
      "Table management",
      "Priority phone support",
      "Staff management",
      "Custom receipt branding",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    icon: Building2,
    description: "For multi-location businesses",
    price: "Custom",
    period: "",
    popular: false,
    features: [
      "Unlimited terminals",
      "Multi-branch management",
      "Advanced reporting & BI",
      "API access",
      "Dedicated account manager",
      "On-site training",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

export function Pricing() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0,0,0) 1px, transparent 0)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="container-custom relative z-10">
        {/* Header */}
        <motion.div
          initial={isMounted ? { opacity: 0, y: 20 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="badge-primary mb-4">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-neutral-900 mb-4">
            Simple, Transparent
            <span className="text-primary-600"> Pricing</span>
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            No hidden fees. No long-term contracts. Start free and scale as you grow.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={isMounted ? { opacity: 0, y: 20 } : false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-3xl p-8 ${
                  plan.highlight
                    ? "bg-neutral-900 text-white shadow-2xl shadow-neutral-900/20 scale-105"
                    : "bg-neutral-50 text-neutral-900 border border-neutral-200"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-full">
                      <Sparkles className="w-4 h-4" />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                    plan.highlight
                      ? "bg-white/10"
                      : "bg-primary-100"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      plan.highlight ? "text-primary-400" : "text-primary-600"
                    }`}
                  />
                </div>

                {/* Plan Name */}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p
                  className={`text-sm mb-6 ${
                    plan.highlight ? "text-neutral-400" : "text-neutral-600"
                  }`}
                >
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-8">
                  <span className="text-4xl font-bold">
                    {plan.price === "Custom" ? "" : "AED "}
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${
                      plan.highlight ? "text-neutral-400" : "text-neutral-500"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check
                        className={`w-5 h-5 flex-shrink-0 ${
                          plan.highlight ? "text-primary-400" : "text-primary-600"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          plan.highlight ? "text-neutral-300" : "text-neutral-600"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link href={plan.name === "Enterprise" ? "/contact" : "/signup"}>
                  <Button
                    className={`w-full ${
                      plan.highlight
                        ? "bg-white text-neutral-900 hover:bg-neutral-100"
                        : "bg-neutral-900 text-white hover:bg-neutral-800"
                    }`}
                    size="lg"
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <motion.div
          initial={isMounted ? { opacity: 0 } : false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-neutral-500 text-sm">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
