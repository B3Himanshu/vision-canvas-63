/**
 * Simple authentication utilities
 * For production, consider using NextAuth.js, Auth0, or similar
 */

/**
 * Generate a simple session token (for demo purposes)
 * In production, use proper JWT or session management
 */
export function generateSessionToken(userId: string): string {
  // Simple token generation (replace with proper JWT in production)
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return Buffer.from(`${userId}:${timestamp}:${random}`).toString('base64');
}

/**
 * Verify session token
 */
export function verifySessionToken(token: string): { userId: string; valid: boolean } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId] = decoded.split(':');
    return { userId, valid: !!userId };
  } catch {
    return { userId: '', valid: false };
  }
}

/**
 * Get user ID from request headers or cookies
 */
export function getUserIdFromRequest(request: Request): string {
  // Check for auth token in headers
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { userId, valid } = verifySessionToken(token);
    if (valid) return userId;
  }
  
  // Check for session token in cookies
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    if (cookies.session_token) {
      const { userId, valid } = verifySessionToken(cookies.session_token);
      if (valid) return userId;
    }
  }
  
  // Fallback to x-user-id header (for development)
  return request.headers.get('x-user-id') || 'anonymous';
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(request: Request): boolean {
  const userId = getUserIdFromRequest(request);
  return userId !== 'anonymous';
}
