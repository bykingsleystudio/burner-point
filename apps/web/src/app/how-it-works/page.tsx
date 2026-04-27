import { MarketingPage } from '@/components/marketing';
import { buildMarketingMetadata, pageStructuredData } from '@/lib/seo';

const page = {
  slug: 'how-it-works',
  eyebrow: 'How It Works',
  title: 'Get started in minutes.',
  description:
    'Create your account, choose a Burner Point product, and manage everything from one privacy-first dashboard.',
  primaryCta: { label: 'Get Started', href: '/sign-up' },
  secondaryCta: { label: 'View Pricing', href: '/pricing' },
  highlights: ['Create your account', 'Choose the product you need', 'Manage everything from one place'],
  sections: [
    {
      meta: '01',
      title: 'Create your account',
      text: 'Sign up with your name, email, phone number, and password, or continue with Google, Apple, or Microsoft.',
      items: ['Clerk handles sign-in, sessions, OAuth, and account security', 'Your account opens directly into onboarding or the dashboard'],
    },
    {
      meta: '02',
      title: 'Choose a product',
      text: 'Use BP Messenger, Verify Hub, Rentals, eSIM Store, Proxy Store, or Secure Tunnel based on the task in front of you.',
      items: ['Product pages explain use cases, pricing, and availability', 'Dashboard modules stay grouped by product'],
    },
    {
      meta: '03',
      title: 'Stay private and in control',
      text: 'Manage numbers, codes, plans, billing, and support without exposing your personal number everywhere.',
      items: ['Protected routes require sign-in', 'Phone verification uses clean OTP flows during onboarding and security updates'],
    },
  ],
} as const;

export const metadata = buildMarketingMetadata(page, '/how-it-works');

export default function HowItWorksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageStructuredData(page, '/how-it-works')) }}
      />
      <MarketingPage page={page} />
    </>
  );
}
