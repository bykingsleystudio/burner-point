import { notFound } from 'next/navigation';
import { MarketingPage } from '@/components/marketing';
import { getMarketingPage, marketingPages } from '@/lib/marketing-data';

export function generateStaticParams() {
  return Object.keys(marketingPages)
    .filter((slug) => slug !== 'api' && slug !== 'api-docs')
    .map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const page = getMarketingPage(params.slug);
  if (!page) return {};
  return {
    title: `${page.eyebrow} - Burner Point`,
    description: page.description,
  };
}

export default function PublicPage({ params }: { params: { slug: string } }) {
  const page = getMarketingPage(params.slug);
  if (!page || page.slug === 'api' || page.slug === 'api-docs') notFound();
  return <MarketingPage page={page} />;
}
