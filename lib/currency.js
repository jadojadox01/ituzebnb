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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}`;
  }
  return `RWF ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}

/**
 * Convert RWF room prices to the active display currency using a live USD→RWF rate.
 * Payment amounts stay in RWF (MoMo).
 */
export function convertFromRwf(amountRwf, currency = "RWF", rwfPerUsd) {
  const code = normalizeCurrency(currency);
  const value = Number(amountRwf) || 0;
  if (code !== "USD") return value;
  if (!Number.isFinite(rwfPerUsd) || rwfPerUsd <= 0) return null;
  return value / rwfPerUsd;
}

/** Nightly display amount from the RWF base price + live FX. */
export function getNightlyPrice(room, currency = "RWF", rwfPerUsd) {
  const rwf = Number(room?.price_daily) || 0;
  return convertFromRwf(rwf, currency, rwfPerUsd);
}

export function getMonthlyPrice(room, currency = "RWF", rwfPerUsd) {
  const rwf = Number(room?.price_monthly) || 0;
  return convertFromRwf(rwf, currency, rwfPerUsd);
}

/** Payment / booking totals stay in RWF for MoMo. */
export function getPayableNightlyPrice(room) {
  return Number(room?.price_daily) || 0;
}
