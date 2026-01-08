import { NextRequest, NextResponse } from 'next/server';
import { insertImage } from '@/backend/lib/images';

export const dynamic = 'force-dynamic';

/**
 * POST /api/images/upload
 * Upload and process image: Auto-convert to WebP + Generate BlurHash
 * 
 * Automatically:
 * - Converts image to WebP format (85% quality)
 * - Creates thumbnail (150x150 WebP)
 * - Resizes full image (max 800x800 WebP)
 * - Generates BlurHash for instant preview
 * - Saves to database (generated_images table)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string || formData.get('title') as string;
    const category = formData.get('category') as string;
    const tags = formData.get('tags') as string;
    const status = formData.get('status') as string || 'pending';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const imageBuffer = Buffer.from(bytes);

    // Parse tags (comma-separated)
    const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    // Prepare metadata
    const metadata = {
      description: description || file.name,
      tag1: category || tagArray[0] || null,
      tag2: tagArray[1] || null,
      tag3: tagArray[2] || null,
      status,
    };

    // Insert image (automatically converts to WebP and generates BlurHash)
    const result = await insertImage(imageBuffer, metadata);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to process and save image',
        },
        { status: 500 }
      );
    }

    // Return success with image ID and metadata
    return NextResponse.json({
      success: true,
      data: {
        id: result.data.id,
        description: metadata.description,
        category: metadata.tag1,
        tags: [metadata.tag1, metadata.tag2, metadata.tag3].filter(Boolean),
        blurhash: result.data.blurhash,
        width: result.data.width,
        height: result.data.height,
        thumbnailSize: result.data.thumbnailSize,
        imageSize: result.data.imageSize,
        originalSize: result.data.originalSize,
        thumbnailUrl: `/api/images/${result.data.id}/thumbnail`,
        imageUrl: `/api/images/${result.data.id}/file`,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}
