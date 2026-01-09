/**
 * Image Processing Utilities
 * Functions for converting images to WebP and generating BlurHash
 */

import sharp from 'sharp';
import { encode } from 'blurhash';

// BlurHash configuration
const BLURHASH_COMPONENT_X = 4;
const BLURHASH_COMPONENT_Y = 4;

// Image size limits
export const FULL_IMAGE_MAX_SIZE = undefined; // No size limit - preserve original HD quality
export const THUMBNAIL_SIZE = 150; // Thumbnail width and height

export interface ProcessedImage {
  blurhash: string;
  thumbnailWebP: Buffer;
  imageWebP: Buffer;
  originalImage: Buffer; // Original image in its native format (PNG/JPG)
  originalMimeType: string; // Original MIME type (image/png, image/jpeg, etc.)
  width: number;
  height: number;
  originalSize: number;
}

/**
 * Generate BlurHash from image buffer
 */
export async function generateBlurHash(imageBuffer: Buffer): Promise<string> {
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
export async function convertToWebP(
  imageBuffer: Buffer,
  maxSize?: number,
  exactSize?: number
): Promise<Buffer> {
  try {
    let sharpInstance = sharp(imageBuffer);

    // Convert to WebP format
    // Use higher quality for full images (when exactSize not set), lower for thumbnails
    const webpQuality = exactSize ? 85 : 92; // Higher quality (92) for original HD images, lower (85) for thumbnails
    sharpInstance = sharpInstance.toFormat('webp', {
      quality: webpQuality,
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
 * Resize image to specific dimensions while maintaining highest quality (PNG/JPG)
 * @param imageBuffer - Original image buffer
 * @param width - Target width
 * @param height - Target height
 * @param format - Output format ('png' or 'jpeg')
 * @returns Resized image buffer in original format
 */
export async function resizeToDimensions(
  imageBuffer: Buffer,
  width: number,
  height: number,
  format: 'png' | 'jpeg' = 'jpeg'
): Promise<Buffer> {
  try {
    let sharpInstance = sharp(imageBuffer);

    // Resize to exact dimensions with highest quality
    sharpInstance = sharpInstance.resize(width, height, {
      fit: 'cover', // Cover the entire area, may crop
      position: 'center', // Center the crop
      withoutEnlargement: false, // Allow upscaling if needed
    });

    // Convert to format with highest quality settings
    if (format === 'png') {
      // PNG: Lossless compression
      sharpInstance = sharpInstance.png({
        compressionLevel: 6, // Good balance (0-9, 6 is default)
        quality: 100, // Maximum quality
      });
    } else {
      // JPEG: Highest quality
      sharpInstance = sharpInstance.jpeg({
        quality: 100, // Maximum quality (no compression loss)
        mozjpeg: true, // Use mozjpeg for better compression at same quality
      });
    }

    return await sharpInstance.toBuffer();
  } catch (error) {
    console.error('Error resizing image:', error);
    throw error;
  }
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(imageBuffer: Buffer): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    throw error;
  }
}

/**
 * Detect MIME type from image buffer
 */
export async function detectMimeType(imageBuffer: Buffer): Promise<string> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const format = metadata.format;
    
    // Map sharp format to MIME type
    const mimeTypeMap: Record<string, string> = {
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'tiff': 'image/tiff',
      'bmp': 'image/bmp',
    };
    
    return mimeTypeMap[format || 'jpeg'] || 'image/jpeg';
  } catch (error) {
    console.error('Error detecting MIME type:', error);
    return 'image/jpeg'; // Default fallback
  }
}

/**
 * Process uploaded image: Convert to WebP + Generate BlurHash + Preserve Original
 * 
 * This is the main function to use for processing new uploads
 * Preserves original image for highest quality downloads
 */
export async function processUploadedImage(imageBuffer: Buffer): Promise<ProcessedImage> {
  try {
    // Get original dimensions and size
    const { width, height } = await getImageDimensions(imageBuffer);
    const originalSize = imageBuffer.length;
    
    // Detect original MIME type
    const originalMimeType = await detectMimeType(imageBuffer);

    // Generate BlurHash (use original image for better quality)
    const blurhash = await generateBlurHash(imageBuffer);

    // Convert to WebP formats in parallel for better performance
    // Preserve original image buffer for highest quality downloads
    const [thumbnailWebP, imageWebP] = await Promise.all([
      convertToWebP(imageBuffer, undefined, THUMBNAIL_SIZE), // Thumbnail: 150x150
      convertToWebP(imageBuffer, undefined), // Full image: original HD quality (no size limit)
    ]);

    return {
      blurhash,
      thumbnailWebP,
      imageWebP,
      originalImage: imageBuffer, // Preserve original for highest quality downloads
      originalMimeType, // Store original format (PNG/JPG/etc)
      width,
      height,
      originalSize,
    };
  } catch (error) {
    console.error('Error processing uploaded image:', error);
    throw error;
  }
}
