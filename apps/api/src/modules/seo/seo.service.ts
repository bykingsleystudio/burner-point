/**
 * apps/api/src/modules/seo/seo.service.ts
 *
 * Handles sitemap, robots.txt, structured data, and IndexNow pinging.
 * Registered as a module so it auto-loads on startup.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SeoService implements OnModuleInit {
  private readonly logger = new Logger(SeoService.name);
  private readonly publicRoutes = [
    '/',
    '/overview',
    '/verifications',
    '/rentals',
    '/numbers',
    '/api',
    '/api/docs',
    '/pricing',
    '/blog',
    '/updates',
    '/announcements',
    '/careers',
    '/faq',
    '/help',
    '/help-center',
    '/support',
    '/contact',
    '/about',
    '/terms',
    '/privacy',
    '/privacy-policy',
    '/esim',
    '/proxies',
    '/security',
  ];

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    // Only ping search engines in production
    if (this.config.get('NODE_ENV') === 'production') {
      await this.pingIndexNow().catch(() => {}); // non-critical
    }
  }

  getSitemap(): string {
    const base = this.config.get<string>('WEB_URL', 'https://burnerpoint.app').replace(/\/+$/, '');
    const now = new Date().toISOString().split('T')[0];

    const body = this.publicRoutes
      .map((route) => {
        const priority = route === '/' ? '1.0' : ['/pricing', '/verifications', '/rentals'].includes(route) ? '0.9' : '0.7';
        const changefreq = route === '/' || route === '/blog' || route === '/updates' || route === '/announcements'
          ? 'weekly'
          : 'monthly';
        return `  <url>
    <loc>${base}${route}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
  }

  getRobots(): string {
    const base = this.config.get<string>('WEB_URL', 'https://burnerpoint.app').replace(/\/+$/, '');
    return `# BurnerPoint robots.txt
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /auth/
Disallow: /onboarding
Disallow: /sso-callback
Disallow: /test

# Allow marketing bots full access
User-agent: Googlebot
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /auth/

User-agent: Bingbot
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /auth/

Sitemap: ${base}/sitemap.xml`;
  }

  /**
   * Returns JSON-LD structured data for the BurnerPoint app.
   * Embed in <script type="application/ld+json"> in the HTML <head>.
   */
  getStructuredData(): object {
    const base = this.config.get<string>('WEB_URL', 'https://burnerpoint.app').replace(/\/+$/, '');
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'BurnerPoint',
      description:
        'Privacy-first temporary phone numbers for anonymous SMS, OTP verification, and secure calling.',
      url: base,
      sameAs: [
        'https://www.instagram.com/burnerpoint.app',
        'https://www.facebook.com/burnerpoint.app',
        'https://www.linkedin.com/company/burnerpointapp',
        'https://www.tiktok.com/@burnerpointapp',
        'https://x.com/burnerpointapp',
        'https://t.me/burnerpointapp',
        'https://www.youtube.com/@burnerpointapp',
      ],
      supportUrl: `${base}/support`,
      applicationCategory: 'CommunicationApplication',
      operatingSystem: 'iOS, Android, Web',
      offers: {
        '@type': 'Offer',
        price: '0.99',
        priceCurrency: 'USD',
        description: 'Pay-per-use verification from $0.99',
      },
      author: {
        '@type': 'Organization',
        name: 'BurnerPoint',
        url: base,
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1200',
      },
    };
  }

  /**
   * IndexNow — instantly pings search engines when content changes.
   * Much faster than waiting for Googlebot to crawl.
   */
  async pingIndexNow(urls?: string[]): Promise<void> {
    const base = this.config.get<string>('WEB_URL', 'https://burnerpoint.app').replace(/\/+$/, '');
    const host = new URL(base).hostname;

    const defaultUrls = [
      `${base}/`,
      `${base}/pricing`,
      `${base}/verifications`,
      `${base}/rentals`,
      `${base}/blog`,
      `${base}/faq`,
      `${base}/help`,
      `${base}/contact`,
    ];

    const urlsToSubmit = urls ?? defaultUrls;

    const indexNowPayload = {
      host,
      key: this.config.get<string>('INDEXNOW_KEY', ''),
      keyLocation: `${base}/indexnow-key.txt`,
      urlList: urlsToSubmit,
    };

    if (!indexNowPayload.key) {
      this.logger.debug('INDEXNOW_KEY not set — skipping IndexNow ping');
      return;
    }

    // Ping both Bing and Yandex (they share the IndexNow protocol)
    const endpoints = [
      'https://api.indexnow.org/indexnow',
      'https://www.bing.com/indexnow',
      'https://yandex.com/indexnow',
    ];

    for (const endpoint of endpoints) {
      try {
        await axios.post(endpoint, indexNowPayload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        });
        this.logger.log(`IndexNow: pinged ${endpoint} with ${urlsToSubmit.length} URLs`);
      } catch (err) {
        this.logger.warn(`IndexNow ping failed for ${endpoint}: ${err.message}`);
      }
    }
  }
}
