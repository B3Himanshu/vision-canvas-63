import { NextRequest, NextResponse } from 'next/server';
import { getUserFavorites, addFavorite, removeFavorite, isFavorited } from '@/backend/lib/favorites';
import { getUserIdFromRequest } from '@/lib/auth';
import { validateId } from '@/backend/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/favorites
 * Get all favorited images for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    
    if (!userId || userId === 'anonymous') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const result = await getUserFavorites(userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to fetch favorites' },
        { status: 500 }
      );
    }

    // Return full image data
    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Favorites GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch favorites',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorites
 * Add an image to favorites
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    
    if (!userId || userId === 'anonymous') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { imageId } = body;

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: 'imageId is required' },
        { status: 400 }
      );
    }

    const validatedId = validateId(imageId);
    const result = await addFavorite(userId, validatedId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to add favorite' },
        { status: result.error === 'Image already in favorites' ? 409 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image added to favorites',
      data: result.data,
    });
  } catch (error) {
    console.error('Favorites POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add favorite',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/favorites?imageId=X
 * Remove an image from favorites
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    
    if (!userId || userId === 'anonymous') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
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
    const result = await removeFavorite(userId, validatedId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to remove favorite' },
        { status: result.error === 'Favorite not found' ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image removed from favorites',
    });
  } catch (error) {
    console.error('Favorites DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove favorite',
      },
      { status: 500 }
    );
  }
}
