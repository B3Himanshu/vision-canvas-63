import { Pool, PoolConfig } from 'pg';

/**
 * Get database configuration from environment variables
 * This is called lazily to ensure env vars are loaded before use
 */
function getDbConfig(): PoolConfig {
  return {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    // SSL configuration - required for remote PostgreSQL connections
    ssl: process.env.DATABASE_SSL === 'true' || process.env.DATABASE_SSL === undefined ? {
      rejectUnauthorized: false // Set to false for self-signed certificates
    } : false,
    // Connection pool optimization
    min: 5, // Minimum number of clients to keep in pool (reduces connection overhead)
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds (recycle stale connections)
    connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000'), // Reduced to 10s for faster failure detection
    statement_timeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '120000'),
  };
}

// Create a connection pool
let pool: Pool | null = null;

/**
 * Get or create database connection pool
 * @returns PostgreSQL connection pool
 * @throws Error if required environment variables are missing
 */
export function getPool(): Pool {
  // Get config lazily (reads env vars at call time, not module load time)
  const dbConfig = getDbConfig();
  
  // Validate required environment variables
  if (!dbConfig.host || !dbConfig.database || !dbConfig.user || !dbConfig.password) {
    throw new Error(
      'Missing required database environment variables. Please set DATABASE_HOST, DATABASE_NAME, DATABASE_USER, and DATABASE_PASSWORD in your .env.local file.'
    );
  }

  if (!pool) {
    pool = new Pool(dbConfig);
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

/**
 * Test database connection
 * @returns Connection test result with current time and PostgreSQL version
 */
export async function testConnection() {
  const pool = getPool();
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    client.release();
    return {
      success: true,
      data: {
        currentTime: result.rows[0].current_time,
        version: result.rows[0].version,
      },
    };
  } catch (error) {
    console.error('Database connection error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get database details
export async function getDatabaseDetails() {
  const pool = getPool();
  try {
    const client = await pool.connect();
    
    // Get database name, user, and connection info
    const dbInfo = await client.query(`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        inet_server_addr() as server_address,
        inet_server_port() as server_port,
        version() as postgres_version
    `);
    
    // Get list of tables
    const tables = await client.query(`
      SELECT 
        table_schema,
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `);
    
    // Get database size
    const dbSize = await client.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
    `);
    
    client.release();
    
    return {
      success: true,
      data: {
        databaseInfo: dbInfo.rows[0],
        tables: tables.rows,
        databaseSize: dbSize.rows[0].database_size,
        totalTables: tables.rows.length,
      },
    };
  } catch (error) {
    console.error('Error fetching database details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Close all database connections
 * Useful for cleanup and graceful shutdown
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
