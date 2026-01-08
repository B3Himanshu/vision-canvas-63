# Backend Scripts

All database scripts in this folder require environment variables to be set.

## 🔧 Setup

1. **Create `.env.local` file in project root** (not in backend folder):
   ```env
   DATABASE_HOST=your_host
   DATABASE_PORT=5432
   DATABASE_NAME=your_database
   DATABASE_USER=your_user
   DATABASE_PASSWORD=your_password
   DATABASE_SSL=true
   ```

2. **Run scripts from project root** (recommended):
   ```bash
   # From project root
   npm run export:excel
   npm run migrate
   npm run backup:db
   ```

   OR from backend folder:
   ```bash
   # From backend folder
   cd backend
   npx tsx scripts/export-custom-tables.ts
   ```

## 📝 Available Scripts

### Export Custom Tables
```bash
npm run export:excel
# or
cd backend && npx tsx scripts/export-custom-tables.ts
```

### Export All Tables (filters Django)
```bash
npm run export:all
# or
cd backend && npx tsx scripts/export-to-excel.ts
```

### Run Migrations
```bash
npm run migrate
# or
cd backend && npx tsx scripts/run-migrations.ts
```

### Backup Database
```bash
npm run backup:db
# or
cd backend && npx tsx scripts/backup-database.ts
```

## ⚠️ Troubleshooting

### Error: "Missing required database environment variables"

**Solution:**
1. Make sure `.env.local` exists in the **project root** (not in backend folder)
2. Check that all required variables are set:
   - `DATABASE_HOST`
   - `DATABASE_NAME`
   - `DATABASE_USER`
   - `DATABASE_PASSWORD`

3. If running from backend folder, the script will automatically look for `.env.local` in the parent directory

### File Path Issues

All scripts automatically resolve the `.env.local` file from the project root, regardless of where you run them from.
