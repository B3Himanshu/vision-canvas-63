/**
 * Advanced search with full-text search capabilities
 */

import { getPool } from './db';
import { validateString, validatePagination } from './validation';

export interface SearchOptions {
  query: string;
  limit?: number;
  offset?: number;
  category?: string;
}

/**
 * Full-text search across prompt_used, description, tag1, tag2
 */
export async function fullTextSearch(options: SearchOptions) {
  const pool = getPool();
  try {
    const validatedQuery = validateString(options.query, 500);
    const { limit, offset } = validatePagination(options.limit, options.offset);
    const client = await pool.connect();

    // Build full-text search query
    let query = `
      SELECT 
        *,
        ts_rank(
          to_tsvector('english', COALESCE(prompt_used, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(tag1, '') || ' ' || COALESCE(tag2, '')),
          plainto_tsquery('english', $1)
        ) as rank
      FROM generated_images
      WHERE 
        (deleted_at IS NULL OR deleted_at = '')
        AND (
          to_tsvector('english', COALESCE(prompt_used, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(tag1, '') || ' ' || COALESCE(tag2, ''))
          @@ plainto_tsquery('english', $1)
        )
    `;

    const params: any[] = [validatedQuery];
    let paramCount = 2;

    // Add category filter if provided
    if (options.category && options.category !== 'all') {
      query += ` AND (tag1 ILIKE $${paramCount} OR tag2 ILIKE $${paramCount})`;
      params.push(`%${options.category}%`);
      paramCount++;
    }

    // Order by relevance (rank) and then by date
    query += ` ORDER BY rank DESC, created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await client.query(query, params);
    client.release();

    return {
      success: true,
      data: result.rows.map(row => {
        const tags: string[] = [];
        if (row.tag1) tags.push(row.tag1);
        if (row.tag2) tags.push(row.tag2);
        
        return {
          id: row.id,
          image_url: row.image_url,
          image_file: row.image_file,
          prompt_used: row.prompt_used,
          description: row.description,
          tag1: row.tag1,
          tag2: row.tag2,
          url: row.image_url || row.image_file || '',
          title: row.description || row.prompt_used || `Image ${row.id}`,
          author: 'system',
          downloads: row.downloads || 0,
          width: 600,
          height: 400,
          category: row.tag1 || 'uncategorized',
          tags: tags,
          type: 'photo' as const,
          rank: row.rank,
        };
      }),
      total: result.rows.length,
    };
  } catch (error) {
    console.error('Full-text search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
    };
  }
}
