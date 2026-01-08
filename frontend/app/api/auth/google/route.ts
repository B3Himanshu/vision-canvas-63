import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/google-oauth';
import { checkRateLimit, getClientIdentifier } from '../../rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow by redirecting to Google
 */
export async function GET(request: NextRequest) {
  try {
    // Validate Google OAuth configuration
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set');
      return NextResponse.json(
        { success: false, error: 'Google OAuth not configured. Please check environment variables.' },
        { status: 500 }
      );
    }

    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, { windowMs: 60000, maxRequests: 10 });
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: rateLimit.error },
        { status: 429 }
      );
    }

    // Get return URL from query parameter (where to redirect after login)
    const returnUrl = request.nextUrl.searchParams.get('returnUrl') || '/';
    const pendingDownload = request.nextUrl.searchParams.get('download'); // Format: imageId:format
    
    // Generate state for CSRF protection with return URL and pending download
    const stateData = {
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(7),
      returnUrl: returnUrl,
      pendingDownload: pendingDownload || null,
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

    // Store state in cookie for verification
    const authUrl = getGoogleAuthUrl(state);
    
    // Log for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('GOOGLE_CLIENT_ID =', googleClientId);
    }
    
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initiate Google login',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
