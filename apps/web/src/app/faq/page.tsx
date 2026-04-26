import { BurnerPointFaqPage } from '@/components/sections/bp-faq-page';
import { allFaqItems } from '@/lib/homepage-content';
import { buildMetadata, siteName, siteUrl } from '@/lib/seo';

export const metadata = buildMetadata({
  route: '/faq',
  title: 'Burner Point FAQ',
  description:
    'Answers about Burner Point products, verifications, rentals, wallet billing, eSIM, proxies, Secure Tunnel, and account support.',
});

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: allFaqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

const breadcrumbStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: siteName, item: siteUrl },
    { '@type': 'ListItem', position: 2, name: 'FAQ', item: `${siteUrl}/faq` },
  ],
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <BurnerPointFaqPage />
    </>
  );
}
