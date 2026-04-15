import type { MetadataRoute } from 'next';
import { marketingPages } from '@/lib/marketing-data';

const baseUrl = 'https://burnerpoint.vercel.app';

const routeForSlug = (slug: string) => {
  if (slug === 'api-docs') return '/api/docs';
  return `/${slug}`;
};

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes = [
    '/',
    ...Object.keys(marketingPages).map(routeForSlug),
  ];

  return Array.from(new Set(publicRoutes)).map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : route === '/pricing' || route === '/verifications' ? 0.9 : 0.7,
  }));
}
