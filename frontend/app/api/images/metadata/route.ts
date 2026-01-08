import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/backend/lib/db';
import { validateId, validateString, validateStringArray, validateCategory } from '@/backend/lib/validation';

/**
 * Update image metadata (title, tags, category)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageId, title, tags, category } = body;

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: 'imageId is required' },
        { status: 400 }
      );
    }

    const validatedId = validateId(imageId);
    const pool = getPool();
    const client = await pool.connect();

    try {
      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (title !== undefined) {
        const validatedTitle = validateString(title, 255);
        updates.push(`description = $${paramCount}`);
        params.push(validatedTitle);
        paramCount++;
      }

      if (tags !== undefined) {
        const validatedTags = validateStringArray(tags);
        // Update tag1 and tag2 (simplified - can be improved)
        if (validatedTags.length > 0) {
          updates.push(`tag1 = $${paramCount}`);
          params.push(validatedTags[0]);
          paramCount++;
        }
        if (validatedTags.length > 1) {
          updates.push(`tag2 = $${paramCount}`);
          params.push(validatedTags[1]);
          paramCount++;
        }
      }

      if (category !== undefined) {
        const validatedCategory = validateCategory(category);
        updates.push(`tag1 = $${paramCount}`);
        params.push(validatedCategory);
        paramCount++;
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No fields to update' },
          { status: 400 }
        );
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(validatedId);

      const query = `
        UPDATE generated_images 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, params);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Image not found' },
          { status: 404 }
        );
      }

      client.release();

      return NextResponse.json({
        success: true,
        data: result.rows[0],
        message: 'Metadata updated successfully',
      });
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('Metadata update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update metadata',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
