"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Settings,
  Rocket,
  HeadphonesIcon,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui";

const steps = [
  {
    number: "01",
    title: "Get in Touch",
    description: "Schedule a free consultation. We'll understand your business needs and recommend the perfect solution.",
    icon: MessageSquare,
    features: ["Free consultation", "Needs assessment", "Custom quote"],
  },
  {
    number: "02",
    title: "Setup & Configure",
    description: "Our team handles everything - hardware setup, software configuration, and menu/inventory import.",
    icon: Settings,
    features: ["Hardware installation", "Software setup", "Data migration"],
  },
  {
    number: "03",
    title: "Go Live",
    description: "Launch your new POS system with confidence. We provide comprehensive training for your team.",
    icon: Rocket,
    features: ["Staff training", "Live testing", "Smooth transition"],
  },
  {
    number: "04",
    title: "Ongoing Support",
    description: "We're always here for you. 24/7 support, regular updates, and continuous optimization.",
    icon: HeadphonesIcon,
    features: ["24/7 support", "Regular updates", "Performance monitoring"],
  },
];

export function HowItWorks() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0,0,0) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
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
          <span className="badge-primary mb-4">How It Works</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-neutral-900 mb-4">
            Get Started in
            <span className="text-primary-600"> 4 Simple Steps</span>
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            We make the transition to NexusPoint seamless. From consultation to launch,
            we&apos;ve got you covered.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep === index;

            return (
              <motion.div
                key={step.number}
                initial={isMounted ? { opacity: 0, y: 20 } : false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveStep(index)}
                className="relative cursor-pointer group"
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-neutral-200">
                    <motion.div
                      className="h-full bg-primary-500"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: activeStep > index ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>
                )}

                {/* Step Card */}
                <div className={`relative bg-white rounded-2xl p-6 border-2 transition-all duration-300 ${
                  isActive
                    ? "border-primary-500 shadow-lg shadow-primary-500/10"
                    : "border-neutral-100 hover:border-primary-200"
                }`}>
                  {/* Number Badge */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                    isActive
                      ? "bg-primary-500 text-white"
                      : "bg-neutral-100 text-neutral-400 group-hover:bg-primary-100 group-hover:text-primary-600"
                  }`}>
                    <span className="font-bold">{step.number}</span>
                  </div>

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
                    isActive ? "bg-primary-100" : "bg-neutral-50"
                  }`}>
                    <Icon className={`w-5 h-5 ${isActive ? "text-primary-600" : "text-neutral-400"}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    {step.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2">
                    {step.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className={`w-4 h-4 ${
                          isActive ? "text-primary-500" : "text-neutral-300"
                        }`} />
                        <span className="text-neutral-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={isMounted ? { opacity: 0, y: 20 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="px-8">
                Start Your Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <span className="text-neutral-500 text-sm">No credit card required</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
