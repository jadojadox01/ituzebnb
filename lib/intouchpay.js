import crypto from "crypto";
import { getIntouchCallbackUrl } from "@/lib/appUrl";
import { validatePaymentEnv } from "@/lib/env";
import { buildIntouchApiUrl } from "@/lib/intouchpayUrls";

const HTTP_ERROR_MESSAGES = {
  400: "Invalid request",
  401: "Authentication failed",
  403: "Account inactive",
  409: "Duplicate transaction ID",
  422: "Payment failed",
  429: "Too many requests",
  500: "Server error",
};

/** UTC timestamp YYYYMMDDHHMMSS */
export function generateTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
}

/** SHA256(username + accountNumber + partnerPassword + timestamp) */
export function generateSHA256Hash(username, accountNumber, partnerPassword, timestamp, options = {}) {
  const includeAccount =
    options.includeAccount ??
    process.env.INTOUCHPAY_HASH_INCLUDES_ACCOUNT !== "false";

  const raw = includeAccount
    ? `${username}${accountNumber}${partnerPassword}${timestamp}`
    : `${username}${partnerPassword}${timestamp}`;

  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function generateHashVariants(username, accountNumber, partnerPassword, timestamp) {
  return {
    withAccount: generateSHA256Hash(username, accountNumber, partnerPassword, timestamp, {
      includeAccount: true,
    }),
    withoutAccount: generateSHA256Hash(username, accountNumber, partnerPassword, timestamp, {
      includeAccount: false,
    }),
  };
}

function cleanEnv(value) {
  return String(value || "")
    .trim()
    .replace(/\r/g, "")
    .replace(/^['"]|['"]$/g, "");
}

export function getConfig() {
  const environment = cleanEnv(process.env.INTOUCHPAY_ENV) || "production";
  const baseUrl = cleanEnv(process.env.INTOUCHPAY_BASE_URL);
  const callbackUrl = cleanEnv(process.env.INTOUCHPAY_CALLBACK_URL) || getIntouchCallbackUrl();

  return {
    username:
      cleanEnv(process.env.INTOUCHPAY_USERNAME) ||
      cleanEnv(process.env.INTOUCH_USERNAME) ||
      "",
    accountNumber:
      cleanEnv(process.env.INTOUCHPAY_ACCOUNT_NUMBER) ||
      cleanEnv(process.env.INTOUCH_ACCOUNT_NO) ||
      "",
    partnerPassword:
      cleanEnv(process.env.INTOUCHPAY_PARTNER_PASSWORD) ||
      cleanEnv(process.env.INTOUCH_PARTNER_PASSWORD) ||
      "",
    baseUrl,
    environment,
    callbackUrl,
  };
}

export function assertConfigured() {
  if (process.env.NODE_ENV === "production") {
    validatePaymentEnv();
  }

  const config = getConfig();
  const missing = [];
  if (!config.username) missing.push("INTOUCHPAY_USERNAME");
  if (!config.accountNumber) missing.push("INTOUCHPAY_ACCOUNT_NUMBER");
  if (!config.partnerPassword) missing.push("INTOUCHPAY_PARTNER_PASSWORD");
  if (!config.callbackUrl) missing.push("INTOUCHPAY_CALLBACK_URL or NEXT_PUBLIC_APP_URL");

  if (missing.length) {
    const error = new Error(`IntouchPay credentials missing: ${missing.join(", ")}`);
    error.code = "INTOUCH_NOT_CONFIGURED";
    error.missing = missing;
    throw error;
  }

  return config;
}

function buildApiUrl(endpoint) {
  const { baseUrl, environment } = getConfig();
  return buildIntouchApiUrl(endpoint, { baseUrl, environment });
}

export function getRequestPaymentUrl() {
  return buildApiUrl("requestpayment");
}

export function getTransactionStatusUrl() {
  return buildApiUrl("gettransactionstatus");
}

export function getBalanceUrl() {
  return buildApiUrl("getbalance");
}

export function getRequestDepositUrl() {
  return buildApiUrl("requestdeposit");
}

export function normalizeRwandaPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (digits.startsWith("250") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `250${digits.slice(1)}`;
  if (digits.length === 9) return `250${digits}`;

  throw new Error("Enter a valid Rwanda mobile number (e.g. 0781234567)");
}

export function validateAmount(amount) {
  const value = Math.round(Number(amount));
  if (!value || value <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }
  return value;
}

/** Unique PAY + timestamp + order suffix */
export function generateRequestTransactionId(orderId) {
  const clean = String(orderId || "ORD")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(-6)
    .toUpperCase();
  return `PAY${generateTimestamp()}${clean}`.slice(0, 40);
}

function parseResponse(rawText) {
  const trimmed = String(rawText || "").trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    return { message: trimmed };
  }
}

export function mapHttpError(status, result = {}) {
  const detail = result.detail || result.message || result.statusdesc || "";
  const code = String(result.responsecode || result.responseCode || "");

  if (/no Route matched/i.test(detail)) {
    return (
      "IntouchPay URL is wrong for this environment. Production uses " +
      "https://www.intouchpay.co.rw/api/requestpayment/ (not /api/v1/...). " +
      "Sandbox uses https://developer.intouchpay.co.rw/api/v1/sandbox/requestpayment/."
    );
  }

  if (detail === "No such user" || code === "0007") {
    return (
      "No such user (code 0007): username not found on this API environment. " +
      "Use production credentials on www.intouchpay.co.rw, or sandbox credentials on developer.intouchpay.co.rw."
    );
  }

  if (code === "0005" || /invalid password/i.test(detail)) {
    return (
      "Authentication failed (code 0005): password hash does not match. " +
      "In Admin → Payments, verify hash with Swagger timestamp 20260727081934. " +
      "Check .env password has no extra spaces and restart the server."
    );
  }

  const base = HTTP_ERROR_MESSAGES[status] || detail || "IntouchPay request failed";
  return code ? `${base} (code ${code})` : base;
}

async function postToIntouch(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  const result = parseResponse(rawText);

  if (!response.ok || result.success === false) {
    const error = new Error(mapHttpError(response.status, result));
    error.status = response.status;
    error.intouch = result;
    throw error;
  }

  return { result, httpStatus: response.status };
}

function buildAuthFields(config) {
  const timestamp = generateTimestamp();
  const includeAccount = process.env.INTOUCHPAY_HASH_INCLUDES_ACCOUNT !== "false";
  const password = generateSHA256Hash(
    config.username,
    config.accountNumber,
    config.partnerPassword,
    timestamp,
    { includeAccount }
  );
  return { username: config.username, timestamp, password };
}

/** Initiate Mobile Money collection (Request Payment) */
export async function requestPayment({ amount, mobilephone, requesttransactionid, callbackurl }) {
  const config = assertConfigured();
  const intAmount = validateAmount(amount);
  const auth = buildAuthFields(config);

  const payload = {
    username: auth.username,
    timestamp: auth.timestamp,
    password: auth.password,
    amount: String(intAmount),
    mobilephone,
    requesttransactionid,
    callbackurl: callbackurl || config.callbackUrl,
  };

  const { result } = await postToIntouch(getRequestPaymentUrl(), payload);
  return result;
}

/** Send Mobile Money deposit to a subscriber (Request Deposit) */
export async function requestDeposit({
  amount,
  mobilephone,
  requesttransactionid,
  reason = "",
  withdrawcharge = 0,
  sid = 1,
}) {
  const config = assertConfigured();
  const intAmount = validateAmount(amount);
  const auth = buildAuthFields(config);
  const phone = normalizeRwandaPhone(mobilephone);

  const payload = {
    username: auth.username,
    timestamp: auth.timestamp,
    password: auth.password,
    amount: String(intAmount),
    withdrawcharge: Number(withdrawcharge) || 0,
    reason: reason || "",
    sid: Number(sid) || 1,
    mobilephone: phone,
    requesttransactionid: requesttransactionid || generateRequestTransactionId("DEP"),
  };

  const { result } = await postToIntouch(getRequestDepositUrl(), payload);
  return result;
}

/** Poll transaction status from IntouchPay */
export async function checkTransactionStatus({ requesttransactionid, transactionid }) {
  const config = assertConfigured();
  if (!requesttransactionid && !transactionid) {
    throw new Error("requesttransactionid or transactionid is required");
  }

  const auth = buildAuthFields(config);
  const payload = {
    username: auth.username,
    timestamp: auth.timestamp,
    password: auth.password,
  };

  if (requesttransactionid) payload.requesttransactionid = requesttransactionid;
  if (transactionid) payload.transactionid = transactionid;

  const { result } = await postToIntouch(getTransactionStatusUrl(), payload);
  return result;
}

/** Test credentials via getbalance */
export async function testConnection() {
  const config = assertConfigured();
  const auth = buildAuthFields(config);
  const payload = {
    username: auth.username,
    timestamp: auth.timestamp,
    password: auth.password,
    accountno: config.accountNumber,
  };

  try {
    const { result, httpStatus } = await postToIntouch(getBalanceUrl(), payload);
    return {
      ok: true,
      httpStatus,
      apiUrl: getBalanceUrl(),
      username: config.username,
      accountno: config.accountNumber,
      response: result,
      message: "Connected to IntouchPay successfully.",
    };
  } catch (error) {
    return {
      ok: false,
      httpStatus: error.status || 500,
      apiUrl: getBalanceUrl(),
      username: config.username,
      accountno: config.accountNumber,
      response: error.intouch || null,
      message: error.message,
    };
  }
}

export function extractCallbackPayload(body) {
  if (body?.jsonpayload) return body.jsonpayload;
  return body || {};
}

export function mapIntouchStatus(payload) {
  const status = String(payload?.status || payload?.Status || "").toLowerCase();
  const code = String(payload?.responsecode || payload?.responseCode || "");

  if (
    code === "01" ||
    status === "successfully" ||
    status === "successful" ||
    status === "success"
  ) {
    return "SUCCESSFUL";
  }

  if (status === "cancelled" || status === "canceled") {
    return "CANCELLED";
  }

  if (status === "failed" || status === "failure") {
    return "FAILED";
  }

  if (code && code !== "1000" && code !== "01") {
    return "FAILED";
  }

  return "PENDING";
}

export function isPaymentSuccess(payload) {
  const status = mapIntouchStatus(payload);
  return status === "SUCCESSFUL" || status === "SUCCESS";
}

export function isPaymentFailure(payload) {
  const status = mapIntouchStatus(payload);
  return status === "FAILED" || status === "CANCELLED";
}

export function isTerminalPaymentStatus(status) {
  const value = String(status || "").toUpperCase();
  return ["SUCCESS", "SUCCESSFUL", "FAILED", "CANCELLED"].includes(value);
}

export function providerLabel(provider) {
  if (!provider) return "";
  if (typeof provider === "string") return provider;
  return provider.name || provider.code || "";
}

// Legacy aliases used elsewhere in the app
export const getTimestamp = generateTimestamp;
export const computePasswordHash = generateSHA256Hash;

export async function verifyPasswordHash(timestamp, expectedHash) {
  const config = getConfig();
  const variants = generateHashVariants(
    config.username,
    config.accountNumber,
    config.partnerPassword,
    timestamp
  );

  const expected = String(expectedHash || "").toLowerCase();
  const withAccountMatch = variants.withAccount.toLowerCase() === expected;
  const withoutAccountMatch = variants.withoutAccount.toLowerCase() === expected;

  return {
    matches: withAccountMatch || withoutAccountMatch,
    matchMode: withAccountMatch
      ? "username+account+password+timestamp"
      : withoutAccountMatch
        ? "username+password+timestamp"
        : null,
    computed: variants.withAccount,
    computedWithoutAccount: variants.withoutAccount,
    username: config.username,
    accountno: config.accountNumber,
    passwordLength: config.partnerPassword.length,
    timestamp,
  };
}

export async function isMockPaymentsEnabled() {
  if (process.env.INTOUCH_MOCK_PAYMENTS === "true") return true;
  if (process.env.INTOUCHPAY_MOCK_PAYMENTS === "true") return true;
  return false;
}
