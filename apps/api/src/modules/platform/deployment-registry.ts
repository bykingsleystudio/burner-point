export type DeploymentEnvironment = 'development' | 'staging' | 'production';

export type DeploymentCategory =
  | 'source-control'
  | 'web'
  | 'api'
  | 'database'
  | 'auth'
  | 'mobile'
  | 'observability'
  | 'telecom'
  | 'payments'
  | 'connectivity'
  | 'privacy'
  | 'email'
  | 'storage'
  | 'operator-tooling';

export type DeploymentStage =
  | 'core'
  | 'primary'
  | 'fallback'
  | 'secondary'
  | 'supporting'
  | 'planned';

export interface DeploymentTargetDefinition {
  id: string;
  name: string;
  category: DeploymentCategory;
  stage: DeploymentStage;
  environmentScope: DeploymentEnvironment[];
  ownerSurface: string;
  requiredEnv?: string[];
  optionalEnv?: string[];
  deferredUnlessEnv?: string;
  disabledWhenEnvTrue?: string;
  productionRequired?: boolean;
  releaseCheck: string;
  rollback: string;
}

export interface DeploymentEnvironmentDefinition {
  id: DeploymentEnvironment;
  purpose: string;
  branchPolicy: string;
  secretStores: string[];
  publicEnv: string[];
  serverEnv: string[];
  deployTargets: string[];
  releaseRule: string;
}

export interface ReleaseGateDefinition {
  id: string;
  phase: 'code' | 'security' | 'data' | 'web' | 'api' | 'mobile' | 'monitoring' | 'business';
  required: boolean;
  check: string;
  command?: string;
}

export interface ObservabilityCheckDefinition {
  id: string;
  surface: 'web' | 'api' | 'mobile' | 'provider' | 'database' | 'payments';
  signal: string;
  requiredEnv?: string[];
  alertOwner: string;
  releaseBlocker: boolean;
}

export const DEPLOYMENT_TARGETS: DeploymentTargetDefinition[] = [
  {
    id: 'github',
    name: 'GitHub',
    category: 'source-control',
    stage: 'core',
    environmentScope: ['development', 'staging', 'production'],
    ownerSurface: 'Repository, pull requests, reviews, CI status, release tags',
    requiredEnv: ['GITHUB_REPOSITORY'],
    productionRequired: true,
    releaseCheck: 'CI passes on the release commit and the deployment commit is tagged or traceable.',
    rollback: 'Revert or hotfix through a new PR; never force-push protected production history.',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'web',
    stage: 'core',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Next.js public web app, dashboard shell, SEO routes, auth pages',
    requiredEnv: ['VERCEL_ENV', 'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'],
    optionalEnv: ['VERCEL_PROJECT_ID', 'VERCEL_ORG_ID', 'NEXT_PUBLIC_SENTRY_DSN', 'NEXT_PUBLIC_POSTHOG_KEY', 'GOOGLE_SITE_VERIFICATION', 'BING_SITE_VERIFICATION', 'INDEXNOW_KEY'],
    productionRequired: true,
    releaseCheck: 'Vercel production build passes and /, /sitemap.xml, /robots.txt, /auth/login, and /dashboard resolve.',
    rollback: 'Promote the previous successful Vercel deployment or revert the release commit.',
  },
  {
    id: 'railway',
    name: 'Railway',
    category: 'api',
    stage: 'core',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'NestJS API, webhooks, realtime gateway, provider adapters',
    requiredEnv: ['RAILWAY_ENVIRONMENT', 'DATABASE_URL', 'CORS_ORIGINS'],
    optionalEnv: ['RAILWAY_PROJECT_ID', 'RAILWAY_SERVICE_ID', 'API_URL', 'APP_URL', 'SENTRY_DSN'],
    productionRequired: true,
    releaseCheck: 'Railway deployment is healthy, /health returns 200, and /api/platform/readiness has no core blockers.',
    rollback: 'Redeploy the previous Railway deployment or push a forward hotfix.',
  },
  {
    id: 'neon',
    name: 'Neon Postgres',
    category: 'database',
    stage: 'core',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Primary relational data store for users, numbers, billing, messages, audit, and webhooks',
    requiredEnv: ['DATABASE_URL'],
    optionalEnv: ['NEON_PROJECT_ID', 'DB_SSL', 'DB_SSL_REJECT_UNAUTHORIZED'],
    productionRequired: true,
    releaseCheck: 'Migrations are reviewed, reversible where practical, and applied before traffic depends on new schema.',
    rollback: 'Use Neon branching/backups and a forward-compatible migration fix; avoid destructive rollback on live data.',
  },
  {
    id: 'clerk',
    name: 'Clerk',
    category: 'auth',
    stage: 'core',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Authentication, sessions, OAuth, phone/email verification, webhooks',
    requiredEnv: ['CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_WEBHOOK_SIGNING_SECRET'],
    optionalEnv: ['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_WEBHOOK_SECRET'],
    productionRequired: true,
    releaseCheck: 'Email, phone, Google, Apple, Microsoft, redirect URLs, and Clerk webhook signing are configured per environment.',
    rollback: 'Disable the affected auth route or restore the previous Clerk redirect/webhook configuration.',
  },
  {
    id: 'auth-browser-smoke',
    name: 'Auth Browser Smoke Tests',
    category: 'auth',
    stage: 'core',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Verified end-to-end browser evidence for sign-up, sign-in, and OAuth on the deployed web app',
    requiredEnv: [
      'AUTH_SMOKE_EMAIL_PASSWORD_SIGNUP_AT',
      'AUTH_SMOKE_EMAIL_PASSWORD_LOGIN_AT',
      'AUTH_SMOKE_GOOGLE_OAUTH_AT',
      'AUTH_SMOKE_APPLE_OAUTH_AT',
      'AUTH_SMOKE_MICROSOFT_OAUTH_AT',
    ],
    productionRequired: true,
    releaseCheck: 'A real browser round-trip has been executed on the deployed release for email/password sign-up, email/password login, Google OAuth, Apple OAuth, and Microsoft OAuth using dedicated test identities.',
    rollback: 'Keep release blocked, disable the affected provider, or restore the last known-good auth configuration until browser smoke evidence is refreshed.',
  },
  {
    id: 'sentry',
    name: 'Sentry',
    category: 'observability',
    stage: 'core',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Runtime error monitoring and release diagnostics across web, API, and mobile',
    requiredEnv: ['SENTRY_DSN'],
    optionalEnv: ['NEXT_PUBLIC_SENTRY_DSN', 'EXPO_PUBLIC_SENTRY_DSN', 'SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT', 'SENTRY_ENVIRONMENT', 'SENTRY_RELEASE'],
    productionRequired: true,
    releaseCheck: 'Release creates traceable web/API/mobile errors in the correct Sentry projects without sensitive payloads.',
    rollback: 'Keep Sentry enabled during rollback; compare issue volume before and after reverting.',
  },
  {
    id: 'posthog',
    name: 'PostHog',
    category: 'observability',
    stage: 'supporting',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Product events, funnel diagnostics, activation and billing analytics',
    requiredEnv: ['POSTHOG_API_KEY'],
    optionalEnv: ['NEXT_PUBLIC_POSTHOG_KEY', 'POSTHOG_HOST', 'POSTHOG_PROJECT_ID'],
    releaseCheck: 'Server-side events arrive for auth, verification, billing, support, and provider flows.',
    rollback: 'Disable non-critical product capture if it causes request latency or privacy issues.',
  },
  {
    id: 'expo',
    name: 'Expo / EAS',
    category: 'mobile',
    stage: 'core',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Native iOS and Android builds, OTA updates, environment channels',
    requiredEnv: ['EXPO_PROJECT_ID', 'EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_WEB_URL', 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'],
    optionalEnv: ['EXPO_OWNER', 'EAS_BUILD_PROFILE', 'EXPO_UPDATE_CHANNEL', 'EXPO_PUBLIC_SENTRY_DSN'],
    productionRequired: true,
    releaseCheck: 'EAS preview and production builds install, sign in, reach API, and respect store payment rules.',
    rollback: 'Use EAS update rollback for JS-only issues or submit a patched binary for native/signing issues.',
  },
  {
    id: 'apple-app-store',
    name: 'iOS App Store',
    category: 'mobile',
    stage: 'supporting',
    environmentScope: ['production'],
    ownerSurface: 'Apple Developer Program and App Store Connect release',
    requiredEnv: ['APPLE_APP_IDENTIFIER'],
    optionalEnv: ['APPLE_TEAM_ID', 'APP_STORE_CONNECT_KEY_ID'],
    productionRequired: true,
    releaseCheck: 'Bundle ID, privacy nutrition labels, encryption export answers, screenshots, and payment policy are approved.',
    rollback: 'Pause phased release or submit expedited fix if Apple review allows.',
  },
  {
    id: 'google-play',
    name: 'Google Play Console',
    category: 'mobile',
    stage: 'supporting',
    environmentScope: ['production'],
    ownerSurface: 'Android signing, Play Store release, internal and production tracks',
    requiredEnv: ['GOOGLE_PLAY_PACKAGE_NAME'],
    optionalEnv: ['GOOGLE_PLAY_SERVICE_ACCOUNT_JSON'],
    productionRequired: true,
    releaseCheck: 'Package name, signing key, data safety, screenshots, and store payment policy are approved.',
    rollback: 'Halt staged rollout or promote a known-good artifact from a previous track.',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'telecom',
    stage: 'primary',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'SMS, MMS, voice, voicemail, WebRTC, and Verify',
    requiredEnv: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_VERIFY_SERVICE_SID'],
    optionalEnv: ['TWILIO_API_KEY', 'TWILIO_API_SECRET', 'TWILIO_DEFAULT_FROM', 'TWILIO_WEBHOOK_SECRET'],
    productionRequired: true,
    releaseCheck: 'OTP send/check, inbound SMS, status callbacks, inbound call, and voicemail callback are smoke-tested.',
    rollback: 'Disable affected route, fail over where available, and restore previous webhook URLs.',
  },
  {
    id: 'telnyx',
    name: 'Telnyx',
    category: 'telecom',
    stage: 'primary',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Conversation number infrastructure, messaging fallback, and global verification expansion',
    requiredEnv: ['TELNYX_API_KEY'],
    optionalEnv: ['TELNYX_MESSAGING_PROFILE_ID', 'TELNYX_CONNECTION_ID', 'TELNYX_WEBHOOK_SECRET'],
    releaseCheck: 'Number inventory, routed message fallback, and country/service route tests succeed with webhook events recorded.',
    rollback: 'Remove Telnyx from route selection while keeping Twilio and Tremil active.',
  },
  {
    id: 'tremil',
    name: 'Tremil',
    category: 'telecom',
    stage: 'fallback',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Economy SMS route and final verification fallback',
    requiredEnv: ['TREMIL_API_KEY'],
    optionalEnv: ['TREMIL_BASE_URL', 'TREMIL_SECRET', 'TREMIL_WEBHOOK_SECRET'],
    productionRequired: false,
    releaseCheck: 'Economy route is exercised in staging and provider health marks the route degraded when it fails.',
    rollback: 'Disable fallback route and keep provider health marked degraded until fixed.',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'api',
    stage: 'supporting',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'AI-assisted message classification and future private assistant features',
    requiredEnv: ['OPENAI_API_KEY'],
    optionalEnv: ['OPENAI_MODEL', 'AI_KILL_SWITCH'],
    disabledWhenEnvTrue: 'AI_KILL_SWITCH',
    releaseCheck: 'AI calls are server-side only, redacted in logs, and kill switch behavior is verified.',
    rollback: 'Set AI_KILL_SWITCH=true and keep core telecom flows running.',
  },
  {
    id: 'airalo',
    name: 'Airalo',
    category: 'connectivity',
    stage: 'primary',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'eSIM plans, order lifecycle, activation, usage webhooks',
    requiredEnv: ['AIRALO_CLIENT_ID', 'AIRALO_CLIENT_SECRET'],
    optionalEnv: ['AIRALO_BASE_URL', 'AIRALO_PLANS_PATH', 'AIRALO_ORDER_PATH', 'AIRALO_WEBHOOK_SECRET'],
    releaseCheck: 'Plan sync, order creation, and webhook signature handling are verified in provider sandbox or test account.',
    rollback: 'Hide eSIM purchase CTAs and keep active eSIM management read-only.',
  },
  {
    id: 'oxylabs',
    name: 'Oxylabs',
    category: 'connectivity',
    stage: 'primary',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Residential/mobile proxy plans, credentials, region control',
    requiredEnv: ['OXYLABS_USERNAME', 'OXYLABS_PASSWORD'],
    optionalEnv: ['OXYLABS_BASE_URL', 'OXYLABS_PROXY_ORDER_PATH', 'OXYLABS_WEBHOOK_SECRET'],
    releaseCheck: 'Proxy order, credential masking, region selection, and webhook ingestion are verified.',
    rollback: 'Disable new proxy purchases and preserve existing credentials for active users.',
  },
  {
    id: 'smartproxy',
    name: 'Smartproxy',
    category: 'connectivity',
    stage: 'fallback',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Proxy fulfillment fallback and region continuity',
    requiredEnv: ['SMARTPROXY_API_KEY'],
    optionalEnv: ['SMARTPROXY_BASE_URL', 'SMARTPROXY_PROXY_ORDER_PATH', 'SMARTPROXY_WEBHOOK_SECRET'],
    releaseCheck: 'Fallback proxy ordering is verified when Oxylabs is unavailable or explicitly bypassed.',
    rollback: 'Disable Smartproxy fallback and preserve existing Oxylabs-backed credentials.',
  },
  {
    id: 'wireguard',
    name: 'WireGuard',
    category: 'privacy',
    stage: 'primary',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'In-platform VPN control plane, server selection, session lifecycle',
    requiredEnv: ['WIREGUARD_PRIVATE_KEY', 'WIREGUARD_ENDPOINT'],
    optionalEnv: ['WIREGUARD_CONTROL_BASE_URL', 'WIREGUARD_CONTROL_API_KEY', 'WIREGUARD_WEBHOOK_SECRET'],
    releaseCheck: 'Server health, device config lifecycle, session start/stop, and key rotation are verified.',
    rollback: 'Disable VPN toggle and keep existing sessions expiring naturally.',
  },
  {
    id: 'paystack',
    name: 'Paystack',
    category: 'payments',
    stage: 'primary',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Primary Nigerian/local card and transfer checkout',
    requiredEnv: ['PAYSTACK_SECRET_KEY'],
    optionalEnv: ['PAYSTACK_WEBHOOK_SECRET', 'PAYSTACK_PUBLIC_KEY', 'PAYMENT_USD_TO_NGN_RATE'],
    productionRequired: true,
    releaseCheck: 'Checkout initialization, webhook verification, ledger crediting, and reconciliation are tested.',
    rollback: 'Disable Paystack checkout route and keep Paddle/NOWPayments available where policy allows.',
  },
  {
    id: 'paddle',
    name: 'Paddle',
    category: 'payments',
    stage: 'primary',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'International card checkout and monthly subscriptions',
    requiredEnv: ['PADDLE_API_KEY', 'PADDLE_WEBHOOK_SECRET'],
    optionalEnv: ['PADDLE_CLIENT_TOKEN', 'PADDLE_PRICE_VERIFICATION', 'PADDLE_PRICE_RENTAL', 'PADDLE_PRICE_SUB_MONTHLY'],
    productionRequired: true,
    releaseCheck: 'One-time and subscription webhooks reconcile with ledger state without frontend secret exposure.',
    rollback: 'Pause Paddle products or switch checkout routing while keeping entitlement reconciliation intact.',
  },
  {
    id: 'nowpayments',
    name: 'NOWPayments',
    category: 'payments',
    stage: 'primary',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Crypto checkout and IPN confirmation',
    requiredEnv: ['NOWPAYMENTS_API_KEY', 'NOWPAYMENTS_IPN_SECRET'],
    productionRequired: true,
    releaseCheck: 'Invoice creation, IPN verification, pending/confirmed/expired states, and ledger idempotency are verified.',
    rollback: 'Disable crypto checkout while preserving pending invoice status checks.',
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    category: 'payments',
    stage: 'secondary',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Secondary gateway after core revenue stabilizes',
    requiredEnv: ['FLUTTERWAVE_SECRET_KEY'],
    optionalEnv: ['FLUTTERWAVE_WEBHOOK_HASH'],
    deferredUnlessEnv: 'SECONDARY_GATEWAYS_ENABLED',
    releaseCheck: 'Only enabled after Paystack, Paddle, and NOWPayments are stable.',
    rollback: 'Set SECONDARY_GATEWAYS_ENABLED=false.',
  },
  {
    id: 'squad',
    name: 'Squad by GTCO',
    category: 'payments',
    stage: 'secondary',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Secondary gateway after core revenue stabilizes',
    requiredEnv: ['SQUAD_SECRET_KEY'],
    optionalEnv: ['SQUAD_WEBHOOK_SECRET'],
    deferredUnlessEnv: 'SECONDARY_GATEWAYS_ENABLED',
    releaseCheck: 'Only enabled after core gateway reconciliation is stable.',
    rollback: 'Set SECONDARY_GATEWAYS_ENABLED=false.',
  },
  {
    id: 'korapay',
    name: 'Korapay',
    category: 'payments',
    stage: 'secondary',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Secondary gateway after core revenue stabilizes',
    requiredEnv: ['KORAPAY_SECRET_KEY'],
    optionalEnv: ['KORAPAY_WEBHOOK_SECRET'],
    deferredUnlessEnv: 'SECONDARY_GATEWAYS_ENABLED',
    releaseCheck: 'Only enabled after core gateway reconciliation is stable.',
    rollback: 'Set SECONDARY_GATEWAYS_ENABLED=false.',
  },
  {
    id: 'opay',
    name: 'OPay',
    category: 'payments',
    stage: 'secondary',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Secondary wallet/USSD gateway after core revenue stabilizes',
    requiredEnv: ['OPAY_MERCHANT_ID', 'OPAY_SECRET_KEY'],
    optionalEnv: ['OPAY_WEBHOOK_SECRET'],
    deferredUnlessEnv: 'SECONDARY_GATEWAYS_ENABLED',
    releaseCheck: 'Only enabled after core gateway reconciliation is stable.',
    rollback: 'Set SECONDARY_GATEWAYS_ENABLED=false.',
  },
  {
    id: 'resend',
    name: 'Resend',
    category: 'email',
    stage: 'supporting',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Transactional email for auth, payment, support, and notification flows',
    requiredEnv: ['RESEND_API_KEY'],
    optionalEnv: ['SMTP_HOST', 'SMTP_PASS', 'SMTP_FROM', 'EMAIL_FROM'],
    productionRequired: true,
    releaseCheck: 'Domain verification, SPF/DKIM, and transactional template smoke tests pass.',
    rollback: 'Switch to SMTP fallback or temporarily suppress non-critical notifications.',
  },
  {
    id: 's3',
    name: 'S3-compatible object storage',
    category: 'storage',
    stage: 'planned',
    environmentScope: ['staging', 'production'],
    ownerSurface: 'Private MMS media, voicemail, support attachments, exports, and sensitive uploads',
    requiredEnv: ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'],
    optionalEnv: ['S3_ENDPOINT', 'S3_REGION'],
    releaseCheck: 'Signed upload/download URLs are private, short-lived, content-type limited, and audit logged.',
    rollback: 'Disable new uploads while preserving read access to already issued private objects.',
  },
  {
    id: 'dbeaver',
    name: 'DBeaver',
    category: 'operator-tooling',
    stage: 'supporting',
    environmentScope: ['development', 'staging', 'production'],
    ownerSurface: 'Manual Neon inspection by trusted operators',
    requiredEnv: ['DATABASE_CLIENT'],
    releaseCheck: 'Production access is read-mostly, audited by account ownership, and never shared through screenshots/logs.',
    rollback: 'Revoke database credentials and rotate Neon connection strings.',
  },
];

export const DEPLOYMENT_ENVIRONMENTS: DeploymentEnvironmentDefinition[] = [
  {
    id: 'development',
    purpose: 'Local feature work with disposable credentials and local ports.',
    branchPolicy: 'Any local branch; never commit .env or provider secrets.',
    secretStores: ['ignored .env', 'ignored .env.local'],
    publicEnv: ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_APP_URL', 'EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_WEB_URL'],
    serverEnv: ['DATABASE_URL', 'REDIS_URL', 'CLERK_SECRET_KEY', 'TWILIO_* sandbox/test values'],
    deployTargets: ['local Next.js', 'local NestJS', 'Expo Go/development build'],
    releaseRule: 'No production traffic or real user data.',
  },
  {
    id: 'staging',
    purpose: 'Production-like verification with isolated data and provider sandbox/test keys where available.',
    branchPolicy: 'Preview branch or release candidate branch after CI passes.',
    secretStores: ['Vercel Preview env', 'Railway staging env', 'EAS preview env', 'Clerk test instance', 'Sentry staging projects'],
    publicEnv: ['NEXT_PUBLIC_* preview values', 'EXPO_PUBLIC_* preview values'],
    serverEnv: ['DATABASE_URL staging branch', 'REDIS_URL staging', 'provider sandbox/test keys', 'webhook signing secrets'],
    deployTargets: ['Vercel preview', 'Railway staging service', 'EAS preview/internal builds'],
    releaseRule: 'All release gates must pass before promoting the same commit to production.',
  },
  {
    id: 'production',
    purpose: 'Live Burner Point customer traffic, billing, telecom, and store releases.',
    branchPolicy: 'Protected main branch, reviewed PRs, CI required, release notes required.',
    secretStores: ['Vercel Production env', 'Railway production env', 'EAS production env', 'Clerk production instance', 'provider dashboards'],
    publicEnv: ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'EXPO_PUBLIC_* production values'],
    serverEnv: ['DATABASE_URL production', 'payment secrets', 'telecom secrets', 'webhook secrets', 'S3 secrets', 'SENTRY_DSN'],
    deployTargets: ['Vercel production', 'Railway production service', 'EAS production builds', 'App Store', 'Google Play'],
    releaseRule: 'Deploy only after staging smoke tests, migration review, observability checks, and rollback path are ready.',
  },
];

export const RELEASE_GATES: ReleaseGateDefinition[] = [
  {
    id: 'secret-scan',
    phase: 'security',
    required: true,
    check: 'No high-confidence secrets are committed or bundled.',
    command: 'npm run security:scan',
  },
  {
    id: 'api-build',
    phase: 'api',
    required: true,
    check: 'NestJS API compiles with deployment readiness, security, payments, telecom, and webhook modules.',
    command: 'npm run build --prefix apps/api',
  },
  {
    id: 'web-build',
    phase: 'web',
    required: true,
    check: 'Next.js production build compiles public, auth, dashboard, SEO, and social image routes.',
    command: 'npm run build --prefix apps/web',
  },
  {
    id: 'mobile-typecheck',
    phase: 'mobile',
    required: true,
    check: 'Expo app TypeScript compiles before EAS preview or production builds.',
    command: 'cd apps/mobile && npx tsc --noEmit',
  },
  {
    id: 'database-migrations',
    phase: 'data',
    required: true,
    check: 'Neon migrations are reviewed, applied to staging first, and do not require destructive rollback.',
  },
  {
    id: 'webhook-smoke-test',
    phase: 'api',
    required: true,
    check: 'Twilio, payment, Clerk, and provider webhook URLs use the deployed Railway API and verify signatures where secrets exist.',
  },
  {
    id: 'auth-browser-smoke',
    phase: 'web',
    required: true,
    check: 'A live browser round-trip has been executed for email/password sign-up, email/password login, Google OAuth, Apple OAuth, and Microsoft OAuth on the deployed release with dedicated test identities.',
  },
  {
    id: 'payment-reconciliation',
    phase: 'business',
    required: true,
    check: 'Paystack, Paddle, and NOWPayments webhooks are idempotent and ledger updates reconcile.',
  },
  {
    id: 'observability-online',
    phase: 'monitoring',
    required: true,
    check: 'Sentry, PostHog, Railway logs, Vercel logs, and provider dashboards are available during release.',
  },
  {
    id: 'store-policy',
    phase: 'mobile',
    required: true,
    check: 'iOS and Android builds respect Apple/Google billing policy for digital goods and subscriptions.',
  },
];

export const OBSERVABILITY_CHECKS: ObservabilityCheckDefinition[] = [
  {
    id: 'api-health',
    surface: 'api',
    signal: 'Railway /health returns 200 and API logs include deployment version, environment, and fatal bootstrap errors.',
    requiredEnv: ['RAILWAY_ENVIRONMENT'],
    alertOwner: 'backend',
    releaseBlocker: true,
  },
  {
    id: 'sentry-errors',
    surface: 'api',
    signal: 'Sentry captures API exceptions, web runtime errors, and mobile crashes in separate projects or tagged releases.',
    requiredEnv: ['SENTRY_DSN'],
    alertOwner: 'engineering',
    releaseBlocker: true,
  },
  {
    id: 'posthog-funnels',
    surface: 'web',
    signal: 'PostHog receives server-side product events for onboarding, verification, checkout, and support flows.',
    requiredEnv: ['POSTHOG_API_KEY'],
    alertOwner: 'product',
    releaseBlocker: false,
  },
  {
    id: 'provider-health',
    surface: 'provider',
    signal: 'Twilio, Telnyx, Tremil, Airalo, Oxylabs, Smartproxy, and WireGuard health/degraded states are visible to operators.',
    requiredEnv: ['REDIS_URL'],
    alertOwner: 'operations',
    releaseBlocker: true,
  },
  {
    id: 'database-connectivity',
    surface: 'database',
    signal: 'Neon connection pool is stable; migrations, RLS policies, and audit tables are present.',
    requiredEnv: ['DATABASE_URL'],
    alertOwner: 'backend',
    releaseBlocker: true,
  },
  {
    id: 'payment-webhooks',
    surface: 'payments',
    signal: 'Gateway webhook delivery, signature failures, idempotency skips, and ledger mismatches are observable.',
    requiredEnv: ['PAYSTACK_SECRET_KEY', 'PADDLE_WEBHOOK_SECRET', 'NOWPAYMENTS_IPN_SECRET'],
    alertOwner: 'billing',
    releaseBlocker: true,
  },
];

export const COMMIT_STRUCTURE = [
  'feat(web): public page, dashboard, auth, SEO, and conversion work',
  'feat(api): provider, billing, webhook, auth, platform, and readiness work',
  'feat(mobile): Expo app screens, navigation, auth, secure storage, and native UX',
  'fix(security): validation, rate limits, CORS, uploads, secrets, and audit corrections',
  'docs(deploy): runbooks, environment separation, launch checklists, and store notes',
  'chore(ci): build gates, dependency updates, release metadata, and deployment configuration',
];
