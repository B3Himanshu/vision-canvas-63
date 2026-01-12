import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixelvault.com';

export async function generateMetadata({
  params,
}: {
  params: { tagName: string };
}): Promise<Metadata> {
  const tagName = decodeURIComponent(params.tagName);
  const capitalizedTag = tagName.charAt(0).toUpperCase() + tagName.slice(1);
  
  return {
    title: `${capitalizedTag} Images - Free High-Quality Photos`,
    description: `Browse and download free high-quality ${tagName} images. Discover thousands of ${tagName} photos, illustrations, and graphics for your projects.`,
    keywords: [`${tagName} images`, `${tagName} photos`, `free ${tagName} images`, `stock ${tagName} photos`, `${tagName} graphics`],
    openGraph: {
      title: `${capitalizedTag} Images - PixelVault`,
      description: `Browse and download free high-quality ${tagName} images. Discover thousands of ${tagName} photos for your projects.`,
      url: `${siteUrl}/tag/${encodeURIComponent(tagName)}`,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}/tag/${encodeURIComponent(tagName)}`,
    },
  };
}

export default function TagLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
