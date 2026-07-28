import { getAppUrl, isProductionUrl } from "@/lib/appUrl";

const REQUIRED_PAYMENT_VARS = [
  "INTOUCHPAY_USERNAME",
  "INTOUCHPAY_ACCOUNT_NUMBER",
  "INTOUCHPAY_PARTNER_PASSWORD",
  "INTOUCHPAY_BASE_URL",
];

const REQUIRED_PRODUCTION_VARS = ["NEXT_PUBLIC_APP_URL", "JWT_SECRET"];

function clean(value) {
  return String(value || "")
    .trim()
    .replace(/\r/g, "")
    .replace(/^['"]|['"]$/g, "");
}

function read(name) {
  return clean(process.env[name]);
}

export function getEnv(name, fallback = "") {
  return read(name) || fallback;
}

export function validatePaymentEnv() {
  const missing = REQUIRED_PAYMENT_VARS.filter((key) => !read(key));
  if (missing.length) {
    const error = new Error(`Missing payment environment variables: ${missing.join(", ")}`);
    error.code = "ENV_NOT_CONFIGURED";
    error.missing = missing;
    throw error;
  }

  if (process.env.NODE_ENV === "production") {
    const prodMissing = REQUIRED_PRODUCTION_VARS.filter((key) => !read(key));
    if (prodMissing.length) {
      const error = new Error(`Missing production environment variables: ${prodMissing.join(", ")}`);
      error.code = "ENV_NOT_CONFIGURED";
      error.missing = prodMissing;
      throw error;
    }

    if (!isProductionUrl()) {
      throw new Error("NEXT_PUBLIC_APP_URL must be a public HTTPS URL in production.");
    }
  }

  return {
    username: read("INTOUCHPAY_USERNAME"),
    accountNumber: read("INTOUCHPAY_ACCOUNT_NUMBER"),
    partnerPassword: read("INTOUCHPAY_PARTNER_PASSWORD"),
    baseUrl: read("INTOUCHPAY_BASE_URL"),
    environment: read("INTOUCHPAY_ENV") || "production",
    appUrl: getAppUrl(),
  };
}

export function validateEmailEnv() {
  return Boolean(
    read("SMTP_HOST") ||
      read("RESEND_API_KEY") ||
      read("EMAIL_FROM")
  );
}
