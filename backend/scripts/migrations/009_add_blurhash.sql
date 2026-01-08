-- Migration: 009_add_blurhash.sql
-- Description: Add BlurHash column for instant image previews
-- Created: 2025-01-02

-- Add blurhash column to store BlurHash string (30 characters)
ALTER TABLE generated_images 
ADD COLUMN IF NOT EXISTS blurhash VARCHAR(30);

-- Create index on blurhash for faster lookups (optional, but useful)
CREATE INDEX IF NOT EXISTS idx_generated_images_blurhash ON generated_images(blurhash) WHERE blurhash IS NOT NULL;

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('009_add_blurhash')
ON CONFLICT (version) DO NOTHING;
