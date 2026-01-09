import { NextRequest, NextResponse } from 'next/server';
import { isFavorited } from '@/backend/lib/favorites';
import { getUserIdFromRequest } from '@/lib/auth';
import { validateId } from '@/backend/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/favorites/check?imageId=X
 * Check if an image is favorited by the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    
    if (!userId || userId === 'anonymous') {
      return NextResponse.json({
        success: true,
        isFavorited: false,
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: 'imageId is required' },
        { status: 400 }
      );
    }

    const validatedId = validateId(parseInt(imageId, 10));
    const result = await isFavorited(userId, validatedId);

    return NextResponse.json({
      success: true,
      isFavorited: result.isFavorited || false,
    });
  } catch (error) {
    console.error('Favorites check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check favorite status',
      },
      { status: 500 }
    );
  }
}
