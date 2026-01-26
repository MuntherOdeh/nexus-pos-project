export function formatMoney(params: { cents: number; currency: string }): string {
  const cents = params?.cents ?? 0;
  const currency = params?.currency || "USD";
  const value = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatCompactNumber(value: number): string {
  try {
    return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value ?? 0);
  } catch {
    return String(value ?? 0);
  }
}

