# Troubleshooting

## API does not boot
- Check Railway logs for bootstrap errors.
- Confirm `DATABASE_URL`, `JWT_SECRET`, and `CLERK_SECRET_KEY`.
- Hit `/health` after deploy.

## Database health fails
- Check `GET /health/db`.
- Confirm Neon connection string and SSL settings.
- Verify migrations were applied.

## Queue health fails
- Check `GET /health/queue`.
- Confirm `REDIS_URL` or host/port values.
- Redis is required for rate limits, token revocation, and queue-adjacent flows.

## Storage health fails
- Check `GET /health/storage`.
- Confirm either AWS S3 or Cloudflare R2 credentials and bucket name.

## Users cannot sign in
- Verify Clerk publishable key on web and secret key on API.
- Confirm `POST /auth/clerk/exchange` works from the frontend origin.
- Confirm `NEXT_PUBLIC_API_URL` points to the deployed API.

## Phone verification fails
- Confirm:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_VERIFY_SERVICE_SID`
- Phone numbers must be valid E.164.
- Check API logs for Twilio status/code, not raw secrets.

## Wallet credits incorrect
- Confirm migration `008_convert_minor_units_to_usd_cents.sql` ran.
- Wallet is stored in USD cents.
- Review `wallet_transactions` for immutable balance history.

## Payment webhook not crediting
- Verify provider signature secret exists.
- Check webhook dedup table for duplicate event IDs.
- Check `payment_sessions.status` for:
  - `pending`
  - `processing`
  - `completed`
  - `reconciliation_failed`
  - `paid_pending_fulfillment`

## Web build fails
- Confirm `NEXT_PUBLIC_API_URL` is set.
- Confirm Clerk public key exists.
- Confirm `NEXT_PUBLIC_SUPPORT_EMAIL` or default support links do not violate the CSP/domain policy you expect to ship.
- Run:
```bash
npm run verify:web
```
