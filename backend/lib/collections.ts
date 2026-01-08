/**
 * Image collections functionality for organizing saved images
 */

import { getPool } from './db';
import { validateId, validateString, validateStringArray } from './validation';

export interface Collection {
  id: number;
  user_id: string;
  name: string;
  description?: string;
  image_ids: number[];
  created_at: Date;
  updated_at: Date;
}

/**
 * Get all collections for a user
 */
export async function getUserCollections(userId: string) {
  const pool = getPool();
  try {
    const validatedUserId = validateString(userId, 255);
    const client = await pool.connect();
    
    const result = await client.query(
      'SELECT * FROM collections WHERE user_id = $1 ORDER BY created_at DESC',
      [validatedUserId]
    );
    
    client.release();
    
    return {
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        description: row.description,
        image_ids: row.image_ids || [],
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
    };
  } catch (error) {
    console.error('Error fetching collections:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
    };
  }
}

/**
 * Create a new collection
 */
export async function createCollection(userId: string, name: string, description?: string) {
  const pool = getPool();
  try {
    const validatedUserId = validateString(userId, 255);
    const validatedName = validateString(name, 100);
    const validatedDescription = description ? validateString(description, 500) : null;
    const client = await pool.connect();
    
    const result = await client.query(
      `INSERT INTO collections (user_id, name, description, image_ids) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [validatedUserId, validatedName, validatedDescription, []]
    );
    
    client.release();
    
    return {
      success: true,
      data: {
        id: result.rows[0].id,
        user_id: result.rows[0].user_id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        image_ids: result.rows[0].image_ids || [],
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at,
      },
    };
  } catch (error) {
    console.error('Error creating collection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Add image to collection
 */
export async function addImageToCollection(collectionId: number, imageId: number) {
  const pool = getPool();
  try {
    const validatedCollectionId = validateId(collectionId);
    const validatedImageId = validateId(imageId);
    const client = await pool.connect();
    
    // Get current collection
    const collectionResult = await client.query(
      'SELECT image_ids FROM collections WHERE id = $1',
      [validatedCollectionId]
    );
    
    if (collectionResult.rows.length === 0) {
      client.release();
      return {
        success: false,
        error: 'Collection not found',
      };
    }
    
    const currentImageIds = collectionResult.rows[0].image_ids || [];
    if (currentImageIds.includes(validatedImageId)) {
      client.release();
      return {
        success: false,
        error: 'Image already in collection',
      };
    }
    
    const updatedImageIds = [...currentImageIds, validatedImageId];
    
    const result = await client.query(
      `UPDATE collections 
       SET image_ids = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [updatedImageIds, validatedCollectionId]
    );
    
    client.release();
    
    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error('Error adding image to collection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Remove image from collection
 */
export async function removeImageFromCollection(collectionId: number, imageId: number) {
  const pool = getPool();
  try {
    const validatedCollectionId = validateId(collectionId);
    const validatedImageId = validateId(imageId);
    const client = await pool.connect();
    
    const collectionResult = await client.query(
      'SELECT image_ids FROM collections WHERE id = $1',
      [validatedCollectionId]
    );
    
    if (collectionResult.rows.length === 0) {
      client.release();
      return {
        success: false,
        error: 'Collection not found',
      };
    }
    
    const currentImageIds = collectionResult.rows[0].image_ids || [];
    const updatedImageIds = currentImageIds.filter((id: number) => id !== validatedImageId);
    
    const result = await client.query(
      `UPDATE collections 
       SET image_ids = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [updatedImageIds, validatedCollectionId]
    );
    
    client.release();
    
    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error('Error removing image from collection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete collection
 */
export async function deleteCollection(collectionId: number, userId: string) {
  const pool = getPool();
  try {
    const validatedCollectionId = validateId(collectionId);
    const validatedUserId = validateString(userId, 255);
    const client = await pool.connect();
    
    const result = await client.query(
      'DELETE FROM collections WHERE id = $1 AND user_id = $2 RETURNING *',
      [validatedCollectionId, validatedUserId]
    );
    
    client.release();
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Collection not found or unauthorized',
      };
    }
    
    return {
      success: true,
      message: 'Collection deleted',
    };
  } catch (error) {
    console.error('Error deleting collection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
