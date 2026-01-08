# Bulk Image Upload Script

## Overview

The `upload-images.ts` script uploads all WebP images from the `webp_images/` directory to your local database.

## Features

- ✅ Reads all `.webp` files from `webp_images/` directory
- ✅ Automatically processes each image:
  - Generates BlurHash for instant preview
  - Creates thumbnail (150x150 WebP)
  - Resizes full image (max 800x800 WebP)
- ✅ Inserts into `generated_images` table
- ✅ Shows progress and statistics
- ✅ Processes images in batches (5 at a time)

## Prerequisites

1. **Database Setup**: Make sure your `.env.local` file is configured with your local database credentials
2. **Migrations**: Run migrations first to create the database schema:
   ```bash
   npm run migrate
   ```
3. **Images**: Place all your WebP images in the `webp_images/` directory

## Usage

### Option 1: From root directory
```bash
npm run upload:images
```

### Option 2: From backend directory
```bash
cd backend
npm run upload:images
```

### Option 3: Direct execution
```bash
cd backend
npx tsx scripts/upload-images.ts
```

## What the Script Does

1. **Scans** the `webp_images/` directory for all `.webp` files
2. **Processes** each image:
   - Reads the image file
   - Generates BlurHash
   - Creates thumbnail (150x150)
   - Resizes full image (max 800x800)
3. **Extracts metadata** from filename:
   - Description: "Image 001", "Image 002", etc.
   - Tags: Automatically assigned based on image number
4. **Inserts** into database with status "approved"
5. **Shows progress** with success/failure for each image

## Output Example

```
🚀 Starting bulk image upload...

📊 Found 100 images to upload

============================================================
✅ [1/100] (1.0%) image_001.webp → ID: 1
✅ [2/100] (2.0%) image_002.webp → ID: 2
...
============================================================
📊 Upload Summary
============================================================
✅ Successfully uploaded: 100 images
❌ Failed: 0 images
⏱️  Total time: 45.2 seconds
📈 Average: 0.45 seconds per image
============================================================

🎉 All images uploaded successfully!
```

## Image Metadata

The script automatically generates:
- **Description**: Based on filename (e.g., "Image 001")
- **Tags**: 
  - `tag1`: Rotates through categories (Nature, Urban, Abstract, etc.)
  - `tag2`: "Featured" for even-numbered images
  - `tag3`: "Popular" for images divisible by 3
- **Status**: Set to "approved"

## Troubleshooting

### Error: Directory not found
- Make sure `webp_images/` directory exists in the project root
- Check the path is correct

### Error: Missing database environment variables
- Ensure `.env.local` file exists in project root
- Verify all required variables are set:
  - `DATABASE_HOST`
  - `DATABASE_NAME`
  - `DATABASE_USER`
  - `DATABASE_PASSWORD`

### Error: Database connection failed
- Check PostgreSQL is running
- Verify database credentials in `.env.local`
- Make sure database exists (create it in pgAdmin if needed)

### Some images failed to upload
- Check the error messages in the output
- Verify image files are valid WebP format
- Check database has enough space

## Customization

To customize the script behavior, edit `backend/scripts/upload-images.ts`:

- **Batch size**: Change `BATCH_SIZE` constant (default: 5)
- **Tags**: Modify `generateTags()` function
- **Description**: Modify `extractMetadata()` function
- **Status**: Change default status in `uploadImage()` function
