/**
 * Database migration runner
 * Executes SQL migration files in order
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
// Check multiple locations: root, frontend directory, or .env fallback
const rootEnvPath = path.join(__dirname, '../../.env.local');
const frontendEnvPath = path.join(__dirname, '../../frontend/.env.local');
const rootEnvFallback = path.join(__dirname, '../../.env');

let envLoaded = false;
if (fs.existsSync(rootEnvPath)) {
  const result = dotenv.config({ path: rootEnvPath, override: true });
  if (result.error) {
    console.error('Error loading .env.local:', result.error);
  } else {
    console.log('Loaded environment variables from root .env.local');
    envLoaded = true;
  }
} else if (fs.existsSync(frontendEnvPath)) {
  const result = dotenv.config({ path: frontendEnvPath, override: true });
  if (result.error) {
    console.error('Error loading frontend/.env.local:', result.error);
  } else {
    console.log('Loaded environment variables from frontend/.env.local');
    envLoaded = true;
  }
} else if (fs.existsSync(rootEnvFallback)) {
  const result = dotenv.config({ path: rootEnvFallback, override: true });
  if (result.error) {
    console.error('Error loading .env:', result.error);
  } else {
    console.log('Loaded environment variables from root .env');
    envLoaded = true;
  }
} else {
  console.warn('No .env.local or .env file found. Using system environment variables.');
}

// Debug: Check if database variables are loaded (without showing sensitive values)
if (envLoaded) {
  console.log('Database config check:');
  console.log('  DATABASE_HOST:', process.env.DATABASE_HOST ? '✓ Set' : '✗ Missing');
  console.log('  DATABASE_NAME:', process.env.DATABASE_NAME ? '✓ Set' : '✗ Missing');
  console.log('  DATABASE_USER:', process.env.DATABASE_USER ? '✓ Set' : '✗ Missing');
  console.log('  DATABASE_PASSWORD:', process.env.DATABASE_PASSWORD ? '✓ Set' : '✗ Missing');
}

import { getPool } from '../lib/db';

interface Migration {
  version: string;
  filename: string;
  sql: string;
}

async function runMigrations() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get already applied migrations
    const appliedResult = await client.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(appliedResult.rows.map((r: any) => r.version));

    // Read migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files`);

    for (const file of files) {
      const version = file.replace('.sql', '');
      
      if (appliedVersions.has(version)) {
        console.log(`✓ Migration ${version} already applied, skipping`);
        continue;
      }

      console.log(`Running migration ${version}...`);
      
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Execute migration
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`✓ Migration ${version} applied successfully`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

export { runMigrations };
