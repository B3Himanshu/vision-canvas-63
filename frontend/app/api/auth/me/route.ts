import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest, isAuthenticated } from '@/lib/auth';
import { getUserById } from '@/backend/lib/users';

export async function GET(request: NextRequest) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = getUserIdFromRequest(request);
    const userIdNum = parseInt(userId, 10);

    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Fetch full user data from database
    const userResult = await getUserById(userIdNum);

    if (!userResult.success || !userResult.data) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: userResult.data.id,
        email: userResult.data.email,
        name: userResult.data.name,
        auth_provider: userResult.data.auth_provider || 'email',
        picture: null, // Picture is not stored in DB, can be fetched from Google if needed
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication check failed',
      },
      { status: 500 }
    );
  }
}
