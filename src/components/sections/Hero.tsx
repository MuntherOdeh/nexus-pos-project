"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Play,
  Check,
  ShoppingBag,
  Receipt,
  CreditCard,
  TrendingUp,
  Users,
  Package,
  Zap,
  Star
} from "lucide-react";
import { Button } from "@/components/ui";

const floatingCards = [
  { icon: Receipt, label: "Order #1847", amount: "+AED 156.00", color: "bg-emerald-500" },
  { icon: CreditCard, label: "Payment", amount: "Completed", color: "bg-blue-500" },
  { icon: TrendingUp, label: "Sales Today", amount: "+23%", color: "bg-purple-500" },
];

const stats = [
  { value: "99.9%", label: "Uptime" },
  { value: "< 1s", label: "Response" },
  { value: "24/7", label: "Support" },
];

export function Hero() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [currentOrder, setCurrentOrder] = useState(0);

  const tabs = ["Restaurant", "Cafe", "Retail"];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % tabs.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tabs.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOrder((prev) => (prev + 1) % floatingCards.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-neutral-950">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.3),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_80%_60%,rgba(20,184,166,0.15),rgba(255,255,255,0))]" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />

        {/* Floating Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="container-custom relative z-10 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={isMounted ? { opacity: 0, x: -30 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={isMounted ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-8"
            >
              <Zap className="w-4 h-4" />
              <span>Next-Gen POS System</span>
              <span className="flex items-center gap-1 text-primary-300">
                <Star className="w-3 h-3 fill-current" />
                4.9
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={isMounted ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.1] mb-6"
            >
              Run Your
              <br />
              <span className="relative">
                <span className="bg-gradient-to-r from-primary-400 via-emerald-300 to-secondary-400 bg-clip-text text-transparent">
                  Business
                </span>
                <motion.span
                  className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                />
              </span>
              <br />
              Smarter
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={isMounted ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-neutral-400 mb-8 max-w-lg leading-relaxed"
            >
              The all-in-one POS system designed for modern restaurants, cafes, and retail stores.
              Fast, reliable, and beautifully simple.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={isMounted ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <Link href="/signup">
                <Button size="lg" className="bg-primary-500 hover:bg-primary-600 text-white px-8 h-14 text-lg">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/services">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 px-8 h-14 text-lg"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={isMounted ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-8"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-neutral-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right - POS Dashboard Mockup */}
          <motion.div
            initial={isMounted ? { opacity: 0, x: 30 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            {/* Main Dashboard Card */}
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-3xl blur-2xl" />

              {/* Dashboard */}
              <div className="relative bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">NexusPoint POS</div>
                      <div className="text-xs text-neutral-500">Dashboard</div>
                    </div>
                  </div>

                  {/* Tab Switcher */}
                  <div className="flex items-center gap-1 bg-neutral-800/50 rounded-lg p-1">
                    {tabs.map((tab, index) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(index)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          activeTab === index
                            ? "bg-primary-500 text-white"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-neutral-800/50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-white">247</div>
                    <div className="text-xs text-neutral-500">Orders Today</div>
                    <div className="text-xs text-emerald-400 mt-1">+12% vs yesterday</div>
                  </div>
                  <div className="bg-neutral-800/50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-white">AED 8,420</div>
                    <div className="text-xs text-neutral-500">Revenue</div>
                    <div className="text-xs text-emerald-400 mt-1">+8% vs yesterday</div>
                  </div>
                  <div className="bg-neutral-800/50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-white">34</div>
                    <div className="text-xs text-neutral-500">Active Tables</div>
                    <div className="text-xs text-amber-400 mt-1">6 awaiting</div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="space-y-3">
                  <div className="text-sm text-neutral-400 mb-2">Recent Orders</div>
                  {[
                    { id: "#1847", items: "3 items", amount: "AED 156.00", status: "completed" },
                    { id: "#1846", items: "5 items", amount: "AED 234.50", status: "preparing" },
                    { id: "#1845", items: "2 items", amount: "AED 89.00", status: "completed" },
                  ].map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center justify-between bg-neutral-800/30 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          order.status === "completed" ? "bg-emerald-500" : "bg-amber-500"
                        }`} />
                        <div>
                          <div className="text-sm text-white font-medium">{order.id}</div>
                          <div className="text-xs text-neutral-500">{order.items}</div>
                        </div>
                      </div>
                      <div className="text-sm text-white font-medium">{order.amount}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-2 mt-6">
                  {[
                    { icon: Receipt, label: "New Order" },
                    { icon: Users, label: "Tables" },
                    { icon: Package, label: "Inventory" },
                    { icon: TrendingUp, label: "Reports" },
                  ].map((action) => (
                    <motion.button
                      key={action.label}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center gap-2 p-3 bg-neutral-800/30 hover:bg-neutral-800/50 rounded-xl transition-colors"
                    >
                      <action.icon className="w-5 h-5 text-primary-400" />
                      <span className="text-xs text-neutral-400">{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Floating Notification Cards */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentOrder}
                  initial={{ opacity: 0, x: 50, y: -20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className="absolute -top-4 -right-4 bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${floatingCards[currentOrder].color} rounded-xl flex items-center justify-center`}>
                      {React.createElement(floatingCards[currentOrder].icon, { className: "w-5 h-5 text-white" })}
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{floatingCards[currentOrder].label}</div>
                      <div className="text-xs text-emerald-400">{floatingCards[currentOrder].amount}</div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Bottom Left Badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium">99.9% Uptime</div>
                    <div className="text-xs text-neutral-500">Enterprise reliability</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section - Trusted By */}
        <motion.div
          initial={isMounted ? { opacity: 0, y: 30 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-20 pt-12 border-t border-white/5"
        >
          <div className="text-center">
            <p className="text-sm text-neutral-500 mb-6">Trusted by businesses across the UAE</p>
            <div className="flex items-center justify-center gap-12 flex-wrap">
              {["Restaurants", "Cafes", "Retail Stores", "Food Courts", "Hotels"].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  className="text-neutral-600 font-medium"
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
