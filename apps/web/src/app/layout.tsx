import type { Metadata } from 'next';
import type { ReactNode } from 'react';
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
  title: 'Burner Point - Private by Design',
  description: 'Privacy-first phone numbers, verifications, rentals, and communication tools.',
  themeColor: '#0A0A0A',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmMono.variable}`}>
      <body className="min-h-screen bg-brand-black font-sans antialiased text-white">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1A1A1A', color: '#fff', border: '1px solid #2A2A2A' },
            success: { iconTheme: { primary: '#00FF9D', secondary: '#0A0A0A' } },
          }}
        />
      </body>
    </html>
  );
}
