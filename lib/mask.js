const SENSITIVE_KEYS = new Set([
  "password",
  "partnerpassword",
  "partner_password",
  "intouchpay_partner_password",
  "authorization",
  "cookie",
]);

export function maskPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 6) return "***";
  return `${digits.slice(0, 5)}*****${digits.slice(-2)}`;
}

export function maskPayload(value, depth = 0) {
  if (depth > 6) return "[truncated]";
  if (value == null) return value;
  if (Array.isArray(value)) return value.map((item) => maskPayload(item, depth + 1));
  if (typeof value !== "object") return value;

  const masked = {};
  for (const [key, val] of Object.entries(value)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lower)) {
      masked[key] = "[redacted]";
    } else if (lower.includes("phone") || lower === "mobilephone") {
      masked[key] = maskPhone(val);
    } else if (typeof val === "object") {
      masked[key] = maskPayload(val, depth + 1);
    } else {
      masked[key] = val;
    }
  }
  return masked;
}
