#!/usr/bin/env node
/**
 * SQLite database backup for ITUZE B&B booking system.
 * Usage: node scripts/backup-database.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dbPath = path.join(root, "prisma", "dev.db");
const backupDir = path.join(root, "backups");

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function main() {
  if (!fs.existsSync(dbPath)) {
    console.error(`Database not found: ${dbPath}`);
    process.exit(1);
  }

  fs.mkdirSync(backupDir, { recursive: true });

  const fileName = `house_booking_${timestamp()}.db`;
  const target = path.join(backupDir, fileName);

  fs.copyFileSync(dbPath, target);

  const meta = {
    createdAt: new Date().toISOString(),
    source: dbPath,
    backupFile: fileName,
    tables: [
      "User",
      "Room",
      "Booking",
      "PaymentTransaction",
      "PaymentLog",
      "Setting",
      "ContactMessage",
      "HeroAd",
    ],
  };

  fs.writeFileSync(`${target}.json`, JSON.stringify(meta, null, 2));
  console.log(`Backup created: ${target}`);
}

main();
