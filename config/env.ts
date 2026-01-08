/**
 * Environment configuration
 * Centralized environment variable management
 */

interface EnvConfig {
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
    connectionTimeout: number;
    statementTimeout: number;
  };
  app: {
    env: 'development' | 'staging' | 'production';
    apiUrl: string;
  };
}

/**
 * Get environment configuration
 * Validates required environment variables
 */
export function getEnvConfig(): EnvConfig {
  const requiredVars = [
    'DATABASE_HOST',
    'DATABASE_NAME',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please set these in your .env.local file'
    );
  }

  return {
    database: {
      host: process.env.DATABASE_HOST!,
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      name: process.env.DATABASE_NAME!,
      user: process.env.DATABASE_USER!,
      password: process.env.DATABASE_PASSWORD!,
      ssl: process.env.DATABASE_SSL !== 'false',
      connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '60000', 10),
      statementTimeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '120000', 10),
    },
    app: {
      env: (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production',
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    },
  };
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in staging
 */
export function isStaging(): boolean {
  return process.env.NODE_ENV === 'staging';
}
