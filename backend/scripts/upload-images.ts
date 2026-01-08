/**
 * Bulk Image Upload Script
 * 
 * Uploads all WebP images from webp_images/ directory to the database
 * 
 * Features:
 * - Reads all .webp files from webp_images/ directory
 * - Processes each image (generates thumbnail, blurhash, resizes)
 * - Inserts into generated_images table
 * - Shows progress and statistics
 * 
 * Usage: 
 *   npx tsx backend/scripts/upload-images.ts
 *   OR
 *   cd backend && npm run upload:images (if script is added to package.json)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { insertImage } from '../lib/images';

// Load environment variables
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
  // You can customize this logic
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
async function uploadImage(filePath: string, index: number, total: number): Promise<{ success: boolean; id?: number; error?: string }> {
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
    const result = await insertImage(imageBuffer, metadata);
    
    if (!result.success || !result.data) {
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
 * Main upload function
 */
async function uploadAllImages() {
  console.log('🚀 Starting bulk image upload...\n');
  
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
        return uploadImage(file, globalIndex, totalImages);
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
