"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Headphones,
  MapPin,
  Sparkles,
  Shield,
  BadgeDollarSign,
} from "lucide-react";
import { WHY_CHOOSE_US } from "@/lib/constants";

const iconMap: { [key: string]: React.ElementType } = {
  Award,
  HeadphonesIcon: Headphones,
  MapPin,
  Sparkles,
  Shield,
  BadgeDollarSign,
};

export function WhyChooseUs() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className="section bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <motion.div
          initial={isMounted ? { opacity: 0, y: 20 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-4">
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
            The NexusPoint Advantage
          </h2>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto">
            We combine industry expertise with cutting-edge technology to deliver
            POS solutions that help your business thrive.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {WHY_CHOOSE_US.map((feature, index) => {
            const Icon = iconMap[feature.icon] || Award;
            return (
              <motion.div
                key={feature.title}
                initial={isMounted ? { opacity: 0, y: 20 } : false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group h-full"
              >
                <div className="h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center mb-4 group-hover:bg-primary-500/30 transition-colors flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary-200" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-primary-100 text-sm leading-relaxed flex-grow">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
