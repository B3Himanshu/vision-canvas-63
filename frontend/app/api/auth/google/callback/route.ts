import { NextRequest, NextResponse } from 'next/server';
import { generateSessionToken } from '@/lib/auth';
import { createGoogleUser, authenticateGoogleUser, getUserByFirebaseUid } from '@/backend/lib/users';
import { checkRateLimit, getClientIdentifier } from '../../../rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/google/callback
 * Handles Google OAuth callback and creates/authenticates user
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, { windowMs: 60000, maxRequests: 10 });
    
    if (!rateLimit.success) {
      return NextResponse.redirect(new URL('/?error=rate_limit', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
    }

    // Verify state for CSRF protection
    const storedState = request.cookies.get('oauth_state')?.value;
    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
    }

    // Decode state to get return URL and pending download/favorite
    let returnUrl = '/';
    let pendingDownload: string | null = null;
    let pendingFavorite: string | null = null;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
      returnUrl = stateData.returnUrl || '/';
      pendingDownload = stateData.pendingDownload || null;
      pendingFavorite = stateData.pendingFavorite || null;
      
      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[OAuth Callback] Decoded returnUrl:', returnUrl);
        console.log('[OAuth Callback] Decoded pendingDownload:', pendingDownload);
        console.log('[OAuth Callback] Decoded pendingFavorite:', pendingFavorite);
      }
    } catch (e) {
      // If state parsing fails, use default return URL
      console.warn('Failed to parse OAuth state, using default return URL', e);
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    // Validate Google OAuth configuration
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
    
    if (!googleClientId || !googleClientSecret) {
      console.error('Google OAuth credentials not configured:', {
        hasClientId: !!googleClientId,
        hasClientSecret: !!googleClientSecret,
      });
      return NextResponse.redirect(new URL('/?error=oauth_not_configured', request.url));
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: googleRedirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenResponse.json();
    const { access_token, id_token } = tokenData;

    if (!access_token || !id_token) {
      return NextResponse.redirect(new URL('/?error=no_tokens', request.url));
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(new URL('/?error=user_info_failed', request.url));
    }

    const userInfo = await userInfoResponse.json();
    const { id: googleId, email, name } = userInfo;

    if (!email) {
      return NextResponse.redirect(new URL('/?error=no_email', request.url));
    }

    // Check if user exists
    const existingUser = await getUserByFirebaseUid(googleId);
    
    let user;
    if (existingUser.success) {
      // User exists, authenticate them
      const authResult = await authenticateGoogleUser(googleId, email);
      if (!authResult.success) {
        return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
      }
      user = authResult.data!;
    } else {
      // User doesn't exist, create new user
      const createResult = await createGoogleUser(email, googleId, name || undefined);
      if (!createResult.success) {
        // If user exists with same email but different auth method, try to authenticate
        if (createResult.error?.includes('already exists')) {
          const authResult = await authenticateGoogleUser(googleId, email);
          if (authResult.success) {
            user = authResult.data!;
          } else {
            return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
          }
        } else {
          return NextResponse.redirect(new URL('/?error=user_creation_failed', request.url));
        }
      } else {
        user = createResult.data!;
      }
    }

    // Generate session token
    const token = generateSessionToken(String(user.id));

    // Build redirect URL with pending download info if available
    // Handle both absolute and relative URLs
    let redirectUrl: URL;
    if (returnUrl.startsWith('http://') || returnUrl.startsWith('https://')) {
      redirectUrl = new URL(returnUrl);
    } else {
      // Relative URL - construct from request origin
      const baseUrl = new URL(request.url);
      redirectUrl = new URL(returnUrl, `${baseUrl.protocol}//${baseUrl.host}`);
    }
    
    if (pendingDownload) {
      redirectUrl.searchParams.set('download', pendingDownload);
      redirectUrl.searchParams.set('auth', 'success');
    } else if (pendingFavorite) {
      // For pending favorite, add auth=success to indicate OAuth return for favoriting
      redirectUrl.searchParams.set('auth', 'success');
      // The image ID is already in the returnUrl path for /image/[id] or as a query param for /gallery
      // No need to add a separate 'favorite' param, just 'auth=success' is enough to trigger the useEffect
    }
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[OAuth Callback] Final redirect URL:', redirectUrl.toString());
    }

    // Clear OAuth state cookie
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('oauth_state');
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=callback_failed', request.url));
  }
}
