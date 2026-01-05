"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  BarChart3,
  Smartphone,
  Cloud,
  Clock,
  CreditCard,
  Users,
  Package,
  Bell,
  Wifi,
  Lock
} from "lucide-react";

const features = [
  {
    id: 1,
    title: "Lightning Fast",
    description: "Process orders in milliseconds. No lag, no waiting.",
    icon: Zap,
    color: "from-amber-500 to-orange-600",
    size: "col-span-1 row-span-1"
  },
  {
    id: 2,
    title: "Real-time Analytics",
    description: "Track sales, inventory, and performance with live dashboards. Make data-driven decisions instantly.",
    icon: BarChart3,
    color: "from-primary-500 to-emerald-600",
    size: "col-span-2 row-span-1",
    featured: true
  },
  {
    id: 3,
    title: "Works Offline",
    description: "Never miss a sale. Continue operations even without internet.",
    icon: Wifi,
    color: "from-blue-500 to-cyan-600",
    size: "col-span-1 row-span-1"
  },
  {
    id: 4,
    title: "Multi-Device Sync",
    description: "Tablets, phones, terminals - all connected seamlessly.",
    icon: Smartphone,
    color: "from-violet-500 to-purple-600",
    size: "col-span-1 row-span-1"
  },
  {
    id: 5,
    title: "Cloud Backup",
    description: "Your data is automatically backed up and accessible anywhere.",
    icon: Cloud,
    color: "from-sky-500 to-blue-600",
    size: "col-span-1 row-span-1"
  },
  {
    id: 6,
    title: "Bank-Level Security",
    description: "End-to-end encryption, PCI compliance, and secure payment processing to protect your business.",
    icon: Shield,
    color: "from-emerald-500 to-teal-600",
    size: "col-span-2 row-span-1",
    featured: true
  },
  {
    id: 7,
    title: "24/7 Support",
    description: "Round-the-clock assistance whenever you need it.",
    icon: Clock,
    color: "from-rose-500 to-pink-600",
    size: "col-span-1 row-span-1"
  },
  {
    id: 8,
    title: "Smart Inventory",
    description: "Auto-track stock levels and get low inventory alerts.",
    icon: Package,
    color: "from-teal-500 to-cyan-600",
    size: "col-span-1 row-span-1"
  },
];

export function Features() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className="py-24 bg-neutral-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent_70%)]" />
      </div>

      <div className="container-custom relative z-10">
        {/* Header */}
        <motion.div
          initial={isMounted ? { opacity: 0, y: 20 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Powerful Features
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Everything You Need to
            <br />
            <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Run Your Business
            </span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            A complete toolkit designed for modern businesses. Fast, secure, and incredibly easy to use.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                initial={isMounted ? { opacity: 0, y: 20 } : false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`group relative ${feature.size} ${
                  feature.featured ? "lg:col-span-2" : ""
                }`}
              >
                <div className={`h-full bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-primary-500/30 transition-all duration-300 overflow-hidden ${
                  feature.featured ? "flex flex-col justify-between min-h-[200px]" : ""
                }`}>
                  {/* Gradient Glow on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`} />

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className={`text-neutral-400 text-sm leading-relaxed ${
                      feature.featured ? "" : "line-clamp-2"
                    }`}>
                      {feature.description}
                    </p>
                  </div>

                  {/* Decorative Element for Featured */}
                  {feature.featured && (
                    <div className="mt-4 flex items-center gap-2">
                      <div className="h-1 w-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full" />
                      <span className="text-xs text-neutral-500">Key Feature</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={isMounted ? { opacity: 0, y: 20 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { value: "50+", label: "Features" },
            { value: "99.9%", label: "Uptime" },
            { value: "<1s", label: "Load Time" },
            { value: "24/7", label: "Support" },
          ].map((stat, index) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-neutral-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
