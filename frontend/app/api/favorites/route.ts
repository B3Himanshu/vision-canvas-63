import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/backend/lib/db';
import { validateId } from '@/backend/lib/validation';

// Simple in-memory favorites (replace with database in production)
// In production, this should use a database table with user_id and image_id
const favorites = new Map<string, Set<number>>();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const userFavorites = Array.from(favorites.get(userId) || []);

    return NextResponse.json({
      success: true,
      data: userFavorites,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch favorites',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageId } = body;
    const userId = request.headers.get('x-user-id') || 'anonymous';

    const validatedId = validateId(imageId);

    if (!favorites.has(userId)) {
      favorites.set(userId, new Set());
    }

    favorites.get(userId)!.add(validatedId);

    return NextResponse.json({
      success: true,
      message: 'Image added to favorites',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add favorite',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageId = searchParams.get('imageId');
    const userId = request.headers.get('x-user-id') || 'anonymous';

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: 'imageId is required' },
        { status: 400 }
      );
    }

    const validatedId = validateId(parseInt(imageId, 10));

    if (favorites.has(userId)) {
      favorites.get(userId)!.delete(validatedId);
    }

    return NextResponse.json({
      success: true,
      message: 'Image removed from favorites',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove favorite',
      },
      { status: 500 }
    );
  }
}
