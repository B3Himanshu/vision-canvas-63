import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  }, {
    headers: {
      'Set-Cookie': 'session_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
    },
  });
}
