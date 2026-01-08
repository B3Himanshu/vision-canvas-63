import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/backend/lib/db';
import { validateId } from '@/backend/lib/validation';

/**
 * Track image view
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageId, action } = body; // action: 'view' | 'download'

    if (!imageId || !action) {
      return NextResponse.json(
        { success: false, error: 'imageId and action are required' },
        { status: 400 }
      );
    }

    const validatedId = validateId(imageId);

    const pool = getPool();
    const client = await pool.connect();

    try {
      if (action === 'view') {
        // Update view count in generated_images table
        await client.query(
          `UPDATE generated_images 
           SET view_count = COALESCE(view_count, 0) + 1,
               last_viewed_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [validatedId]
        );
      } else if (action === 'download') {
        // Track download (can be added to a downloads table)
        await client.query(
          `UPDATE generated_images 
           SET downloads = COALESCE(downloads, 0) + 1
           WHERE id = $1`,
          [validatedId]
        );
      }

      client.release();

      return NextResponse.json({
        success: true,
        message: `${action} tracked successfully`,
      });
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
