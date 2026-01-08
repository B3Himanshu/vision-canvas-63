-- Migration: 005_add_analytics_columns.sql
-- Description: Add analytics columns to generated_images table
-- Created: 2024

-- Add analytics columns if they don't exist
ALTER TABLE generated_images 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP;

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_generated_images_view_count ON generated_images(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_downloads ON generated_images(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_last_viewed ON generated_images(last_viewed_at DESC);

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('005_add_analytics_columns')
ON CONFLICT (version) DO NOTHING;
