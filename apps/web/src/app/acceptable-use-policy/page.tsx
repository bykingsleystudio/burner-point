import { MarketingPage } from '@/components/marketing';
import { buildMarketingMetadata, pageStructuredData } from '@/lib/seo';

const page = {
  slug: 'acceptable-use-policy',
  eyebrow: 'Legal',
  title: 'Acceptable Use Policy.',
  description:
    'Burner Point is built for privacy, communication, access, and control. It is not intended for abuse, fraud, or unlawful activity.',
  primaryCta: { label: 'Read Terms of Service', href: '/terms-of-service' },
  secondaryCta: { label: 'Privacy Policy', href: '/privacy-policy' },
  sections: [
    {
      meta: 'Allowed',
      title: 'Use Burner Point for lawful privacy and communication.',
      text: 'Use Burner Point for private communication, supported verification, rentals, travel connectivity, proxies, and secure access only where you are authorized to do so.',
      items: ['Lawful account creation and recovery', 'Business, travel, research, testing, and personal privacy use cases', 'Approved proxy and secure access usage'],
    },
    {
      meta: 'Not Allowed',
      title: 'Do not use Burner Point for abuse or deception.',
      text: 'Accounts may be restricted or removed when activity creates fraud, spam, harassment, platform abuse, or provider risk.',
      items: ['Fraud, phishing, impersonation, or scams', 'Spam, harassment, or unsolicited messaging', 'Credential attacks, malware, or unauthorized access', 'Any activity that violates applicable law or third-party terms'],
    },
  ],
} as const;

export const metadata = buildMarketingMetadata(page, '/acceptable-use-policy');

export default function AcceptableUsePolicyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageStructuredData(page, '/acceptable-use-policy')) }}
      />
      <MarketingPage page={page} />
    </>
  );
}
