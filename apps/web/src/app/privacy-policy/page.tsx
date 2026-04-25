import { LegalDocumentPage } from '@/components/legal-document';
import { getLegalDocument } from '@/lib/legal-documents';
import { buildMetadata } from '@/lib/seo';

const document = getLegalDocument('privacy-policy');

export const metadata = buildMetadata({
  route: '/privacy-policy',
  title: document.title,
  description: 'Burner Point Privacy Policy effective April 23, 2026.',
});

export default function PrivacyPolicyPage() {
  return <LegalDocumentPage document={document} canonicalPath="/privacy-policy" />;
}
