"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  touched?: boolean;
  hint?: string;
}

/**
 * Reusable form input component with label and error display
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, touched, hint, className, ...props }, ref) => {
    const showError = touched && error;

    return (
      <div className="space-y-1">
        <label className="block text-sm font-semibold text-[var(--pos-text)]">
          {label}
          {props.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
        <input
          ref={ref}
          {...props}
          className={cn(
            "w-full px-4 py-2.5 rounded-xl bg-[var(--pos-bg)] border focus:outline-none transition-colors text-[var(--pos-text)] placeholder:text-[var(--pos-muted)]",
            showError
              ? "border-red-500 focus:border-red-500"
              : "border-[var(--pos-border)] focus:border-[var(--pos-accent)]",
            className
          )}
        />
        {showError && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {hint && !showError && (
          <p className="text-sm text-[var(--pos-muted)]">{hint}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  touched?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

/**
 * Reusable form select component with label and error display
 */
export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, touched, options, placeholder, className, ...props }, ref) => {
    const showError = touched && error;

    return (
      <div className="space-y-1">
        <label className="block text-sm font-semibold text-[var(--pos-text)]">
          {label}
          {props.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
        <select
          ref={ref}
          {...props}
          className={cn(
            "w-full px-4 py-2.5 rounded-xl bg-[var(--pos-bg)] border focus:outline-none transition-colors text-[var(--pos-text)]",
            showError
              ? "border-red-500 focus:border-red-500"
              : "border-[var(--pos-border)] focus:border-[var(--pos-accent)]",
            className
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {showError && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = "FormSelect";

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  touched?: boolean;
}

/**
 * Reusable form textarea component with label and error display
 */
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, touched, className, ...props }, ref) => {
    const showError = touched && error;

    return (
      <div className="space-y-1">
        <label className="block text-sm font-semibold text-[var(--pos-text)]">
          {label}
          {props.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
        <textarea
          ref={ref}
          {...props}
          className={cn(
            "w-full px-4 py-2.5 rounded-xl bg-[var(--pos-bg)] border focus:outline-none transition-colors text-[var(--pos-text)] placeholder:text-[var(--pos-muted)] resize-none",
            showError
              ? "border-red-500 focus:border-red-500"
              : "border-[var(--pos-border)] focus:border-[var(--pos-accent)]",
            className
          )}
        />
        {showError && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = "FormTextarea";
