import { LegalDocumentPage } from '@/components/legal-document';
import { getLegalDocument } from '@/lib/legal-documents';
import { buildMetadata } from '@/lib/seo';

const document = getLegalDocument('terms-of-service');

export const metadata = buildMetadata({
  route: '/terms-of-service',
  title: document.title,
  description: 'Burner Point Terms of Service effective April 23, 2026.',
});

export default function TermsOfServicePage() {
  return <LegalDocumentPage document={document} canonicalPath="/terms-of-service" />;
}
