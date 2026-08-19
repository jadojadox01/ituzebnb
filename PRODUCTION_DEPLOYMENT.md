# Production deployment — ITUZE B&B (`https://www.ituzebnb.com`)

## 1. Environment setup

Set these in **Vercel → Project → Settings → Environment Variables** (or copy `.env.production.example` on a VPS). Never commit secrets.

Required:

| Variable | Example | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://www.ituzebnb.com` | Public HTTPS domain |
| `DATABASE_URL` | Neon **pooled** URL | App runtime |
| `DATABASE_URL_UNPOOLED` | Neon **direct** URL | Prisma migrate / `db push` |
| `JWT_SECRET` | long random string | Required |
| `CLOUDINARY_CLOUD_NAME` | from Cloudinary dashboard | Uploads on Vercel |
| `CLOUDINARY_API_KEY` | from Cloudinary | |
| `CLOUDINARY_API_SECRET` | from Cloudinary | |
| `INTOUCHPAY_USERNAME` | production or sandbox | From IntouchPay |
| `INTOUCHPAY_ACCOUNT_NUMBER` | production or sandbox | From IntouchPay |
| `INTOUCHPAY_PARTNER_PASSWORD` | secret | Server env only |
| `INTOUCHPAY_BASE_URL` | `https://www.intouchpay.co.rw` | Confirm with IntouchPay |
| `INTOUCHPAY_ENV` | `production` | Or `sandbox` while testing |
| `INTOUCHPAY_CALLBACK_URL` | see below | Register this with IntouchPay |

Optional: `RESEND_API_KEY`, `EMAIL_FROM`, `SUPPORT_EMAIL`, Sentry DSNs.

### IntouchPay callback (production)

```
https://www.ituzebnb.com/api/payment/intouchpay/callback
```

Do **not** use `localhost` or ngrok in production.

---

## 2. Neon PostgreSQL

1. Create a Neon project and copy the pooled + unpooled connection strings.
2. Locally (with `.env` pointing at Neon):

```bash
npx prisma generate
npx prisma db push
node scripts/seed-neon.js
```

Important tables: `Booking`, `PaymentTransaction`, `PaymentLog`, `User`, `Room`, `Setting`, `HeroAd`, `ContactMessage`.

Default admin after seed: `admin@ituzebnb.com` / `admin123` — change immediately.

See [DATABASE_BACKUP.md](./DATABASE_BACKUP.md) for backups (prefer Neon’s built-in backups in production).

---

## 3. Cloudinary

1. Create a free Cloudinary account → Dashboard → API Keys.
2. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
3. Admin uploads (rooms, hero, logo) go to Cloudinary; local `public/uploads` is only for local/dev without Cloudinary.

---

## 4. Build and deploy (Vercel + custom domain)

```bash
npm ci
npx prisma generate
npm run build
```

1. Connect GitHub repo `jadojadox01/ituzebnb` to Vercel.
2. Add all env vars for Production.
3. Add domain `www.ituzebnb.com` (and apex `ituzebnb.com` if desired) in Vercel → Domains.
4. Deploy. Build command should run `prisma generate` (via `postinstall`).

Ensure:

- TLS certificate valid
- `NEXT_PUBLIC_APP_URL=https://www.ituzebnb.com`
- Callback registered with IntouchPay as above

---

## 5. Switch IntouchPay sandbox → production

1. Complete sandbox testing (success, failure, duplicate callback).
2. Request **production credentials** from IntouchPay support.
3. Register production callback URL with IntouchPay:
   ```
   https://www.ituzebnb.com/api/payment/intouchpay/callback
   ```
4. Update env:
   ```env
   INTOUCHPAY_ENV=production
   INTOUCHPAY_BASE_URL=https://www.intouchpay.co.rw
   INTOUCHPAY_USERNAME=<production username>
   INTOUCHPAY_ACCOUNT_NUMBER=<production account>
   INTOUCHPAY_PARTNER_PASSWORD=<production partner password>
   ```
   Production API paths have **no** `/production/` segment:
   `https://www.intouchpay.co.rw/api/v1/requestpayment/`
   Guest checkout uses **requestpayment** (collect). **requestdeposit** sends money out of your wallet.
5. Restart application.
6. Admin → Payments → **Test connection**.

---

## 6. Testing checklist (production)

### Scenario 1 — Successful payment
- [ ] Guest checkout → order created
- [ ] POST `/api/payment/intouchpay/request` succeeds
- [ ] Guest receives USSD prompt
- [ ] Callback received → order **paid**
- [ ] Confirmation email sent (if email configured)
- [ ] `PaymentLog` entries created

### Scenario 2 — Failed payment
- [ ] Payment fails on phone
- [ ] Status → **FAILED**
- [ ] Guest notified (email if configured)
- [ ] Room released

### Scenario 3 — Duplicate callback
- [ ] Send same callback twice
- [ ] Second callback ignored (no double charge / double email)
- [ ] `PAYMENT_DUPLICATE_CALLBACK` logged

### Scenario 4 — Security
- [ ] Frontend cannot change payment amount (server recalculates)
- [ ] Rate limiting returns 429 on abuse
- [ ] Secrets not exposed in browser network tab

---

## 7. Rollback procedure

1. Stop traffic to new deployment.
2. Restore previous application build.
3. Restore database backup if schema/data changed.
4. Revert IntouchPay credentials to last known good set.
5. Verify callback URL still registered.
6. Run smoke test with small amount.

---

## 8. Monitoring

- Watch server logs for `[payment]` JSON entries.
- Query `PaymentLog` for failed events.
- Configure Sentry DSN for exception alerts.
- Monitor IntouchPay merchant portal for transaction mismatches.

---

## 9. Ready for production credentials?

The system is ready when:

- [x] HTTPS domain configured via `NEXT_PUBLIC_APP_URL`
- [x] Callback route secured and idempotent
- [x] Env validation for payment operations
- [x] Payment logging in database
- [x] Server-side amount verification
- [x] Rate limiting on payment endpoints
- [x] Email notifications (when `RESEND_API_KEY` set)
- [x] Backup script and documentation
- [ ] Production IntouchPay credentials installed
- [ ] Callback URL whitelisted by IntouchPay
- [ ] End-to-end test with real small amount
