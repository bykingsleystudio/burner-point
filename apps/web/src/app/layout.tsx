import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { Space_Grotesk, DM_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
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

export const metadata: Metadata = {
  metadataBase: new URL('https://burnerpoint.vercel.app'),
  title: 'Burner Point - Private by Design',
  description: 'Privacy-first phone numbers, verifications, rentals, and communication tools.',
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
    description: 'Private phone numbers, OTP verification, rentals, and secure communication infrastructure.',
    url: 'https://burnerpoint.vercel.app',
    siteName: 'Burner Point',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Burner Point - Private by Design',
    description: 'Stay anonymous and connected with private numbers, OTP verification, rentals, and secure communication tools.',
  },
};

export const viewport: Viewport = {
  themeColor: '#013220',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmMono.variable}`}>
      <body className="min-h-screen bg-brand-black font-sans antialiased text-white">
        <ClerkProvider>
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
