import { MarketingPage } from '@/components/marketing';
import { getMarketingPage } from '@/lib/marketing-data';

export const metadata = {
  title: 'API Docs - Burner Point',
  description: 'Burner Point API documentation for numbers, messages, verification, and payments.',
};

export default function ApiDocsPage() {
  return <MarketingPage page={getMarketingPage('api-docs')!} />;
}
