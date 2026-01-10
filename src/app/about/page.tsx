"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Award,
  Headphones,
  MapPin,
  Sparkles,
  Shield,
  Target,
  Users,
  Zap,
  TrendingUp,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui";
import { STATS, WHY_CHOOSE_US } from "@/lib/constants";

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Award,
  HeadphonesIcon: Headphones,
  MapPin,
  Sparkles,
  Shield,
  BadgeDollarSign: TrendingUp,
};

const values = [
  {
    icon: Target,
    title: "Customer First",
    description: "Every decision we make starts with our customers' needs. Your success is our priority.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "We constantly evolve our solutions to stay ahead of industry trends and technology.",
  },
  {
    icon: Shield,
    title: "Reliability",
    description: "Count on us for 99.9% uptime and enterprise-grade security for your business.",
  },
  {
    icon: Heart,
    title: "Partnership",
    description: "We build lasting relationships, not just transactions. We grow with you.",
  },
];

const milestones = [
  { year: "2017", title: "Founded", description: "Started with a vision to simplify POS for UAE businesses" },
  { year: "2019", title: "First 50 Clients", description: "Reached our first major milestone with 50 active clients" },
  { year: "2021", title: "Cloud Platform", description: "Launched our cloud-based management platform" },
  { year: "2024", title: "Growing Strong", description: "Continuing to innovate and expand our solutions" },
];

export default function AboutPage() {
  return (
    <>
      {/* Our Story */}
      <section className="pt-32 pb-20 bg-neutral-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full text-sm font-medium text-primary-700 mb-6">
                Our Story
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-neutral-900 mb-6">
                Your Trusted POS Partner in the UAE
              </h2>
              <div className="space-y-4 text-neutral-600 leading-relaxed">
                <p>
                  <strong className="text-neutral-900">NexusPoint</strong> was founded with a simple mission:
                  to make powerful POS technology accessible to every business in the UAE.
                  Based in Al Ain, we understand the unique challenges and opportunities that
                  local businesses face.
                </p>
                <p>
                  With <strong className="text-neutral-900">over 7 years of experience</strong> in
                  the industry, our team has helped countless restaurants, cafes, and retail shops
                  streamline their operations and boost their sales with our comprehensive POS solutions.
                </p>
                <p>
                  From complete hardware setups to custom software development and cloud management
                  systems, we deliver practical, scalable solutions that grow with your business.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                {["Local UAE expertise", "24/7 support available", "Complete solutions", "Affordable pricing"].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    <span className="text-neutral-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Timeline */}
              <div className="relative">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.year}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-6 mb-8 last:mb-0"
                  >
                    <div className="relative flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm z-10">
                        {milestone.year.slice(2)}
                      </div>
                      {index < milestones.length - 1 && (
                        <div className="w-0.5 h-full bg-primary-200 absolute top-12" />
                      )}
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-6 shadow-lg shadow-neutral-200/50 border border-neutral-100">
                      <div className="text-sm font-medium text-primary-600 mb-1">{milestone.year}</div>
                      <h3 className="font-semibold text-neutral-900 mb-2">{milestone.title}</h3>
                      <p className="text-sm text-neutral-600">{milestone.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {STATS.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-2xl bg-gradient-to-br from-primary-50 to-white border border-primary-100"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-neutral-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                  <Target className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-primary-200 mb-2">01 — Vision</div>
                <h3 className="text-2xl font-bold mb-4">Where We&apos;re Headed</h3>
                <p className="text-primary-100 leading-relaxed">
                  To be the leading provider of innovative POS solutions in the UAE,
                  empowering businesses of all sizes with technology that drives efficiency,
                  enhances customer experience, and accelerates growth.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-neutral-900 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden"
            >
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-neutral-500 mb-2">02 — Mission</div>
                <h3 className="text-2xl font-bold mb-4">What Drives Us</h3>
                <p className="text-neutral-400 leading-relaxed">
                  To deliver exceptional POS solutions that simplify business operations,
                  providing reliable hardware, intuitive software, and outstanding support
                  to help our clients succeed in a competitive market.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-neutral-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full text-sm font-medium text-primary-700 mb-4">
              Our Values
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-neutral-900 mb-4">
              What We Stand For
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              These core values guide everything we do and shape how we serve our customers.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg shadow-neutral-200/50 border border-neutral-100 hover:border-primary-200 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4 group-hover:bg-primary-500 transition-colors">
                  <value.icon className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">{value.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CHOOSE_US.map((feature, index) => {
              const Icon = iconMap[feature.icon] || Award;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="h-full"
                >
                  <div className="h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 flex flex-col">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center mb-4 flex-shrink-0">
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
    </>
  );
}
