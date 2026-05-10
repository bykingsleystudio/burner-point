/**
 * apps/web/src/app/layout.tsx
 *
 * Root layout with:
 * - Complete Open Graph meta tags
 * - Twitter Card meta
 * - JSON-LD structured data
 * - Canonical URLs
 * - Security headers via next.config.js
 */
import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, DM_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

// ─── Base metadata ────────────────────────────────────────────────────────────
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://burnerpoint.com';
const APP_NAME = 'BurnerPoint';
const DESCRIPTION =
  'Privacy-first temporary phone numbers. Get anonymous SMS, OTP verifications, and burner numbers instantly. Starting from $0.99.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Privacy-first Phone Numbers`,
    template: `%s | ${APP_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    'burner phone number',
    'temporary phone number',
    'anonymous SMS',
    'OTP verification',
    'disposable number',
    'privacy phone',
    'receive SMS online',
    'virtual phone number Nigeria',
  ],
  authors: [{ name: APP_NAME, url: APP_URL }],
  creator: APP_NAME,
  publisher: APP_NAME,
  category: 'Communication',

  // ── Open Graph (og:) ── controls how links look when shared ─────────────────
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Privacy is not a feature. It is the foundation.`,
    description: DESCRIPTION,
    images: [
      {
        url: `${APP_URL}/og-image.png`, // 1200×630px
        width: 1200,
        height: 630,
        alt: 'BurnerPoint — Private Phone Numbers',
        type: 'image/png',
      },
    ],
  },

  // ── Twitter Card ───────────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    site: '@BurnerPoint',
    creator: '@BurnerPoint',
    title: `${APP_NAME} — Private Phone Numbers`,
    description: DESCRIPTION,
    images: [`${APP_URL}/og-image.png`],
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/assets/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/assets/logo-mark.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },

  // ── App manifest ─────────────────────────────────────────────────────────
  manifest: '/manifest.json',

  // ── Robots ───────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Alternate links ───────────────────────────────────────────────────────
  alternates: {
    canonical: APP_URL,
    languages: { 'en-US': APP_URL },
  },

  // ── App-specific meta ─────────────────────────────────────────────────────
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false, // Prevent auto-linking phone numbers as tel: links
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0A0A0A',
  colorScheme: 'dark',
};

// ─── JSON-LD structured data component ───────────────────────────────────────
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: APP_NAME,
  description: DESCRIPTION,
  url: APP_URL,
  applicationCategory: 'CommunicationApplication',
  operatingSystem: 'iOS, Android, Web',
  offers: {
    '@type': 'Offer',
    price: '0.99',
    priceCurrency: 'USD',
    description: 'Pay-per-use verification from $0.99',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to external resources for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* JSON-LD Structured Data */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-brand-black text-white font-sans antialiased min-h-screen">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1A1A1A',
              color: '#fff',
              border: '1px solid #2A2A2A',
            },
            success: {
              iconTheme: { primary: '#00FF9D', secondary: '#0A0A0A' },
            },
          }}
        />
      </body>
    </html>
  );
}
