/**
 * User management utilities
 * For production, consider using a proper authentication library
 */

import { getPool } from './db';
import { validateString } from './validation';
import * as crypto from 'crypto';

export interface User {
  id: number;
  email: string;
  name?: string;
  auth_provider?: 'email' | 'google';
  firebase_uid?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

/**
 * Hash password using SHA-256 (for demo - use bcrypt in production)
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify password
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Create a new user
 */
export async function createUser(email: string, password: string, name?: string) {
  const pool = getPool();
  try {
    const validatedEmail = validateString(email, 255);
    const validatedName = name ? validateString(name, 100) : null;
    const passwordHash = hashPassword(password);
    
    const client = await pool.connect();
    
    const result = await client.query(
      `INSERT INTO users (email, password_hash, name, auth_provider) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, name, auth_provider, created_at, updated_at`,
      [validatedEmail, passwordHash, validatedName, 'email']
    );
    
    client.release();
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'User with this email already exists',
      };
    }
    
    return {
      success: true,
      data: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        name: result.rows[0].name,
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at,
      },
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Authenticate user
 */
export async function authenticateUser(email: string, password: string) {
  const pool = getPool();
  try {
    const validatedEmail = validateString(email, 255);
    const client = await pool.connect();
    
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [validatedEmail]
    );
    
    client.release();
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }
    
    const user = result.rows[0];
    const isValid = verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }
    
    // Update last login
    await updateLastLogin(user.id);
    
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update last login timestamp
 */
async function updateLastLogin(userId: number) {
  const pool = getPool();
  try {
    const client = await pool.connect();
    await client.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
    client.release();
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number) {
  const pool = getPool();
  try {
    const client = await pool.connect();
    
    const result = await client.query(
      'SELECT id, email, name, auth_provider, firebase_uid, created_at, updated_at, last_login FROM users WHERE id = $1',
      [userId]
    );
    
    client.release();
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'User not found',
      };
    }
    
    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user by Firebase UID
 */
export async function getUserByFirebaseUid(firebaseUid: string) {
  const pool = getPool();
  try {
    const validatedUid = validateString(firebaseUid, 255);
    const client = await pool.connect();
    
    const result = await client.query(
      'SELECT id, email, name, auth_provider, firebase_uid, created_at, updated_at, last_login FROM users WHERE firebase_uid = $1',
      [validatedUid]
    );
    
    client.release();
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'User not found',
      };
    }
    
    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error('Error fetching user by Firebase UID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a new Google-authenticated user
 */
export async function createGoogleUser(email: string, firebaseUid: string, name?: string) {
  const pool = getPool();
  try {
    const validatedEmail = validateString(email, 255);
    const validatedUid = validateString(firebaseUid, 255);
    const validatedName = name ? validateString(name, 100) : null;
    
    const client = await pool.connect();
    
    // Check if user with this email already exists
    const existingUser = await client.query(
      'SELECT id, auth_provider, firebase_uid FROM users WHERE email = $1',
      [validatedEmail]
    );
    
    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      // If user exists but doesn't have Firebase UID, update it
      if (!existing.firebase_uid) {
        await client.query(
          'UPDATE users SET firebase_uid = $1, auth_provider = $2, name = COALESCE($3, name), updated_at = CURRENT_TIMESTAMP WHERE id = $4',
          [validatedUid, 'google', validatedName, existing.id]
        );
        client.release();
        return {
          success: true,
          data: {
            id: existing.id,
            email: validatedEmail,
            name: validatedName || existing.name,
            auth_provider: 'google' as const,
            firebase_uid: validatedUid,
          },
        };
      }
      client.release();
      return {
        success: false,
        error: 'User with this email already exists',
      };
    }
    
    // Create new user
    const result = await client.query(
      `INSERT INTO users (email, firebase_uid, name, auth_provider, password_hash) 
       VALUES ($1, $2, $3, $4, NULL) 
       RETURNING id, email, name, auth_provider, firebase_uid, created_at, updated_at`,
      [validatedEmail, validatedUid, validatedName, 'google']
    );
    
    client.release();
    
    return {
      success: true,
      data: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        name: result.rows[0].name,
        auth_provider: result.rows[0].auth_provider,
        firebase_uid: result.rows[0].firebase_uid,
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at,
      },
    };
  } catch (error) {
    console.error('Error creating Google user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Authenticate Google user
 */
export async function authenticateGoogleUser(firebaseUid: string, email: string) {
  const pool = getPool();
  try {
    const validatedUid = validateString(firebaseUid, 255);
    const validatedEmail = validateString(email, 255);
    const client = await pool.connect();
    
    // Try to find user by Firebase UID first
    let result = await client.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [validatedUid]
    );
    
    // If not found by UID, try by email (for users who might have signed up with email first)
    if (result.rows.length === 0) {
      result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [validatedEmail]
      );
      
      // If found by email, update with Firebase UID
      if (result.rows.length > 0) {
        await client.query(
          'UPDATE users SET firebase_uid = $1, auth_provider = $2, updated_at = CURRENT_TIMESTAMP WHERE email = $3',
          [validatedUid, 'google', validatedEmail]
        );
        // Re-fetch updated user
        result = await client.query(
          'SELECT * FROM users WHERE email = $1',
          [validatedEmail]
        );
      }
    }
    
    client.release();
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'User not found',
      };
    }
    
    const user = result.rows[0];
    
    // Update last login
    await updateLastLogin(user.id);
    
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        auth_provider: user.auth_provider || 'google',
        firebase_uid: user.firebase_uid,
        created_at: user.created_at,
      },
    };
  } catch (error) {
    console.error('Error authenticating Google user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
