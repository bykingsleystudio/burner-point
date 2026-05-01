# Burner Point Deployment Runbook

This runbook prepares Burner Point for production deployment across GitHub, Vercel, Railway, Neon, Clerk, Sentry, PostHog, Expo, iOS App Store, Google Play Store, telecom providers, payment gateways, eSIM, proxy, VPN, email, storage, and operator tooling.

It is intentionally operational. It does not claim that any external service has been pushed, deployed, verified, or connected. Use it as the step-by-step release path for developers and operators.

## 1. Deployment Principles

- Use GitHub as the source of truth for code, review, CI, and release history.
- Use Vercel for the Next.js web app.
- Use Railway for the NestJS API.
- Use Neon Postgres for production and staging databases.
- Use Clerk for auth and sessions across web and mobile.
- Use Expo/EAS for iOS and Android builds.
- Use Sentry for runtime errors and release diagnostics.
- Use PostHog for privacy-aware product analytics.
- Keep every private provider key server-side in Railway, Vercel, EAS environment storage, provider dashboards, or ignored local env files.
- Do not place Twilio, Infobip, Vonage, Bandwidth, OpenAI, 1GLOBAL, Bright Data, WireGuard, payment, Resend, S3, Neon, or private PostHog keys in frontend bundles.
- Release through staging first, then production.

## 2. Environment Model

### Development

Purpose: local feature work and disposable test credentials.

Storage:
- `.env`
- `.env.local`
- provider sandbox credentials only

Rules:
- Never commit real env files.
- Use local ports from `.env.example`.
- Keep provider credentials isolated from production credentials.
- Do not use production user data.

### Staging

Purpose: production-like release validation with isolated data.

Storage:
- Vercel Preview environment
- Railway staging environment
- Neon staging branch or separate staging database
- Clerk test/development instance
- EAS preview environment variables
- Sentry staging projects
- PostHog staging project or tagged events

Rules:
- Staging must use different database, Redis, payment, auth, webhook, and provider credentials from production.
- Provider webhooks should point to the Railway staging API.
- All release gates must pass here before production promotion.

### Production

Purpose: live customer traffic, billing, telecom, and store releases.

Storage:
- Vercel Production environment
- Railway production environment
- Neon production database
- Clerk production instance
- EAS production environment variables
- App Store Connect and Google Play Console
- Provider dashboards

Rules:
- Production deploys from reviewed commits on `main`.
- CI must pass before production promotion.
- Migrations must be applied deliberately and verified.
- Observability must be online before the release starts.

## 3. Source Control and Commit Structure

Use small, traceable commits. Recommended scopes:

- `feat(web): ...` for public site, dashboard, auth, SEO, and conversion work.
- `feat(api): ...` for providers, billing, webhooks, auth, platform, and readiness work.
- `feat(mobile): ...` for Expo screens, auth, secure storage, and native UX.
- `fix(security): ...` for validation, rate limits, CORS, uploads, secrets, and audit corrections.
- `docs(deploy): ...` for runbooks, launch checklists, environment notes, and app store notes.
- `chore(ci): ...` for build gates, dependencies, release metadata, and deployment configuration.

Release branch pattern:

1. Work on feature branches.
2. Open a pull request into `main`.
3. Let GitHub Actions run `Burner Point CI`.
4. Review code, env changes, migrations, provider changes, and payment/webhook changes.
5. Merge only after CI and review pass.
6. Promote the merged commit through staging, then production.

## 4. GitHub CI

The repository includes `.github/workflows/ci.yml`.

It runs:

```bash
npm ci
npm ci --prefix apps/api
npm ci --prefix apps/web
npm ci --prefix apps/mobile
npm run security:scan
npm run build --prefix apps/api
npm run build --prefix apps/web
cd apps/mobile && npx tsc --noEmit
```

The workflow does not deploy. It only proves that the release candidate can build and does not contain high-confidence committed secrets.

Local equivalent:

```bash
npm run release:verify
```

## 5. Deployment Readiness API

The API exposes a safe, secret-free deployment readiness contract:

```http
GET /api/platform/deployment-readiness
```

Use this endpoint after setting staging or production env vars. It returns:

- deployment targets
- configured/missing env status
- production blockers
- environment model
- release gates
- observability checks
- commit structure
- rollback notes

It never returns secret values. It reports only whether required or optional env variables are configured.

Related endpoints:

```http
GET /health
GET /api/platform/stack
GET /api/platform/readiness
```

## 6. Target Matrix

| Target | Surface | Deployment Role | Required Before Production |
| --- | --- | --- | --- |
| GitHub | Source control | PRs, CI, release history | Yes |
| Vercel | Web | Next.js app, SEO, dashboard shell, auth pages | Yes |
| Railway | API | NestJS API, webhooks, realtime, providers | Yes |
| Neon | Database | Postgres data and migrations | Yes |
| DBeaver | Operator tooling | Manual database inspection | Supporting |
| Clerk | Auth | Sessions, OAuth, phone/email verification | Yes |
| Resend | Email | Transactional email | Yes |
| Sentry | Observability | Errors and release diagnostics | Yes |
| PostHog | Analytics | Product and funnel events | Supporting |
| Expo/EAS | Mobile | iOS/Android build pipeline | Yes |
| iOS App Store | Mobile | iOS distribution | Yes for iOS launch |
| Google Play Store | Mobile | Android distribution | Yes for Android launch |
| Twilio | Telecom | SMS, MMS, voice, voicemail, Verify | Yes |
| Infobip | Telecom | Global verification routing | Primary expansion |
| Vonage | Telecom | Independent fallback | Yes before high-volume launch |
| Bandwidth | Telecom | Number infrastructure | Primary for long-term number quality |
| OpenAI | AI | Server-side message classification | Supporting, kill-switchable |
| 1GLOBAL | eSIM | Plans, orders, activation, webhooks | Before eSIM sales |
| Bright Data | Proxies | Proxy purchase and management | Before proxy sales |
| WireGuard | VPN | In-platform VPN protection | Before VPN activation |
| Paystack | Payments | Nigerian/local checkout | Yes |
| Paddle | Payments | International cards and subscriptions | Yes |
| NOWPayments | Payments | Crypto checkout | Yes if crypto is enabled |
| Flutterwave | Payments | Secondary gateway | Deferred |
| Squad | Payments | Secondary gateway | Deferred |
| Korapay | Payments | Secondary gateway | Deferred |
| OPay | Payments | Secondary gateway | Deferred |
| S3-compatible storage | Storage | Private uploads and media | Before MMS/voicemail/document upload scale |

## 7. Vercel Web Deployment

Required production env:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` if Paddle checkout is active
- `NEXT_PUBLIC_PADDLE_SANDBOX=false` for live Paddle

Recommended production env:

- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `GOOGLE_SITE_VERIFICATION`
- `BING_SITE_VERIFICATION`
- `INDEXNOW_KEY`
- `SENTRY_AUTH_TOKEN` only when source-map upload is intended
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_RELEASE`
- `SENTRY_ENVIRONMENT=production`

Pre-release checks:

1. Run `npm run build --prefix apps/web`.
2. Confirm `/` renders.
3. Confirm `/auth/login` and `/auth/signup` render.
4. Confirm `/sitemap.xml` and `/robots.txt` render.
5. Confirm `/opengraph-image` and `/twitter-image` render.
6. Confirm dashboard routes are protected.
7. Confirm no private env value appears in the web bundle.

Rollback:

- Promote the previous successful Vercel deployment or revert the release commit.

## 8. Railway API Deployment

Required production env:

- `NODE_ENV=production`
- `APP_ENV=production`
- `DATABASE_URL`
- `REDIS_URL`
- `CORS_ORIGINS`
- `RAILWAY_ENVIRONMENT`
- auth, telecom, payment, email, observability, storage, and provider secrets as needed

Pre-release checks:

1. Run `npm run build --prefix apps/api`.
2. Run migrations against staging first.
3. Deploy the release commit to Railway staging.
4. Confirm `GET /health` returns 200.
5. Confirm `GET /api/platform/readiness`.
6. Confirm `GET /api/platform/deployment-readiness`.
7. Smoke test Clerk token exchange.
8. Smoke test Twilio OTP send/check with test values.
9. Smoke test payment webhook signature verification.
10. Confirm provider webhook endpoints reject malformed requests.

Rollback:

- Redeploy the previous Railway deployment if schema is compatible.
- If schema changed, prefer a forward hotfix migration over destructive rollback.

## 9. Neon and DBeaver

Neon setup:

1. Create separate development, staging, and production databases or branches.
2. Require SSL for staging and production.
3. Store `DATABASE_URL` only in Railway and ignored local env files.
4. Apply migrations to staging first.
5. Back up production before risky schema changes.

DBeaver setup:

1. Use least-privilege credentials.
2. Name connections clearly: `Burner Point - Staging`, `Burner Point - Production`.
3. Do not store production passwords in screenshots, docs, chat, or issue comments.
4. Use read-only credentials for routine inspection.

## 10. Clerk

Production setup:

1. Create or verify the Clerk production instance.
2. Enable email, phone, Google, Apple, and Microsoft auth as required.
3. Add web redirects:
   - `https://YOUR_DOMAIN/auth/login`
   - `https://YOUR_DOMAIN/auth/signup`
   - `https://YOUR_DOMAIN/sso-callback`
   - `https://YOUR_DOMAIN/dashboard`
4. Add Expo/native redirect URLs for the Burner Point scheme.
5. Configure webhook endpoint on Railway:
   - `https://YOUR_API_DOMAIN/api/webhooks/clerk`
6. Store `CLERK_SECRET_KEY` and `CLERK_WEBHOOK_SIGNING_SECRET` in Railway. `CLERK_WEBHOOK_SECRET` is supported as a legacy alias but should not be the primary name.
7. Store `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in Vercel.
8. Store `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in EAS environment variables, not in `eas.json`.

Operator note:

- Clerk does not expose a general account-management CLI in this runbook. The verified official CLI surface used here is `@clerk/upgrade`, which helps with SDK upgrade and migration guidance rather than dashboard account administration.
- Provider redirects, OAuth connections, live keys, and webhook signing secrets still come from the Clerk dashboard.

## 10.1 PostHog CLI Note

- The verified official PostHog CLI surface used in this project is `@posthog/wizard`, exposed as the `wizard` command.
- Use the PostHog dashboard for project settings, keys, and privacy controls unless PostHog documents a broader supported CLI workflow for that task.

## 11. Expo, iOS, and Android

Run EAS from `apps/mobile`.

Preview:

```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

Production:

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

Before production:

1. Set EAS env:
   - `EXPO_PROJECT_ID`
   - `EXPO_PUBLIC_API_URL`
   - `EXPO_PUBLIC_WEB_URL`
   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `EXPO_PUBLIC_SENTRY_DSN`
2. Confirm `apps/mobile/eas.json` uses separate `preview` and `production` channels.
3. Confirm iOS bundle ID: `app.burnerpoint.mobile`.
4. Confirm Android package: `app.burnerpoint.mobile`.
5. Confirm app store privacy and data safety forms match actual data handling.
6. Confirm digital goods/subscriptions comply with Apple and Google billing rules.

Rollback:

- Use EAS update rollback for JavaScript-only regressions.
- Use app store staged rollout controls or submit a patched binary for native regressions.

## 12. Telecom Providers

Twilio:

- Store secrets only in Railway.
- Verify OTP send/check.
- Verify inbound SMS, MMS status callbacks, inbound call, voicemail recording callback, and signature rules.
- Point webhooks to Railway production only after staging succeeds.

Infobip:

- Verify global SMS/voice route for selected countries.
- Keep route metrics and fallback behavior visible.

Vonage:

- Treat as independent fallback, not as another path through Twilio.
- Verify fallback delivery before high-volume launch.

Bandwidth:

- Use for number infrastructure and long-term number quality.
- Verify inventory, assignment, release, and webhook callbacks.

## 13. Payments

Core gateways:

- Paystack for Nigerian/local card and transfer checkout.
- Paddle for international cards and subscriptions.
- NOWPayments for crypto checkout where enabled.

Rules:

- Gateway secrets stay in Railway.
- Frontend calls only Burner Point backend endpoints.
- Webhooks must verify signatures.
- Ledger updates must be idempotent.
- Number assignment or credit updates happen only after confirmed payment state.
- Mobile in-app purchase rules must be reviewed before selling digital goods or subscriptions inside native apps.

Secondary gateways:

- Flutterwave
- Squad
- Korapay
- OPay

Enable secondary gateways only when `SECONDARY_GATEWAYS_ENABLED=true` and core gateway reconciliation is stable.

## 14. Connectivity and Privacy Providers

1GLOBAL:

- Enable only after plans, orders, activation, and webhooks are verified.
- Hide eSIM purchase CTAs until production credentials and support workflows are ready.

Bright Data:

- Enable only after proxy order, region selection, credential masking, and webhook handling are verified.

WireGuard:

- Treat VPN as an in-platform feature.
- Verify server health, key rotation, device config lifecycle, and session expiry.
- Keep `AI_KILL_SWITCH` and VPN controls independent.

S3-compatible storage:

- Required before scaling MMS, voicemail, support attachments, exports, or sensitive uploads.
- Use private buckets, signed URLs, content-type limits, object key randomization, and audit logs.

## 15. Observability

Minimum production monitoring:

- Sentry web project
- Sentry API project
- Sentry mobile project
- Railway logs and health status
- Vercel deployment and function logs
- PostHog funnels for onboarding, verification, payment, support, and retention
- Provider dashboards for Twilio, Infobip, Vonage, Bandwidth, 1GLOBAL, Bright Data, WireGuard
- Payment dashboards for Paystack, Paddle, NOWPayments
- Neon database metrics

Release blocker signals:

- API `/health` is failing.
- Sentry error rate spikes.
- Payment webhooks fail signature checks or idempotency.
- OTP send/check flow fails.
- CORS rejects production web origin.
- Database migrations fail or block startup.
- Auth redirect or token exchange fails.

## 16. Production Release Order

1. Open PR and pass GitHub CI.
2. Run local `npm run release:verify`.
3. Confirm env diffs against `.env.example`.
4. Apply migrations to staging.
5. Deploy API to Railway staging.
6. Deploy web to Vercel preview.
7. Build Expo preview apps.
8. Smoke test auth, OTP, dashboard, payment, webhook, SEO, and support flows.
9. Review `GET /api/platform/deployment-readiness`.
10. Apply migrations to production.
11. Promote API to Railway production.
12. Promote web to Vercel production.
13. Build native production artifacts.
14. Submit iOS and Android builds when store metadata is ready.
15. Monitor Sentry, PostHog, Railway, Vercel, Neon, and provider dashboards.

## 17. Rollback Rules

- Prefer feature flags and provider route disablement for provider issues.
- Prefer Vercel previous deployment promotion for web-only issues.
- Prefer Railway previous deployment only when database schema is compatible.
- Prefer forward migrations for schema/data issues.
- Prefer EAS update rollback for JS-only mobile issues.
- Pause app store staged rollout for native mobile regressions.
- Never rotate production secrets during an active incident unless the incident involves secret exposure.

## 18. Final Launch Checklist

Before public launch:

1. GitHub CI passes on `main`.
2. `npm run release:verify` passes locally.
3. `.env.example` matches all required deployment env names.
4. Vercel production env is complete.
5. Railway production env is complete.
6. EAS production env is complete.
7. Clerk production redirects and webhooks are complete.
8. Neon production database is backed up.
9. Sentry projects are receiving events.
10. PostHog captures server-side events.
11. Twilio OTP and conversation webhooks pass smoke tests.
12. Real browser auth smoke tests have been executed for email/password sign-up, email/password login, Google OAuth, Apple OAuth, and Microsoft OAuth.
13. Payment webhooks reconcile ledger state.
14. SEO routes are live and submitted.
15. App store metadata and policy forms are ready.
16. Support email, Telegram links, and incident owner contacts are current.
