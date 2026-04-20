# Burner Point Security Audit

Date: 2026-04-17

This document tracks the production security posture for Section 19. It focuses on code-level controls that are now present in the repository and the remaining vulnerabilities that must be closed before a public launch.

## Implemented Controls

### Secrets and Provider Access

- Provider secrets are modeled as server-side environment variables only.
- Public clients use Burner Point API routes instead of calling Twilio, Infobip, Vonage, Bandwidth, OpenAI, 1GLOBAL, Bright Data, WireGuard, payment gateways, Resend, Neon, S3, or private PostHog capture directly.
- The backend integration catalog reports whether env names are configured without returning secret values.
- Provider responses are recursively redacted before returning to clients.
- A repeatable tracked-file secret scanner is available at `npm run security:scan`.

### API Middleware

- Helmet security headers are enabled.
- HTTPS redirect is enforced in production except `/health`.
- CORS rejects wildcard origins and allows only configured app origins, derived deployment origins, and explicit Vercel preview opt-in.
- JSON and URL-encoded payload limits are enforced at the Express layer.
- Security middleware rejects blocked HTTP methods, unsupported content types, oversized payloads, deeply nested payloads, excessive object keys, excessive array items, excessive string payloads, and prototype pollution keys.
- Redis-backed rate limiting covers global traffic, authentication routes, payment initialization routes, and provider webhooks.

### Authentication and Sessions

- Passwords are hashed with bcrypt and are never stored in plain text.
- Clerk remains the primary auth provider for OAuth, MFA, session security, and production identity verification.
- Burner Point API sessions use short-lived access tokens plus refresh tokens with revocation tracking.
- Auth routes are limited to 5 attempts per route bucket and identity bucket per 15 minutes.
- Suspicious authentication velocity is logged into redacted audit records.

### Abuse, Fraud, and Audit

- Abuse velocity checks exist for SMS sends, number purchases, login attempts, and API requests.
- Abuse events are persisted with risk score and action state.
- Redacted security audit logging records blocked methods, oversized payloads, malformed payloads, blocked content types, rate limit hits, and suspicious auth velocity.
- Developer API keys are hashed at rest and raw keys are returned once.
- Developer webhook URLs must be HTTPS and cannot target localhost, link-local, private IPv4 ranges, `.local`, or `.internal` hostnames.

### Uploads and Sensitive Data

- Upload intents are authenticated.
- Upload object keys are private, user-sharded, randomized, and do not expose raw user IDs.
- Upload content types are restricted by purpose.
- Sensitive uploads are classified as identity/document, support attachment, communication media, or export.
- S3 credentials are server-side only and direct public storage access is not exposed.
- A `secure_uploads` table migration adds private upload metadata, indexes, retention fields, and row-level security policies based on `app.current_user_id`.

### Mobile Storage

- Expo mobile API access and refresh tokens are stored using `expo-secure-store`.
- iOS Keychain accessibility is set to `WHEN_UNLOCKED_THIS_DEVICE_ONLY` for API tokens.

### AI Safety

- OpenAI is called server-side only.
- `AI_KILL_SWITCH=true` disables AI calls and falls back to deterministic heuristics.
- SMS bodies are truncated before AI classification.

## Validation Commands

Run these before deployment:

```bash
npm run security:scan
cd apps/api && npm run build
cd ../mobile && npx tsc --noEmit
```

## Remaining Vulnerabilities Before Public Launch

1. Provider-specific webhook signatures should be fully implemented for Twilio, Infobip, Vonage, and Bandwidth using each provider's exact signing algorithm and timestamp replay window.
2. `secure_uploads` RLS requires the database session variable `app.current_user_id` to be set before any direct table access. Until that is wired into request-scoped DB transactions, keep all upload access behind backend service methods.
3. Actual S3 object write/read streaming endpoints still need malware scanning, checksum verification, object encryption enforcement, private bucket policy checks, and signed deletion workflow.
4. Developer webhook signing secrets are hidden from list responses but still stored as recoverable values for future delivery signing. Add envelope encryption with `ENCRYPTION_KEY` before enabling outbound webhook delivery at scale.
5. Redis rate limiting currently fails open if Redis is unavailable. For production abuse-sensitive routes, set a platform alert and consider a fail-closed mode for auth and payment routes.
6. Admin and abuse endpoints need explicit role guards beyond JWT before production operator access.
7. Database RLS is not broadly enabled on existing user-owned tables because doing that without request-scoped session variables can break backend queries. Expand RLS after the backend data-access layer sets `app.current_user_id`.
8. Full dependency vulnerability scanning should be added to CI with `npm audit`, GitHub Dependabot, and Snyk or equivalent.
9. Security event retention, export deletion, and legal hold rules need final policy values before handling IDs, licenses, SSNs, or equivalent documents.
10. Production CORS origins must be set explicitly in Railway/Vercel env. Wildcard origins are rejected, but an empty production allowlist will block browser clients.
