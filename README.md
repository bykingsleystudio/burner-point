# Burner Point

Burner Point is a production telecom and privacy platform built around Supabase, Next.js, NestJS, Railway, Vercel, and Expo.

## Production surfaces

- Web: `https://burnerpoint.com`
- API: `https://api.burnerpoint.com`
- WebSocket: `wss://api.burnerpoint.com`

## Stack

- Web: Next.js, React, TypeScript, Tailwind CSS
- Mobile: React Native, Expo, EAS
- API: NestJS on Railway
- Core platform: Supabase Auth, Postgres, Realtime, Storage
- Payments: Paystack, Flutterwave, Paddle, NOWPayments
- Subscriptions: RevenueCat
- Telecom: Twilio, Telnyx, Bandwidth, Tremil
- Connectivity: Airalo, Oxylabs, Smartproxy, WireGuard
- Monitoring: Sentry, PostHog

## Workspace

```text
apps/
  api/
  mobile/
  web/
docs/
supabase/
packages/
scripts/
```

## Local development

```bash
npm install
cp .env.example .env
npm run build --prefix apps/api
npm run build --prefix apps/web
cd apps/mobile && npx tsc --noEmit
```

Local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- API docs: `http://localhost:3001/api/docs`

## Canonical docs

- [Environment](docs/environment.md)
- [Deployment](docs/deployment.md)
- [Security](docs/security.md)
- [API](docs/api.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Post-deployment checklist](docs/post-deployment-checklist.md)
- [Detailed runbook](docs/DEPLOYMENT_RUNBOOK.md)
- [Supabase and DBeaver](docs/supabase-dbeaver.md)

## Verification commands

```bash
npm run security:scan
npm run build --prefix apps/api
npm run build --prefix apps/web
cd apps/mobile && npx tsc --noEmit
npm run test:e2e --prefix apps/web
```

## Support

- Email: `info@burnerpoint.com`
- Telegram: `https://t.me/burnerpoint`

## License

Proprietary. All rights reserved.
