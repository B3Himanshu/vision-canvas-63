-- Migration: 003_add_indexes.sql
-- Description: Add performance indexes for search and filtering
-- Created: 2024

-- Full-text search index on title
CREATE INDEX IF NOT EXISTS idx_images_title_fts ON images USING gin(to_tsvector('english', title));

-- Composite index for common queries (category + created_at)
CREATE INDEX IF NOT EXISTS idx_images_category_created ON images(category, created_at DESC);

-- Index for tag searches (if using array operations)
CREATE INDEX IF NOT EXISTS idx_images_tags_gin ON images USING GIN(tags);

-- Index for author searches
CREATE INDEX IF NOT EXISTS idx_images_author ON images(author);

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('003_add_indexes')
ON CONFLICT (version) DO NOTHING;
