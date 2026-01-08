"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Store,
  Coffee,
  ShoppingCart,
  Utensils,
  ChevronDown,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui";

const industries = [
  { icon: Utensils, label: "Restaurants", color: "bg-orange-500" },
  { icon: Coffee, label: "Cafes", color: "bg-amber-500" },
  { icon: Store, label: "Retail", color: "bg-blue-500" },
  { icon: ShoppingCart, label: "Supermarkets", color: "bg-emerald-500" },
];

const highlights = [
  "No setup fees",
  "Free 14-day trial",
  "Cancel anytime",
];

export function Hero() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeIndustry, setActiveIndustry] = useState(0);
  const { scrollY } = useScroll();

  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndustry((prev) => (prev + 1) % industries.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Animated Gradient Background */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Primary gradient blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary-500/30 via-primary-500/10 to-transparent blur-3xl" />

        {/* Secondary accent blobs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-10 w-72 h-72 bg-secondary-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-10 w-96 h-96 bg-primary-400/15 rounded-full blur-3xl"
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </motion.div>

      {/* Main Content */}
      <div className="container-custom relative z-10 pt-20 pb-12">
        <div className="max-w-5xl mx-auto text-center">
          {/* Top Badge */}
          <motion.div
            initial={isMounted ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-sm mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-neutral-300">The Future of Point of Sale</span>
            <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs font-medium rounded-full">
              New
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={isMounted ? { opacity: 0, y: 30 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold text-white leading-[1.05] tracking-tight mb-6"
          >
            Sell More.
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary-400 via-emerald-400 to-secondary-400 bg-clip-text text-transparent">
                Stress Less.
              </span>
              <motion.svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                <motion.path
                  d="M2 8C50 3 100 3 150 6C200 9 250 7 298 4"
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.8 }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </motion.svg>
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={isMounted ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            The all-in-one POS system built for UAE businesses.
            Fast setup, powerful features, zero headaches.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={isMounted ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-white text-neutral-900 hover:bg-neutral-100 px-8 h-14 text-lg font-semibold shadow-xl shadow-white/10 w-full sm:w-auto"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/services">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 px-8 h-14 text-lg w-full sm:w-auto"
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={isMounted ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-500"
          >
            {highlights.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary-500" />
                <span>{item}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Industry Showcase */}
        <motion.div
          initial={isMounted ? { opacity: 0, y: 40 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20"
        >
          {/* Floating POS Interface Preview */}
          <div className="relative max-w-4xl mx-auto">
            {/* Main Card */}
            <div className="relative bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              {/* Decorative glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 via-transparent to-secondary-500/20 rounded-3xl blur-xl opacity-50" />

              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">NexusPoint POS</h3>
                      <p className="text-neutral-500 text-sm">Real-time Dashboard</p>
                    </div>
                  </div>

                  {/* Industry Tabs */}
                  <div className="hidden md:flex items-center gap-2 bg-neutral-800/50 rounded-full p-1.5">
                    {industries.map((industry, index) => {
                      const Icon = industry.icon;
                      return (
                        <button
                          key={industry.label}
                          onClick={() => setActiveIndustry(index)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            activeIndustry === index
                              ? "bg-white text-neutral-900"
                              : "text-neutral-400 hover:text-white"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="hidden lg:inline">{industry.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Today's Sales", value: "AED 12,450", change: "+18%", positive: true },
                    { label: "Orders", value: "156", change: "+23", positive: true },
                    { label: "Avg. Order", value: "AED 79.80", change: "+5%", positive: true },
                    { label: "Active Tables", value: "12/20", change: "60%", positive: true },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="bg-neutral-800/50 rounded-2xl p-4"
                    >
                      <p className="text-neutral-500 text-xs mb-1">{stat.label}</p>
                      <p className="text-white text-xl font-bold">{stat.value}</p>
                      <span className={`text-xs ${stat.positive ? "text-emerald-400" : "text-red-400"}`}>
                        {stat.change}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Actions Bar */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {["New Order", "Tables", "Menu", "Reports", "Inventory", "Settings"].map((action, index) => (
                    <motion.div
                      key={action}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      className="flex-shrink-0 px-5 py-3 bg-neutral-800/80 hover:bg-neutral-700/80 border border-white/5 rounded-xl text-sm text-neutral-300 hover:text-white cursor-pointer transition-colors"
                    >
                      {action}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating notification cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-xl hidden md:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Payment Received</p>
                  <p className="text-emerald-400 text-xs">+AED 234.00</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-4 -left-4 bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-xl hidden md:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Order #2847</p>
                  <p className="text-amber-400 text-xs">Ready for pickup</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          style={{ opacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-neutral-500"
          >
            <span className="text-xs uppercase tracking-wider">Scroll to explore</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
