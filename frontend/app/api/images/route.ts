import { NextRequest, NextResponse } from 'next/server';
import { getImages, getImagesCount } from '@/backend/lib/images';
import { checkRateLimit, getClientIdentifier } from '../rate-limit';
import { log, trackPerformance } from '@/lib/monitoring';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, { windowMs: 60000, maxRequests: 100 });
    
    if (!rateLimit.success) {
      log('WARN', 'Rate limit exceeded', { clientId });
      return NextResponse.json(
        { success: false, error: rateLimit.error },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Extract and validate query parameters
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('q') || searchParams.get('search') || undefined;
    const orientation = searchParams.get('orientation') || 'all';
    const sort = (searchParams.get('sort') || 'recent') as 'recent' | 'popular' | 'trending';
    const limit = parseInt(searchParams.get('limit') || '40', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Parse tags from query string
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : undefined;

    // Fetch images with filters
    let result;
    try {
      result = await getImages({
        category,
        search,
        orientation: orientation as 'landscape' | 'portrait' | 'square' | 'all',
        tags,
        sort,
        limit,
        offset,
      });
    } catch (dbError) {
      console.error('❌ Database error in getImages:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database query failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
        },
        { status: 500 }
      );
    }

    if (!result.success) {
      console.error('❌ getImages returned error:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to fetch images',
          details: result.error,
        },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const countResult = await getImagesCount({
      category,
      search,
      orientation: orientation as 'landscape' | 'portrait' | 'square' | 'all',
      tags,
    });

    const duration = Date.now() - startTime;
    trackPerformance('api.images.get', duration);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: countResult.success ? countResult.count : 0,
        limit,
        offset,
        hasMore: countResult.success ? offset + limit < countResult.count : false,
      },
    }, {
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    trackPerformance('api.images.get.error', duration);
    
    // Log full error details for debugging
    console.error('❌ API Error in /api/images:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    log('ERROR', 'API Error in /api/images', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}
