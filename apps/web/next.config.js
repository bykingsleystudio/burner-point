const { withSentryConfig } = require('@sentry/nextjs');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep file tracing rooted at the monorepo so Vercel can package App Router routes correctly.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: ['@burner-point/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      [
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        'https://*.sentry.io',
        'https://js.sentry-cdn.com',
        'https://app.posthog.com',
        'https://*.posthog.com',
        'https://prod.spline.design',
        'https://cdn.paddle.com',
      ].join(' '),
      [
        "connect-src 'self' https: wss:",
        'https://*.sentry.io',
        'https://app.posthog.com',
        'https://*.posthog.com',
        'https://prod.spline.design',
        'https://*.supabase.co',
      ].join(' '),
      [
        "frame-src 'self'",
        'https://checkout.paddle.com',
        'https://*.paddle.com',
      ].join(' '),
      "form-action 'self'",
      'upgrade-insecure-requests',
    ].join('; ');

    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
      { key: 'Content-Security-Policy', value: csp },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/dashboard/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        source: '/auth/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        source: '/sign-in',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        source: '/sign-up',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        source: '/forgot-password',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        source: '/verify-phone',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        source: '/onboarding',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        source: '/sso-callback',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
    ];
  },
}

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
})
