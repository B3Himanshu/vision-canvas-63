/**
 * Bulk Image Upload Script
 * 
 * Uploads all WebP images from webp_images/ directory to the database
 * Uses database credentials from env.example
 * 
 * Usage: 
 *   npx tsx backend/scripts/upload.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Database configuration - uses environment variables from .env.local
// IMPORTANT: Set these BEFORE importing any database modules
// These are fallback defaults - should be overridden by .env.local
const DB_CONFIG = {
  DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',
  DATABASE_PORT: process.env.DATABASE_PORT || '5432',
  DATABASE_NAME: process.env.DATABASE_NAME || 'images',
  DATABASE_USER: process.env.DATABASE_USER || 'postgres',
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || '',
  DATABASE_SSL: process.env.DATABASE_SSL || 'false',
  DATABASE_CONNECTION_TIMEOUT: process.env.DATABASE_CONNECTION_TIMEOUT || '10000',
  DATABASE_STATEMENT_TIMEOUT: process.env.DATABASE_STATEMENT_TIMEOUT || '120000',
};

// Set environment variables from env.example FIRST (before any imports)
Object.entries(DB_CONFIG).forEach(([key, value]) => {
  process.env[key] = value;
});

// Also try loading from .env.local if it exists (will override defaults)
const rootEnvPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

// Verify environment variables are set
console.log('🔧 Setting environment variables...');
console.log(`   DATABASE_HOST=${process.env.DATABASE_HOST}`);
console.log(`   DATABASE_NAME=${process.env.DATABASE_NAME}`);
console.log(`   DATABASE_USER=${process.env.DATABASE_USER}`);
console.log(`   DATABASE_PASSWORD=${process.env.DATABASE_PASSWORD ? '***' : 'NOT SET'}\n`);

// Validate environment variables
if (!process.env.DATABASE_HOST || !process.env.DATABASE_NAME || !process.env.DATABASE_USER || !process.env.DATABASE_PASSWORD) {
  console.error('❌ Error: Missing required database environment variables.');
  console.error('Using default values from env.example:');
  console.error(`  DATABASE_HOST=${DB_CONFIG.DATABASE_HOST}`);
  console.error(`  DATABASE_NAME=${DB_CONFIG.DATABASE_NAME}`);
  console.error(`  DATABASE_USER=${DB_CONFIG.DATABASE_USER}`);
  console.error(`  DATABASE_PASSWORD=${DB_CONFIG.DATABASE_PASSWORD}`);
}

// Path to webp_images directory (relative to project root)
const WEBP_IMAGES_DIR = path.resolve(process.cwd(), 'webp_images');

/**
 * Get all WebP image files from directory
 */
function getImageFiles(): string[] {
  if (!fs.existsSync(WEBP_IMAGES_DIR)) {
    console.error(`❌ Error: Directory not found: ${WEBP_IMAGES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(WEBP_IMAGES_DIR)
    .filter(file => file.toLowerCase().endsWith('.webp'))
    .map(file => path.join(WEBP_IMAGES_DIR, file))
    .sort(); // Sort for consistent processing order

  return files;
}

/**
 * Extract metadata from filename
 * Example: image_001.webp -> { description: "Image 001", number: 1 }
 */
function extractMetadata(filename: string): { description: string; number: number } {
  const basename = path.basename(filename, '.webp');
  const match = basename.match(/image[_\s]*(\d+)/i);
  
  if (match) {
    const number = parseInt(match[1], 10);
    return {
      description: `Image ${number.toString().padStart(3, '0')}`,
      number,
    };
  }
  
  // Fallback: use filename without extension
  return {
    description: basename.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    number: 0,
  };
}

/**
 * Generate tags based on image number (for categorization)
 */
function generateTags(imageNumber: number): { tag1: string | null; tag2: string | null; tag3: string | null } {
  // Simple categorization based on number ranges
  const categories = [
    'Nature', 'Urban', 'Abstract', 'Portrait', 'Landscape',
    'Architecture', 'Food', 'Travel', 'Art', 'Technology'
  ];
  
  const tag1 = categories[imageNumber % categories.length];
  const tag2 = imageNumber % 2 === 0 ? 'Featured' : null;
  const tag3 = imageNumber % 3 === 0 ? 'Popular' : null;
  
  return { tag1, tag2, tag3 };
}

/**
 * Upload a single image
 */
async function uploadImage(filePath: string, index: number, total: number, insertImageFn: typeof import('../lib/images').insertImage): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    // Read image file
    const imageBuffer = fs.readFileSync(filePath);
    
    // Extract metadata from filename
    const { description, number } = extractMetadata(filePath);
    const tags = generateTags(number);
    
    // Prepare metadata for database
    const metadata = {
      description,
      tag1: tags.tag1,
      tag2: tags.tag2,
      tag3: tags.tag3,
      status: 'approved', // Set status to approved for bulk uploads
    };
    
    // Insert image (automatically processes: WebP conversion, thumbnail, blurhash)
    const result = await insertImageFn(imageBuffer, metadata);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Unknown error',
      };
    }
    
    return {
      success: true,
      id: result.data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Ensure table exists before uploading
 */
async function ensureTableExists() {
  const { getPool } = await import('../lib/db');
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // Check if table exists
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'generated_images'
      )
    `);
    
    if (!result.rows[0].exists) {
      console.log('📋 Table generated_images does not exist. Creating it...\n');
      
      // Create the table
      await client.query(`
        CREATE TABLE generated_images (
          id BIGSERIAL PRIMARY KEY,
          description TEXT,
          tag1 VARCHAR(255),
          tag2 VARCHAR(255),
          tag3 VARCHAR(255),
          status VARCHAR(50) DEFAULT 'pending',
          image_data BYTEA,
          thumbnail_data BYTEA,
          image_mime_type VARCHAR(50) DEFAULT 'image/webp',
          image_width INTEGER,
          image_height INTEGER,
          image_size BIGINT,
          blurhash VARCHAR(100),
          is_deleted BOOLEAN DEFAULT false,
          deleted_at TIMESTAMP,
          view_count INTEGER DEFAULT 0,
          downloads INTEGER DEFAULT 0,
          last_viewed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_generated_images_created_at 
        ON generated_images(created_at DESC)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_generated_images_status_created 
        ON generated_images(status, created_at DESC)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_generated_images_is_deleted 
        ON generated_images(is_deleted) WHERE is_deleted = false
      `);
      
      console.log('✅ Table created successfully!\n');
    } else {
      console.log('✅ Table generated_images already exists.');
      
      // Check and update blurhash column size if needed
      try {
        const columnCheck = await client.query(`
          SELECT character_maximum_length 
          FROM information_schema.columns 
          WHERE table_name = 'generated_images' 
          AND column_name = 'blurhash'
        `);
        
        if (columnCheck.rows.length > 0 && columnCheck.rows[0].character_maximum_length < 100) {
          console.log('📋 Updating blurhash column size to VARCHAR(100)...');
          await client.query(`
            ALTER TABLE generated_images 
            ALTER COLUMN blurhash TYPE VARCHAR(100)
          `);
          console.log('✅ Blurhash column updated successfully!\n');
        } else {
          console.log('✅ Blurhash column size is correct.\n');
        }
      } catch (alterError) {
        console.log('⚠️  Could not check/update blurhash column (this is okay if column doesn\'t exist yet)\n');
      }
    }
  } catch (error) {
    console.error('❌ Error checking/creating table:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Main upload function
 */
async function uploadAllImages() {
  // Ensure table exists first
  await ensureTableExists();
  
  // Dynamically import after env vars are set
  const { insertImage } = await import('../lib/images');
  
  console.log('🚀 Starting bulk image upload...\n');
  console.log('📋 Database Configuration:');
  console.log(`   Host: ${process.env.DATABASE_HOST}`);
  console.log(`   Database: ${process.env.DATABASE_NAME}`);
  console.log(`   User: ${process.env.DATABASE_USER}`);
  console.log(`   Port: ${process.env.DATABASE_PORT || '5432'}\n`);
  
  // Get all image files
  const imageFiles = getImageFiles();
  const totalImages = imageFiles.length;
  
  if (totalImages === 0) {
    console.log('⚠️  No WebP images found in webp_images/ directory');
    console.log(`   Checked directory: ${WEBP_IMAGES_DIR}`);
    process.exit(0);
  }
  
  console.log(`📊 Found ${totalImages} images to upload\n`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;
  const errors: Array<{ file: string; error: string }> = [];
  
  // Process images in batches to avoid overwhelming the database
  const BATCH_SIZE = 5; // Process 5 images at a time
  
  for (let i = 0; i < totalImages; i += BATCH_SIZE) {
    const batch = imageFiles.slice(i, i + BATCH_SIZE);
    
    // Process batch in parallel
    const results = await Promise.all(
      batch.map((file, batchIndex) => {
        const globalIndex = i + batchIndex + 1;
        return uploadImage(file, globalIndex, totalImages, insertImage);
      })
    );
    
    // Process results
    batch.forEach((file, batchIndex) => {
      const globalIndex = i + batchIndex + 1;
      const result = results[batchIndex];
      const filename = path.basename(file);
      
      if (result.success) {
        successCount++;
        const percentage = ((globalIndex / totalImages) * 100).toFixed(1);
        console.log(
          `✅ [${globalIndex}/${totalImages}] (${percentage}%) ${filename} → ID: ${result.id}`
        );
      } else {
        failCount++;
        errors.push({ file: filename, error: result.error || 'Unknown error' });
        console.error(
          `❌ [${globalIndex}/${totalImages}] ${filename} → Error: ${result.error}`
        );
      }
    });
    
    // Small delay between batches to avoid overwhelming the database
    if (i + BATCH_SIZE < totalImages) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Upload Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successfully uploaded: ${successCount} images`);
  console.log(`❌ Failed: ${failCount} images`);
  console.log(`⏱️  Total time: ${duration} seconds`);
  if (successCount > 0) {
    console.log(`📈 Average: ${(parseFloat(duration) / successCount).toFixed(2)} seconds per image`);
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(({ file, error }) => {
      console.log(`   - ${file}: ${error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (successCount === totalImages) {
    console.log('🎉 All images uploaded successfully!');
  } else if (successCount > 0) {
    console.log(`⚠️  Uploaded ${successCount} out of ${totalImages} images`);
  } else {
    console.log('❌ No images were uploaded. Please check the errors above.');
    process.exit(1);
  }
}

// Run the upload
uploadAllImages()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
