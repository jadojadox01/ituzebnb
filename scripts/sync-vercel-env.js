#!/usr/bin/env node
/**
 * Push selected .env keys to Vercel Production without printing values.
 * Usage: node scripts/sync-vercel-env.js
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const KEYS = [
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "JWT_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "INTOUCHPAY_USERNAME",
  "INTOUCHPAY_ACCOUNT_NUMBER",
  "INTOUCHPAY_PARTNER_PASSWORD",
  "INTOUCHPAY_BASE_URL",
  "INTOUCHPAY_ENV",
  "INTOUCHPAY_CALLBACK_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_FROM_NAME",
  "SUPPORT_EMAIL",
];

function loadEnv(filePath) {
  const map = {};
  if (!fs.existsSync(filePath)) return map;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map[key] = value;
  }
  return map;
}

const env = {
  ...loadEnv(path.join(__dirname, "..", ".env")),
  ...loadEnv(path.join(__dirname, "..", ".env.local")),
};

const missing = [];
const skippedEmpty = [];
let ok = 0;

for (const key of KEYS) {
  const value = env[key];
  if (!value) {
    skippedEmpty.push(key);
    continue;
  }
  const sensitive = !key.startsWith("NEXT_PUBLIC_");
  const args = ["env", "add", key, "production", "--force"];
  if (sensitive) args.push("--sensitive");

  const result = spawnSync("vercel", args, {
    input: `${value}\n`,
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0) {
    missing.push(key);
    const err = (result.stderr || result.stdout || "").replace(/\s+/g, " ").slice(0, 240);
    console.error(`FAILED ${key}: ${err}`);
  } else {
    ok += 1;
    console.log(`SET ${key}`);
  }
}

console.log(
  `Done. set=${ok} empty_skipped=${skippedEmpty.join(",") || "none"} failed=${missing.join(",") || "none"}`
);
