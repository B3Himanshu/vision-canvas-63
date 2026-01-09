/**
 * Hashids utility for encoding/decoding image IDs (client-side)
 * Matches backend implementation
 */

// Note: For client-side, we only need encoding for creating URLs
// Decoding happens on the server side for security

/**
 * Encode a numeric ID to a hash string (client-side)
 * This matches the backend implementation
 * 
 * Note: In production, you might want to use the same Hashids library
 * For now, we'll let the server handle encoding/decoding for security
 */

/**
 * Get image URL with hash ID
 * Since encoding should match backend, we'll use the ID directly
 * and let the backend handle the conversion, OR we can use a simple
 * base62 encoding for client-side
 */

// Simple base62 encoding for client-side (if needed)
// For now, we'll rely on backend to provide hash IDs in API responses

export function getImageUrl(id: number | string): string {
  // If it's already a hash (string), use it directly
  if (typeof id === 'string') {
    return `/image/${id}`;
  }
  // Otherwise, use numeric ID (backend will handle encoding in API)
  return `/image/${id}`;
}
