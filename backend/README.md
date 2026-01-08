# Backend - Database Operations

All database-related operations are centralized in this `backend` folder using **TypeScript/Next.js** (no Python/Django).

## 📁 Structure

```
backend/
├── lib/                    # Core database libraries
│   ├── db.ts              # Database connection pool
│   ├── db-retry.ts        # Connection retry logic
│   ├── validation.ts      # Input validation
│   ├── images.ts         # Image operations
│   ├── favorites.ts      # Favorites operations
│   ├── collections.ts    # Collections operations
│   ├── users.ts          # User management
│   └── search.ts          # Full-text search
├── scripts/               # Database scripts
│   ├── run-migrations.ts  # Run database migrations
│   ├── backup-database.ts # Backup database
│   ├── export-custom-tables.ts  # Export custom tables to Excel
│   ├── export-to-excel.ts      # Export all tables (filters Django)
│   └── migrations/       # SQL migration files
└── package.json          # Backend dependencies
```

## 🚀 Available Scripts

### Database Migrations
```bash
# Run all pending migrations
npm run migrate
# or
cd backend && npx tsx scripts/run-migrations.ts
```

### Database Backup
```bash
# Create a backup of the database
npm run backup:db
# or
cd backend && npx tsx scripts/backup-database.ts
```

### Export to Excel
```bash
# Export only custom application tables (recommended)
npm run export:excel
# or
cd backend && npx tsx scripts/export-custom-tables.ts

# Export all tables (filters out Django tables)
npm run export:all
# or
cd backend && npx tsx scripts/export-to-excel.ts
```

## 📊 Custom Tables

The following tables are considered "custom" and will be exported:

- `generated_images` - Main image data
- `favorites` - User favorites
- `collections` - Image collections
- `users` - User accounts (if custom, not Django)
- `schema_migrations` - Migration tracking
- `image_action_history` - Image analytics
- `jobs` - Background jobs
- `keywords` - Search keywords

## 🚫 Excluded Tables

The following Django/system tables are automatically excluded:

- `auth_*` - Django authentication tables
- `django_*` - Django system tables
- `users_groups` - Django user groups
- `users_user_permissions` - Django permissions

## 🔧 Environment Variables

Required in `.env.local`:

```env
DATABASE_HOST=your_host
DATABASE_PORT=5432
DATABASE_NAME=your_database
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_SSL=true
```

## 📝 Notes

- All scripts use **TypeScript/Node.js** (no Python/Django)
- All database operations use the connection pool from `lib/db.ts`
- All queries use parameterized statements to prevent SQL injection
- Input validation is enforced via `lib/validation.ts`
