import { marketingPages, type MarketingPageContent } from './marketing-data';

export const productPages: Record<string, MarketingPageContent> = {
  messenger: {
    ...marketingPages.numbers,
    slug: 'messenger',
    eyebrow: 'BP Messenger Pro',
    title: "Your phone's other number.",
    description:
      'Call, text, and manage contacts with a private number built for separation between your real line and the rest of your online life.',
    primaryCta: { label: 'Get Started', href: '/sign-up' },
    secondaryCta: { label: 'View Pricing', href: '/pricing' },
    highlights: ['US, UK, and Canada numbers', 'Calls, texts, contacts, and voicemail', 'Private communication across web and mobile'],
  },
  'verify-hub': {
    ...marketingPages.verifications,
    slug: 'verify-hub',
    eyebrow: 'BP Verify Hub',
    primaryCta: { label: 'Get Started', href: '/sign-up' },
    secondaryCta: { label: 'View Pricing', href: '/pricing' },
  },
  rentals: {
    ...marketingPages.rentals,
    slug: 'rentals',
    eyebrow: 'BP Rental Hub',
    primaryCta: { label: 'Get Started', href: '/sign-up' },
    secondaryCta: { label: 'View Pricing', href: '/pricing' },
  },
  'esim-store': {
    ...marketingPages.esim,
    slug: 'esim-store',
    eyebrow: 'BP eSIM Store',
    title: 'Travel-ready data without swapping physical SIM cards.',
    primaryCta: { label: 'Get Started', href: '/sign-up' },
    secondaryCta: { label: 'View Pricing', href: '/pricing' },
  },
  'proxy-store': {
    ...marketingPages.proxies,
    slug: 'proxy-store',
    eyebrow: 'BP Proxy Store',
    title: 'Private routing for approved business and research workflows.',
    primaryCta: { label: 'Get Started', href: '/sign-up' },
    secondaryCta: { label: 'View Pricing', href: '/pricing' },
  },
  'secure-tunnel': {
    ...marketingPages.security,
    slug: 'secure-tunnel',
    eyebrow: 'BP Secure Tunnel VPN',
    title: 'Secure your connection with BP Secure Tunnel VPN.',
    description:
      'Protect your connection with secure access, location control, and dedicated IP options from the same Burner Point account.',
    primaryCta: { label: 'Get Started', href: '/sign-up' },
    secondaryCta: { label: 'View Pricing', href: '/pricing' },
  },
};

export function getProductPage(slug: string) {
  return productPages[slug];
}
