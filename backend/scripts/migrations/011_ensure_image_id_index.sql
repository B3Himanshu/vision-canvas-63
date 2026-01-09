-- Migration: 011_ensure_image_id_index.sql
-- Description: Ensure image ID column is properly indexed for fast lookups
-- This ensures the /image/[id] route can fetch images quickly using database ID
-- Created: 2025-01-XX

-- The id column is already PRIMARY KEY (which includes an index), but we'll ensure it's optimized
-- Add explicit index on id for faster lookups (though PRIMARY KEY already provides this)
-- This is mainly for documentation and to ensure optimal performance

-- Note: PRIMARY KEY automatically creates a unique index, but we document it here
-- The id column is BIGSERIAL PRIMARY KEY, which means:
-- 1. It's auto-incrementing
-- 2. It's unique
-- 3. It has an index (from PRIMARY KEY constraint)
-- 4. It's used as the foreign key reference in favorites, collections, etc.

-- Verify the id column exists and is PRIMARY KEY
DO $$
BEGIN
  -- Check if id column exists and is PRIMARY KEY
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'PRIMARY KEY' 
    AND table_name = 'generated_images'
    AND constraint_name LIKE '%_pkey'
  ) THEN
    -- If no primary key exists, add it (shouldn't happen, but safety check)
    ALTER TABLE generated_images ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Ensure there's an explicit index on id for documentation and clarity
-- (PRIMARY KEY already provides this, but we make it explicit)
-- This index helps with:
-- 1. Fast lookups by ID: SELECT * FROM generated_images WHERE id = ?
-- 2. JOIN operations with favorites, collections tables
-- 3. Foreign key references

-- The PRIMARY KEY constraint already creates an index, but we can add a comment
COMMENT ON COLUMN generated_images.id IS 'Primary key - unique identifier for each image. Used in URLs like /image/[id]. Auto-incrementing BIGSERIAL.';

-- Create a covering index for common query pattern: id + is_deleted (for filtering)
-- This helps with queries like: SELECT * FROM generated_images WHERE id = ? AND (is_deleted = false OR is_deleted IS NULL)
CREATE INDEX IF NOT EXISTS idx_generated_images_id_not_deleted 
ON generated_images(id) WHERE (is_deleted = false OR is_deleted IS NULL);

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('011_ensure_image_id_index')
ON CONFLICT (version) DO NOTHING;
