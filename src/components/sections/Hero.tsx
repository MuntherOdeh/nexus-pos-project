"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Store,
  Coffee,
  ShoppingCart,
  Utensils,
  ChevronDown,
  Play,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Zap,
  BarChart3,
  Package,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui";

const industries = [
  { icon: Utensils, label: "Restaurants", color: "from-orange-500 to-red-500", stats: { sales: "AED 18,450", orders: "203", avg: "AED 90.89", tables: "18/24" } },
  { icon: Coffee, label: "Cafes", color: "from-amber-500 to-orange-500", stats: { sales: "AED 8,230", orders: "312", avg: "AED 26.38", tables: "8/12" } },
  { icon: Store, label: "Retail", color: "from-blue-500 to-indigo-500", stats: { sales: "AED 24,680", orders: "89", avg: "AED 277.30", tables: "N/A" } },
  { icon: ShoppingCart, label: "Supermarkets", color: "from-emerald-500 to-teal-500", stats: { sales: "AED 45,120", orders: "567", avg: "AED 79.58", tables: "6/8" } },
];

const highlights = [
  "No setup fees",
  "Free 14-day trial",
  "Cancel anytime",
];

const quickActions = [
  { label: "New Order", icon: CreditCard, color: "text-emerald-400" },
  { label: "Tables", icon: Users, color: "text-blue-400" },
  { label: "Menu", icon: Package, color: "text-amber-400" },
  { label: "Reports", icon: BarChart3, color: "text-purple-400" },
  { label: "Inventory", icon: Package, color: "text-pink-400" },
  { label: "Settings", icon: Zap, color: "text-cyan-400" },
];

export function Hero() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeIndustry, setActiveIndustry] = useState(0);
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  const [hoveredAction, setHoveredAction] = useState<number | null>(null);
  const [liveOrderCount, setLiveOrderCount] = useState(156);
  const [showNotification, setShowNotification] = useState(true);
  const { scrollY } = useScroll();

  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndustry((prev) => (prev + 1) % industries.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Simulate live order updates
  useEffect(() => {
    const orderInterval = setInterval(() => {
      setLiveOrderCount((prev) => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(orderInterval);
  }, []);

  // Toggle notification
  useEffect(() => {
    const notifInterval = setInterval(() => {
      setShowNotification((prev) => !prev);
    }, 6000);
    return () => clearInterval(notifInterval);
  }, []);

  const currentIndustry = industries[activeIndustry];

  const statsData = [
    { label: "Today's Sales", value: currentIndustry.stats.sales, change: "+18%", icon: DollarSign, positive: true },
    { label: "Orders", value: liveOrderCount.toString(), change: "+23", icon: TrendingUp, positive: true, live: true },
    { label: "Avg. Order", value: currentIndustry.stats.avg, change: "+5%", icon: BarChart3, positive: true },
    { label: "Active Tables", value: currentIndustry.stats.tables, change: "75%", icon: Clock, positive: true },
  ];

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-x-hidden overflow-y-visible bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Animated Gradient Background */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        {/* Primary gradient blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] max-w-[200vw] h-[600px] bg-gradient-to-b from-primary-500/30 via-primary-500/10 to-transparent blur-3xl" />

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
          {/* Main Heading */}
          <motion.h1
            initial={isMounted ? { opacity: 0, y: 30 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-white leading-[1.1] tracking-tight mb-4 sm:mb-6"
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
            className="text-base sm:text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed px-2"
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
                className="bg-white text-neutral-900 hover:bg-neutral-100 px-8 h-14 text-lg font-semibold shadow-xl shadow-white/10 w-full sm:w-auto group"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/services">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 px-8 h-14 text-lg w-full sm:w-auto group"
              >
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
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

        {/* Interactive Dashboard Preview */}
        <motion.div
          initial={isMounted ? { opacity: 0, y: 40 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-10 sm:mt-16 md:mt-20 px-2"
        >
          <div className="relative max-w-4xl mx-auto">
            {/* Main Card */}
            <motion.div
              className="relative bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Decorative glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 via-transparent to-secondary-500/20 rounded-3xl blur-xl opacity-50" />

              <div className="relative">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                  <div className="flex items-center gap-4">
                    <motion.div
                      className={`w-12 h-12 bg-gradient-to-br ${currentIndustry.color} rounded-xl flex items-center justify-center`}
                      key={activeIndustry}
                      initial={{ scale: 0.8, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <currentIndustry.icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">NexusPoint POS</h3>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <p className="text-neutral-500 text-sm">Real-time Dashboard</p>
                      </div>
                    </div>
                  </div>

                  {/* Industry Tabs */}
                  <div className="hidden md:flex items-center gap-1 bg-neutral-800/50 rounded-full p-1.5">
                    {industries.map((industry, index) => {
                      const Icon = industry.icon;
                      return (
                        <motion.button
                          key={industry.label}
                          onClick={() => setActiveIndustry(index)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                            activeIndustry === index
                              ? "bg-white text-neutral-900 shadow-lg"
                              : "text-neutral-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="hidden lg:inline">{industry.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <AnimatePresence mode="wait">
                    {statsData.map((stat, index) => {
                      const Icon = stat.icon;
                      return (
                        <motion.div
                          key={`${stat.label}-${activeIndustry}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.1 }}
                          onMouseEnter={() => setHoveredStat(index)}
                          onMouseLeave={() => setHoveredStat(null)}
                          className={`bg-neutral-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-300 border border-transparent ${
                            hoveredStat === index ? "bg-neutral-800 border-primary-500/30 scale-105 shadow-lg shadow-primary-500/10" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-neutral-500 text-xs">{stat.label}</p>
                            <Icon className={`w-4 h-4 ${hoveredStat === index ? "text-primary-400" : "text-neutral-600"} transition-colors`} />
                          </div>
                          <p className="text-white text-base sm:text-lg md:text-xl font-bold">{stat.value}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs ${stat.positive ? "text-emerald-400" : "text-red-400"}`}>
                              {stat.change}
                            </span>
                            {stat.live && (
                              <span className="flex items-center gap-1 text-xs text-amber-400">
                                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                                Live
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Quick Actions Bar */}
                <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <motion.div
                        key={action.label}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.05 }}
                        onMouseEnter={() => setHoveredAction(index)}
                        onMouseLeave={() => setHoveredAction(null)}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-neutral-800/80 hover:bg-neutral-700/80 border border-white/5 rounded-lg sm:rounded-xl text-xs sm:text-sm cursor-pointer transition-all duration-300 ${
                          hoveredAction === index ? "border-primary-500/30 shadow-lg shadow-primary-500/5" : ""
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${action.color} ${hoveredAction === index ? "scale-110" : ""} transition-transform`} />
                        <span className={`${hoveredAction === index ? "text-white" : "text-neutral-300"} transition-colors`}>
                          {action.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Floating notification cards */}
            <AnimatePresence>
              {showNotification && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                    opacity: { duration: 0.3 },
                    scale: { duration: 0.3 }
                  }}
                  className="absolute -top-6 -right-6 bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-xl hidden lg:block cursor-pointer hover:scale-105 transition-transform"
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
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!showNotification && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: [0, 10, 0] }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  transition={{
                    y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 },
                    opacity: { duration: 0.3 },
                    scale: { duration: 0.3 }
                  }}
                  className="absolute -bottom-4 -left-4 bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-xl hidden lg:block cursor-pointer hover:scale-105 transition-transform"
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
              )}
            </AnimatePresence>

            {/* Static notification on opposite side */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-4 -left-4 bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-xl hidden lg:block"
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
