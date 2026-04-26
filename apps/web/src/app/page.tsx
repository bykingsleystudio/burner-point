import { BurnerPointHomepage } from '@/components/sections/bp-homepage';
import { buildMetadata, siteName, siteTagline, siteUrl } from '@/lib/seo';

export const metadata = buildMetadata({
  route: '/',
  title: 'Private by Design. Stay Anonymous. Stay Connected.',
  description:
    'Need a number without giving out your real one? Burner Point gives you instant access to private numbers, messaging tools, verifications, rentals, eSIM data, and secure connectivity.',
});

const homeStructuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${siteName} - ${siteTagline}`,
    description:
      'Need a number without giving out your real one? Burner Point gives you instant access to private numbers, messaging tools, verifications, rentals, eSIM data, and secure connectivity.',
    url: siteUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: siteUrl,
    },
  },
  {
    '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Burner Point core products',
      itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'BP Messenger', url: `${siteUrl}/#bp-messenger` },
      { '@type': 'ListItem', position: 2, name: 'BP Verify Hub', url: `${siteUrl}/#bp-verify-hub` },
      { '@type': 'ListItem', position: 3, name: 'BP Rentals', url: `${siteUrl}/#bp-rentals` },
      { '@type': 'ListItem', position: 4, name: 'BP eSIM Store', url: `${siteUrl}/#bp-esim-store` },
      { '@type': 'ListItem', position: 5, name: 'BP Secure Tunnel', url: `${siteUrl}/#bp-secure-tunnel` },
      { '@type': 'ListItem', position: 6, name: 'BP Proxy Store', url: `${siteUrl}/#bp-proxy-store` },
    ],
  },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }}
      />
      <BurnerPointHomepage />
    </>
  );
}
