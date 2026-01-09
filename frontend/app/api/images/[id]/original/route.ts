import { NextRequest, NextResponse } from 'next/server';
import { getOriginalImageFile } from '@/backend/lib/images';
import { getUserIdFromRequest } from '@/lib/auth';
import { decodeId } from '@/backend/lib/hashids';

export const dynamic = 'force-dynamic';

/**
 * GET /api/images/[id]/original
 * Returns original image binary data (highest quality - PNG/JPG)
 * Requires authentication for downloads
 * Accepts both hash IDs (e.g., "a3xK9m") and numeric IDs for backward compatibility
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication for downloads
    const userId = getUserIdFromRequest(request);
    if (!userId || userId === 'anonymous') {
      return new NextResponse('Authentication required', { status: 401 });
    }

    // Try to decode hash ID first, fallback to numeric ID for backward compatibility
    let id: number | null = decodeId(params.id);
    
    // If hash decoding failed, try parsing as numeric ID (backward compatibility)
    if (id === null) {
      const numericId = parseInt(params.id, 10);
      if (!isNaN(numericId) && numericId > 0) {
        id = numericId;
      }
    }
    
    if (!id || id <= 0) {
      return new NextResponse('Invalid image ID', { status: 400 });
    }

    const result = await getOriginalImageFile(id);

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

    // Determine file extension from MIME type
    const mimeToExt: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
    };
    const extension = mimeToExt[result.mimeType || 'image/jpeg'] || 'jpg';

    // Return binary image data with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': result.mimeType || 'image/jpeg',
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'no-cache, must-revalidate', // Browser caches but validates with server
        'ETag': `"${etag}"`, // ETag for cache validation
        'Content-Disposition': `attachment; filename="image-${id}-original.${extension}"`, // Force download
      },
    });
  } catch (error) {
    console.error('Original Image API Error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
