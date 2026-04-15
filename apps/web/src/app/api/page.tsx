import { MarketingPage } from '@/components/marketing';
import { getMarketingPage } from '@/lib/marketing-data';

export const metadata = {
  title: 'Developer API | Burner Point',
  description: 'Developer API for Burner Point verification and communication workflows.',
  alternates: {
    canonical: '/api',
  },
  openGraph: {
    title: 'Developer API | Burner Point',
    description: 'Developer API for Burner Point verification and communication workflows.',
    url: '/api',
    siteName: 'Burner Point',
    type: 'website',
  },
};

export default function ApiPage() {
  return <MarketingPage page={getMarketingPage('api')!} />;
}
