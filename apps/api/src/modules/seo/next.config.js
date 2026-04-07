/**
 * apps/web/next.config.js
 *
 * Production-grade Next.js configuration:
 * - Security headers
 * - CORS configuration
 * - Image domain allowlist
 * - Redirect HTTP → HTTPS
 */

const isProduction = process.env.NODE_ENV === 'production';
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,             // Remove X-Powered-By: Next.js header
  transpilePackages: ['@burner-point/shared'],

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    // SAFE to expose — this is the Paddle client token (NOT the API key)
    // The API key lives in apps/api only and is never bundled here
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    NEXT_PUBLIC_PADDLE_SANDBOX: process.env.NEXT_PUBLIC_PADDLE_SANDBOX,
  },

  // ── Security headers ──────────────────────────────────────────────────────
  async headers() {
    const headers = [
      // Content Security Policy
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.paddle.com https://www.googletagmanager.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          `img-src 'self' data: https: blob:`,
          `connect-src 'self' ${apiUrl} wss: https://api.paddle.com https://sandbox-api.paddle.com`,
          "frame-src https://checkout.paddle.com https://sandbox-checkout.paddle.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          isProduction ? 'upgrade-insecure-requests' : '',
        ]
          .filter(Boolean)
          .join('; '),
      },
      // HTTP Strict Transport Security (HSTS)
      ...(isProduction
        ? [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=63072000; includeSubDomains; preload',
            },
          ]
        : []),
      // Frame embedding (prevent clickjacking)
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      // Content type sniffing protection
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Referrer policy (don't leak URL to third parties)
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Permissions policy (disable unused browser features)
      {
        key: 'Permissions-Policy',
        value: [
          'camera=()',
          'microphone=(self)',   // Allow microphone for calls
          'geolocation=()',
          'payment=()',
          'usb=()',
          'accelerometer=()',
          'gyroscope=()',
        ].join(', '),
      },
      // Cross-origin policies
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
      { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
    ];

    return [
      {
        source: '/(.*)',
        headers,
      },
      // Cache static assets aggressively
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Cache SVG assets
      {
        source: '/assets/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ];
  },

  // ── HTTP → HTTPS redirect ─────────────────────────────────────────────────
  async redirects() {
    if (!isProduction) return [];
    return [
      {
        source: '/(.*)',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://burnerpoint.app/:path*',
        permanent: true,
      },
    ];
  },

  // ── Image allowlist ───────────────────────────────────────────────────────
  images: {
    domains: ['burnerpoint.app', 'localhost'],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ── Output ────────────────────────────────────────────────────────────────
  output: 'standalone', // For Docker deployments (Vercel handles this automatically)
};

module.exports = nextConfig;
