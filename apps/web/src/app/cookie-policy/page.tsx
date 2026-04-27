import { MarketingPage } from '@/components/marketing';
import { buildMarketingMetadata, pageStructuredData } from '@/lib/seo';

const page = {
  slug: 'cookie-policy',
  eyebrow: 'Legal',
  title: 'Cookie Policy.',
  description:
    'Burner Point uses cookies and similar technologies for login, preferences, security, and product analytics.',
  primaryCta: { label: 'Privacy Policy', href: '/privacy-policy' },
  secondaryCta: { label: 'Support', href: '/support' },
  sections: [
    {
      meta: 'Why',
      title: 'Cookies help keep Burner Point secure and usable.',
      text: 'They support sign-in, session continuity, security checks, saved preferences, and product measurement.',
    },
    {
      meta: 'Control',
      title: 'You can manage browser-level cookie settings.',
      text: 'Blocking some cookies may affect sign-in, onboarding, or dashboard behavior, especially on mobile browsers.',
    },
  ],
} as const;

export const metadata = buildMarketingMetadata(page, '/cookie-policy');

export default function CookiePolicyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageStructuredData(page, '/cookie-policy')) }}
      />
      <MarketingPage page={page} />
    </>
  );
}
