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
import { AuthSessionRouter } from '@/components/auth-session-router';
import { PostHogProvider } from '@/components/posthog-provider';
import { ThemeProvider } from '@/components/theme-provider';
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
    icon: [
      { url: '/assets/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/assets/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/assets/icon-192.png',
    apple: '/assets/icon-192.png',
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3F8F5' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <meta name="theme-color" content="#000000" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('burnerpoint-theme')||'system';var d=t==='system'?(!window.matchMedia('(prefers-color-scheme: dark)').matches?'light':'dark'):t;document.documentElement.dataset.theme=d}catch(e){document.documentElement.dataset.theme='dark'}})()`,
          }}
        />
        <ThemeProvider>
          <PostHogProvider>
            <AuthSessionRouter />
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
        </ThemeProvider>
      </body>
    </html>
  );
}
