/**
 * Create generated_images table if it doesn't exist
 * This script ensures the table is created before uploading images
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Database configuration - uses environment variables from .env.local
// These are fallback defaults - should be overridden by .env.local
const DB_CONFIG = {
  DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',
  DATABASE_PORT: process.env.DATABASE_PORT || '5432',
  DATABASE_NAME: process.env.DATABASE_NAME || 'images',
  DATABASE_USER: process.env.DATABASE_USER || 'postgres',
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || '',
  DATABASE_SSL: process.env.DATABASE_SSL || 'false',
  DATABASE_CONNECTION_TIMEOUT: process.env.DATABASE_CONNECTION_TIMEOUT || '10000',
  DATABASE_STATEMENT_TIMEOUT: process.env.DATABASE_STATEMENT_TIMEOUT || '120000',
};

// Set environment variables FIRST
Object.entries(DB_CONFIG).forEach(([key, value]) => {
  process.env[key] = value;
});

// Load from .env.local if exists
const rootEnvPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

async function createTable() {
  // Now import after env vars are set
  const { getPool } = await import('../lib/db');
  console.log('🔧 Creating generated_images table if it doesn\'t exist...\n');
  
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // Create the generated_images table with all required columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS generated_images (
        id BIGSERIAL PRIMARY KEY,
        description TEXT,
        tag1 VARCHAR(255),
        tag2 VARCHAR(255),
        tag3 VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        image_data BYTEA,
        thumbnail_data BYTEA,
        image_mime_type VARCHAR(50) DEFAULT 'image/webp',
        image_width INTEGER,
        image_height INTEGER,
        image_size BIGINT,
        blurhash VARCHAR(100),
        is_deleted BOOLEAN DEFAULT false,
        deleted_at TIMESTAMP,
        view_count INTEGER DEFAULT 0,
        downloads INTEGER DEFAULT 0,
        last_viewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_generated_images_created_at 
      ON generated_images(created_at DESC)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_generated_images_status_created 
      ON generated_images(status, created_at DESC)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_generated_images_is_deleted 
      ON generated_images(is_deleted) WHERE is_deleted = false
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_generated_images_blurhash 
      ON generated_images(blurhash) WHERE blurhash IS NOT NULL
    `);
    
    console.log('✅ Table generated_images created successfully!');
    console.log('✅ Indexes created successfully!\n');
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
    throw error;
  } finally {
    client.release();
  }
}

createTable()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
