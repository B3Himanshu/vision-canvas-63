# Database Duplication Script

This script replicates your entire database (structure and data) from a source database to a target database.

## Quick Start

The script is pre-configured with:
- **Source Database**: Uses your current `.env.local` settings
- **Target Database**: Configure via environment variables (see below)

## Usage

### Option 1: Run with default settings (recommended)

```bash
node duplicatescript.js
```

The script will:
1. Connect to your source database (from `.env.local`)
2. Connect to the target database (with the provided password)
3. Copy all tables, indexes, and data
4. Sync sequences

### Option 2: Customize via environment variables

Create or update `.env.local` with:

```env
# Source Database (your current database)
SOURCE_DATABASE_HOST=34.121.114.117
SOURCE_DATABASE_PORT=5432
SOURCE_DATABASE_NAME=images
SOURCE_DATABASE_USER=postgres
SOURCE_DATABASE_PASSWORD=your_source_password

# Target Database (new database)
TARGET_DATABASE_HOST=your_target_host
TARGET_DATABASE_PORT=5432
TARGET_DATABASE_NAME=your_target_database
TARGET_DATABASE_USER=postgres
TARGET_DATABASE_PASSWORD=your_target_password
```

Then run:
```bash
node duplicatescript.js
```

## What the Script Does

1. ✅ Tests connections to both databases
2. ✅ Lists all tables in source database
3. ✅ Creates tables in target database (with same structure)
4. ✅ Copies all data row by row
5. ✅ Creates indexes
6. ✅ Syncs sequences (for auto-increment columns)

## Requirements

- Node.js installed
- `pg` package (already in backend dependencies)
- `dotenv` package (already in backend dependencies)
- Network access to both databases

## Notes

- The script will **DROP** existing tables in the target database before creating new ones
- Large tables may take time to copy
- Progress is shown for each table
- The script handles errors gracefully and continues with other tables

## Troubleshooting

### Connection Issues
- Verify database credentials
- Check firewall/network access
- Ensure SSL is properly configured

### Permission Issues
- Make sure the database user has CREATE, INSERT, and SELECT permissions
- For sequences, user needs USAGE permission

### Large Tables
- The script processes data in batches of 1000 rows
- For very large tables, consider running during off-peak hours
