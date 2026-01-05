"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { STATS } from "@/lib/constants";

interface AboutProps {
  showFull?: boolean;
}

export function About({ showFull = false }: AboutProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const highlights = [
    "7+ years of industry experience",
    "UAE-based with local expertise",
    "Complete POS hardware and software solutions",
    "24/7 support and maintenance",
  ];

  return (
    <section className="section bg-white">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={isMounted ? { opacity: 0, x: -20 } : false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="badge-primary mb-4">About Us</span>
            <h2 className="section-heading mb-6">
              Your Trusted POS Partner in the UAE
            </h2>
            <div className="space-y-4 text-neutral-600 mb-8">
              <p>
                <strong className="text-neutral-900">NexusPoint</strong> is a professional
                point of sale solutions company based in Al Ain, UAE. We specialize in
                providing cutting-edge <strong className="text-neutral-900">POS systems</strong> for
                restaurants, cafes, and retail businesses.
              </p>
              <p>
                With <strong className="text-neutral-900">7 years of experience</strong> in
                the industry, our team delivers practical and scalable solutions — from
                complete POS hardware setups to custom software development and cloud
                management systems.
              </p>
              {showFull && (
                <>
                  <p>
                    Our mission is to simplify business operations for our clients by
                    providing reliable, user-friendly POS solutions that help them
                    streamline their processes, boost sales, and grow their business.
                  </p>
                  <p>
                    We understand the unique challenges faced by restaurants, cafes, and
                    retail shops in the UAE, and we&apos;re committed to delivering solutions
                    that address these challenges with modern technology and exceptional
                    customer support.
                  </p>
                </>
              )}
            </div>

            {/* Highlights */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {highlights.map((item, index) => (
                <motion.div
                  key={index}
                  initial={isMounted ? { opacity: 0, y: 10 } : false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <span className="text-neutral-700">{item}</span>
                </motion.div>
              ))}
            </div>

            {!showFull && (
              <Link href="/about">
                <Button variant="secondary">
                  Learn More About Us
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            )}
          </motion.div>

          {/* Stats / Visual */}
          <motion.div
            initial={isMounted ? { opacity: 0, x: 20 } : false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-2 gap-6">
              {STATS.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={isMounted ? { opacity: 0, scale: 0.9 } : false}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl p-6 text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-neutral-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Vision & Mission - Only on full page */}
            {showFull && (
              <div className="mt-8 space-y-6">
                <motion.div
                  initial={isMounted ? { opacity: 0, y: 20 } : false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-primary-600 text-white rounded-2xl p-6"
                >
                  <div className="text-sm font-medium text-primary-200 mb-2">
                    01 — Vision
                  </div>
                  <p>
                    To be the leading provider of innovative POS solutions in the UAE,
                    empowering businesses of all sizes with technology that drives
                    efficiency, enhances customer experience, and accelerates growth.
                  </p>
                </motion.div>

                <motion.div
                  initial={isMounted ? { opacity: 0, y: 20 } : false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="bg-neutral-900 text-white rounded-2xl p-6"
                >
                  <div className="text-sm font-medium text-neutral-400 mb-2">
                    02 — Mission
                  </div>
                  <p className="text-neutral-200">
                    To deliver exceptional POS solutions that simplify business operations,
                    providing reliable hardware, intuitive software, and outstanding
                    support to help our clients succeed in a competitive market.
                  </p>
                </motion.div>

                <motion.div
                  initial={isMounted ? { opacity: 0, y: 20 } : false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-2xl p-6"
                >
                  <div className="text-sm font-medium text-primary-600 mb-3">
                    03 — Our Commitment
                  </div>
                  <p className="text-neutral-700">
                    We are committed to building long-term partnerships with our clients,
                    understanding their unique needs, and delivering solutions that grow
                    with their business. Your success is our success.
                  </p>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
