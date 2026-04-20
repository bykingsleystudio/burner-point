import { MarketingPage } from '@/components/marketing';
import { marketingPages } from '@/lib/marketing-data';
import { buildMarketingMetadata, pageStructuredData } from '@/lib/seo';

const page = { ...marketingPages.help, slug: 'help-center' };

export const metadata = buildMarketingMetadata(page, '/help-center');

export default function HelpCenterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageStructuredData(page, '/help-center')) }}
      />
      <MarketingPage page={page} />
    </>
  );
}
