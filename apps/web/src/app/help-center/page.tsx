import { MarketingPage } from '@/components/marketing';
import { marketingPages } from '@/lib/marketing-data';

export const metadata = {
  title: 'Help Center | Burner Point',
  description: marketingPages.help.description,
  alternates: { canonical: '/help-center' },
};

export default function HelpCenterPage() {
  return <MarketingPage page={{ ...marketingPages.help, slug: 'help-center' }} />;
}
