import { notFound } from 'next/navigation';
import { MarketingPage } from '@/components/marketing';
import { buildMarketingMetadata, pageStructuredData } from '@/lib/seo';
import { getProductPage } from '@/lib/product-pages';

type ProductPageParams = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: ProductPageParams }) {
  const { slug } = await params;
  const page = getProductPage(slug);
  if (!page) return {};
  return buildMarketingMetadata(page, `/products/${slug}`);
}

export default async function ProductPage({ params }: { params: ProductPageParams }) {
  const { slug } = await params;
  const page = getProductPage(slug);
  if (!page) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageStructuredData(page, `/products/${slug}`)) }}
      />
      <MarketingPage page={page} />
    </>
  );
}
