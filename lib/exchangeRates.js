/**
 * Live FX via ExchangeRate-API open endpoint:
 * https://open.er-api.com/v6/latest/USD
 *
 * Rates are relative to USD (1 USD = rates.RWF RWF).
 */

const ER_API_URL = "https://open.er-api.com/v6/latest/USD";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

let memoryCache = null;

export function getErApiUrl() {
  return ER_API_URL;
}

export async function fetchLiveUsdRates({ force = false } = {}) {
  const now = Date.now();
  if (!force && memoryCache && now - memoryCache.fetchedAt < CACHE_TTL_MS) {
    return memoryCache;
  }

  const response = await fetch(ER_API_URL, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  }).catch((error) => {
    if (memoryCache) return null;
    throw error;
  });

  if (!response) return memoryCache;

  if (!response.ok) {
    if (memoryCache) return memoryCache;
    throw new Error(`Exchange rate API failed (${response.status})`);
  }

  const data = await response.json();
  if (data?.result !== "success" || !data?.rates?.RWF) {
    if (memoryCache) return memoryCache;
    throw new Error("Exchange rate API returned an invalid payload");
  }

  const rwfPerUsd = Number(data.rates.RWF);
  if (!Number.isFinite(rwfPerUsd) || rwfPerUsd <= 0) {
    if (memoryCache) return memoryCache;
    throw new Error("Invalid RWF rate from exchange API");
  }

  memoryCache = {
    ok: true,
    provider: "open.er-api.com",
    base: "USD",
    rwfPerUsd,
    usdPerRwf: 1 / rwfPerUsd,
    updatedAt: data.time_last_update_utc || null,
    nextUpdateAt: data.time_next_update_utc || null,
    fetchedAt: now,
    source: ER_API_URL,
  };

  return memoryCache;
}

export function convertAmount(amount, fromCurrency, toCurrency, rwfPerUsd) {
  const value = Number(amount) || 0;
  const from = String(fromCurrency || "RWF").toUpperCase();
  const to = String(toCurrency || "RWF").toUpperCase();
  if (from === to) return value;
  if (!Number.isFinite(rwfPerUsd) || rwfPerUsd <= 0) return value;

  if (from === "RWF" && to === "USD") return value / rwfPerUsd;
  if (from === "USD" && to === "RWF") return value * rwfPerUsd;
  return value;
}
