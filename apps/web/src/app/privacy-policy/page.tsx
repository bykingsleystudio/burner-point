import { MarketingPage } from '@/components/marketing';
import { marketingPages } from '@/lib/marketing-data';
import { buildMarketingMetadata, pageStructuredData } from '@/lib/seo';

const page = { ...marketingPages.privacy, slug: 'privacy-policy' };

export const metadata = buildMarketingMetadata(page, '/privacy-policy');

export default function PrivacyPolicyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageStructuredData(page, '/privacy-policy')) }}
      />
      <MarketingPage page={page} />
    </>
  );
}
