/**
 * Database connection retry logic and error handling
 */

import { Pool } from 'pg';
import { getPool } from './db';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Retry a database operation with exponential backoff
 */
export async function retryDbOperation<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }

    // Check if error is retryable
    const isRetryable = error instanceof Error && (
      error.message.includes('connection') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND')
    );

    if (!isRetryable) {
      throw error;
    }

    console.warn(`Database operation failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
    
    // Wait before retrying with exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryDbOperation(operation, retries - 1, delay * 2);
  }
}

/**
 * Test database connection with retry logic
 */
export async function testConnectionWithRetry() {
  return retryDbOperation(async () => {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return { success: true };
    } finally {
      client.release();
    }
  });
}

/**
 * Execute a query with retry logic
 */
export async function queryWithRetry<T = any>(
  query: string,
  params?: any[]
): Promise<T[]> {
  return retryDbOperation(async () => {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  });
}
