import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { BRAND } from '@/lib/brand';
import {
  baseStructuredData,
  buildMetadata,
  siteDescription,
  siteName,
  siteUrl,
} from '@/lib/seo';
import { PostHogProvider } from '@/components/posthog-provider';
import './globals.css';

const verification: NonNullable<Metadata['verification']> = {
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
  ...(process.env.BING_SITE_VERIFICATION ? { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } } : {}),
};

export const metadata: Metadata = {
  ...buildMetadata({
    route: '/',
    title: 'Private by Design. Stay Anonymous. Stay Connected.',
    description: siteDescription,
  }),
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} - Private by Design`,
    template: `%s | ${siteName}`,
  },
  applicationName: siteName,
  manifest: '/manifest.webmanifest',
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  category: 'Communication',
  verification,
  icons: {
    icon: [{ url: '/assets/logo-mark.svg', type: 'image/svg+xml' }],
    shortcut: '/assets/logo-mark.svg',
    apple: '/assets/logo-mark.svg',
  },
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: BRAND.colors.deepGreen,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-black font-sans antialiased text-white">
        <PostHogProvider>
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: JSON.stringify(baseStructuredData()) }}
          />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: BRAND.colors.surface,
                color: BRAND.colors.white,
                border: `1px solid ${BRAND.colors.border}`,
                borderRadius: BRAND.radii.md,
              },
              success: { iconTheme: { primary: BRAND.colors.cyberGreen, secondary: BRAND.colors.black } },
            }}
          />
        </PostHogProvider>
      </body>
    </html>
  );
}
