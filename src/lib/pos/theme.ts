export type PosThemeKey = "LIGHT" | "DARK";

export const POS_THEMES: Record<
  PosThemeKey,
  { label: string; className: string; accent: string; accent2: string }
> = {
  LIGHT: {
    label: "Light",
    className: "pos-theme--light",
    accent: "#10b981",
    accent2: "#0d9488",
  },
  DARK: {
    label: "Dark",
    className: "pos-theme--dark",
    accent: "#10b981",
    accent2: "#2dd4bf",
  },
};

export function normalizePosTheme(theme: string | null | undefined): PosThemeKey {
  if (!theme) return "LIGHT";
  const upper = theme.toUpperCase();
  // Map old themes to new ones
  if (upper === "LIGHT") return "LIGHT";
  if (upper === "DARK" || upper === "MIDNIGHT") return "DARK";
  // Default all other old themes to LIGHT
  return "LIGHT";
}

export function getPosThemeClass(theme: string | null | undefined): string {
  return POS_THEMES[normalizePosTheme(theme)].className;
}
