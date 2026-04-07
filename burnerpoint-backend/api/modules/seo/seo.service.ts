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

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    // Only ping search engines in production
    if (this.config.get('NODE_ENV') === 'production') {
      await this.pingIndexNow().catch(() => {}); // non-critical
    }
  }

  getSitemap(): string {
    const base = this.config.get<string>('WEB_URL', 'https://burnerpoint.app');
    const now = new Date().toISOString().split('T')[0];

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <!-- Marketing pages -->
  <url>
    <loc>${base}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${base}/pricing</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${base}/features</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${base}/about</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${base}/blog</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Legal -->
  <url>
    <loc>${base}/privacy</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${base}/terms</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${base}/support</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- Auth (noindex these in meta but include for crawlers) -->
  <url>
    <loc>${base}/auth/login</loc>
    <lastmod>${now}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${base}/auth/register</loc>
    <lastmod>${now}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>

</urlset>`;
  }

  getRobots(): string {
    const base = this.config.get<string>('WEB_URL', 'https://burnerpoint.app');
    return `# BurnerPoint robots.txt
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /auth/

# Allow marketing bots full access
User-agent: Googlebot
Allow: /
Disallow: /dashboard/
Disallow: /api/

User-agent: Bingbot
Allow: /
Disallow: /dashboard/
Disallow: /api/

Sitemap: ${base}/sitemap.xml`;
  }

  /**
   * Returns JSON-LD structured data for the BurnerPoint app.
   * Embed in <script type="application/ld+json"> in the HTML <head>.
   */
  getStructuredData(): object {
    const base = this.config.get<string>('WEB_URL', 'https://burnerpoint.app');
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'BurnerPoint',
      description:
        'Privacy-first temporary phone numbers for anonymous SMS, OTP verification, and secure calling.',
      url: base,
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
    const base = this.config.get<string>('WEB_URL', 'https://burnerpoint.app');
    const host = new URL(base).hostname;

    const defaultUrls = [
      `${base}/`,
      `${base}/pricing`,
      `${base}/features`,
      `${base}/blog`,
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
