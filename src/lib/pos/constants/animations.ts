// Animation constants for POS system using Framer Motion

export const ANIMATION_DURATION = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
} as const;

export const SPRING_CONFIG = {
  default: { type: "spring" as const, stiffness: 400, damping: 30 },
  bouncy: { type: "spring" as const, stiffness: 500, damping: 25 },
  gentle: { type: "spring" as const, stiffness: 300, damping: 35 },
  stiff: { type: "spring" as const, stiffness: 600, damping: 40 },
} as const;

export const TRANSITION_PRESETS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeSlideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  fadeSlideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  fadeScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
} as const;

export const STAGGER_CONFIG = {
  fast: 0.03,
  normal: 0.05,
  slow: 0.1,
} as const;

// Common animation variants for lists
export const LIST_VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: STAGGER_CONFIG.normal,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  },
} as const;

// Dialog/modal animation
export const DIALOG_VARIANTS = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: ANIMATION_DURATION.fast },
  },
  content: {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: SPRING_CONFIG.default,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: { duration: ANIMATION_DURATION.fast },
    },
  },
} as const;

// Toast animation
export const TOAST_VARIANTS = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_CONFIG.bouncy,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: ANIMATION_DURATION.fast },
  },
} as const;
