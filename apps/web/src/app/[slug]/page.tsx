import { notFound } from 'next/navigation';
import { MarketingPage } from '@/components/marketing';
import { getMarketingPage, marketingPages } from '@/lib/marketing-data';
import { buildMarketingMetadata, pageStructuredData } from '@/lib/seo';

type PublicPageParams = Promise<{ slug: string }>;

export function generateStaticParams() {
  return Object.keys(marketingPages)
    .filter((slug) => slug !== 'api' && slug !== 'api-docs')
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: PublicPageParams }) {
  const { slug } = await params;
  const page = getMarketingPage(slug);
  if (!page) return {};
  return buildMarketingMetadata(page);
}

export default async function PublicPage({ params }: { params: PublicPageParams }) {
  const { slug } = await params;
  const page = getMarketingPage(slug);
  if (!page || page.slug === 'api' || page.slug === 'api-docs') notFound();
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageStructuredData(page)) }}
      />
      <MarketingPage page={page} />
    </>
  );
}
