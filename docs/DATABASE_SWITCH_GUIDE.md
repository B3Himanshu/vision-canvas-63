# Switching to ImageStorage Database

## Overview

You want to switch from your current database to the new `ImageStorage` database you just created. This guide explains how to do it.

---

## Step 1: Locate Your .env.local File

The database connection is configured in `.env.local`. Check these locations:
- `frontend/.env.local` (most likely - Next.js needs it here)
- Root `.env.local` (if exists)

---

## Step 2: Update Database Configuration

Open `frontend/.env.local` and update the `DATABASE_NAME` variable:

```env
# Before (example)
DATABASE_NAME=your_old_database_name

# After
DATABASE_NAME=ImageStorage
```

**Keep all other variables the same:**
- `DATABASE_HOST` - Your PostgreSQL server (e.g., `34.46.166.6`)
- `DATABASE_PORT` - Usually `5432`
- `DATABASE_USER` - Your PostgreSQL username
- `DATABASE_PASSWORD` - Your PostgreSQL password
- `DATABASE_SSL` - Usually `true` for remote connections

**Complete Example:**
```env
DATABASE_HOST=34.46.166.6
DATABASE_PORT=5432
DATABASE_NAME=ImageStorage
DATABASE_USER=your_username
DATABASE_PASSWORD=your_password
DATABASE_SSL=true
```

---

## Step 3: Verify Database Connection

### Option A: Test Connection (Quick Check)
You can test the connection by running:
```bash
cd backend
npm run migrate
```
This will attempt to connect and show any errors if the connection fails.

### Option B: Check via pgAdmin
In pgAdmin (which you already have open):
1. Right-click on `ImageStorage` database
2. Select "Query Tool"
3. Run: `SELECT current_database();`
4. Should return: `ImageStorage`

---

## Step 4: Run Migrations on New Database

**IMPORTANT:** The `ImageStorage` database is new and empty. You need to run all migrations to create the required tables.

### Run All Migrations
```bash
cd backend
npm run migrate
```

This will:
- Create the `generated_images` table
- Create all indexes
- Create the `schema_migrations` table
- Set up the complete schema

**Expected Output:**
```
✓ Migration 001_initial_schema applied
✓ Migration 002_add_analytics applied
✓ Migration 003_add_indexes applied
✓ Migration 004_add_favorites applied
✓ Migration 005_add_analytics_columns applied
✓ Migration 006_add_collections applied
✓ Migration 007_add_users applied
✓ Migration 008_optimize_indexes applied
✓ Migration 009_add_blurhash applied (if you want BlurHash)
```

---

## Step 5: Verify Tables Are Created

In pgAdmin Query Tool for `ImageStorage` database:
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should show:
-- generated_images
-- schema_migrations
-- (and other tables if migrations created them)
```

---

## Step 6: Restart Your Development Server

After changing the database:
1. Stop your dev server (Ctrl+C)
2. Restart: `npm run dev`
3. The app will now use the `ImageStorage` database

---

## Important Notes

### Database is Empty
- The `ImageStorage` database is **brand new and empty**
- You'll need to:
  - Run migrations (creates tables)
  - Upload new images (no existing images will be migrated)
  - Or export/import data if you want to move images from old database

### Data Migration (Optional)

If you want to copy existing images from your old database to `ImageStorage`:

**Option 1: Manual Copy (Simple)**
1. Export images from old database (using existing export scripts)
2. Re-upload through API (images will be converted to WebP)

**Option 2: Database Dump (Advanced)**
```sql
-- In old database
COPY (SELECT * FROM generated_images) TO '/path/to/file.csv';

-- In ImageStorage database
COPY generated_images FROM '/path/to/file.csv';
```

**Option 3: Use Export Scripts**
You have export scripts in `backend/scripts/`:
- `export-custom-tables.ts` - Export images
- Can modify to import into new database

---

## Troubleshooting

### Error: "database does not exist"
- Check spelling: `ImageStorage` (case-sensitive in some PostgreSQL setups)
- Verify database exists in pgAdmin
- Try: `ImageStorage` or `imagestorage` (lowercase)

### Error: "permission denied"
- Verify user has access to `ImageStorage` database
- In pgAdmin: Right-click `ImageStorage` → Properties → Privileges
- Grant your user access

### Error: "connection refused"
- Check `DATABASE_HOST` is correct
- Verify PostgreSQL server is running
- Check firewall/network settings

### Empty Gallery After Switch
- **Expected!** New database has no images
- Upload new images through API
- Or migrate data from old database

---

## Quick Summary

1. ✅ Edit `frontend/.env.local`
2. ✅ Change `DATABASE_NAME=ImageStorage`
3. ✅ Run `cd backend && npm run migrate`
4. ✅ Restart dev server: `npm run dev`
5. ✅ Upload images or migrate data

---

## Environment File Location

Your `.env.local` should be in:
- **Primary**: `frontend/.env.local` (Next.js uses this)
- **Backup**: Root `.env.local` (if you have one)

**Make sure to update the one in `frontend/` folder!**
