import { MarketingPage } from '@/components/marketing';
import { getMarketingPage } from '@/lib/marketing-data';

export const metadata = {
  title: 'API - Burner Point',
  description: 'Developer API for Burner Point verification and communication workflows.',
};

export default function ApiPage() {
  return <MarketingPage page={getMarketingPage('api')!} />;
}
