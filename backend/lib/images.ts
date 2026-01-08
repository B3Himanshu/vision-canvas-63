import { getPool } from './db';
import { validateString, validateId, validateStringArray, validateCategory, validateImageType, validateUrl, validatePagination } from './validation';
import { processUploadedImage } from './image-processing';

export interface Image {
  id: number;
  image_url?: string;
  image_file?: string;
  prompt_used?: string;
  description?: string;
  tag1?: string;
  tag2?: string;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
  reviewed_at?: Date;
  id_reviewed_by?: number;
  delete_reason?: string;
  deleted_at?: Date;
  deleted_by_id?: number;
  is_false?: boolean;
  original_image_id?: number;
  // Mapped fields for compatibility
  url?: string;
  title?: string;
  author?: string;
  downloads?: number;
  width?: number;
  height?: number;
  category?: string;
  tags?: string[];
  thumbnailUrl?: string;
  imageUrl?: string;
  blurhash?: string | null;
  type?: 'photo' | 'illustration' | 'icon';
}

export interface ImageFilters {
  category?: string;
  search?: string;
  orientation?: 'landscape' | 'portrait' | 'square' | 'all';
  tags?: string[];
  sort?: 'recent' | 'popular' | 'trending';
  limit?: number;
  offset?: number;
}

// Fetch images with filters - using generated_images table
// Returns metadata ONLY (no binary data for performance)
export async function getImages(filters: ImageFilters = {}) {
  const pool = getPool();
  try {
    const client = await pool.connect();
    
    // Select metadata only - exclude binary columns (image_data, thumbnail_data)
    // This keeps response size small (~5-10 KB instead of MBs)
    // Note: Only selecting columns that exist - view_count and downloads may not exist
    let query = `SELECT 
      id, description, tag1, tag2, tag3, status, 
      image_width, image_height, image_size, image_mime_type,
      blurhash,
      created_at, updated_at,
      is_deleted, deleted_at
      FROM generated_images WHERE 1=1`;
    const params: any[] = [];
    let paramCount = 1;
    
    // Filter out deleted images by default
    query += ' AND (is_deleted = false OR is_deleted IS NULL)';

    // Category filter (using tag1 or tag2)
    if (filters.category && filters.category !== 'all') {
      query += ` AND (tag1 ILIKE $${paramCount} OR tag2 ILIKE $${paramCount})`;
      params.push(`%${filters.category}%`);
      paramCount++;
    }

    // Search filter
    if (filters.search) {
      query += ` AND (
        description ILIKE $${paramCount} OR 
        tag1 ILIKE $${paramCount} OR 
        tag2 ILIKE $${paramCount} OR 
        tag3 ILIKE $${paramCount}
      )`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map((_, idx) => 
        `(tag1 ILIKE $${paramCount + idx} OR tag2 ILIKE $${paramCount + idx} OR tag3 ILIKE $${paramCount + idx})`
      ).join(' OR ');
      query += ` AND (${tagConditions})`;
      filters.tags.forEach(tag => params.push(`%${tag}%`));
      paramCount += filters.tags.length;
    }

    // Sort
    switch (filters.sort) {
      case 'popular':
        query += ' ORDER BY created_at DESC'; // Fallback - view_count may not exist
        break;
      case 'trending':
        query += ' ORDER BY created_at DESC'; // Fallback
        break;
      case 'recent':
      default:
        query += ' ORDER BY created_at DESC';
        break;
    }

    // Limit and offset
    const limit = filters.limit || 40;
    const offset = filters.offset || 0;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    // Try query with blurhash first, fallback to query without blurhash if column doesn't exist
    let result;
    let hasBlurhash = true;
    try {
      result = await client.query(query, params);
    } catch (queryError: any) {
      // If blurhash column doesn't exist (error code 42703 = undefined_column), retry without it
      if (queryError?.code === '42703' && queryError?.message?.includes('blurhash')) {
        hasBlurhash = false;
        // Rebuild query without blurhash column
        query = `SELECT 
          id, description, tag1, tag2, tag3, status, 
          image_width, image_height, image_size, image_mime_type,
          created_at, updated_at,
          is_deleted, deleted_at
          FROM generated_images WHERE 1=1`;
        query += ' AND (is_deleted = false OR is_deleted IS NULL)';
        
        // Rebuild filters with same params (params array stays the same, just query changes)
        paramCount = 1;
        if (filters.category && filters.category !== 'all') {
          query += ` AND (tag1 ILIKE $${paramCount} OR tag2 ILIKE $${paramCount})`;
          paramCount++;
        }
        if (filters.search) {
          query += ` AND (
            description ILIKE $${paramCount} OR 
            tag1 ILIKE $${paramCount} OR 
            tag2 ILIKE $${paramCount} OR 
            tag3 ILIKE $${paramCount}
          )`;
          paramCount++;
        }
        if (filters.tags && filters.tags.length > 0) {
          const tagConditions = filters.tags.map((_, idx) => 
            `(tag1 ILIKE $${paramCount + idx} OR tag2 ILIKE $${paramCount + idx} OR tag3 ILIKE $${paramCount + idx})`
          ).join(' OR ');
          query += ` AND (${tagConditions})`;
          paramCount += filters.tags.length;
        }
        switch (filters.sort) {
          case 'popular':
          case 'trending':
          case 'recent':
          default:
            query += ' ORDER BY created_at DESC';
            break;
        }
        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        result = await client.query(query, params);
      } else {
        throw queryError; // Re-throw if it's a different error
      }
    }
    
    client.release();

    return {
      success: true,
      data: result.rows.map(row => {
        // Map generated_images columns to Image interface
        const tags: string[] = [];
        if (row.tag1) tags.push(row.tag1);
        if (row.tag2) tags.push(row.tag2);
        if (row.tag3) tags.push(row.tag3);
        
        return {
          id: row.id,
          description: row.description,
          tag1: row.tag1,
          tag2: row.tag2,
          tag3: row.tag3,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
          view_count: 0, // Default to 0 if column doesn't exist
          downloads: 0, // Default to 0 if column doesn't exist
          // Mapped fields for compatibility with frontend
          title: row.description || `Image ${row.id}`,
          author: 'system', // Default author
          width: row.image_width || 600,
          height: row.image_height || 400,
          category: row.tag1 || 'uncategorized',
          tags: tags,
          type: 'photo' as const,
          // URLs for frontend to use
          thumbnailUrl: `/api/images/${row.id}/thumbnail`,
          imageUrl: `/api/images/${row.id}/file`,
          // BlurHash for instant preview (null if column doesn't exist)
          blurhash: hasBlurhash ? (row.blurhash || null) : null,
        };
      }),
      total: result.rows.length,
    };
  } catch (error) {
    console.error('Error fetching images:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
      total: 0,
    };
  }
}

// Get image metadata by ID (no binary data)
export async function getImageById(id: number, trackView: boolean = true) {
  const pool = getPool();
  try {
    const validatedId = validateId(id);
    const client = await pool.connect();

    // Increment view count if tracking is enabled
    // Note: Skip if view_count column doesn't exist in database
    if (trackView) {
      try {
        await client.query(
          `UPDATE generated_images
           SET view_count = COALESCE(view_count, 0) + 1,
               last_viewed_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [validatedId]
        );
      } catch (err) {
        // Silently ignore if view_count column doesn't exist
        // This allows the query to work with older database schemas
      }
    }
    
    // Select metadata only (exclude binary columns)
    // Note: view_count, downloads, and blurhash may not exist in all database schemas
    let query = `SELECT 
      id, description, tag1, tag2, tag3, status, 
      image_width, image_height, image_size, image_mime_type,
      blurhash,
      created_at, updated_at
      FROM generated_images 
      WHERE id = $1 AND (is_deleted = false OR is_deleted IS NULL)`;
    
    let result;
    let hasBlurhash = true;
    try {
      result = await client.query(query, [validatedId]);
    } catch (queryError: any) {
      // If blurhash column doesn't exist, retry without it
      const errorMessage = queryError?.message || String(queryError || '');
      if (queryError?.code === '42703' && errorMessage.toLowerCase().includes('blurhash')) {
        hasBlurhash = false;
        query = `SELECT 
          id, description, tag1, tag2, tag3, status, 
          image_width, image_height, image_size, image_mime_type,
          created_at, updated_at
          FROM generated_images 
          WHERE id = $1 AND (is_deleted = false OR is_deleted IS NULL)`;
        result = await client.query(query, [validatedId]);
      } else {
        throw queryError; // Re-throw if it's a different error
      }
    }
    
    client.release();

    if (result.rows.length === 0) {
      return { success: false, error: 'Image not found' };
    }

    const row = result.rows[0];
    const tags: string[] = [];
    if (row.tag1) tags.push(row.tag1);
    if (row.tag2) tags.push(row.tag2);
    if (row.tag3) tags.push(row.tag3);
    
    return {
      success: true,
      data: {
        id: row.id,
        description: row.description,
        tag1: row.tag1,
        tag2: row.tag2,
        tag3: row.tag3,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        view_count: 0, // Default to 0 if column doesn't exist
        downloads: 0, // Default to 0 if column doesn't exist
        // Mapped fields
        title: row.description || `Image ${row.id}`,
        author: 'system',
        width: row.image_width || 600,
        height: row.image_height || 400,
        category: row.tag1 || 'uncategorized',
        tags: tags,
        type: 'photo' as const,
        // URLs for frontend
        thumbnailUrl: `/api/images/${row.id}/thumbnail`,
        imageUrl: `/api/images/${row.id}/file`,
        // BlurHash for instant preview (null if column doesn't exist)
        blurhash: hasBlurhash ? (row.blurhash || null) : null,
      },
    };
  } catch (error) {
    console.error('Error fetching image by ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get thumbnail binary data from database
 * @param id - Image ID
 * @returns Buffer containing thumbnail binary data and MIME type
 */
export async function getImageThumbnail(id: number) {
  const pool = getPool();
  try {
    const validatedId = validateId(id);
    const client = await pool.connect();
    
    // Try to get thumbnail_data first, fallback to image_data if thumbnail doesn't exist
    const result = await client.query(
      `SELECT thumbnail_data, image_data, image_mime_type 
       FROM generated_images 
       WHERE id = $1 AND (is_deleted = false OR is_deleted IS NULL)`,
      [validatedId]
    );
    client.release();

    if (result.rows.length === 0) {
      return { success: false, error: 'Image not found' };
    }

    const row = result.rows[0];
    
    // Use thumbnail if available, otherwise fallback to full image
    const imageData = row.thumbnail_data || row.image_data;
    
    if (!imageData) {
      return { success: false, error: 'Image data not available' };
    }

    return {
      success: true,
      data: imageData, // Buffer/BYTEA
      mimeType: row.image_mime_type || 'image/webp',
    };
  } catch (error) {
    console.error('Error fetching thumbnail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get full image binary data from database
 * @param id - Image ID
 * @returns Buffer containing full image binary data and MIME type
 */
export async function getImageFile(id: number) {
  const pool = getPool();
  try {
    const validatedId = validateId(id);
    const client = await pool.connect();
    
    const result = await client.query(
      `SELECT image_data, image_mime_type
       FROM generated_images
       WHERE id = $1 AND (is_deleted = false OR is_deleted IS NULL)`,
      [validatedId]
    );
    client.release();

    if (result.rows.length === 0) {
      return { success: false, error: 'Image not found' };
    }

    const row = result.rows[0];

    if (!row.image_data) {
      return { success: false, error: 'Image data not available' };
    }

    return {
      success: true,
      data: row.image_data, // Buffer/BYTEA
      mimeType: row.image_mime_type || 'image/webp',
    };
  } catch (error) {
    console.error('Error fetching image file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get total count of images (for pagination)
export async function getImagesCount(filters: ImageFilters = {}) {
  const pool = getPool();
  try {
    const client = await pool.connect();

    let query = 'SELECT COUNT(*) as count FROM generated_images WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    // Apply same filters as getImages
    query += ' AND (is_deleted = false OR is_deleted IS NULL)';

    if (filters.category && filters.category !== 'all') {
      query += ` AND (tag1 ILIKE $${paramCount} OR tag2 ILIKE $${paramCount})`;
      params.push(`%${filters.category}%`);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (
        description ILIKE $${paramCount} OR 
        tag1 ILIKE $${paramCount} OR 
        tag2 ILIKE $${paramCount} OR 
        tag3 ILIKE $${paramCount}
      )`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map((_, idx) => 
        `(tag1 ILIKE $${paramCount + idx} OR tag2 ILIKE $${paramCount + idx} OR tag3 ILIKE $${paramCount + idx})`
      ).join(' OR ');
      query += ` AND (${tagConditions})`;
      filters.tags.forEach(tag => params.push(`%${tag}%`));
      paramCount += filters.tags.length;
    }

    const result = await client.query(query, params);
    client.release();

    return {
      success: true,
      count: parseInt(result.rows[0].count),
    };
  } catch (error) {
    console.error('Error getting images count:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      count: 0,
    };
  }
}

/**
 * Insert a new image into the database
 * Automatically converts to WebP and generates BlurHash
 * 
 * @param imageBuffer - Original image buffer (JPEG/PNG/etc)
 * @param metadata - Image metadata (description, tags, etc)
 * @returns Created image ID and metadata
 */
export async function insertImage(
  imageBuffer: Buffer,
  metadata: {
    description?: string;
    tag1?: string;
    tag2?: string;
    tag3?: string;
    status?: string;
  } = {}
) {
  const pool = getPool();
  try {
    // Process image: Convert to WebP + Generate BlurHash
    const processed = await processUploadedImage(imageBuffer);

    const client = await pool.connect();

    // Insert into generated_images table
    const result = await client.query(
      `INSERT INTO generated_images (
        description, tag1, tag2, tag3, status,
        image_data, thumbnail_data, image_mime_type,
        image_width, image_height, image_size,
        blurhash,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id`,
      [
        metadata.description || null,
        metadata.tag1 || null,
        metadata.tag2 || null,
        metadata.tag3 || null,
        metadata.status || 'pending',
        processed.imageWebP, // WebP full image
        processed.thumbnailWebP, // WebP thumbnail
        'image/webp',
        processed.width,
        processed.height,
        processed.imageWebP.length, // Size of WebP image
        processed.blurhash,
      ]
    );

    client.release();

    const imageId = result.rows[0].id;

    return {
      success: true,
      data: {
        id: imageId,
        blurhash: processed.blurhash,
        width: processed.width,
        height: processed.height,
        thumbnailSize: processed.thumbnailWebP.length,
        imageSize: processed.imageWebP.length,
        originalSize: processed.originalSize,
      },
    };
  } catch (error) {
    console.error('Error inserting image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
