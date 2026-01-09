# Live Database Configuration

## Overview

This project uses the live database (`34.121.114.117/images`) as the primary database. This guide explains the configuration.

---

## Step 1: Locate Your .env.local File

The database connection is configured in `.env.local`. Check these locations:
- `frontend/.env.local` (most likely - Next.js needs it here)
- Root `.env.local` (if exists)

---

## Step 2: Update Database Configuration

Create or update `.env.local` in the root directory with the live database configuration:

```env
# Live Database Configuration
DATABASE_HOST=34.121.114.117
DATABASE_PORT=5432
DATABASE_NAME=images
DATABASE_USER=postgres
DATABASE_PASSWORD=your_database_password
DATABASE_SSL=true
```

**Configuration Details:**
- `DATABASE_HOST` - Live database server: `34.121.114.117`
- `DATABASE_PORT` - PostgreSQL port: `5432`
- `DATABASE_NAME` - Live database name: `images`
- `DATABASE_USER` - Database user: `postgres`
- `DATABASE_PASSWORD` - Your database password
- `DATABASE_SSL` - Required: `true` (for remote connections)

---

## Step 3: Verify Database Connection

### Option A: Test Connection (Quick Check)
You can test the connection by running:
```bash
cd backend
npm run migrate
```
This will attempt to connect and show any errors if the connection fails.

### Option B: Check via Database Client
In your PostgreSQL client:
1. Connect to `34.121.114.117:5432`
2. Select `images` database
3. Run: `SELECT current_database();`
4. Should return: `images`

---

## Step 4: Run Migrations on New Database

**IMPORTANT:** Ensure the `images` database has all required tables. Run migrations if needed.

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

In your database client for the `images` database:
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
3. The app will now use the live database (`34.121.114.117/images`)

---

## Important Notes

### Database Configuration
- The project uses the **live database** (`34.121.114.117/images`)
- All data is stored in the live database
- No localhost database is needed

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
- Check spelling: `images` (case-sensitive)
- Verify database exists on the live server (`34.121.114.117`)
- Ensure you have network access to the database server

### Error: "permission denied"
- Verify user has access to `images` database
- Check database user permissions on the live server
- Ensure credentials are correct in `.env.local`

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

1. ✅ Create/Edit `.env.local` in root directory
2. ✅ Set `DATABASE_HOST=34.121.114.117`
3. ✅ Set `DATABASE_NAME=images`
4. ✅ Set `DATABASE_SSL=true`
5. ✅ Run `cd backend && npm run migrate` (if needed)
6. ✅ Restart dev server: `npm run dev`

---

## Environment File Location

Your `.env.local` should be in:
- **Root directory**: `.env.local` (recommended)
- **Alternative**: `frontend/.env.local` (Next.js will also read this)

**Important:** Never commit `.env.local` to git (it contains sensitive credentials).
