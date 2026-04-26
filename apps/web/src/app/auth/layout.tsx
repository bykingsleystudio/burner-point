import type { Metadata } from 'next';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = noIndexMetadata(
  'Account Access',
  'Sign in or create your Burner Point account.',
);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
