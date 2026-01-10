"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Phone,
  ChevronDown,
  UtensilsCrossed,
  Coffee,
  Store,
  Tablet,
  Printer,
  Code,
  Cloud,
  Sparkles,
  ArrowRight,
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

// Pages that have light backgrounds at the top (need dark nav text)
const LIGHT_BACKGROUND_PAGES = ["/contact", "/privacy", "/terms", "/about"];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  // Check if current page has a light background
  const hasLightBackground = LIGHT_BACKGROUND_PAGES.includes(pathname);

  // Use dark navigation style when scrolled OR when on a light background page
  const useDarkNav = isScrolled || hasLightBackground;

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
      {/* Main Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          useDarkNav
            ? "bg-white/80 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-neutral-200/50"
            : "bg-transparent"
        )}
      >
        <div className="container-custom">
          <nav className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Logo variant={useDarkNav ? "dark" : "light"} size="md" />
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item, index) => (
                item.href === "/services" ? (
                  // Services Dropdown
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                    data-services-dropdown
                    onMouseEnter={() => {
                      if (isMounted) {
                        setIsServicesOpen(true);
                      }
                    }}
                    onMouseLeave={() => {
                      if (isMounted) {
                        setIsServicesOpen(false);
                      }
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsServicesOpen(!isServicesOpen);
                      }}
                      className={cn(
                        "relative flex items-center gap-1 px-4 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                        pathname === item.href || pathname.startsWith("/services")
                          ? useDarkNav
                            ? "text-white bg-primary-600 shadow-md shadow-primary-500/25"
                            : "text-white bg-white/20 backdrop-blur-sm"
                          : useDarkNav
                            ? "text-neutral-600 hover:text-primary-600 hover:bg-neutral-100"
                            : "text-white/90 hover:text-white hover:bg-white/10",
                        "group"
                      )}
                    >
                      {item.label}
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform duration-300",
                        isServicesOpen && "rotate-180"
                      )} />
                    </button>

                    {/* Mega Dropdown Menu */}
                    <AnimatePresence>
                      {isServicesOpen && isMounted && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute top-full left-1/2 -translate-x-1/2 pt-4"
                          data-services-dropdown
                        >
                          <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 border border-neutral-100 p-6 min-w-[640px] overflow-hidden" data-services-dropdown>
                            {/* Decorative gradient */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 rounded-full blur-3xl -z-10" />

                            {/* Header */}
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                  <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-base font-semibold text-neutral-900">Our Solutions</span>
                              </div>
                              <Link
                                href="/services"
                                className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 group/link"
                              >
                                View All
                                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                              </Link>
                            </div>

                            {/* Services Grid */}
                            <div className="grid grid-cols-2 gap-8">
                              {SERVICE_CATEGORIES.map((category) => (
                                <div key={category.id}>
                                  <div className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-4">
                                    {category.title}
                                  </div>
                                  <div className="space-y-1">
                                    {category.services.map((service) => {
                                      const IconComponent = iconMap[service.icon] || Code;
                                      return (
                                        <Link
                                          key={service.id}
                                          href={`/services#${service.slug}`}
                                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent transition-all duration-300 group/item"
                                        >
                                          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center group-hover/item:bg-primary-100 group-hover/item:scale-110 transition-all duration-300">
                                            <IconComponent className="w-5 h-5 text-neutral-600 group-hover/item:text-primary-600 transition-colors" />
                                          </div>
                                          <div>
                                            <span className="text-sm font-medium text-neutral-800 group-hover/item:text-primary-600 transition-colors block">
                                              {service.title}
                                            </span>
                                            <span className="text-xs text-neutral-500">Learn more</span>
                                          </div>
                                        </Link>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* CTA Banner */}
                            <div className="mt-6 pt-4 border-t border-neutral-100">
                              <Link
                                href="/contact"
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 group/cta"
                              >
                                <div className="text-white">
                                  <div className="text-sm font-semibold">Need a custom solution?</div>
                                  <div className="text-xs text-white/80">Get a free consultation today</div>
                                </div>
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover/cta:bg-white/30 transition-colors">
                                  <ArrowRight className="w-5 h-5 text-white" />
                                </div>
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  // Regular Nav Link
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "relative px-4 py-2.5 text-sm font-medium rounded-full transition-all duration-300 block",
                        pathname === item.href
                          ? useDarkNav
                            ? "text-white bg-primary-600 shadow-md shadow-primary-500/25"
                            : "text-white bg-white/20 backdrop-blur-sm"
                          : useDarkNav
                            ? "text-neutral-600 hover:text-primary-600 hover:bg-neutral-100"
                            : "text-white/90 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                )
              ))}
            </div>

            {/* Desktop CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden lg:flex items-center gap-3"
            >
              <a
                href={`tel:${COMPANY_INFO.phone}`}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                  useDarkNav ? "text-neutral-600 hover:text-primary-600 hover:bg-primary-50" : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                <Phone className="w-4 h-4" />
                <span className="hidden xl:inline">{COMPANY_INFO.phone}</span>
              </a>
              <Link href="/signup">
                <Button
                  size="md"
                  className={cn(
                    "shadow-lg transition-all duration-300 group",
                    useDarkNav
                      ? "bg-primary-600 hover:bg-primary-700 shadow-primary-500/20"
                      : "bg-white text-neutral-900 hover:bg-neutral-100 shadow-white/20"
                  )}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "lg:hidden p-3 rounded-xl transition-all duration-300",
                useDarkNav ? "hover:bg-neutral-100" : "hover:bg-white/10",
                isMobileMenuOpen && "bg-primary-50"
              )}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className={cn("w-6 h-6", useDarkNav ? "text-neutral-700" : "text-white")} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className={cn("w-6 h-6", useDarkNav ? "text-neutral-700" : "text-white")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
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
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
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
                <div className="flex items-center justify-between p-5 border-b border-neutral-100">
                  <Logo variant="dark" size="sm" href={undefined} />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-neutral-100 transition-colors"
                  >
                    <X className="w-6 h-6 text-neutral-700" />
                  </button>
                </div>

                {/* Menu Links */}
                <div className="flex-1 overflow-y-auto py-6 px-5">
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
                              "w-full flex items-center justify-between px-4 py-4 rounded-2xl text-base font-medium transition-all duration-300",
                              pathname === item.href || pathname.startsWith("/services")
                                ? "bg-primary-50 text-primary-600"
                                : "text-neutral-700 hover:bg-neutral-50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                pathname === item.href || pathname.startsWith("/services") ? "bg-primary-100" : "bg-neutral-100"
                              )}>
                                <Store className="w-5 h-5" />
                              </div>
                              {item.label}
                            </div>
                            <ChevronDown className={cn(
                              "w-5 h-5 transition-transform duration-300",
                              isMobileServicesOpen && "rotate-180"
                            )} />
                          </button>

                          <AnimatePresence>
                            {isMobileServicesOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="pl-4 pt-2 space-y-4">
                                  {SERVICE_CATEGORIES.map((category) => (
                                    <div key={category.id}>
                                      <div className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2 px-4">
                                        {category.title}
                                      </div>
                                      <div className="space-y-1">
                                        {category.services.map((service) => {
                                          const IconComponent = iconMap[service.icon] || Code;
                                          return (
                                            <Link
                                              key={service.id}
                                              href={`/services#${service.slug}`}
                                              className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition-all duration-300"
                                            >
                                              <IconComponent className="w-5 h-5" />
                                              <span className="text-sm font-medium">{service.title}</span>
                                            </Link>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                  <Link
                                    href="/services"
                                    className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-primary-600"
                                  >
                                    View All Solutions
                                    <ArrowRight className="w-4 h-4" />
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
                              "flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-medium transition-all duration-300",
                              pathname === item.href
                                ? "bg-primary-50 text-primary-600"
                                : "text-neutral-700 hover:bg-neutral-50"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                              pathname === item.href ? "bg-primary-100" : "bg-neutral-100"
                            )}>
                              {item.href === "/" && <Sparkles className="w-5 h-5" />}
                              {item.href === "/about" && <Store className="w-5 h-5" />}
                              {item.href === "/contact" && <Phone className="w-5 h-5" />}
                            </div>
                            {item.label}
                          </Link>
                        </motion.div>
                      )
                    ))}
                  </nav>
                </div>

                {/* Menu Footer */}
                <div className="p-5 border-t border-neutral-100 space-y-4 bg-neutral-50">
                  <a
                    href={`tel:${COMPANY_INFO.phone}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-700 hover:bg-white transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{COMPANY_INFO.phone}</div>
                      <div className="text-xs text-neutral-500">Call us anytime</div>
                    </div>
                  </a>
                  <Link href="/signup" className="block">
                    <Button className="w-full h-14 text-base font-semibold shadow-lg shadow-primary-500/20" size="lg">
                      Get Started Free
                      <ArrowRight className="w-5 h-5" />
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
