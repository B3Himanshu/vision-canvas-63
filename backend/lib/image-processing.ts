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
 * Process uploaded image: Convert to WebP + Generate BlurHash
 * 
 * This is the main function to use for processing new uploads
 */
export async function processUploadedImage(imageBuffer: Buffer): Promise<ProcessedImage> {
  try {
    // Get original dimensions and size
    const { width, height } = await getImageDimensions(imageBuffer);
    const originalSize = imageBuffer.length;

    // Generate BlurHash (use original image for better quality)
    const blurhash = await generateBlurHash(imageBuffer);

    // Convert to WebP formats in parallel for better performance
    const [thumbnailWebP, imageWebP] = await Promise.all([
      convertToWebP(imageBuffer, undefined, THUMBNAIL_SIZE), // Thumbnail: 150x150
      convertToWebP(imageBuffer, undefined), // Full image: original HD quality (no size limit)
    ]);

    return {
      blurhash,
      thumbnailWebP,
      imageWebP,
      width,
      height,
      originalSize,
    };
  } catch (error) {
    console.error('Error processing uploaded image:', error);
    throw error;
  }
}
