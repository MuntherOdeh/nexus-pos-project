"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  href?: string;
}

export function Logo({
  variant = "dark",
  size = "md",
  showText = true,
  className,
  href = "/",
}: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: "text-lg", gap: "gap-2" },
    md: { icon: 40, text: "text-xl", gap: "gap-3" },
    lg: { icon: 48, text: "text-2xl", gap: "gap-3" },
  };

  const currentSize = sizes[size];

  const LogoContent = (
    <div className={cn("flex items-center", currentSize.gap, className)}>
      {/* Icon - Modern Badge with N + Point */}
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id={`badgeGrad-${size}-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>

        {/* Badge background */}
        <rect x="2" y="2" width="40" height="40" rx="12" fill={`url(#badgeGrad-${size}-${variant})`} />

        {/* N letterform */}
        <path
          d="M12 32V12L22 26V12"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* P dot/point */}
        <circle cx="32" cy="32" r="4" fill="#ffffff" />
      </svg>

      {/* Text */}
      {showText && (
        <span className={cn("font-bold tracking-tight", currentSize.text)}>
          <span
            className={cn(
              "bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent"
            )}
          >
            Nexus
          </span>
          <span className={variant === "dark" ? "text-neutral-900" : "text-white"}>
            Point
          </span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex-shrink-0">
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
}
