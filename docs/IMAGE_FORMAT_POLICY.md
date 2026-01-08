# Image Format Policy & Conversion Strategy

## Problem Statement

**Current Issue:**
- New uploads through API → Converted to WebP ✅
- Direct database inserts → May be in any format (JPEG/PNG/etc.) ❌
- **Conflict**: Mixed formats in database (WebP + original formats)

## Solution: Unified Format Strategy

### Recommended Approach: **On-The-Fly Conversion**

Convert images to WebP when serving them if they're not already WebP. This ensures:
- ✅ All images served as WebP (consistent)
- ✅ No breaking changes for existing data
- ✅ Works with direct database inserts
- ✅ Progressive conversion (converts when first accessed)

---

## Implementation Options

### Option 1: Convert on Fetch (Recommended)

**How it works:**
1. Check `image_mime_type` when fetching
2. If not `'image/webp'`, convert on-the-fly
3. Cache converted version (optional: update database)

**Pros:**
- ✅ Works immediately
- ✅ No breaking changes
- ✅ Handles mixed formats gracefully
- ✅ No migration needed

**Cons:**
- ⚠️ Conversion overhead on first access
- ⚠️ Slower first load for non-WebP images

### Option 2: Enforce WebP on Insert (Strict)

**How it works:**
1. Add database trigger/function
2. Convert any image to WebP on INSERT/UPDATE
3. Reject non-WebP images (or auto-convert)

**Pros:**
- ✅ Guaranteed format consistency
- ✅ No runtime conversion overhead

**Cons:**
- ⚠️ Requires database trigger setup
- ⚠️ Breaks existing direct inserts (needs migration)

### Option 3: Background Conversion Job

**How it works:**
1. Periodically check for non-WebP images
2. Convert to WebP in background
3. Update database with converted versions

**Pros:**
- ✅ No user-facing delay
- ✅ Progressive improvement

**Cons:**
- ⚠️ Requires background job infrastructure
- ⚠️ Delayed conversion

---

## Recommended: Hybrid Approach

### Short Term (Current)
- ✅ API uploads: Convert to WebP (already implemented)
- ✅ Direct inserts: Accept any format, convert on fetch
- ✅ Batch conversion: Run script to convert existing images

### Long Term (Best Practice)
1. **Documentation**: All images must be WebP
2. **Validation**: Add checks for direct inserts
3. **Auto-convert**: Convert on-the-fly if format differs
4. **Monitoring**: Track format distribution

---

## Code Implementation

### Update `getImageThumbnail()` and `getImageFile()`

Add format checking and conversion:

```typescript
export async function getImageThumbnail(id: number) {
  // ... existing code ...
  
  const row = result.rows[0];
  let imageData = row.thumbnail_data || row.image_data;
  let mimeType = row.image_mime_type || 'image/webp';
  
  // Convert to WebP if not already WebP
  if (mimeType !== 'image/webp' && imageData) {
    const { convertToWebP } = await import('./image-processing');
    imageData = await convertToWebP(imageData, undefined, THUMBNAIL_SIZE);
    mimeType = 'image/webp';
    
    // Optional: Update database with converted version
    // (uncomment if you want to cache the conversion)
    // await client.query(
    //   `UPDATE generated_images SET thumbnail_data = $1, image_mime_type = 'image/webp' WHERE id = $2`,
    //   [imageData, id]
    // );
  }
  
  return {
    success: true,
    data: imageData,
    mimeType: 'image/webp', // Always return as WebP
  };
}
```

---

## Database Policy

### For Direct Inserts

**Current Behavior:**
- ✅ Accepts any format (JPEG, PNG, WebP, etc.)
- ⚠️ Served as-is (may not be WebP)

**Recommended Policy:**
1. **Prefer API Upload**: Use `/api/images/upload` endpoint
2. **Direct Insert Rules**:
   - If inserting directly: Convert to WebP before insert
   - Set `image_mime_type = 'image/webp'`
   - Generate `thumbnail_data` (150x150 WebP)
   - Generate `blurhash` (if column exists)

**SQL Example (Don't Use - For Reference Only):**
```sql
-- ❌ BAD: Direct insert without conversion
INSERT INTO generated_images (image_data, image_mime_type) 
VALUES (binary_data, 'image/jpeg');

-- ✅ GOOD: Use API endpoint
POST /api/images/upload
(API handles conversion automatically)

-- ✅ GOOD: If direct insert necessary, convert first
-- (Use backend/lib/image-processing.ts functions)
```

---

## Migration Strategy

### Phase 1: Handle Mixed Formats (Current)
- ✅ Code handles both WebP and original formats
- ✅ Convert on-the-fly if needed
- ⏳ Run batch conversion script (convert existing images)

### Phase 2: Standardize (After Batch Conversion)
- ✅ All images should be WebP
- ✅ Add validation to prevent non-WebP inserts
- ✅ Monitor for any non-WebP images

### Phase 3: Enforcement (Future)
- ✅ Database constraints (if needed)
- ✅ API-only uploads (deprecate direct inserts)
- ✅ Format validation in application layer

---

## Recommendations

1. **For New Development:**
   - Always use `/api/images/upload` endpoint
   - Never insert images directly to database

2. **For Existing Data:**
   - Run batch conversion script
   - Monitor format distribution

3. **For Direct Database Access:**
   - Convert to WebP before inserting
   - Use `backend/lib/image-processing.ts` functions
   - Set `image_mime_type = 'image/webp'`

4. **For Performance:**
   - Implement on-the-fly conversion (fallback)
   - Cache converted versions (optional)
   - Prefer batch conversion for existing data

---

## Summary

**Current State:**
- ✅ API uploads: WebP (consistent)
- ⚠️ Direct inserts: Any format (inconsistent)
- ⚠️ Mixed formats in database

**Solution:**
- ✅ Add on-the-fly conversion (handles mixed formats)
- ✅ Run batch conversion (standardize existing data)
- ✅ Document policy (prevent future issues)

**Best Practice:**
- ✅ Always use API endpoint for uploads
- ✅ Convert to WebP before direct inserts (if necessary)
- ✅ Monitor format consistency
