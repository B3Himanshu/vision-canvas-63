# Database Setup Guide: Live Database Configuration

## Overview

This guide explains how to configure your project to use the live database (`34.121.114.117/images`).

---

## Step 1: Update Environment Variables

### Find Your .env.local File

The `.env.local` file should be located in:
- **Root directory**: `.env.local` OR
- **Frontend directory**: `frontend/.env.local`

### Required Environment Variables

Copy this template and update with your actual credentials:

```env
# Database Configuration (LIVE DATABASE)
DATABASE_HOST=34.121.114.117
DATABASE_PORT=5432
DATABASE_NAME=images
DATABASE_USER=postgres
DATABASE_PASSWORD=your_database_password
DATABASE_SSL=true
```

### Database Configuration

The project uses the **live database** by default:
- **Host**: `34.121.114.117`
- **Database**: `images`
- **SSL**: Required (`true`)

---

## Step 2: Verify Database Connection

### Test the Connection

1. **Check if database exists**:
   - Open pgAdmin or your PostgreSQL client
   - Verify `ImageStorage` database exists
   - Check that you have access permissions

2. **Test connection from code**:
   ```bash
   cd backend
   npm run migrate
   ```
   - This will test the connection and run migrations
   - If connection fails, check your credentials

---

## Step 3: Run Migrations

After updating `.env.local`, run migrations to set up the schema:

```bash
cd backend
npm run migrate
```

This will:
- ✅ Create necessary tables (`generated_images`, `schema_migrations`, etc.)
- ✅ Add indexes
- ✅ Set up the schema structure

---

## Step 4: Verify Configuration

### Check Environment Variables Are Loaded

The application will:
- ✅ Load `.env.local` from root OR frontend directory
- ✅ Use `ImageStorage` as the database name
- ✅ Connect to the same host (34.46.166.6)

### Database Connection Flow

1. Application starts
2. Reads `.env.local` file
3. Connects to: `postgresql://postgres:PASSWORD@34.121.114.117:5432/images`
4. Uses connection pool (5-20 connections)

---

## Complete .env.local Template

Here's a complete template with all variables:

```env
# ============================================
# PostgreSQL Database Configuration
# ============================================

# Database Server (LIVE DATABASE)
DATABASE_HOST=34.121.114.117
DATABASE_PORT=5432

# Database Name
DATABASE_NAME=images

# Database Credentials
DATABASE_USER=your_postgresql_username
DATABASE_PASSWORD=your_postgresql_password

# SSL Configuration
# Set to 'true' for remote databases (recommended)
# Set to 'false' for local databases without SSL
DATABASE_SSL=true

# ============================================
# Optional: Connection Pool Settings
# ============================================
# DATABASE_CONNECTION_TIMEOUT=10000
# DATABASE_STATEMENT_TIMEOUT=120000

# ============================================
# Application Settings (Optional)
# ============================================
# NODE_ENV=development
```

---

## Quick Setup Checklist

- [ ] Locate your `.env.local` file (root or frontend directory)
- [ ] Set `DATABASE_HOST=34.121.114.117` (live database)
- [ ] Set `DATABASE_NAME=images` (live database name)
- [ ] Set `DATABASE_USER=postgres`
- [ ] Set `DATABASE_PASSWORD=your_database_password` (or your password)
- [ ] Set `DATABASE_SSL=true` (required for remote database)
- [ ] Save the file
- [ ] Test connection: `cd backend && npm run migrate`
- [ ] Verify tables are created in ImageStorage database
- [ ] Restart your development server

---

## Troubleshooting

### Error: "database does not exist"
- ✅ Verify `images` database exists on the live server
- ✅ Check `DATABASE_NAME=images` is spelled correctly

### Error: "password authentication failed"
- ✅ Verify `DATABASE_USER` and `DATABASE_PASSWORD` are correct
- ✅ Check user has access to `ImageStorage` database

### Error: "connection refused"
- ✅ Verify `DATABASE_HOST` and `DATABASE_PORT` are correct
- ✅ Check firewall rules allow connection
- ✅ Verify database server is running

### Error: "SSL connection required"
- ✅ Set `DATABASE_SSL=true` in `.env.local`
- ✅ For local databases without SSL, set `DATABASE_SSL=false`

### Environment Variables Not Loading
- ✅ Ensure file is named `.env.local` (with the dot)
- ✅ Check file is in root directory OR frontend directory
- ✅ Restart development server after changes
- ✅ Verify no syntax errors in `.env.local` file

---

## Migration from Old Database

### Option 1: Fresh Start (Recommended if new database)
1. Update `.env.local` with `DATABASE_NAME=ImageStorage`
2. Run migrations: `npm run migrate`
3. Start fresh with new database

### Option 2: Copy Data (If you need existing data)
1. Export data from old database
2. Update `.env.local` with `DATABASE_NAME=ImageStorage`
3. Run migrations in new database
4. Import data to new database

---

## Example .env.local File

**Location**: `frontend/.env.local` or `.env.local` (root)

```env
DATABASE_HOST=34.121.114.117
DATABASE_PORT=5432
DATABASE_NAME=images
DATABASE_USER=postgres
DATABASE_PASSWORD=your_database_password
DATABASE_SSL=true
```

**Important Notes:**
- ⚠️ Never commit `.env.local` to git (it's in `.gitignore`)
- ⚠️ Keep passwords secure
- ✅ Use strong passwords for production
- ✅ Use different credentials for development/production

---

## Security Best Practices

1. **Never commit `.env.local`**:
   - Already in `.gitignore`
   - Contains sensitive credentials

2. **Use strong passwords**:
   - Minimum 16 characters
   - Mix of letters, numbers, symbols

3. **Restrict database access**:
   - Use database user with limited permissions
   - Only grant necessary table access

4. **Use SSL for remote databases**:
   - Always set `DATABASE_SSL=true` for remote connections
   - Protects data in transit

---

## Next Steps

After configuring the database:

1. ✅ **Run migrations**: `cd backend && npm run migrate`
2. ✅ **Verify connection**: Check for errors
3. ✅ **Test API**: Try uploading an image
4. ✅ **Check database**: Verify tables created in ImageStorage
5. ✅ **Run application**: `npm run dev`

---

## Summary

**To configure the live database:**

1. Create/Update `.env.local` file:
   ```env
   DATABASE_HOST=34.121.114.117
   DATABASE_NAME=images
   DATABASE_USER=postgres
   DATABASE_PASSWORD=your_database_password
   DATABASE_SSL=true
   ```

2. Run migrations (if needed):
   ```bash
   cd backend && npm run migrate
   ```

3. Restart server:
   ```bash
   npm run dev
   ```

That's it! Your application will now use the live database (`34.121.114.117/images`).
