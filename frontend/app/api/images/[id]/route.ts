import { NextRequest, NextResponse } from 'next/server';
import { getImageById } from '@/backend/lib/images';
import { decodeId } from '@/backend/lib/hashids';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      return NextResponse.json(
        { success: false, error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    const result = await getImageById(id, false); // Don't track view for metadata requests

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Image not found' ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
