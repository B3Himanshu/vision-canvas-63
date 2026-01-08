import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/backend/lib/db';
import { validateId } from '@/backend/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    const validatedId = validateId(id);
    
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Get current image to find related images
      const currentImage = await client.query(
        'SELECT tag1, tag2, category FROM generated_images WHERE id = $1',
        [validatedId]
      );
      
      if (currentImage.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Image not found' },
          { status: 404 }
        );
      }
      
      const image = currentImage.rows[0];
      const tags = [image.tag1, image.tag2].filter(Boolean);
      
      // Find related images by tags
      let query = `
        SELECT * FROM generated_images 
        WHERE id != $1 
        AND (deleted_at IS NULL OR deleted_at = '')
      `;
      const params: any[] = [validatedId];
      
      if (tags.length > 0) {
        const tagConditions = tags.map((_, idx) => 
          `(tag1 ILIKE $${idx + 2} OR tag2 ILIKE $${idx + 2})`
        ).join(' OR ');
        query += ` AND (${tagConditions})`;
        tags.forEach(tag => params.push(`%${tag}%`));
      }
      
      query += ' ORDER BY created_at DESC LIMIT 12';
      
      const result = await client.query(query, params);
      
      // Map to frontend format
      const relatedImages = result.rows.map(row => {
        const tags: string[] = [];
        if (row.tag1) tags.push(row.tag1);
        if (row.tag2) tags.push(row.tag2);
        
        return {
          id: row.id,
          url: row.image_url || row.image_file || '',
          title: row.description || row.prompt_used || `Image ${row.id}`,
          author: 'system',
          downloads: row.downloads || 0,
          width: 600,
          height: 400,
          category: row.tag1 || 'uncategorized',
          tags: tags,
          type: 'photo' as const,
        };
      });
      
      client.release();
      
      return NextResponse.json({
        success: true,
        data: relatedImages,
      });
    } catch (error) {
      client.release();
      throw error;
    }
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
