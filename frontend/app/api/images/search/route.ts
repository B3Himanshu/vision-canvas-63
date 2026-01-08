import { NextRequest, NextResponse } from 'next/server';
import { getImages, getImagesCount } from '@/backend/lib/images';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const search = searchParams.get('q') || searchParams.get('search');
    if (!search) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await getImages({
      search,
      limit,
      offset,
      sort: 'recent',
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    const countResult = await getImagesCount({ search });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: countResult.success ? countResult.count : 0,
        limit,
        offset,
        hasMore: countResult.success ? offset + limit < countResult.count : false,
      },
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
