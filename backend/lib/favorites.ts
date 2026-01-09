/**
 * Favorites/bookmarks functionality
 */

import { getPool } from './db';
import { validateId, validateString } from './validation';
import { encodeId } from './hashids';

export interface Favorite {
  id: number;
  user_id: string;
  image_id: number;
  created_at: Date;
}

/**
 * Get all favorites for a user with full image data
 */
export async function getUserFavorites(userId: string) {
  const pool = getPool();
  try {
    const validatedUserId = validateString(userId, 255);
    const client = await pool.connect();
    
    // Join with generated_images to get full image data
    const result = await client.query(
      `SELECT 
        f.id as favorite_id,
        f.created_at as favorited_at,
        gi.id,
        gi.description,
        gi.tag1,
        gi.tag2,
        gi.tag3,
        gi.image_width,
        gi.image_height,
        gi.blurhash,
        gi.created_at
      FROM favorites f
      INNER JOIN generated_images gi ON f.image_id = gi.id
      WHERE f.user_id = $1 
        AND (gi.is_deleted = false OR gi.is_deleted IS NULL)
      ORDER BY f.created_at DESC`,
      [validatedUserId]
    );
    
    client.release();
    
    // Map to image format
    const images = result.rows.map(row => {
      const tags: string[] = [];
      if (row.tag1) tags.push(row.tag1);
      if (row.tag2) tags.push(row.tag2);
      if (row.tag3) tags.push(row.tag3);
      
      const hashId = encodeId(row.id);
      return {
        id: row.id,
        hashId: hashId, // Add hash ID for secure URLs
        description: row.description,
        tag1: row.tag1,
        tag2: row.tag2,
        tag3: row.tag3,
        title: row.description || `Image ${row.id}`,
        author: 'system',
        width: row.image_width || 600,
        height: row.image_height || 400,
        category: row.tag1 || 'uncategorized',
        tags: tags,
        type: 'photo' as const,
        thumbnailUrl: `/api/images/${hashId}/thumbnail`,
        imageUrl: `/api/images/${hashId}/file`,
        blurhash: row.blurhash || null,
        downloads: 0,
        favorited_at: row.favorited_at,
      };
    });
    
    return {
      success: true,
      data: images,
    };
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
    };
  }
}

/**
 * Add image to favorites
 */
export async function addFavorite(userId: string, imageId: number) {
  const pool = getPool();
  try {
    const validatedUserId = validateString(userId, 255);
    const validatedImageId = validateId(imageId);
    const client = await pool.connect();
    
    const result = await client.query(
      `INSERT INTO favorites (user_id, image_id) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id, image_id) DO NOTHING
       RETURNING *`,
      [validatedUserId, validatedImageId]
    );
    
    client.release();
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Image already in favorites',
      };
    }
    
    return {
      success: true,
      data: {
        id: result.rows[0].id,
        user_id: result.rows[0].user_id,
        image_id: result.rows[0].image_id,
        created_at: result.rows[0].created_at,
      },
    };
  } catch (error) {
    console.error('Error adding favorite:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Remove image from favorites
 */
export async function removeFavorite(userId: string, imageId: number) {
  const pool = getPool();
  try {
    const validatedUserId = validateString(userId, 255);
    const validatedImageId = validateId(imageId);
    const client = await pool.connect();
    
    const result = await client.query(
      'DELETE FROM favorites WHERE user_id = $1 AND image_id = $2 RETURNING *',
      [validatedUserId, validatedImageId]
    );
    
    client.release();
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Favorite not found',
      };
    }
    
    return {
      success: true,
      message: 'Favorite removed',
    };
  } catch (error) {
    console.error('Error removing favorite:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if image is favorited by user
 */
export async function isFavorited(userId: string, imageId: number) {
  const pool = getPool();
  try {
    const validatedUserId = validateString(userId, 255);
    const validatedImageId = validateId(imageId);
    const client = await pool.connect();
    
    const result = await client.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND image_id = $2',
      [validatedUserId, validatedImageId]
    );
    
    client.release();
    
    return {
      success: true,
      isFavorited: result.rows.length > 0,
    };
  } catch (error) {
    console.error('Error checking favorite:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      isFavorited: false,
    };
  }
}
