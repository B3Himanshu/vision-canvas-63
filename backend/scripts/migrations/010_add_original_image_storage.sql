-- Migration: 010_add_original_image_storage.sql
-- Description: Add columns to store original images for highest quality downloads
-- Created: 2025-01-XX

-- Add original image storage columns
ALTER TABLE generated_images 
ADD COLUMN IF NOT EXISTS original_image_data BYTEA,
ADD COLUMN IF NOT EXISTS original_mime_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS original_image_size BIGINT;

-- Create index for queries that check if original exists
CREATE INDEX IF NOT EXISTS idx_generated_images_original_exists 
ON generated_images(id) WHERE original_image_data IS NOT NULL;

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('010_add_original_image_storage')
ON CONFLICT (version) DO NOTHING;
