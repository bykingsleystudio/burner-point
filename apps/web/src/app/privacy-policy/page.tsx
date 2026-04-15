import { MarketingPage } from '@/components/marketing';
import { marketingPages } from '@/lib/marketing-data';

export const metadata = {
  title: 'Privacy Policy | Burner Point',
  description: marketingPages.privacy.description,
  alternates: { canonical: '/privacy-policy' },
};

export default function PrivacyPolicyPage() {
  return <MarketingPage page={{ ...marketingPages.privacy, slug: 'privacy-policy' }} />;
}
