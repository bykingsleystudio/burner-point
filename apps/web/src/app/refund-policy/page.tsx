import { MarketingPage } from '@/components/marketing';
import { buildMarketingMetadata, pageStructuredData } from '@/lib/seo';

const page = {
  slug: 'refund-policy',
  eyebrow: 'Legal',
  title: 'Refund Policy.',
  description:
    'Refund eligibility depends on the product, delivery state, and whether the service has already been provisioned to your account.',
  primaryCta: { label: 'Read Terms of Service', href: '/terms-of-service' },
  secondaryCta: { label: 'Contact Support', href: '/support' },
  sections: [
    {
      meta: 'Before Delivery',
      title: 'Orders that do not complete can be credited or reversed.',
      text: 'If a supported verification, payment, or order fails before the service is delivered, Burner Point may reverse the charge or return the balance according to the product rules.',
    },
    {
      meta: 'After Delivery',
      title: 'Provisioned products are generally non-refundable.',
      text: 'Once a number is assigned, an eSIM is issued, proxy credentials are delivered, or secure access is activated, refunds are usually not available unless required by law.',
    },
    {
      meta: 'Support',
      title: 'Open support with the right details.',
      text: 'If you need a review, include your account email, product, payment reference, timestamp, and screenshots when relevant.',
    },
  ],
} as const;

export const metadata = buildMarketingMetadata(page, '/refund-policy');

export default function RefundPolicyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageStructuredData(page, '/refund-policy')) }}
      />
      <MarketingPage page={page} />
    </>
  );
}
