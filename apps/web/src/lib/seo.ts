import type { Metadata, MetadataRoute } from 'next';
import { marketingPages, socialLinks, type MarketingPageContent } from './marketing-data';

export const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://burnerpoint.app').replace(/\/+$/, '');
export const siteName = 'Burner Point';
export const siteTagline = 'Stay Anonymous. Stay Connected. Private By Design.';
export const siteDescription =
  'Privacy-first phone numbers, OTP verification, rentals, eSIM, proxies, and secure communication tools.';
export const supportUrl = `${siteUrl}/support`;
export const ogImagePath = '/opengraph-image';
export const ogImageUrl = `${siteUrl}${ogImagePath}`;

export const seoKeywords = [
  'Burner Point',
  'burner phone number',
  'non-VoIP phone number',
  'temporary phone number',
  'SMS OTP verification',
  'voice verification',
  'number rentals',
  'private communication',
  'eSIM connectivity',
  'privacy proxies',
  'secure tunnel privacy protection',
];

export type SeoPage = {
  route: string;
  title: string;
  description: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
  page?: MarketingPageContent;
};

export function routeForSlug(slug: string) {
  if (slug === 'api-docs') return '/api/docs';
  if (slug === 'overview') return '/';
  if (slug === 'verifications') return '/products/verify-hub';
  if (slug === 'rentals') return '/products/rentals';
  if (slug === 'esim') return '/products/esim-store';
  if (slug === 'proxies') return '/products/proxy-store';
  if (slug === 'security') return '/products/secure-tunnel';
  if (slug === 'help') return '/help-center';
  if (slug === 'terms') return '/terms-of-service';
  if (slug === 'privacy') return '/privacy-policy';
  return `/${slug}`;
}

export const publicSeoPages: SeoPage[] = [
  {
    route: '/',
    title: 'Private by Design. Stay Anonymous. Stay Connected.',
    description: 'Generate secure, non-VoIP numbers instantly and stay in control of your communication anytime, anywhere.',
    changeFrequency: 'weekly',
    priority: 1,
  },
  {
    route: '/faq',
    title: 'Burner Point FAQ',
    description: 'Answers about Burner Point products, verifications, rentals, wallet billing, eSIM, proxies, and Secure Tunnel.',
    changeFrequency: 'monthly',
    priority: 0.75,
  },
  {
    route: '/announcements',
    title: 'Announcements',
    description: marketingPages.updates.description,
    changeFrequency: 'weekly',
    priority: 0.6,
    page: marketingPages.updates,
  },
  {
    route: '/help-center',
    title: 'Help Center',
    description: marketingPages.help.description,
    changeFrequency: 'monthly',
    priority: 0.7,
    page: marketingPages.help,
  },
  {
    route: '/terms-of-service',
    title: 'Terms of Service',
    description: 'Burner Point Terms of Service effective April 23, 2026.',
    changeFrequency: 'yearly',
    priority: 0.4,
  },
  {
    route: '/privacy-policy',
    title: 'Privacy Policy',
    description: 'Burner Point Privacy Policy effective April 23, 2026.',
    changeFrequency: 'yearly',
    priority: 0.4,
  },
  ...Object.values(marketingPages)
    .filter((page) => page.slug !== 'api' && page.slug !== 'api-docs')
    .map((page) => ({
    route: routeForSlug(page.slug),
    title: page.title,
    description: page.description,
    changeFrequency: page.slug === 'blog' || page.slug === 'updates' ? 'weekly' as const : 'monthly' as const,
    priority: page.slug === 'pricing' || page.slug === 'verifications' || page.slug === 'rentals'
      ? 0.9
      : page.slug === 'blog'
        ? 0.8
        : 0.7,
    page,
  })),
];

export const uniquePublicSeoPages = Array.from(
  new Map(publicSeoPages.map((page) => [page.route, page])).values(),
).sort((a, b) => a.route.localeCompare(b.route));

export function absoluteUrl(path = '/') {
  if (path.startsWith('http')) return path;
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function pageTitle(title: string) {
  return title.includes(siteName) ? title : `${title} | ${siteName}`;
}

export function buildMetadata(page: Pick<SeoPage, 'route' | 'title' | 'description'>): Metadata {
  const title = pageTitle(page.title);
  const url = absoluteUrl(page.route);

  return {
    title,
    description: page.description,
    keywords: seoKeywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description: page.description,
      url,
      siteName,
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${siteName} - ${siteTagline}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: page.description,
      images: [ogImageUrl],
      creator: '@burnerpointapp',
      site: '@burnerpointapp',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}

export function buildMarketingMetadata(page: MarketingPageContent, route = routeForSlug(page.slug)) {
  return buildMetadata({
    route,
    title: page.title,
    description: page.description,
  });
}

export function noIndexMetadata(title: string, description: string): Metadata {
  return {
    title: pageTitle(title),
    description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export function baseStructuredData() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
      logo: `${siteUrl}/assets/logo.svg`,
      slogan: siteTagline,
      sameAs: socialLinks.map((link) => link.href),
      contactPoint: [
        {
          '@type': 'ContactPoint',
          email: 'info.burnerpoint@gmail.com',
          contactType: 'customer support',
          url: supportUrl,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: siteUrl,
      description: siteDescription,
      publisher: {
        '@type': 'Organization',
        name: siteName,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: siteName,
      applicationCategory: 'CommunicationApplication',
      operatingSystem: 'Web, iOS, Android',
      url: siteUrl,
      description: siteDescription,
      offers: [
        { '@type': 'Offer', price: '0.99', priceCurrency: 'USD', name: 'Verification' },
        { '@type': 'Offer', price: '5.99', priceCurrency: 'USD', name: 'Non-renewable rental' },
        { '@type': 'Offer', price: '15.99', priceCurrency: 'USD', name: 'Renewable monthly rental' },
      ],
      supportUrl,
    },
  ];
}

export function pageStructuredData(page: MarketingPageContent, route = routeForSlug(page.slug)) {
  const url = absoluteUrl(route);
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: page.title, item: url },
    ],
  };

  if (page.faqs?.length) {
    return [
      breadcrumb,
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ];
  }

  if (page.slug === 'blog') {
    return [
      breadcrumb,
      ...(page.sections || []).map((section) => ({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: section.title,
        description: section.text,
        url: `${url}${section.anchorId ? `#${section.anchorId}` : ''}`,
        author: {
          '@type': 'Organization',
          name: siteName,
        },
        publisher: {
          '@type': 'Organization',
          name: siteName,
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/assets/logo.svg`,
          },
        },
      })),
    ];
  }

  return [
    breadcrumb,
    {
      '@context': 'https://schema.org',
      '@type': page.slug === 'contact' || page.slug === 'support' ? 'ContactPage' : 'WebPage',
      name: page.title,
      description: page.description,
      url,
      isPartOf: {
        '@type': 'WebSite',
        name: siteName,
        url: siteUrl,
      },
    },
  ];
}

export const searchDiscoveryChecklist = [
  'Set NEXT_PUBLIC_APP_URL and WEB_URL to the production domain before launch.',
  'Add GOOGLE_SITE_VERIFICATION and BING_SITE_VERIFICATION in Vercel environment variables.',
  'Submit /sitemap.xml in Google Search Console.',
  'Submit /sitemap.xml in Bing Webmaster Tools.',
  'Set INDEXNOW_KEY on the API and expose /indexnow-key.txt on the web app.',
  'Run a production build and inspect Open Graph tags with a social preview debugger.',
  'Confirm robots.txt allows public pages and blocks dashboard, auth, onboarding, callbacks, and test pages.',
  'Confirm support URL, social profiles, legal pages, and canonical URLs resolve with 200 status.',
];
