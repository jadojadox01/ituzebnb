/**
 * IntouchPay URL builder.
 *
 * Sandbox (developer portal):
 *   https://developer.intouchpay.co.rw/api/v1/sandbox/requestpayment/
 *
 * Production live gateway (official HTTP API, no /v1/ and no /production/):
 *   https://www.intouchpay.co.rw/api/requestpayment/
 *   https://www.intouchpay.co.rw/api/requestdeposit/
 *   https://www.intouchpay.co.rw/api/getbalance/
 */

const SANDBOX_HOST = "developer.intouchpay.co.rw";
const DEFAULT_SANDBOX_BASE = `https://${SANDBOX_HOST}`;
const DEFAULT_PRODUCTION_BASE = "https://www.intouchpay.co.rw";

export function cleanBaseUrl(value, fallback = DEFAULT_SANDBOX_BASE) {
  return String(value || fallback)
    .trim()
    .replace(/\s+/g, "")
    .replace(/\/+$/, "");
}

export function isSandboxEnvironment({ baseUrl, environment } = {}) {
  const env = String(environment || "").trim().toLowerCase();
  const host = cleanBaseUrl(baseUrl || "").toLowerCase();
  if (env === "sandbox" || env === "test" || env === "development") return true;
  if (host.includes(SANDBOX_HOST)) return true;
  return false;
}

export function buildIntouchApiUrl(endpoint, { baseUrl, environment } = {}) {
  const path = String(endpoint || "").replace(/^\/+|\/+$/g, "");
  const sandbox = isSandboxEnvironment({ baseUrl, environment });
  const fallback = sandbox ? DEFAULT_SANDBOX_BASE : DEFAULT_PRODUCTION_BASE;
  const base = cleanBaseUrl(baseUrl, fallback);
  if (sandbox) {
    return `${base}/api/v1/sandbox/${path}/`;
  }
  return `${base}/api/${path}/`;
}

export { DEFAULT_SANDBOX_BASE, DEFAULT_PRODUCTION_BASE };
