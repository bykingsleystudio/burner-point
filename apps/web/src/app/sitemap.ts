import type { MetadataRoute } from 'next';
import { marketingPages } from '@/lib/marketing-data';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://burnerpoint.vercel.app';

const routeForSlug = (slug: string) => {
  if (slug === 'api-docs') return '/api/docs';
  return `/${slug}`;
};

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes = [
    '/',
    '/announcements',
    '/help-center',
    '/privacy-policy',
    ...Object.keys(marketingPages).map(routeForSlug),
  ];

  return Array.from(new Set(publicRoutes)).map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : route === '/pricing' || route === '/verifications' ? 0.9 : 0.7,
  }));
}
