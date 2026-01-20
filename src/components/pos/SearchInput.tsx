"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  showClear?: boolean;
  autoFocus?: boolean;
}

/**
 * Reusable search input component with debouncing
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  className,
  showClear = true,
  autoFocus = false,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce the onChange callback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange, value]);

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  return (
    <div className={cn("relative group", className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pos-muted)] group-focus-within:text-[var(--pos-accent)] transition-colors duration-200" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-12 pr-10 py-3 rounded-xl bg-[var(--pos-bg)] border-2 border-[var(--pos-border)] focus:border-[var(--pos-accent)] focus:outline-none focus:ring-4 focus:ring-[var(--pos-accent)]/10 transition-all duration-200 text-[var(--pos-text)] placeholder:text-[var(--pos-muted)] shadow-sm hover:border-[var(--pos-accent)]/50"
      />
      {showClear && localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-[var(--pos-accent)]/10 text-[var(--pos-muted)] hover:text-[var(--pos-accent)] transition-all duration-200"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
