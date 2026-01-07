export function formatMoney(params: { cents: number; currency: string }): string {
  const { cents, currency } = params;
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
    return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
  } catch {
    return String(value);
  }
}

