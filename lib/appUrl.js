function cleanUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\/$/, "");
}

/** Public site URL — set NEXT_PUBLIC_APP_URL in production (HTTPS). */
export function getAppUrl() {
  const configured = cleanUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL is required in production.");
  }

  const port = process.env.PORT || "3000";
  return `http://localhost:${port}`;
}

export function getIntouchCallbackUrl() {
  const explicit = cleanUrl(process.env.INTOUCHPAY_CALLBACK_URL);
  if (explicit) return explicit;
  return `${getAppUrl()}/api/payment/intouchpay/callback`;
}

export function getOrderTrackingUrl(orderId) {
  return `${getAppUrl()}/my-bookings?order=${encodeURIComponent(orderId)}`;
}

export function getPaymentConfirmationUrl(orderId) {
  return `${getAppUrl()}/my-bookings?paid=${encodeURIComponent(orderId)}`;
}

export function isProductionUrl() {
  const url = getAppUrl();
  return url.startsWith("https://") && !url.includes("localhost") && !url.includes("127.0.0.1");
}
