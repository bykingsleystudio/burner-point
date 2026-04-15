import { MarketingPage } from '@/components/marketing';
import { getMarketingPage } from '@/lib/marketing-data';

export const metadata = {
  title: 'API Docs | Burner Point',
  description: 'Burner Point API documentation for numbers, messages, verification, and payments.',
  alternates: {
    canonical: '/api/docs',
  },
  openGraph: {
    title: 'API Docs | Burner Point',
    description: 'Burner Point API documentation for numbers, messages, verification, and payments.',
    url: '/api/docs',
    siteName: 'Burner Point',
    type: 'website',
  },
};

export default function ApiDocsPage() {
  return <MarketingPage page={getMarketingPage('api-docs')!} />;
}
