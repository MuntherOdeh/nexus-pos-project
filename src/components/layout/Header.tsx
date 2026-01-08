"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Phone,
  Mail,
  ChevronRight,
  ChevronDown,
  UtensilsCrossed,
  Coffee,
  Store,
  Tablet,
  Printer,
  Code,
  Cloud
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Logo } from "@/components/ui";
import { NAV_ITEMS, COMPANY_INFO, SERVICE_CATEGORIES } from "@/lib/constants";

// Icon mapping for services
const iconMap: { [key: string]: React.ElementType } = {
  UtensilsCrossed,
  Coffee,
  Store,
  Tablet,
  Printer,
  Code,
  Cloud,
};

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close services dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-services-dropdown]')) {
        setIsServicesOpen(false);
      }
    };

    if (isServicesOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isServicesOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMobileServicesOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Top Bar */}
      <div className="hidden lg:block bg-primary-900 text-white py-2">
        <div className="container-custom">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <a
                href={`tel:${COMPANY_INFO.phone}`}
                className="flex items-center gap-2 hover:text-primary-200 transition-colors"
              >
                <Phone className="w-4 h-4" />
                {COMPANY_INFO.phone}
              </a>
              <a
                href={`mailto:${COMPANY_INFO.email}`}
                className="flex items-center gap-2 hover:text-primary-200 transition-colors"
              >
                <Mail className="w-4 h-4" />
                {COMPANY_INFO.email}
              </a>
            </div>
            <div className="text-primary-200">
              Smart POS Solutions for Your Business
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-white/95 backdrop-blur-lg shadow-lg"
            : "bg-white"
        )}
      >
        <div className="container-custom">
          <nav className="flex items-center justify-between h-20">
            {/* Logo */}
            <Logo variant="dark" size="md" />

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {NAV_ITEMS.map((item) => (
                item.href === "/services" ? (
                  // Services Dropdown
                  <div
                    key={item.href}
                    className="relative"
                    data-services-dropdown
                    onMouseEnter={() => isMounted && setIsServicesOpen(true)}
                    onMouseLeave={() => isMounted && setIsServicesOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsServicesOpen(!isServicesOpen);
                      }}
                      className={cn(
                        "relative flex items-center gap-1 text-base font-medium transition-colors duration-200",
                        pathname === item.href || pathname.startsWith("/services")
                          ? "text-primary-600"
                          : "text-neutral-700 hover:text-primary-600",
                        "group"
                      )}
                    >
                      {item.label}
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        isServicesOpen && "rotate-180"
                      )} />
                      <span
                        className={cn(
                          "absolute -bottom-1 left-0 h-0.5 bg-primary-600 transition-all duration-300",
                          pathname === item.href || pathname.startsWith("/services") ? "w-full" : "w-0 group-hover:w-full"
                        )}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {isServicesOpen && isMounted && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-1/2 -translate-x-1/2 pt-2"
                          data-services-dropdown
                        >
                          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-100 p-6 min-w-[600px]" data-services-dropdown>
                            {/* View All Services Link */}
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-100">
                              <span className="text-sm font-semibold text-neutral-900">Our Solutions</span>
                              <Link
                                href="/services"
                                className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                              >
                                View All Solutions
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            </div>

                            {/* Services Grid */}
                            <div className="grid grid-cols-2 gap-6">
                              {SERVICE_CATEGORIES.map((category) => (
                                <div key={category.id}>
                                  <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-3">
                                    {category.title}
                                  </div>
                                  <div className="space-y-1">
                                    {category.services.map((service) => {
                                      const IconComponent = iconMap[service.icon] || Code;
                                      return (
                                        <Link
                                          key={service.id}
                                          href={`/services#${service.slug}`}
                                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary-50 transition-colors group/item"
                                        >
                                          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center group-hover/item:bg-primary-200 transition-colors">
                                            <IconComponent className="w-4 h-4 text-primary-600" />
                                          </div>
                                          <span className="text-sm font-medium text-neutral-700 group-hover/item:text-primary-600 transition-colors">
                                            {service.title}
                                          </span>
                                        </Link>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* CTA */}
                            <div className="mt-6 pt-4 border-t border-neutral-100">
                              <Link
                                href="/contact"
                                className="flex items-center justify-between p-3 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
                              >
                                <div>
                                  <div className="text-sm font-semibold text-neutral-900">Need a custom POS solution?</div>
                                  <div className="text-xs text-neutral-600">Contact us for a free consultation</div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-primary-600" />
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  // Regular Nav Link
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative text-base font-medium transition-colors duration-200",
                      pathname === item.href
                        ? "text-primary-600"
                        : "text-neutral-700 hover:text-primary-600",
                      "group"
                    )}
                  >
                    {item.label}
                    <span
                      className={cn(
                        "absolute -bottom-1 left-0 h-0.5 bg-primary-600 transition-all duration-300",
                        pathname === item.href ? "w-full" : "w-0 group-hover:w-full"
                      )}
                    />
                  </Link>
                )
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-4">
              <Link href="/signup">
                <Button size="md">
                  Get Demo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-neutral-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-neutral-700" />
              ) : (
                <Menu className="w-6 h-6 text-neutral-700" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl lg:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Menu Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                  <Logo variant="dark" size="sm" href={undefined} />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-neutral-100 transition-colors"
                  >
                    <X className="w-6 h-6 text-neutral-700" />
                  </button>
                </div>

                {/* Menu Links */}
                <div className="flex-1 overflow-y-auto py-6 px-4">
                  <nav className="space-y-2">
                    {NAV_ITEMS.map((item, index) => (
                      item.href === "/services" ? (
                        // Mobile Services Accordion
                        <motion.div
                          key={item.href}
                          initial={isMounted ? { opacity: 0, x: 20 } : false}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <button
                            onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                            className={cn(
                              "w-full flex items-center justify-between px-4 py-3 rounded-xl text-lg font-medium transition-colors",
                              pathname === item.href || pathname.startsWith("/services")
                                ? "bg-primary-50 text-primary-600"
                                : "text-neutral-700 hover:bg-neutral-50"
                            )}
                          >
                            {item.label}
                            <ChevronDown className={cn(
                              "w-5 h-5 transition-transform duration-200",
                              isMobileServicesOpen && "rotate-180"
                            )} />
                          </button>

                          <AnimatePresence>
                            {isMobileServicesOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="pl-4 pt-2 space-y-4">
                                  {SERVICE_CATEGORIES.map((category) => (
                                    <div key={category.id}>
                                      <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-2 px-4">
                                        {category.title}
                                      </div>
                                      <div className="space-y-1">
                                        {category.services.map((service) => {
                                          const IconComponent = iconMap[service.icon] || Code;
                                          return (
                                            <Link
                                              key={service.id}
                                              href={`/services#${service.slug}`}
                                              className="flex items-center gap-3 px-4 py-2 rounded-lg text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                                            >
                                              <IconComponent className="w-4 h-4" />
                                              <span className="text-sm">{service.title}</span>
                                            </Link>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                  <Link
                                    href="/services"
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600"
                                  >
                                    View All Solutions
                                    <ChevronRight className="w-4 h-4" />
                                  </Link>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ) : (
                        // Regular Mobile Nav Link
                        <motion.div
                          key={item.href}
                          initial={isMounted ? { opacity: 0, x: 20 } : false}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Link
                            href={item.href}
                            className={cn(
                              "block px-4 py-3 rounded-xl text-lg font-medium transition-colors",
                              pathname === item.href
                                ? "bg-primary-50 text-primary-600"
                                : "text-neutral-700 hover:bg-neutral-50"
                            )}
                          >
                            {item.label}
                          </Link>
                        </motion.div>
                      )
                    ))}
                  </nav>
                </div>

                {/* Menu Footer */}
                <div className="p-4 border-t border-neutral-100 space-y-4">
                  <div className="space-y-3">
                    <a
                      href={`tel:${COMPANY_INFO.phone}`}
                      className="flex items-center gap-3 text-neutral-600 hover:text-primary-600 transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      {COMPANY_INFO.phone}
                    </a>
                    <a
                      href={`mailto:${COMPANY_INFO.email}`}
                      className="flex items-center gap-3 text-neutral-600 hover:text-primary-600 transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                      {COMPANY_INFO.email}
                    </a>
                  </div>
                  <Link href="/signup" className="block">
                    <Button className="w-full" size="lg">
                      Get Free Demo
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
