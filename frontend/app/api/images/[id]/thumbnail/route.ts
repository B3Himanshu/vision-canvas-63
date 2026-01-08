import { NextRequest, NextResponse } from 'next/server';
import { getImageThumbnail } from '@/backend/lib/images';

export const dynamic = 'force-dynamic';

/**
 * GET /api/images/[id]/thumbnail
 * Returns thumbnail binary image data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    
    if (isNaN(id) || id <= 0) {
      return new NextResponse('Invalid image ID', { status: 400 });
    }

    const result = await getImageThumbnail(id);

    if (!result.success) {
      return new NextResponse(result.error || 'Thumbnail not found', {
        status: result.error === 'Image not found' || result.error === 'Thumbnail not available' ? 404 : 500,
      });
    }

    // Convert BYTEA buffer to Buffer if needed
    const imageBuffer = Buffer.isBuffer(result.data) 
      ? result.data 
      : Buffer.from(result.data);

    // Generate ETag for cache validation (hash of image data)
    const crypto = await import('crypto');
    const etag = crypto.createHash('md5').update(imageBuffer).digest('hex');

    // Check if client has cached version (If-None-Match header)
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === `"${etag}"`) {
      return new NextResponse(null, { status: 304 }); // Not Modified
    }

    // Return binary image data with proper headers (session cache with ETag)
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': result.mimeType || 'image/webp', // WebP format
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'no-cache, must-revalidate', // Browser caches but validates with server
        'ETag': `"${etag}"`, // ETag for cache validation
        'Content-Disposition': `inline; filename="thumbnail-${id}.webp"`,
      },
    });
  } catch (error) {
    console.error('Thumbnail API Error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
