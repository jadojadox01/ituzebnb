# Database backup guide

## What is backed up

The booking system stores critical data in SQLite (`prisma/dev.db`):

- **Booking** — orders / reservations
- **PaymentTransaction** — IntouchPay payment records
- **PaymentLog** — payment audit trail
- **User** — guest and admin accounts
- **Room** — inventory
- **Setting**, **ContactMessage**, **HeroAd**

## Automated backup script

```bash
node scripts/backup-database.js
```

Creates:

- `backups/house_booking_YYYYMMDD_HHMMSS.db`
- `backups/house_booking_YYYYMMDD_HHMMSS.db.json` (metadata)

## Recommended schedule

| Environment | Frequency |
|-------------|-----------|
| Production  | Daily (minimum) |
| Before deploy | Always |
| After go-live | Hourly during first week (optional) |

Use Windows Task Scheduler, cron, or your host's backup service to run the script.

## Production (PostgreSQL / hosted DB)

If you migrate off SQLite:

1. Use your provider's automated backups (Railway, Supabase, RDS, etc.).
2. Export before major releases: `pg_dump` or provider snapshot.
3. Keep backups encrypted and off-server.

## Restore (SQLite)

1. Stop the application.
2. Copy backup over `prisma/dev.db`.
3. Restart the application.

```bash
cp backups/house_booking_YYYYMMDD_HHMMSS.db prisma/dev.db
```

## Safety rules

- Never commit `.db` files or backups to git.
- Store backups in a separate directory or cloud storage.
- Test restore on a staging copy at least once before production.
