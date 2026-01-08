/**
 * Favorites/bookmarks functionality
 */

import { getPool } from './db';
import { validateId, validateString } from './validation';

export interface Favorite {
  id: number;
  user_id: string;
  image_id: number;
  created_at: Date;
}

/**
 * Get all favorites for a user
 */
export async function getUserFavorites(userId: string) {
  const pool = getPool();
  try {
    const validatedUserId = validateString(userId, 255);
    const client = await pool.connect();
    
    const result = await client.query(
      'SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
      [validatedUserId]
    );
    
    client.release();
    
    return {
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        image_id: row.image_id,
        created_at: row.created_at,
      })),
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
