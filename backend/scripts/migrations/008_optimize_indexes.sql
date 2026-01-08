-- Migration: 008_optimize_indexes.sql
-- Description: Add performance indexes for generated_images table (id and created_at)
-- Created: 2025-01-02

-- Primary key on id should already exist, but ensure index exists for lookups
-- Note: PRIMARY KEY automatically creates an index, but we'll verify it exists

-- Index on created_at for sorting (if not exists from previous migrations)
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at DESC);

-- Index on id for faster lookups (PRIMARY KEY should already have this, but adding explicit index for clarity)
-- Since id is PRIMARY KEY, this index already exists, but we document it here for reference
-- CREATE INDEX IF NOT EXISTS idx_generated_images_id ON generated_images(id); -- Not needed, PRIMARY KEY covers this

-- Composite index for common query pattern: filtering by status and sorting by created_at
CREATE INDEX IF NOT EXISTS idx_generated_images_status_created ON generated_images(status, created_at DESC);

-- Index on is_deleted for filtering out deleted images (common in queries)
CREATE INDEX IF NOT EXISTS idx_generated_images_is_deleted ON generated_images(is_deleted) WHERE is_deleted = false;

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('008_optimize_indexes')
ON CONFLICT (version) DO NOTHING;
