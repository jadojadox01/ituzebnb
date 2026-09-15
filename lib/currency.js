export const CURRENCIES = ["RWF", "USD"];

export function normalizeCurrency(value) {
  const currency = String(value || "RWF").trim().toUpperCase();
  return CURRENCIES.includes(currency) ? currency : "RWF";
}

export function formatMoney(amount, currency = "RWF") {
  const code = normalizeCurrency(currency);
  const value = Number(amount) || 0;
  if (code === "USD") {
    return `$${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value)}`;
  }
  return `RWF ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}

/** Pick the nightly rate for the active display currency. Falls back to RWF. */
export function getNightlyPrice(room, currency = "RWF") {
  const code = normalizeCurrency(currency);
  if (code === "USD") {
    const usd = Number(room?.price_daily_usd);
    if (Number.isFinite(usd) && usd > 0) return usd;
  }
  return Number(room?.price_daily) || 0;
}

export function getMonthlyPrice(room, currency = "RWF") {
  const code = normalizeCurrency(currency);
  if (code === "USD") {
    const usd = Number(room?.price_monthly_usd);
    if (Number.isFinite(usd) && usd > 0) return usd;
  }
  return Number(room?.price_monthly) || 0;
}

/** Payment / booking totals stay in RWF for MoMo. */
export function getPayableNightlyPrice(room) {
  return Number(room?.price_daily) || 0;
}
