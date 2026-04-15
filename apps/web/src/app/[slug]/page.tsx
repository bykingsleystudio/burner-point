import { notFound } from 'next/navigation';
import { MarketingPage } from '@/components/marketing';
import { getMarketingPage, marketingPages } from '@/lib/marketing-data';

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
  return {
    title: `${page.title} | Burner Point`,
    description: page.description,
    alternates: {
      canonical: `/${slug}`,
    },
    openGraph: {
      title: `${page.title} | Burner Point`,
      description: page.description,
      url: `/${slug}`,
      siteName: 'Burner Point',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${page.title} | Burner Point`,
      description: page.description,
    },
  };
}

export default async function PublicPage({ params }: { params: PublicPageParams }) {
  const { slug } = await params;
  const page = getMarketingPage(slug);
  if (!page || page.slug === 'api' || page.slug === 'api-docs') notFound();
  return <MarketingPage page={page} />;
}
