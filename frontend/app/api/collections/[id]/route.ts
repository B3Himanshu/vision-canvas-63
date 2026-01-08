import { NextRequest, NextResponse } from 'next/server';
import { deleteCollection, addImageToCollection, removeImageFromCollection } from '@/backend/lib/collections';
import { checkRateLimit, getClientIdentifier } from '../../rate-limit';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, { windowMs: 60000, maxRequests: 50 });
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: rateLimit.error },
        { status: 429 }
      );
    }

    const id = parseInt(params.id, 10);
    const userId = request.headers.get('x-user-id') || 'anonymous';

    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid collection ID' },
        { status: 400 }
      );
    }

    const result = await deleteCollection(id, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes('not found') ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, { windowMs: 60000, maxRequests: 100 });
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: rateLimit.error },
        { status: 429 }
      );
    }

    const id = parseInt(params.id, 10);
    const body = await request.json();
    const { imageId, action } = body; // action: 'add' | 'remove'

    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid collection ID' },
        { status: 400 }
      );
    }

    if (!imageId || !action) {
      return NextResponse.json(
        { success: false, error: 'imageId and action are required' },
        { status: 400 }
      );
    }

    let result;
    if (action === 'add') {
      result = await addImageToCollection(id, imageId);
    } else if (action === 'remove') {
      result = await removeImageFromCollection(id, imageId);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "add" or "remove"' },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
