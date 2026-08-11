/** Strip HTML/control chars from user-facing text fields (XSS hardening). */
export function sanitizeText(value, { maxLength = 500 } = {}) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeEmail(value) {
  const email = sanitizeText(value, { maxLength: 254 }).toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "";
  }
  return email;
}

export function sanitizePhone(value) {
  return String(value ?? "")
    .replace(/[^\d+\-\s()]/g, "")
    .trim()
    .slice(0, 40);
}

export function isValidDateOnly(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

export function clampInt(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
