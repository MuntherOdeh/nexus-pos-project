export type PosThemeKey = "EMERALD" | "MIDNIGHT" | "OCEAN" | "SUNSET" | "NEON" | "ROYAL";

export const POS_THEMES: Record<
  PosThemeKey,
  { label: string; className: string; accent: string; accent2: string }
> = {
  EMERALD: {
    label: "Emerald",
    className: "pos-theme--emerald",
    accent: "#10b981",
    accent2: "#2dd4bf",
  },
  MIDNIGHT: {
    label: "Midnight",
    className: "pos-theme--midnight",
    accent: "#60a5fa",
    accent2: "#a78bfa",
  },
  OCEAN: {
    label: "Ocean",
    className: "pos-theme--ocean",
    accent: "#38bdf8",
    accent2: "#22c55e",
  },
  SUNSET: {
    label: "Sunset",
    className: "pos-theme--sunset",
    accent: "#fb7185",
    accent2: "#f59e0b",
  },
  NEON: {
    label: "Neon",
    className: "pos-theme--neon",
    accent: "#22c55e",
    accent2: "#06b6d4",
  },
  ROYAL: {
    label: "Royal",
    className: "pos-theme--royal",
    accent: "#a78bfa",
    accent2: "#f472b6",
  },
};

export function normalizePosTheme(theme: string | null | undefined): PosThemeKey {
  if (!theme) return "EMERALD";
  const upper = theme.toUpperCase() as PosThemeKey;
  return POS_THEMES[upper] ? upper : "EMERALD";
}

export function getPosThemeClass(theme: string | null | undefined): string {
  return POS_THEMES[normalizePosTheme(theme)].className;
}

