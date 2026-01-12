import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixelvault.com';

export const metadata: Metadata = {
  title: 'Image Gallery - Browse Free High-Quality Photos',
  description: 'Explore our extensive gallery of free high-quality images. Search, filter, and browse thousands of photos, illustrations, and graphics. Download free images for your projects.',
  keywords: ['image gallery', 'free photos', 'photo gallery', 'stock photo gallery', 'free image gallery'],
  openGraph: {
    title: 'Image Gallery - PixelVault',
    description: 'Explore our extensive gallery of free high-quality images. Search, filter, and browse thousands of photos.',
    url: `${siteUrl}/gallery`,
  },
  alternates: {
    canonical: `${siteUrl}/gallery`,
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
