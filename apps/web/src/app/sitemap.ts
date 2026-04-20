import type { MetadataRoute } from 'next';
import { uniquePublicSeoPages, absoluteUrl } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  return uniquePublicSeoPages.map((page) => ({
    url: absoluteUrl(page.route),
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
