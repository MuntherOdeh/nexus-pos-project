// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Service Types
export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  slug: string;
}

export interface ServiceCategory {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  services: Service[];
}

// Client/Partner Types
export interface Client {
  id: string;
  name: string;
  logo: string;
  url: string;
}

// Team Member Types
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio?: string;
  social?: {
    linkedin?: string;
    twitter?: string;
    email?: string;
  };
}

// Testimonial Types
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating: number;
}

// Navigation Types
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

// Form Types
export interface FormState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
}

// Contact Submission Types
export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
}

// Appointment Types
export interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
}

// Animation Types
export interface AnimationProps {
  delay?: number;
  duration?: number;
  once?: boolean;
}

// SEO Types
export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
}

// Stats Types
export interface Stat {
  value: string;
  label: string;
  icon?: string;
}

// Feature Types
export interface Feature {
  title: string;
  description: string;
  icon: string;
}

// Page Section Types
export interface HeroContent {
  badge?: string;
  title: string;
  subtitle: string;
  primaryCTA: {
    text: string;
    href: string;
  };
  secondaryCTA?: {
    text: string;
    href: string;
  };
}

// FAQ Types
export interface FAQ {
  question: string;
  answer: string;
}

// Social Links
export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  whatsapp?: string;
}

// Contact Person
export interface ContactPerson {
  name: string;
  role: string;
  phone: string;
  email: string;
}

// Company Info
export interface CompanyInfo {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  mapUrl?: string;
  social: SocialLinks;
  director?: ContactPerson;
}
