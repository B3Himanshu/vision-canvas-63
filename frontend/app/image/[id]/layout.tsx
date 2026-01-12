import type { Metadata } from 'next';
import { getImageById } from '@/backend/lib/images';
import { decodeId } from '@/backend/lib/hashids';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixelvault.com';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    // Try to decode hash ID first, fallback to numeric ID
    let id: number | null = decodeId(params.id);
    
    if (id === null) {
      const numericId = parseInt(params.id, 10);
      if (!isNaN(numericId) && numericId > 0) {
        id = numericId;
      }
    }

    if (!id) {
      return {
        title: 'Image Not Found - PixelVault',
        description: 'The requested image could not be found.',
      };
    }

    const result = await getImageById(id, false);
    
    if (!result.success || !result.data) {
      return {
        title: 'Image Not Found - PixelVault',
        description: 'The requested image could not be found.',
      };
    }

    const image = result.data;
    const title = image.title || image.description || `Image ${id}`;
    const description = image.description || `Download ${title} - Free high-quality image from PixelVault.`;
    const thumbnailUrl = image.thumbnailUrl || `/api/images/${params.id}/thumbnail`;

    return {
      title: `${title} - Free Download | PixelVault`,
      description: description,
      keywords: image.tags || [image.category || ''],
      openGraph: {
        title: `${title} - PixelVault`,
        description: description,
        url: `${siteUrl}/image/${params.id}`,
        type: 'article',
        images: [
          {
            url: `${siteUrl}${thumbnailUrl}`,
            width: image.width || 1200,
            height: image.height || 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: [`${siteUrl}${thumbnailUrl}`],
      },
      alternates: {
        canonical: `${siteUrl}/image/${params.id}`,
      },
    };
  } catch (error) {
    return {
      title: 'Image - PixelVault',
      description: 'Browse and download free high-quality images.',
    };
  }
}

export default function ImageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
