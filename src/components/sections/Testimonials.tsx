"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Ahmed Al Mansouri",
    role: "Owner, Zaatar & Zeit Restaurant",
    location: "Dubai",
    image: "/testimonials/ahmed.jpg",
    rating: 5,
    text: "NexusPoint transformed how we run our restaurant. The kitchen display system alone has cut our order errors by 80%. The team was incredibly helpful during setup.",
    metric: "80% fewer errors",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    role: "Manager, Brew & Bean Cafe",
    location: "Abu Dhabi",
    image: "/testimonials/sarah.jpg",
    rating: 5,
    text: "We switched from a legacy system and the difference is night and day. Fast, reliable, and our staff learned it in just one day. Customer checkout is now under 30 seconds.",
    metric: "30s checkout time",
  },
  {
    id: 3,
    name: "Mohammed Hassan",
    role: "Owner, Fresh Mart Supermarket",
    location: "Al Ain",
    image: "/testimonials/mohammed.jpg",
    rating: 5,
    text: "The inventory management feature has saved us thousands in lost stock. Real-time tracking means we never run out of popular items. Best investment we've made.",
    metric: "40% less waste",
  },
  {
    id: 4,
    name: "Lisa Chen",
    role: "Operations Director, Spice Route Group",
    location: "Sharjah",
    image: "/testimonials/lisa.jpg",
    rating: 5,
    text: "Managing 5 locations used to be a nightmare. Now I can see everything from one dashboard. The multi-branch reporting is exactly what we needed.",
    metric: "5 locations managed",
  },
];

const stats = [
  { value: "500+", label: "Businesses Trust Us" },
  { value: "4.9", label: "Average Rating" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

export function Testimonials() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-24 bg-neutral-950 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-primary-500/10 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-secondary-500/10 to-transparent blur-3xl" />
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
            <Star className="w-4 h-4 fill-current" />
            Customer Stories
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Loved by Businesses
            <br />
            <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Across the UAE
            </span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Join hundreds of restaurants, cafes, and retail stores that have transformed their operations with NexusPoint.
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={isMounted ? { opacity: 0, y: 20 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl"
            >
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-neutral-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Testimonial Carousel */}
        <div className="relative max-w-4xl mx-auto px-14 md:px-0">
          {/* Navigation Buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 md:-translate-x-12 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 md:translate-x-12 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Testimonial Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12"
            >
              {/* Quote Icon */}
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mb-6">
                <Quote className="w-6 h-6 text-primary-400" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-6">
                {Array.from({ length: testimonials[activeIndex].rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                ))}
              </div>

              {/* Text */}
              <p className="text-xl md:text-2xl text-white leading-relaxed mb-8">
                &ldquo;{testimonials[activeIndex].text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {testimonials[activeIndex].name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{testimonials[activeIndex].name}</div>
                    <div className="text-neutral-400 text-sm">{testimonials[activeIndex].role}</div>
                    <div className="text-neutral-500 text-xs">{testimonials[activeIndex].location}</div>
                  </div>
                </div>

                {/* Metric Badge */}
                <div className="hidden sm:block px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full">
                  <span className="text-primary-400 font-medium">{testimonials[activeIndex].metric}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeIndex === index ? "w-8 bg-primary-500" : "bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
