import { z } from "zod";

/**
 * Contact form validation schema
 */
export const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const phoneRegex = /^(\+971|971|0)?[0-9\s-]{9,15}$/;
        return phoneRegex.test(val.replace(/[\s-]/g, ""));
      },
      { message: "Please enter a valid phone number" }
    ),
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject must be less than 200 characters"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be less than 5000 characters"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

/**
 * Appointment booking validation schema
 */
export const appointmentSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(9, "Please enter a valid phone number")
    .refine(
      (val) => {
        const phoneRegex = /^(\+971|971|0)?[0-9\s-]{9,15}$/;
        return phoneRegex.test(val.replace(/[\s-]/g, ""));
      },
      { message: "Please enter a valid UAE phone number" }
    ),
  service: z.enum([
    "network-services",
    "web-development",
    "mobile-app",
    "wordpress",
    "ecommerce",
    "computer-repair",
    "it-infrastructure",
    "other",
  ]),
  preferredDate: z.string().refine(
    (val) => {
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    { message: "Please select a future date" }
  ),
  preferredTime: z.string().min(1, "Please select a preferred time"),
  message: z.string().max(2000, "Message must be less than 2000 characters").optional(),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

/**
 * Newsletter subscription schema
 */
export const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type NewsletterFormData = z.infer<typeof newsletterSchema>;

/**
 * Admin login schema
 */
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
