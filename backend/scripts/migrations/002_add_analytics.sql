-- Migration: 002_add_analytics.sql
-- Description: Add analytics tracking columns
-- Created: 2024

-- Add view count and analytics columns to images table
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP;

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_images_view_count ON images(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_images_last_viewed ON images(last_viewed_at DESC);

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('002_add_analytics')
ON CONFLICT (version) DO NOTHING;
