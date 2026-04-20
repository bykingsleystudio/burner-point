import { MarketingPage } from '@/components/marketing';
import { getMarketingPage } from '@/lib/marketing-data';
import { buildMarketingMetadata, pageStructuredData } from '@/lib/seo';

const page = getMarketingPage('api-docs')!;

export const metadata = buildMarketingMetadata(page, '/api/docs');

export default function ApiDocsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageStructuredData(page, '/api/docs')) }}
      />
      <MarketingPage page={page} />
    </>
  );
}
