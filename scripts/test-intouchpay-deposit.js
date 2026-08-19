#!/usr/bin/env node
/**
 * Test IntouchPay sandbox requestdeposit.
 * Usage: node scripts/test-intouchpay-deposit.js
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(path.join(__dirname, "..", ".env"));

const sample = JSON.parse(
  fs.readFileSync(path.join(__dirname, "intouchpay-deposit-test.json"), "utf8")
);

function cleanEnv(value) {
  return String(value || "")
    .trim()
    .replace(/\r/g, "")
    .replace(/^['"]|['"]$/g, "");
}

function generateTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
}

function generateHash(username, accountNumber, partnerPassword, timestamp) {
  const includeAccount = process.env.INTOUCHPAY_HASH_INCLUDES_ACCOUNT !== "false";
  const raw = includeAccount
    ? `${username}${accountNumber}${partnerPassword}${timestamp}`
    : `${username}${partnerPassword}${timestamp}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("250") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `250${digits.slice(1)}`;
  if (digits.length === 9) return `250${digits}`;
  throw new Error("Invalid Rwanda phone number");
}

async function main() {
  const baseUrl = String(process.env.INTOUCHPAY_BASE_URL || "https://developer.intouchpay.co.rw")
    .trim()
    .replace(/\s+/g, "")
    .replace(/\/+$/, "");
  const environment = String(process.env.INTOUCHPAY_ENV || "sandbox").toLowerCase();
  const sandbox = environment === "sandbox" || environment === "test" || baseUrl.includes("developer.intouchpay.co.rw");
  const url = sandbox
    ? `${baseUrl}/api/v1/sandbox/requestdeposit/`
    : `${baseUrl}/api/requestdeposit/`;

  const username = cleanEnv(process.env.INTOUCHPAY_USERNAME);
  const accountNumber = cleanEnv(process.env.INTOUCHPAY_ACCOUNT_NUMBER);
  const partnerPassword = cleanEnv(process.env.INTOUCHPAY_PARTNER_PASSWORD);

  const timestamp = generateTimestamp();
  const password = generateHash(username, accountNumber, partnerPassword, timestamp);
  const requesttransactionid = `${sample.requesttransactionid}_${timestamp.slice(-6)}`;

  const payload = {
    username,
    timestamp,
    password,
    amount: String(sample.amount),
    withdrawcharge: sample.withdrawcharge ?? 0,
    reason: sample.reason || "",
    sid: sample.sid ?? 1,
    mobilephone: normalizePhone(sample.mobilephone),
    requesttransactionid,
  };

  console.log("POST", url);
  console.log("Payload:", JSON.stringify(payload, null, 2));

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log("\nHTTP", res.status);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
