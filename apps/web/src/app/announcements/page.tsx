import { MarketingPage } from '@/components/marketing';
import { marketingPages } from '@/lib/marketing-data';
import { buildMarketingMetadata, pageStructuredData } from '@/lib/seo';

const page = { ...marketingPages.updates, slug: 'announcements', eyebrow: 'Announcements' };

export const metadata = buildMarketingMetadata(page, '/announcements');

export default function AnnouncementsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageStructuredData(page, '/announcements')) }}
      />
      <MarketingPage page={page} />
    </>
  );
}
