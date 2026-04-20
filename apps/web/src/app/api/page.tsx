import { MarketingPage } from '@/components/marketing';
import { getMarketingPage } from '@/lib/marketing-data';
import { buildMarketingMetadata, pageStructuredData } from '@/lib/seo';

const page = getMarketingPage('api')!;

export const metadata = buildMarketingMetadata(page, '/api');

export default function ApiPage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageStructuredData(page, '/api')) }}
      />
      <MarketingPage page={page} />
    </>
  );
}
