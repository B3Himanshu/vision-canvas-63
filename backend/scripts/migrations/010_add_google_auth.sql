-- Migration: 010_add_google_auth.sql
-- Description: Add Google authentication support to users table
-- Created: 2025-01-XX

-- Add auth_provider column to support multiple authentication methods
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'email';

-- Add firebase_uid column for Google-authenticated users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255) UNIQUE;

-- Make password_hash nullable (Google users don't have passwords)
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- Create index on firebase_uid for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid) WHERE firebase_uid IS NOT NULL;

-- Update existing users to have 'email' as auth_provider
UPDATE users 
SET auth_provider = 'email' 
WHERE auth_provider IS NULL;

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('010_add_google_auth')
ON CONFLICT (version) DO NOTHING;
