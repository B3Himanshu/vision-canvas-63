import { NextRequest, NextResponse } from 'next/server';
import { generateSessionToken } from '@/lib/auth';
import { checkRateLimit, getClientIdentifier } from '../../rate-limit';

/**
 * Simple login endpoint
 * In production, integrate with proper authentication service (NextAuth, Auth0, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, { windowMs: 60000, maxRequests: 10 });
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: rateLimit.error },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Simple validation (replace with proper authentication in production)
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // TODO: In production, verify credentials against database
    // For now, generate a session token
    const userId = email.split('@')[0]; // Simple user ID from email
    const token = generateSessionToken(userId);

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          email,
        },
      },
    }, {
      headers: {
        'Set-Cookie': `session_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Login failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
