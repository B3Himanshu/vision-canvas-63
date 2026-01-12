import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixelvault.com';
  
  // Static pages
  const routes = [
    '',
    '/gallery',
    '/favorites',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Common tag pages (you can expand this with actual tags from database)
  const commonTags = [
    'nature',
    'business',
    'travel',
    'people',
    'abstract',
    'food',
    'technology',
    'architecture',
  ];

  const tagRoutes = commonTags.map((tag) => ({
    url: `${baseUrl}/tag/${tag}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...routes, ...tagRoutes];
}
