/**
 * Structured Data (JSON-LD) Component for SEO
 * Adds schema.org markup for better search engine understanding
 */

interface OrganizationSchemaProps {
  siteUrl: string;
  siteName: string;
}

export function OrganizationSchema({ siteUrl, siteName }: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/placeholder.svg`,
    description: 'Free high-quality images for your projects. Browse, search, and download thousands of photos, illustrations, and graphics.',
    sameAs: [
      // Add your social media links here
      // 'https://twitter.com/pixelvault',
      // 'https://facebook.com/pixelvault',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebsiteSchemaProps {
  siteUrl: string;
  siteName: string;
}

export function WebsiteSchema({ siteUrl, siteName }: WebsiteSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/gallery?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ImageGallerySchemaProps {
  siteUrl: string;
  images: Array<{
    id: number;
    title: string;
    imageUrl: string;
    thumbnailUrl: string;
    description?: string;
  }>;
}

export function ImageGallerySchema({ siteUrl, images }: ImageGallerySchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: 'Free High-Quality Images',
    description: 'Browse and download thousands of free high-quality images',
    image: images.slice(0, 10).map((img) => ({
      '@type': 'ImageObject',
      contentUrl: `${siteUrl}${img.imageUrl}`,
      thumbnailUrl: `${siteUrl}${img.thumbnailUrl}`,
      name: img.title,
      description: img.description || img.title,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ImageObjectSchemaProps {
  siteUrl: string;
  image: {
    id: number;
    title: string;
    imageUrl: string;
    thumbnailUrl: string;
    description?: string;
    category?: string;
    tags?: string[];
  };
}

export function ImageObjectSchema({ siteUrl, image }: ImageObjectSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: `${siteUrl}${image.imageUrl}`,
    thumbnailUrl: `${siteUrl}${image.thumbnailUrl}`,
    name: image.title,
    description: image.description || image.title,
    keywords: image.tags?.join(', ') || image.category || '',
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    creator: {
      '@type': 'Organization',
      name: 'PixelVault',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
