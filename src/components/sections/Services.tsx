"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed,
  Coffee,
  Store,
  Tablet,
  Printer,
  Code,
  Cloud,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui";
import { SERVICE_CATEGORIES } from "@/lib/constants";

const iconMap: { [key: string]: React.ElementType } = {
  UtensilsCrossed,
  Coffee,
  Store,
  Tablet,
  Printer,
  Code,
  Cloud,
};

const categoryIcons = [
  { icon: UtensilsCrossed, color: "from-orange-500 to-red-500" },
  { icon: Tablet, color: "from-blue-500 to-cyan-500" },
  { icon: Code, color: "from-purple-500 to-pink-500" },
];

interface ServicesProps {
  showAll?: boolean;
}

export function Services({ showAll = false }: ServicesProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section id="services" className="py-24 bg-gradient-to-b from-white to-neutral-50">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={isMounted ? { opacity: 0, y: 20 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Our Solutions
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-neutral-900 mb-4">
            POS Solutions for
            <span className="text-primary-600"> Every Business</span>
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Whether you run a restaurant, cafe, or retail store, we have the perfect
            POS solution tailored to your needs.
          </p>
        </motion.div>

        {/* Category Tabs */}
        {!showAll && (
          <motion.div
            initial={isMounted ? { opacity: 0, y: 20 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex overflow-x-auto pb-4 gap-3 sm:gap-4 mb-8 sm:mb-12 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center scrollbar-hide"
          >
            {SERVICE_CATEGORIES.map((category, index) => {
              const CategoryIcon = categoryIcons[index]?.icon || Store;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(index)}
                  className={`flex-shrink-0 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${
                    activeCategory === index
                      ? "border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10"
                      : "border-neutral-200 bg-white hover:border-primary-200 hover:bg-primary-50/50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${categoryIcons[index]?.color || "from-primary-500 to-primary-600"} flex items-center justify-center`}>
                    <CategoryIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className={`font-semibold ${activeCategory === index ? "text-primary-700" : "text-neutral-700"}`}>
                      {category.title}
                    </div>
                    <div className="text-xs text-neutral-500">{category.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Services Content */}
        {!showAll ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SERVICE_CATEGORIES[activeCategory].services.map((service, index) => {
                  const Icon = iconMap[service.icon] || Code;
                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-xl hover:border-primary-100 transition-all duration-300"
                    >
                      {/* Gradient Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />

                      <div className="relative z-10">
                        {/* Icon */}
                        <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mb-5 group-hover:bg-primary-500 transition-colors">
                          <Icon className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors" />
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-semibold text-neutral-900 mb-3 group-hover:text-primary-700 transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
                          {service.description}
                        </p>

                        {/* Features */}
                        <ul className="space-y-2">
                          {service.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-neutral-600">
                              <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* View All Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center mt-12"
              >
                <Link href="/services">
                  <Button variant="secondary" size="lg">
                    View All Solutions
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        ) : (
          /* Full Services Page View */
          <div className="space-y-20">
            {SERVICE_CATEGORIES.map((category, categoryIndex) => {
              const CategoryIcon = categoryIcons[categoryIndex]?.icon || Store;
              return (
                <motion.div
                  key={category.id}
                  initial={isMounted ? { opacity: 0, y: 30 } : false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryIcons[categoryIndex]?.color || "from-primary-500 to-primary-600"} flex items-center justify-center`}>
                      <CategoryIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-primary-600 mb-1">
                        {category.number}
                      </div>
                      <h3 className="text-2xl font-bold text-neutral-900">
                        {category.title}
                      </h3>
                      <p className="text-neutral-500">{category.subtitle}</p>
                    </div>
                  </div>

                  {/* Services Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.services.map((service, index) => {
                      const Icon = iconMap[service.icon] || Code;
                      return (
                        <motion.div
                          key={service.id}
                          id={service.slug}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 }}
                          className="group bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-xl hover:border-primary-100 transition-all duration-300"
                        >
                          {/* Icon */}
                          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mb-5 group-hover:bg-primary-500 transition-colors">
                            <Icon className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors" />
                          </div>

                          {/* Content */}
                          <h4 className="text-xl font-semibold text-neutral-900 mb-3">
                            {service.title}
                          </h4>
                          <p className="text-neutral-600 text-sm mb-4">
                            {service.description}
                          </p>

                          {/* Features */}
                          <ul className="space-y-2">
                            {service.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm text-neutral-600">
                                <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
