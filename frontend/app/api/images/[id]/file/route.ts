import { NextRequest, NextResponse } from 'next/server';
import { getImageFile } from '@/backend/lib/images';

export const dynamic = 'force-dynamic';

/**
 * GET /api/images/[id]/file
 * Returns full resolution image binary data
 * Public endpoint - anyone can view HD images
 * (Download functionality still requires authentication)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // No authentication required for viewing images
    // Downloads are handled separately and require authentication

    const id = parseInt(params.id, 10);
    
    if (isNaN(id) || id <= 0) {
      return new NextResponse('Invalid image ID', { status: 400 });
    }

    const result = await getImageFile(id);

    if (!result.success) {
      return new NextResponse(result.error || 'Image not found', {
        status: result.error === 'Image not found' || result.error === 'Image data not available' ? 404 : 500,
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
        'Content-Disposition': `inline; filename="image-${id}.webp"`,
      },
    });
  } catch (error) {
    console.error('Image File API Error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
