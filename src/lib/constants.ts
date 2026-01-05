import { ServiceCategory, Client, Feature, NavItem, CompanyInfo, FAQ } from "@/types";

// Company Information
export const COMPANY_INFO: CompanyInfo = {
  name: "NexusPoint",
  tagline: "Smart POS Solutions",
  phone: "0123456789",
  email: "test.email@email.com",
  address: "Al Ain, UAE",
  mapUrl: "https://www.google.com/maps/place/Al+Ain",
  social: {
    whatsapp: "https://wa.me/123456789",
  },
  // Director section removed as requested
};

// Navigation Items
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

// Service Categories - POS focused services
export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "pos-solutions",
    number: "01",
    title: "POS Solutions",
    subtitle: "Point of Sale Systems",
    services: [
      {
        id: "restaurant-pos",
        title: "Restaurant POS",
        slug: "restaurant-pos",
        description:
          "Complete point of sale solution designed specifically for restaurants, featuring table management, kitchen display systems, and order tracking.",
        icon: "UtensilsCrossed",
        features: [
          "Table management and floor planning",
          "Kitchen display system (KDS) integration",
          "Split bills and multiple payment methods",
          "Menu management with modifiers",
          "Real-time order tracking",
        ],
      },
      {
        id: "cafe-pos",
        title: "Cafe & Coffee Shop POS",
        slug: "cafe-pos",
        description:
          "Streamlined POS system for cafes and coffee shops with quick-service features and loyalty program integration.",
        icon: "Coffee",
        features: [
          "Quick order entry and barista display",
          "Customer loyalty programs",
          "Mobile ordering integration",
          "Inventory tracking for ingredients",
          "Daily sales analytics",
        ],
      },
      {
        id: "retail-pos",
        title: "Retail Shop POS",
        slug: "retail-pos",
        description:
          "Powerful retail POS system for shops of all sizes with inventory management, barcode scanning, and customer management.",
        icon: "Store",
        features: [
          "Barcode and QR code scanning",
          "Inventory management and stock alerts",
          "Customer database and purchase history",
          "Multiple store management",
          "Discount and promotion management",
        ],
      },
    ],
  },
  {
    id: "hardware-solutions",
    number: "02",
    title: "Hardware Solutions",
    subtitle: "POS Equipment & Tablets",
    services: [
      {
        id: "pos-terminals",
        title: "POS Terminals & Tablets",
        slug: "pos-terminals",
        description:
          "Premium quality POS hardware including tablets, touchscreen terminals, and cashier stations for your business needs.",
        icon: "Tablet",
        features: [
          "Touchscreen POS terminals",
          "Android and iPad POS tablets",
          "Cashier stations and stands",
          "All-in-one POS systems",
          "Customer-facing displays",
        ],
      },
      {
        id: "peripherals",
        title: "POS Peripherals",
        slug: "pos-peripherals",
        description:
          "Complete range of POS peripherals including receipt printers, cash drawers, barcode scanners, and card readers.",
        icon: "Printer",
        features: [
          "Thermal receipt printers",
          "Cash drawers and safes",
          "Barcode and QR scanners",
          "Card payment terminals",
          "Kitchen display screens",
        ],
      },
    ],
  },
  {
    id: "software-services",
    number: "03",
    title: "Software & Integration",
    subtitle: "Custom Development",
    services: [
      {
        id: "custom-pos",
        title: "Custom POS Development",
        slug: "custom-pos-development",
        description:
          "Tailored POS software development to meet your specific business requirements with custom features and integrations.",
        icon: "Code",
        features: [
          "Custom feature development",
          "Third-party integrations",
          "API development and connectivity",
          "White-label solutions",
          "Ongoing maintenance and updates",
        ],
      },
      {
        id: "cloud-management",
        title: "Cloud Management System",
        slug: "cloud-management",
        description:
          "Cloud-based management dashboard for real-time monitoring, analytics, and multi-location management.",
        icon: "Cloud",
        features: [
          "Real-time sales dashboard",
          "Multi-location management",
          "Inventory sync across stores",
          "Employee management and scheduling",
          "Advanced reporting and analytics",
        ],
      },
    ],
  },
];

// Clients - Empty as requested (trusted companies section will be removed)
export const CLIENTS: Client[] = [];

// Why Choose Us Features - Updated for POS business
export const WHY_CHOOSE_US: Feature[] = [
  {
    title: "7 Years of Expertise",
    description:
      "Our team brings 7 years of experience in POS systems and restaurant technology solutions.",
    icon: "Award",
  },
  {
    title: "24/7 Support",
    description:
      "Round-the-clock technical support to ensure your business never stops. We're here when you need us.",
    icon: "HeadphonesIcon",
  },
  {
    title: "UAE Based",
    description:
      "Local company based in Al Ain, UAE with understanding of local business needs and regulations.",
    icon: "MapPin",
  },
  {
    title: "Easy to Use",
    description:
      "Intuitive interface designed for quick staff training and seamless daily operations.",
    icon: "Sparkles",
  },
  {
    title: "Secure & Reliable",
    description:
      "Enterprise-grade security with daily backups and 99.9% uptime guarantee for peace of mind.",
    icon: "Shield",
  },
  {
    title: "Affordable Pricing",
    description:
      "Competitive pricing with flexible plans designed for businesses of all sizes.",
    icon: "BadgeDollarSign",
  },
];

// Stats - Updated for NexusPoint
export const STATS = [
  { value: "2+", label: "Happy Clients" },
  { value: "7+", label: "Years Experience" },
  { value: "24/7", label: "Support Available" },
  { value: "99.9%", label: "Uptime Guarantee" },
];

// FAQs - Updated for POS business
export const FAQS: FAQ[] = [
  {
    question: "What types of businesses can use your POS system?",
    answer:
      "Our POS solutions are designed for restaurants, cafes, coffee shops, retail stores, and any business that needs point of sale functionality. We offer specialized features for each business type.",
  },
  {
    question: "Do you provide hardware along with the software?",
    answer:
      "Yes! We offer complete POS packages including tablets, terminals, printers, cash drawers, and all necessary peripherals. We can also integrate with your existing hardware.",
  },
  {
    question: "How long does it take to set up the POS system?",
    answer:
      "Basic setup can be completed within 1-2 days. For custom solutions with specific integrations, the timeline varies based on requirements. We'll provide a detailed timeline during consultation.",
  },
  {
    question: "Is training included with the POS system?",
    answer:
      "Absolutely! We provide comprehensive training for you and your staff. Our system is designed to be intuitive, and most staff can learn it within a few hours.",
  },
  {
    question: "Can I access reports and analytics remotely?",
    answer:
      "Yes, our cloud-based management system allows you to access real-time sales data, inventory reports, and analytics from anywhere using any device with internet access.",
  },
];

// Service options for appointment form - Updated for POS services
export const SERVICE_OPTIONS = [
  { value: "restaurant-pos", label: "Restaurant POS" },
  { value: "cafe-pos", label: "Cafe & Coffee Shop POS" },
  { value: "retail-pos", label: "Retail Shop POS" },
  { value: "pos-hardware", label: "POS Hardware & Equipment" },
  { value: "custom-development", label: "Custom POS Development" },
  { value: "cloud-management", label: "Cloud Management System" },
  { value: "consultation", label: "Free Consultation" },
  { value: "other", label: "Other" },
];

// Time slots for appointments
export const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
];
