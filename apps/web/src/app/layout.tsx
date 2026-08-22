import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Burner Point | Private telecom, one calm workspace',
  description: 'Messaging, verification, rentals, eSIM, proxy, and VPN services in one private workspace.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
