import type { MetadataRoute } from 'next';

const baseUrl = 'https://burnerpoint.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/onboarding', '/sso-callback', '/test', '/api/internal'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
