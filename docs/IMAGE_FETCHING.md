# Image Fetching Architecture

## Overview

PixelVault uses a **metadata-first, binary-on-demand** approach for efficient image delivery. Images are stored as binary data directly in PostgreSQL and served through dedicated API endpoints.

**⚠️ Current Status: Performance Optimization in Progress**
- Images are currently loading slowly (~4-11 seconds per batch)
- This is expected behavior for the initial implementation
- Optimization work is ongoing

---

## Storage Format

### Primary Format: **WebP**
- **Full Images**: Max 800x800px, WebP format (~60-70% quality)
- **Thumbnails**: 150x150px, WebP format (~5-10KB)
- **Why WebP?**
  - 25-35% smaller file size than JPEG
  - Better quality at lower file sizes
  - Browser support: 97%+ of users
  - Faster page loads (once optimized)

### Storage Location
- **Database**: PostgreSQL `BYTEA` columns
  - `image_data`: Full resolution WebP image
  - `thumbnail_data`: 150x150px WebP thumbnail
  - `blurhash`: 30-character string for instant preview (optional, migration pending)

---

## Current Image Fetching Flow

### Phase 1: Metadata Fetch (Currently: ~4-5 seconds)
```
GET /api/images?limit=30&sort=recent
```
- Returns JSON with image metadata only
- **Excludes binary data** for performance
- Includes: `id`, `description`, `tags`, `width`, `height`, `blurhash`, URLs
- Response size: ~5-10KB (vs MBs with binary)
- **Current Performance**: ~4-5 seconds for 30 images (database query overhead)

### Phase 2: Binary Fetch (On-Demand, Currently: ~1-11 seconds per image)
Two endpoints for different use cases:

#### Thumbnails (Gallery View)
```
GET /api/images/{id}/thumbnail
```
- Returns: 150x150px WebP thumbnail
- Size: ~5-10KB per image
- Use case: Gallery grid, image cards
- Falls back to full image if thumbnail missing
- **Current Performance**: ~1-11 seconds per thumbnail (varies based on database load)

#### Full Images (Modal/Detail View)
```
GET /api/images/{id}/file
```
- Returns: Full resolution WebP (max 800x800px)
- Size: ~50-200KB per image
- Use case: Image modal, full-size view
- **Current Performance**: Similar to thumbnails (~1-11 seconds)

### Current Performance Characteristics

**Why It's Slow Right Now:**
1. **Database Binary Retrieval**: Fetching BYTEA data from PostgreSQL adds latency
2. **Network Transfer**: Binary data transfer over network
3. **No CDN**: Images are served directly from database (no edge caching)
4. **Sequential Processing**: Images load one by one (some parallelization exists)
5. **Connection Pool**: Limited database connections (5-20 concurrent)

**Typical Load Times:**
- Initial metadata fetch: **~4-5 seconds** (30 images)
- Thumbnail batch (30 images): **~30-90 seconds** (varies)
- Individual thumbnail: **~1-11 seconds** (depending on database load)

**Note**: These times are expected for the initial implementation. Performance will improve with:
- CDN integration
- Better caching strategies
- Connection pool optimization
- Batch processing improvements

---

## Features (Implemented)

### 1. **BlurHash Instant Preview** (Optional - Migration Pending)
- Generates 30-character blur placeholder
- Shows instantly while image loads
- **Status**: Code implemented, database migration not run yet
- Falls back gracefully if column doesn't exist (handled in code)

### 2. **Lazy Loading**
- Images load only when visible in viewport
- Browser-native `loading="lazy"` attribute
- Reduces initial page load time

### 3. **HTTP Caching (ETag)**
- `Cache-Control: no-cache, must-revalidate`
- ETag headers for efficient validation
- Reduces server load on repeat visits
- Browser validates without re-downloading

### 4. **Automatic Format Conversion**
- Uploads (JPEG/PNG/etc.) → Converted to WebP
- Processed on upload:
  - Full image: Resized to max 800x800px
  - Thumbnail: 150x150px
  - BlurHash: Generated automatically
- Stored in database as binary

### 5. **Pagination**
- Initial load: **30 images**
- "Show More": **+50 images** per page
- Reduces initial payload size
- Better perceived performance

### 6. **Graceful Degradation**
- Works without `blurhash` column (auto-detects)
- Falls back to full image if thumbnail missing
- No errors if optional features unavailable

---

## Database Schema

### `generated_images` Table
```sql
- id: INTEGER (Primary Key)
- image_data: BYTEA (Full WebP image)
- thumbnail_data: BYTEA (150x150 WebP)
- image_mime_type: VARCHAR (default: 'image/webp')
- image_width: INTEGER
- image_height: INTEGER
- image_size: INTEGER (bytes)
- blurhash: VARCHAR(30) (optional, nullable) - Migration pending
- description: TEXT
- tag1, tag2, tag3: VARCHAR
- created_at, updated_at: TIMESTAMP
- is_deleted: BOOLEAN (default: false)
```

**Migration Status:**
- ✅ Basic schema: Complete
- ✅ Indexes: Complete (008_optimize_indexes.sql)
- ⏳ BlurHash column: Migration exists (009_add_blurhash.sql), **not run yet**
- ⏳ Batch conversion: Script ready, **not run yet**

---

## Performance Optimizations (Implemented)

### 1. **Connection Pooling**
- Min connections: 5
- Max connections: 20
- Idle timeout: 30s
- Connection timeout: 10s
- **Current Impact**: Helps but limited by database server performance

### 2. **Database Indexes**
- ✅ `id` (primary key)
- ✅ `created_at DESC`
- ✅ `(status, created_at DESC)`
- ✅ `is_deleted` (where false)
- ⏳ `blurhash` (where not null) - Migration pending

### 3. **Pagination**
- ✅ Initial load: 30 images
- ✅ "Show More": +50 images per page
- ✅ Reduces initial payload size
- ✅ Better perceived performance

### 4. **Graceful Degradation**
- ✅ Works without `blurhash` column (auto-detects)
- ✅ Falls back to full image if thumbnail missing
- ✅ No errors if optional features unavailable

---

## API Response Examples

### Metadata Response
```json
{
  "success": true,
  "data": [
    {
      "id": 391,
      "description": "Sample image",
      "thumbnailUrl": "/api/images/391/thumbnail",
      "imageUrl": "/api/images/391/file",
      "width": 800,
      "height": 600,
      "blurhash": null,  // null until migration is run
      "tags": ["nature", "landscape"]
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 30,
    "offset": 0,
    "hasMore": true
  }
}
```

### Binary Response (Thumbnail)
```
Content-Type: image/webp
Content-Length: 8234
Cache-Control: no-cache, must-revalidate
ETag: "abc123..."
[Binary WebP data]
```

---

## Image Upload Flow

1. **Client uploads** image (any format)
2. **Server processes**:
   - Converts to WebP (full + thumbnail)
   - Generates BlurHash (if column exists)
   - Extracts dimensions
   - Calculates file size
3. **Database insert**:
   - Stores binary data as BYTEA
   - Saves metadata
   - Returns image ID
4. **Response** includes:
   - Image ID
   - BlurHash (if available)
   - Dimensions
   - File sizes

---

## Current Limitations & Known Issues

### Performance
- ⚠️ **Slow loading**: Images take 1-11 seconds each
- ⚠️ **No CDN**: Direct database serving
- ⚠️ **Limited parallelization**: Some images load sequentially
- ⚠️ **Database overhead**: BYTEA retrieval is expensive

### Features
- ⚠️ **BlurHash not active**: Migration not run yet
- ⚠️ **Batch conversion pending**: Existing images not converted to WebP yet
- ⚠️ **No progressive loading**: Images load fully or not at all

### Database
- ⚠️ **Connection limits**: 20 max connections
- ⚠️ **No read replicas**: Single database instance
- ⚠️ **Binary storage**: Large BYTEA columns impact query performance

---

## Next Steps for Performance Improvement

### Short Term (Easy Wins)
1. **Run migrations**:
   - Add `blurhash` column (009_add_blurhash.sql)
   - Run batch conversion script (convert-to-webp-blurhash.ts)
2. **Increase connection pool**: Test with higher max connections
3. **Add response compression**: Gzip/Brotli for binary responses
4. **Implement request queuing**: Better parallel image loading

### Medium Term (Moderate Effort)
1. **CDN Integration**: Move binary storage to CDN (Cloudflare, AWS CloudFront)
2. **Caching layer**: Redis cache for frequently accessed images
3. **Image preloading**: Preload next page thumbnails
4. **Progressive loading**: Show low-quality preview first

### Long Term (Significant Changes)
1. **Separate storage**: Move images to object storage (S3, Cloud Storage)
2. **Read replicas**: Database read replicas for image queries
3. **Multiple sizes**: Generate 50px, 150px, 300px, 800px variants
4. **AVIF format**: Even smaller than WebP (next-gen format)

---

## Benefits of Current Approach

✅ **Metadata-First**: Fast initial page load (~4-5s for metadata)  
✅ **On-Demand Binary**: Images load only when needed  
✅ **WebP Format**: 25-35% smaller than JPEG (when implemented)  
✅ **Database-Backed**: No file system management  
✅ **Scalable Architecture**: Foundation for future optimizations  
✅ **Graceful Degradation**: Works even without all features  

⚠️ **Current Drawbacks**:
- Slow binary retrieval (1-11s per image)
- No CDN caching
- Limited parallelization
- Database serving overhead

---

## Usage Notes

**For Development:**
- Current performance is acceptable for testing
- Use pagination to limit load times
- Expect ~4-5s for initial metadata + ~30-90s for thumbnails

**For Production (Current State):**
- ⚠️ **Not recommended** for high-traffic scenarios
- Consider running migrations first (blurhash, batch conversion)
- Monitor database performance
- Plan for CDN integration

**Future Production (After Optimizations):**
- Will be suitable for production use
- CDN + caching will significantly improve performance
- Expected load times: <500ms per image
