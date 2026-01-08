-- Migration: 004_add_favorites.sql
-- Description: Add favorites/bookmarks functionality
-- Created: 2024

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  image_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, image_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_image_id ON favorites(image_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_image ON favorites(user_id, image_id);

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('004_add_favorites')
ON CONFLICT (version) DO NOTHING;
