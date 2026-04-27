import type { MetadataRoute } from 'next';
import { absoluteUrl, siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/auth',
          '/auth/',
          '/sign-in',
          '/sign-up',
          '/forgot-password',
          '/verify-phone',
          '/onboarding',
          '/sso-callback',
          '/test',
          '/api/internal',
          '/monitoring',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard', '/auth', '/sign-in', '/sign-up', '/forgot-password', '/verify-phone', '/onboarding', '/sso-callback', '/test', '/api/internal'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/dashboard', '/auth', '/sign-in', '/sign-up', '/forgot-password', '/verify-phone', '/onboarding', '/sso-callback', '/test', '/api/internal'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: siteUrl,
  };
}
