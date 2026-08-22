# Burner Point

Burner Point is a production telecom and privacy platform built around Supabase, NestJS, and Railway.

## Production surfaces

- API: `https://api.burnerpoint.com`
- WebSocket: `wss://api.burnerpoint.com`

## Stack

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
```

Local API URL: `http://localhost:3001`

## Canonical docs

- [Frontend design system](docs/frontend-design-system.md)
- [Provider integration contract](docs/provider-integrations.md)
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
```

## Support

- Email: `info@burnerpoint.com`
- Telegram: `https://t.me/burnerpoint`

## License

Proprietary. All rights reserved.
