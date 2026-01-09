/**
 * Database Duplication Script
 * Replicates the entire database structure and data from source to target database
 * 
 * Usage:
 *   node duplicatescript.js
 * 
 * Make sure to set environment variables:
 *   SOURCE_DATABASE_HOST, SOURCE_DATABASE_NAME, SOURCE_DATABASE_USER, SOURCE_DATABASE_PASSWORD
 *   TARGET_DATABASE_HOST, TARGET_DATABASE_NAME, TARGET_DATABASE_USER, TARGET_DATABASE_PASSWORD
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Helper function to determine SSL configuration
function getSSLConfig(host, sslEnv) {
  // If SSL is explicitly set to false, disable it
  if (sslEnv === 'false' || sslEnv === false) {
    return false;
  }
  
  // For localhost, disable SSL by default
  if (host === 'localhost' || host === '127.0.0.1') {
    return false;
  }
  
  // For remote hosts, try SSL but don't reject unauthorized certificates
  // This handles both SSL-enabled and SSL-disabled servers
  return {
    rejectUnauthorized: false
  };
}

// Source database configuration (now using live database as source)
// If you want to copy from a different source, set SOURCE_DATABASE_* env vars
const sourceHost = process.env.SOURCE_DATABASE_HOST || process.env.DATABASE_HOST || '34.121.114.117';
const sourceSSL = process.env.SOURCE_DATABASE_SSL || process.env.DATABASE_SSL || 'true';

const sourceConfig = {
  host: sourceHost,
  port: parseInt(process.env.SOURCE_DATABASE_PORT || process.env.DATABASE_PORT || '5432'),
  database: process.env.SOURCE_DATABASE_NAME || process.env.DATABASE_NAME || 'images',
  user: process.env.SOURCE_DATABASE_USER || process.env.DATABASE_USER || 'postgres',
  password: process.env.SOURCE_DATABASE_PASSWORD || process.env.DATABASE_PASSWORD || '',
  ssl: getSSLConfig(sourceHost, sourceSSL)
};

// Target database configuration (new database)
const targetHost = process.env.TARGET_DATABASE_HOST || '34.121.114.117';
const targetSSL = process.env.TARGET_DATABASE_SSL || 'true'; // Default to true - server requires SSL

const targetConfig = {
  host: targetHost,
  port: parseInt(process.env.TARGET_DATABASE_PORT || '5432'),
  database: process.env.TARGET_DATABASE_NAME || 'images',
  user: process.env.TARGET_DATABASE_USER || 'postgres',
  password: process.env.TARGET_DATABASE_PASSWORD || '',
  // Enable SSL with rejectUnauthorized: false for Google Cloud SQL
  // The server requires encrypted connections (pg_hba.conf rejects unencrypted)
  ssl: targetSSL === 'false' ? false : {
    rejectUnauthorized: false // Accept self-signed certificates
  }
};

let sourcePool = null;
let targetPool = null;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  console.error(`${colors.red}❌ ${message}${colors.reset}`);
}

function success(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function info(message) {
  console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`);
}

function warning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

/**
 * Get connection pools
 */
function getPools() {
  if (!sourcePool) {
    sourcePool = new Pool(sourceConfig);
    sourcePool.on('error', (err) => {
      error(`Source database pool error: ${err.message}`);
    });
  }
  
  if (!targetPool) {
    targetPool = new Pool(targetConfig);
    targetPool.on('error', (err) => {
      error(`Target database pool error: ${err.message}`);
    });
  }
  
  return { sourcePool, targetPool };
}

/**
 * Create database if it doesn't exist
 */
async function createDatabaseIfNotExists() {
  log('\n🔨 Checking if target database exists...', 'blue');
  
  // Connect to postgres database to create the target database
  const adminConfig = {
    ...targetConfig,
    database: 'postgres' // Connect to default postgres database
  };
  
  const adminPool = new Pool(adminConfig);
  
  try {
    const client = await adminPool.connect();
    
    // Check if database exists
    const checkResult = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [targetConfig.database]);
    
    if (checkResult.rows.length === 0) {
      log(`Database "${targetConfig.database}" does not exist, creating...`, 'yellow');
      await client.query(`CREATE DATABASE ${quote_ident(targetConfig.database)}`);
      success(`Database "${targetConfig.database}" created successfully!`);
    } else {
      info(`Database "${targetConfig.database}" already exists`);
    }
    
    client.release();
    return true;
  } catch (err) {
    error(`Failed to create database: ${err.message}`);
    return false;
  } finally {
    await adminPool.end();
  }
}

/**
 * Create generated_images table (the actual table used, not "images")
 */
async function createGeneratedImagesTable() {
  log('\n📋 Creating generated_images table...', 'blue');
  
  const { targetPool } = getPools();
  const client = await targetPool.connect();
  
  try {
    // Check if table already exists
    const existsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'generated_images'
      )
    `);
    
    if (existsResult.rows[0].exists) {
      info('Table generated_images already exists');
      return true;
    }
    
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
        original_image_data BYTEA,
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
    
    success('Table generated_images created successfully!');
    return true;
  } catch (err) {
    error(`Failed to create generated_images table: ${err.message}`);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Run migrations on target database
 */
async function runMigrationsOnTarget() {
  log('\n📋 Running migrations on target database...', 'blue');
  
  const { targetPool } = getPools();
  const client = await targetPool.connect();
  const fs = require('fs');
  const path = require('path');
  
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
    const appliedVersions = new Set(appliedResult.rows.map((r) => r.version));
    
    // Read migration files
    const migrationsDir = path.join(__dirname, 'backend/scripts/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    log(`Found ${files.length} migration files`, 'cyan');
    
    for (const file of files) {
      const version = file.replace('.sql', '');
      
      if (appliedVersions.has(version)) {
        info(`  Migration ${version} already applied, skipping`);
        continue;
      }
      
      log(`  Running migration ${version}...`, 'yellow');
      
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Execute migration
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
        success(`  ✓ Migration ${version} applied successfully`);
      } catch (error) {
        await client.query('ROLLBACK');
        // Some migrations might fail if they reference tables that don't exist
        // (like migration 001 which creates "images" but we use "generated_images")
        // Skip migration 001 and 002 as they're for the old schema
        if (version === '001_initial_schema' || version === '002_add_analytics') {
          warning(`  Migration ${version} skipped (uses old schema, generated_images already created)`);
          // Still mark as applied to avoid re-running
          await client.query(`
            INSERT INTO schema_migrations (version) VALUES ($1)
            ON CONFLICT (version) DO NOTHING
          `, [version]);
        } else {
          throw error;
        }
      }
    }
    
    success('All migrations completed on target database!');
    return true;
  } catch (err) {
    error(`Migration failed: ${err.message}`);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Test database connections
 */
async function testConnections() {
  log('\n📡 Testing database connections...', 'blue');
  
  const { sourcePool, targetPool } = getPools();
  
  try {
    // Test source connection
    const sourceClient = await sourcePool.connect();
    const sourceResult = await sourceClient.query('SELECT current_database() as db, version() as version');
    sourceClient.release();
    log(`Source: ${sourceResult.rows[0].db}`, 'cyan');
    
    // Test target connection (after database is created)
    const targetClient = await targetPool.connect();
    const targetResult = await targetClient.query('SELECT current_database() as db, version() as version');
    targetClient.release();
    log(`Target: ${targetResult.rows[0].db}`, 'cyan');
    
    success('Both database connections successful!');
    return true;
  } catch (err) {
    error(`Connection test failed: ${err.message}`);
    return false;
  }
}

/**
 * Get all tables from source database
 */
async function getTables() {
  const { sourcePool } = getPools();
  const client = await sourcePool.connect();
  
  try {
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    return result.rows.map(row => row.table_name);
  } finally {
    client.release();
  }
}

/**
 * Get table schema (CREATE TABLE statement)
 */
async function getTableSchema(tableName) {
  const { sourcePool } = getPools();
  const client = await sourcePool.connect();
  
  try {
    // Use a better approach: query pg_attribute for accurate type information
    // This properly handles array types
    const result = await client.query(`
      SELECT 
        'CREATE TABLE IF NOT EXISTS ' || quote_ident($1) || ' (' ||
        string_agg(
          quote_ident(a.attname) || ' ' || 
          pg_catalog.format_type(a.atttypid, a.atttypmod) ||
          CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END ||
          CASE 
            WHEN a.atthasdef AND pg_get_expr(adbin, adrelid) IS NOT NULL 
            AND pg_get_expr(adbin, adrelid) NOT LIKE 'nextval%'
            THEN ' DEFAULT ' || pg_get_expr(adbin, adrelid)
            ELSE ''
          END,
          ', '
          ORDER BY a.attnum
        ) || ');' as create_statement
      FROM pg_catalog.pg_attribute a
      LEFT JOIN pg_catalog.pg_attrdef ad ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
      WHERE a.attrelid = $1::regclass
      AND a.attnum > 0
      AND NOT a.attisdropped
      GROUP BY a.attrelid
    `, [tableName]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    let createStatement = result.rows[0].create_statement;
    
    // Fix array type names - replace internal PostgreSQL array type names with standard SQL
    // _int4[] -> integer[], _text[] -> text[], etc.
    createStatement = createStatement
      .replace(/\b_int4\[\]/g, 'integer[]')
      .replace(/\b_int8\[\]/g, 'bigint[]')
      .replace(/\b_text\[\]/g, 'text[]')
      .replace(/\b_varchar\[\]/g, 'varchar[]')
      .replace(/\b_bool\[\]/g, 'boolean[]')
      .replace(/\b_float4\[\]/g, 'real[]')
      .replace(/\b_float8\[\]/g, 'double precision[]')
      .replace(/\b_numeric\[\]/g, 'numeric[]');
    
    // Get primary keys
    const pkResult = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_schema = 'public' 
      AND table_name = $1 
      AND constraint_type = 'PRIMARY KEY'
    `, [tableName]);
    
    if (pkResult.rows.length > 0) {
      const pkColumns = await client.query(`
        SELECT column_name
        FROM information_schema.key_column_usage
        WHERE constraint_name = $1
        ORDER BY ordinal_position
      `, [pkResult.rows[0].constraint_name]);
      
      if (pkColumns.rows.length > 0) {
        const pkCols = pkColumns.rows.map(r => quote_ident(r.column_name)).join(', ');
        // Only add PRIMARY KEY if it's not already in the statement (SERIAL/BIGSERIAL already include it)
        if (!createStatement.includes('PRIMARY KEY')) {
          // Insert PRIMARY KEY before closing parenthesis
          createStatement = createStatement.replace(');', `, PRIMARY KEY (${pkCols}));`);
        }
      }
    }
    
    // Get sequences for SERIAL columns
    const serialColumns = await client.query(`
      SELECT column_name, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = $1 
      AND column_default LIKE 'nextval%'
    `, [tableName]);
    
    // Get indexes (exclude primary key indexes)
    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' 
      AND tablename = $1
      AND indexname NOT LIKE '%_pkey'
    `, [tableName]);
    
    return {
      createStatement,
      indexes: indexes.rows.map(r => r.indexdef),
      serialColumns: serialColumns.rows.map(r => r.column_name)
    };
  } finally {
    client.release();
  }
}

function quote_ident(name) {
  return `"${name}"`;
}

/**
 * Create table in target database
 */
async function createTableInTarget(tableName, schema) {
  const { targetPool } = getPools();
  const client = await targetPool.connect();
  
  try {
    // Drop table if exists (optional - comment out if you want to preserve existing data)
    await client.query(`DROP TABLE IF EXISTS ${quote_ident(tableName)} CASCADE;`);
    
    // Create table
    await client.query(schema.createStatement);
    success(`Created table: ${tableName}`);
    
    // Create sequences for SERIAL columns if needed
    for (const col of schema.serialColumns || []) {
      const seqName = `${tableName}_${col}_seq`;
      try {
        // Check if sequence exists, if not create it
        const seqExists = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM pg_class WHERE relname = $1
          ) as exists
        `, [seqName]);
        
        if (!seqExists.rows[0].exists) {
          await client.query(`CREATE SEQUENCE IF NOT EXISTS ${quote_ident(seqName)};`);
          await client.query(`
            ALTER TABLE ${quote_ident(tableName)} 
            ALTER COLUMN ${quote_ident(col)} 
            SET DEFAULT nextval('${seqName}');
          `);
          info(`  Created sequence for ${tableName}.${col}`);
        }
      } catch (err) {
        warning(`  Sequence creation skipped for ${tableName}.${col}: ${err.message}`);
      }
    }
    
    // Create indexes
    for (const indexDef of schema.indexes) {
      try {
        await client.query(indexDef);
        info(`  Created index for ${tableName}`);
      } catch (err) {
        warning(`  Index creation skipped (might already exist): ${err.message}`);
      }
    }
    
    return true;
  } catch (err) {
    error(`Failed to create table ${tableName}: ${err.message}`);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Check if target table has data
 */
async function targetTableHasData(tableName) {
  const { targetPool } = getPools();
  const client = await targetPool.connect();
  
  try {
    const result = await client.query(`SELECT COUNT(*) as count FROM ${quote_ident(tableName)}`);
    return parseInt(result.rows[0].count) > 0;
  } catch (err) {
    // Table might not exist yet
    return false;
  } finally {
    client.release();
  }
}

/**
 * Copy data from source to target table
 */
async function copyTableData(tableName, skipIfExists = true) {
  const { sourcePool, targetPool } = getPools();
  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();
  
  try {
    // Check if target already has data
    if (skipIfExists) {
      const hasData = await targetTableHasData(tableName);
      if (hasData) {
        info(`  Table ${tableName} already has data, skipping to avoid duplicates`);
        return;
      }
    }
    
    // Get row count
    const countResult = await sourceClient.query(`SELECT COUNT(*) as count FROM ${quote_ident(tableName)}`);
    const rowCount = parseInt(countResult.rows[0].count);
    
    if (rowCount === 0) {
      info(`  Table ${tableName} is empty, skipping data copy`);
      return;
    }
    
    log(`  Copying ${rowCount} rows from ${tableName}...`, 'yellow');
    
    // Get all data
    const dataResult = await sourceClient.query(`SELECT * FROM ${quote_ident(tableName)}`);
    
    if (dataResult.rows.length === 0) {
      return;
    }
    
    // Get column names
    const columns = Object.keys(dataResult.rows[0]);
    const columnList = columns.map(c => quote_ident(c)).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    // Clear target table only if it has data and we're not skipping
    if (!skipIfExists) {
      await targetClient.query(`TRUNCATE TABLE ${quote_ident(tableName)} CASCADE;`);
    }
    
    // Insert data in batches
    const batchSize = 1000;
    let inserted = 0;
    
    for (let i = 0; i < dataResult.rows.length; i += batchSize) {
      const batch = dataResult.rows.slice(i, i + batchSize);
      
      for (const row of batch) {
        const values = columns.map(col => row[col]);
        await targetClient.query(
          `INSERT INTO ${quote_ident(tableName)} (${columnList}) VALUES (${placeholders})`,
          values
        );
        inserted++;
      }
      
      if (inserted % 1000 === 0) {
        process.stdout.write(`\r  Progress: ${inserted}/${rowCount} rows`);
      }
    }
    
    process.stdout.write(`\r  Progress: ${inserted}/${rowCount} rows\n`);
    success(`  Copied ${inserted} rows to ${tableName}`);
    
  } catch (err) {
    error(`Failed to copy data for ${tableName}: ${err.message}`);
    throw err;
  } finally {
    sourceClient.release();
    targetClient.release();
  }
}

/**
 * Get sequences and reset them in target
 */
async function syncSequences() {
  const { sourcePool, targetPool } = getPools();
  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();
  
  try {
    log('\n🔄 Syncing sequences...', 'blue');
    
    // Use pg_sequences which has last_value, or query sequences directly
    let sequences;
    try {
      sequences = await sourceClient.query(`
        SELECT 
          sequencename as sequence_name,
          last_value
        FROM pg_sequences
        WHERE schemaname = 'public'
      `);
    } catch (err) {
      // Fallback: get sequence names and query last_value directly
      const seqNames = await sourceClient.query(`
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
      `);
      
      sequences = { rows: [] };
      for (const seq of seqNames.rows) {
        try {
          const lastValResult = await sourceClient.query(`SELECT last_value FROM ${quote_ident(seq.sequence_name)}`);
          sequences.rows.push({
            sequence_name: seq.sequence_name,
            last_value: lastValResult.rows[0]?.last_value
          });
        } catch (e) {
          // Skip if can't get last_value
        }
      }
    }
    
    for (const seq of sequences.rows) {
      try {
        if (seq.last_value !== null && seq.last_value !== undefined) {
          await targetClient.query(`SELECT setval('${seq.sequence_name}', ${seq.last_value}, true);`);
          info(`  Synced sequence: ${seq.sequence_name} to ${seq.last_value}`);
        }
      } catch (err) {
        warning(`  Could not sync sequence ${seq.sequence_name}: ${err.message}`);
      }
    }
    
    success('Sequences synced!');
  } catch (err) {
    warning(`Sequence sync warning: ${err.message}`);
  } finally {
    sourceClient.release();
    targetClient.release();
  }
}

/**
 * Main duplication function
 */
async function duplicateDatabase() {
  const startTime = Date.now();
  
  log('\n🚀 Starting database duplication...', 'blue');
  log(`Source: ${sourceConfig.host}/${sourceConfig.database}`, 'cyan');
  log(`Target: ${targetConfig.host}/${targetConfig.database}`, 'cyan');
  info('Note: Script will skip copying data if target tables already have data (prevents duplicates)');
  
  // Step 1: Create target database if it doesn't exist
  const dbCreated = await createDatabaseIfNotExists();
  if (!dbCreated) {
    error('Failed to create target database');
    process.exit(1);
  }
  
  // Step 2: Create generated_images table (the actual table used)
  const tableCreated = await createGeneratedImagesTable();
  if (!tableCreated) {
    error('Failed to create generated_images table');
    process.exit(1);
  }
  
  // Step 3: Run migrations on target database
  const migrationsRun = await runMigrationsOnTarget();
  if (!migrationsRun) {
    error('Failed to run migrations on target database');
    process.exit(1);
  }
  
  // Step 4: Test connections
  const connected = await testConnections();
  if (!connected) {
    error('Cannot proceed without database connections');
    process.exit(1);
  }
  
  try {
    // Get all tables
    log('\n📋 Getting table list...', 'blue');
    const tables = await getTables();
    success(`Found ${tables.length} tables: ${tables.join(', ')}`);
    
    // Create tables and copy data
    log('\n📦 Creating tables and copying data...', 'blue');
    for (const table of tables) {
      try {
        log(`\nProcessing table: ${table}`, 'yellow');
        
        // Get schema
        const schema = await getTableSchema(table);
        if (!schema) {
          warning(`Could not get schema for ${table}, skipping`);
          continue;
        }
        
        // Create table in target
        await createTableInTarget(table, schema);
        
        // Copy data
        await copyTableData(table);
        
      } catch (err) {
        error(`Error processing table ${table}: ${err.message}`);
        // Continue with next table
      }
    }
    
    // Sync sequences
    await syncSequences();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log('\n✨ Database duplication completed!', 'green');
    log(`⏱️  Total time: ${duration} seconds`, 'cyan');
    
  } catch (err) {
    error(`Duplication failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    // Close connections
    if (sourcePool) await sourcePool.end();
    if (targetPool) await targetPool.end();
    log('\n🔌 Database connections closed', 'blue');
  }
}

// Run the script
if (require.main === module) {
  duplicateDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      error(`Fatal error: ${err.message}`);
      console.error(err);
      process.exit(1);
    });
}

module.exports = { duplicateDatabase };
