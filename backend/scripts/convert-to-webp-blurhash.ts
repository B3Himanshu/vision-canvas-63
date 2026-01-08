/**
 * Batch Conversion Script: JPEG/PNG → WebP + BlurHash
 * 
 * This script:
 * 1. Fetches all images from generated_images table
 * 2. Converts image_data to WebP format (800x800 max)
 * 3. Generates thumbnail_data as WebP (150x150)
 * 4. Generates BlurHash for instant preview
 * 5. Updates database with new formats
 * 
 * Usage: npx tsx scripts/convert-to-webp-blurhash.ts
 */

import { Pool } from 'pg';
import sharp from 'sharp';
import { encode } from 'blurhash';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables (try multiple paths)
// Try root directory first (where script is typically run from)
const rootEnvPath = path.resolve(process.cwd(), '.env.local');
const backendEnvPath = path.resolve(__dirname, '../../.env.local');
const frontendEnvPath = path.resolve(__dirname, '../../frontend/.env.local');

// Try loading from multiple locations
dotenv.config({ path: rootEnvPath });
if (!process.env.DATABASE_HOST) {
  dotenv.config({ path: backendEnvPath });
}
if (!process.env.DATABASE_HOST) {
  dotenv.config({ path: frontendEnvPath });
}

// Validate environment variables
if (!process.env.DATABASE_HOST || !process.env.DATABASE_NAME || !process.env.DATABASE_USER || !process.env.DATABASE_PASSWORD) {
  console.error('❌ Error: Missing required database environment variables.');
  console.error('Please ensure .env.local exists in one of these locations:');
  console.error(`  - ${rootEnvPath}`);
  console.error(`  - ${backendEnvPath}`);
  console.error(`  - ${frontendEnvPath}`);
  console.error('\nRequired variables: DATABASE_HOST, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD');
  process.exit(1);
}

const dbConfig = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
};

const pool = new Pool(dbConfig);

// BlurHash configuration
const BLURHASH_COMPONENT_X = 4;
const BLURHASH_COMPONENT_Y = 4;

// Image size limits
const FULL_IMAGE_MAX_SIZE = 800; // Max width or height for full image
const THUMBNAIL_SIZE = 150; // Thumbnail width and height

/**
 * Generate BlurHash from image buffer
 */
async function generateBlurHash(imageBuffer: Buffer): Promise<string> {
  try {
    // Resize to small size for BlurHash generation (32px is optimal)
    const smallImage = await sharp(imageBuffer)
      .resize(32, 32, { fit: 'cover' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = smallImage;
    const { width, height } = info;

    // Encode to BlurHash
    const blurhash = encode(
      new Uint8ClampedArray(data),
      width,
      height,
      BLURHASH_COMPONENT_X,
      BLURHASH_COMPONENT_Y
    );

    return blurhash;
  } catch (error) {
    console.error('Error generating BlurHash:', error);
    throw error;
  }
}

/**
 * Convert image to WebP format
 */
async function convertToWebP(
  imageBuffer: Buffer,
  maxSize?: number,
  exactSize?: number
): Promise<Buffer> {
  try {
    let sharpInstance = sharp(imageBuffer);

    // Convert to RGB if needed (WebP requires RGB)
    sharpInstance = sharpInstance.toFormat('webp', {
      quality: 85,
      effort: 4, // Balance between compression and speed
    });

    // Apply sizing
    if (exactSize) {
      // For thumbnails: exact size
      sharpInstance = sharpInstance.resize(exactSize, exactSize, {
        fit: 'cover',
        position: 'center',
      });
    } else if (maxSize) {
      // For full images: max size constraint
      sharpInstance = sharpInstance.resize(maxSize, maxSize, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    return await sharpInstance.toBuffer();
  } catch (error) {
    console.error('Error converting to WebP:', error);
    throw error;
  }
}

/**
 * Process a single image
 */
async function processImage(imageId: number, imageData: Buffer, mimeType: string): Promise<{
  blurhash: string;
  thumbnailWebP: Buffer;
  imageWebP: Buffer;
}> {
  console.log(`Processing image ${imageId}...`);

  // Generate BlurHash (use original image for better quality)
  const blurhash = await generateBlurHash(imageData);

  // Convert to WebP formats
  const [thumbnailWebP, imageWebP] = await Promise.all([
    convertToWebP(imageData, undefined, THUMBNAIL_SIZE), // Thumbnail: 150x150
    convertToWebP(imageData, FULL_IMAGE_MAX_SIZE), // Full image: max 800x800
  ]);

  return {
    blurhash,
    thumbnailWebP,
    imageWebP,
  };
}

/**
 * Main conversion function
 */
async function convertAllImages() {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting batch conversion...\n');

    // Check if blurhash column exists
    let hasBlurhashColumn = false;
    try {
      await client.query('SELECT blurhash FROM generated_images LIMIT 1');
      hasBlurhashColumn = true;
    } catch (error: any) {
      if (error?.code === '42703' && error?.message?.includes('blurhash')) {
        hasBlurhashColumn = false;
      } else {
        throw error;
      }
    }

    // Fetch all images that need processing
    // Process images that either:
    // 1. Don't have blurhash (if column exists), OR
    // 2. Are not already WebP format
    const blurhashCondition = hasBlurhashColumn ? 'blurhash IS NULL OR' : '';
    const result = await client.query(`
      SELECT 
        id, 
        image_data, 
        thumbnail_data,
        image_mime_type
        ${hasBlurhashColumn ? ', blurhash' : ''}
      FROM generated_images
      WHERE (is_deleted = false OR is_deleted IS NULL)
        AND image_data IS NOT NULL
        AND (
          ${blurhashCondition}
          image_mime_type != 'image/webp'
        )
      ORDER BY id ASC
    `);

    const totalImages = result.rows.length;
    console.log(`📊 Found ${totalImages} images to process\n`);

    if (totalImages === 0) {
      console.log('✅ No images need processing. All done!');
      return;
    }

    let processed = 0;
    let failed = 0;
    const startTime = Date.now();

    // Process images in batches to avoid memory issues
    const BATCH_SIZE = 5;
    for (let i = 0; i < totalImages; i += BATCH_SIZE) {
      const batch = result.rows.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (row) => {
          try {
            const imageId = row.id;
            const imageData = row.image_data; // Original image buffer
            const currentMimeType = row.image_mime_type;

            if (!imageData) {
              console.log(`⚠️  Image ${imageId}: No image_data, skipping`);
              return;
            }

            // Process image
            const { blurhash, thumbnailWebP, imageWebP } = await processImage(
              imageId,
              imageData,
              currentMimeType
            );

            // Update database
            if (hasBlurhashColumn) {
              await client.query(
                `UPDATE generated_images
                 SET blurhash = $1,
                     thumbnail_data = $2,
                     image_data = $3,
                     image_mime_type = 'image/webp',
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $4`,
                [blurhash, thumbnailWebP, imageWebP, imageId]
              );
            } else {
              // If blurhash column doesn't exist, update without it
              await client.query(
                `UPDATE generated_images
                 SET thumbnail_data = $1,
                     image_data = $2,
                     image_mime_type = 'image/webp',
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $3`,
                [thumbnailWebP, imageWebP, imageId]
              );
            }

            processed++;
            const percentage = ((processed / totalImages) * 100).toFixed(1);
            console.log(
              `✅ [${processed}/${totalImages}] (${percentage}%) Image ${imageId}: ` +
              `BlurHash=${blurhash.substring(0, 12)}..., ` +
              `Thumb=${(thumbnailWebP.length / 1024).toFixed(1)}KB, ` +
              `Full=${(imageWebP.length / 1024).toFixed(1)}KB`
            );
          } catch (error) {
            failed++;
            console.error(`❌ Image ${row.id}: Error -`, error instanceof Error ? error.message : error);
          }
        })
      );

      // Small delay between batches to avoid overwhelming the database
      if (i + BATCH_SIZE < totalImages) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Conversion Complete!`);
    console.log(`📊 Processed: ${processed} images`);
    console.log(`❌ Failed: ${failed} images`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📈 Average: ${(parseFloat(duration) / processed).toFixed(2)} seconds per image`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the conversion
convertAllImages()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
