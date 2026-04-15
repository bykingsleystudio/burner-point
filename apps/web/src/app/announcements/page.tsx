import { MarketingPage } from '@/components/marketing';
import { marketingPages } from '@/lib/marketing-data';

export const metadata = {
  title: 'Announcements | Burner Point',
  description: marketingPages.updates.description,
  alternates: { canonical: '/announcements' },
};

export default function AnnouncementsPage() {
  return <MarketingPage page={{ ...marketingPages.updates, slug: 'announcements', eyebrow: 'Announcements' }} />;
}
