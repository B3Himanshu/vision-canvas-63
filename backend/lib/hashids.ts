/**
 * Hashids utility for encoding/decoding image IDs
 * Provides secure, non-sequential IDs like "a3xK9m" instead of "96"
 * 
 * Benefits:
 * - Short URLs: /image/a3xK9m instead of /image/96
 * - Non-sequential: Can't guess next image ID
 * - Reversible: Can decode back to database ID
 * - Secure: Uses salt to prevent reverse engineering
 */

import Hashids from 'hashids';

// Use a secret salt from environment or default (should be set in production)
const SALT = process.env.HASHIDS_SALT || 'pixelvault-secret-salt-change-in-production';
const MIN_LENGTH = 6; // Minimum length of hash (shorter = less secure but cleaner URLs)

// Create Hashids instance with salt and minimum length
const hashids = new Hashids(SALT, MIN_LENGTH);

/**
 * Encode a numeric ID to a hash string
 * @param id - Database ID (number)
 * @returns Hash string (e.g., "a3xK9m")
 */
export function encodeId(id: number): string {
  if (!id || id <= 0) {
    throw new Error('Invalid ID: must be a positive number');
  }
  return hashids.encode(id);
}

/**
 * Decode a hash string back to numeric ID
 * @param hash - Hash string (e.g., "a3xK9m")
 * @returns Database ID (number) or null if invalid
 */
export function decodeId(hash: string): number | null {
  if (!hash || typeof hash !== 'string') {
    return null;
  }
  
  try {
    const decoded = hashids.decode(hash);
    if (decoded.length === 0) {
      return null;
    }
    return decoded[0] as number;
  } catch (error) {
    console.error('Error decoding hash:', error);
    return null;
  }
}

/**
 * Validate if a hash string is valid
 * @param hash - Hash string to validate
 * @returns true if valid, false otherwise
 */
export function isValidHash(hash: string): boolean {
  return decodeId(hash) !== null;
}
