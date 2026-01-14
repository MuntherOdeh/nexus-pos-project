"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, ArrowRight, ArrowUpRight, Zap } from "lucide-react";
import { Button, Logo } from "@/components/ui";
import { COMPANY_INFO, NAV_ITEMS, SERVICE_CATEGORIES } from "@/lib/constants";

const socialLinks = [
  {
    name: "WhatsApp",
    href: COMPANY_INFO.social.whatsapp,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    ),
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-neutral-950 text-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary-500/5 rounded-full blur-3xl" />
      </div>

      {/* CTA Section */}
      <div className="relative border-b border-white/5">
        <div className="container-custom py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-emerald-600 rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-14 overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />

            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left max-w-xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm mb-6">
                  <Zap className="w-4 h-4" />
                  <span>Start your free trial today</span>
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                  Ready to transform your business?
                </h3>
                <p className="text-white/80 text-lg">
                  Join hundreds of UAE businesses already using NexusPoint to streamline their operations.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-white text-primary-600 hover:bg-neutral-100 px-8 h-14 text-lg font-semibold shadow-xl shadow-black/20 group"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-8 h-14 text-lg"
                  >
                    Talk to Sales
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="relative container-custom py-16 lg:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8"
        >
          {/* Brand Column */}
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <Logo variant="light" size="md" />
            <p className="mt-6 text-neutral-400 leading-relaxed max-w-sm">
              Smart POS solutions designed for UAE businesses. From restaurants to retail,
              we help you sell more and stress less.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-8">
              {socialLinks.map((social) => (
                social.href && (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-white/5 hover:bg-primary-500 flex items-center justify-center text-neutral-400 hover:text-white transition-all duration-300 group"
                    aria-label={social.name}
                  >
                    <span className="group-hover:scale-110 transition-transform">
                      {social.icon}
                    </span>
                  </a>
                )
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-6">
              Company
            </h4>
            <ul className="space-y-4">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-neutral-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 transition-all duration-300" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Solutions */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-6">
              Solutions
            </h4>
            <ul className="space-y-4">
              {SERVICE_CATEGORIES.flatMap((cat) =>
                cat.services.slice(0, 3).map((service) => (
                  <li key={service.id}>
                    <Link
                      href={`/services#${service.slug}`}
                      className="text-neutral-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <span className="w-0 group-hover:w-2 h-0.5 bg-primary-500 transition-all duration-300" />
                      {service.title}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-6">
              Get in Touch
            </h4>
            <ul className="space-y-5">
              <li>
                <a
                  href={`tel:${COMPANY_INFO.phone}`}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-primary-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Phone className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <span className="text-neutral-500 text-sm block">Call us</span>
                    <span className="text-white group-hover:text-primary-400 transition-colors">
                      {COMPANY_INFO.phone}
                    </span>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${COMPANY_INFO.email}`}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-primary-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Mail className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <span className="text-neutral-500 text-sm block">Email us</span>
                    <span className="text-white group-hover:text-primary-400 transition-colors">
                      {COMPANY_INFO.email}
                    </span>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href={COMPANY_INFO.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(COMPANY_INFO.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-primary-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
                    <MapPin className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <span className="text-neutral-500 text-sm block">Visit us</span>
                    <span className="text-white group-hover:text-primary-400 transition-colors">
                      {COMPANY_INFO.address}
                    </span>
                  </div>
                </a>
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-white/5">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-neutral-500 text-sm">
              &copy; {currentYear} NexusPoint. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-neutral-500 hover:text-white text-sm transition-colors flex items-center gap-1 group"
              >
                Privacy Policy
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/terms"
                className="text-neutral-500 hover:text-white text-sm transition-colors flex items-center gap-1 group"
              >
                Terms of Service
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
