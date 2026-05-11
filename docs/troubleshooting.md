# Burner Point Troubleshooting

## Web returns 404 on Vercel

- Confirm the Vercel project root is `apps/web`.
- Confirm the framework preset is `Next.js`.
- Confirm the deployment is running a real Next build instead of emitting static `NOT_FOUND` output.

## API does not boot

- Check Railway logs for bootstrap errors.
- Confirm `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`.
- Check `GET /health` after deploy.

## Database probe fails

- Check `GET /health/db`.
- Confirm Supabase pooled and direct URLs plus SSL settings.
- Verify migrations ran successfully.

## Redis probe fails

- Check `GET /health/redis`.
- Confirm `REDIS_URL`.
- Redis is required for rate limiting, token revocation, webhook dedupe, and queue coordination.

## Storage probe fails

- Check `GET /health/storage`.
- Confirm Supabase storage bucket names and service-role access.

## Auth or OTP flow fails

- Verify Supabase public URL/key on web and mobile.
- Verify `POST /auth/supabase/exchange`.
- Verify `TWILIO_VERIFY_SERVICE_SID` and related Twilio credentials.

## Payments do not reconcile

- Verify provider webhook secrets.
- Check payment session status and webhook dedupe records.
- Confirm wallet crediting happens only after verified payment state.
