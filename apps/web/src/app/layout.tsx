import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { Space_Grotesk, DM_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://burnerpoint.vercel.app';

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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Burner Point - Private by Design',
  description: 'Privacy-first phone numbers, OTP verification, rentals, eSIM, proxies, and secure communication tools.',
  applicationName: 'Burner Point',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/assets/logo-mark.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Burner Point - Private by Design',
    description: 'Private phone numbers, OTP verification, rentals, eSIM, proxies, and secure communication infrastructure.',
    url: siteUrl,
    siteName: 'Burner Point',
    type: 'website',
    images: [{ url: '/assets/logo.svg', width: 1200, height: 630, alt: 'Burner Point' }],
  },
  twitter: {
    card: 'summary',
    title: 'Burner Point - Private by Design',
    description: 'Stay anonymous and connected with private numbers, OTP verification, rentals, and secure communication tools.',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Burner Point',
  url: siteUrl,
  logo: `${siteUrl}/assets/logo.svg`,
  sameAs: [
    'https://www.instagram.com/burnerpoint.app',
    'https://www.facebook.com/burnerpoint.app',
    'https://www.linkedin.com/company/burnerpointapp',
    'https://www.tiktok.com/@burnerpointapp',
    'https://x.com/burnerpointapp',
    'https://t.me/burnerpointapp',
    'https://www.youtube.com/@burnerpointapp',
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      email: 'info.burnerpoint@gmail.com',
      contactType: 'customer support',
      url: `${siteUrl}/contact`,
    },
  ],
};

export const viewport: Viewport = {
  themeColor: '#013220',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmMono.variable}`}>
      <body className="min-h-screen bg-brand-black font-sans antialiased text-white">
        <ClerkProvider>
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
          />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1A1A1A', color: '#fff', border: '1px solid #2A2A2A' },
              success: { iconTheme: { primary: '#00FF9D', secondary: '#0A0A0A' } },
            }}
          />
        </ClerkProvider>
      </body>
    </html>
  );
}
