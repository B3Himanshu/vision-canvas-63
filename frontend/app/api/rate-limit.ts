/**
 * Simple rate limiting middleware for API routes
 * In production, consider using a more robust solution like Redis
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

/**
 * Check rate limit for a given identifier (IP, user ID, etc.)
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60000, maxRequests: 100 }
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  
  if (!store[key] || store[key].resetTime < now) {
    // Create new entry or reset expired entry
    store[key] = {
      count: 1,
      resetTime: now + options.windowMs,
    };
    return {
      success: true,
      remaining: options.maxRequests - 1,
      resetTime: store[key].resetTime,
    };
  }

  if (store[key].count >= options.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: store[key].resetTime,
      error: 'Rate limit exceeded. Please try again later.',
    };
  }

  store[key].count++;
  return {
    success: true,
    remaining: options.maxRequests - store[key].count,
    resetTime: store[key].resetTime,
  };
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  return ip.trim();
}
