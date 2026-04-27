import { MarketingPage } from '@/components/marketing';
import type { MarketingPageContent } from '@/lib/marketing-data';
import { buildMarketingMetadata, pageStructuredData } from '@/lib/seo';

const page: MarketingPageContent = {
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
      items: ['Sign in with email, phone, or a trusted sign-in provider', 'Your account opens directly into onboarding or the dashboard'],
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
      items: ['Your account stays protected behind secure sign-in', 'Phone verification stays simple during onboarding and account security updates'],
    },
  ],
};

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
