# Environment Configuration Guide

## Quick Setup for Localhost Database

### Step 1: Create `.env.local` file

Copy the example file:
```bash
cp .env.example .env.local
```

Or create `.env.local` manually in the root directory with this content:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ImageStorage
DATABASE_USER=postgres
DATABASE_PASSWORD=your_postgres_password_here

# SSL Configuration (false for localhost)
DATABASE_SSL=false

# Optional Settings
DATABASE_CONNECTION_TIMEOUT=10000
DATABASE_STATEMENT_TIMEOUT=120000
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 2: Update Database Credentials

1. **DATABASE_NAME**: Should match your pgAdmin database name exactly
   - If you created it as `ImageStorage` (with quotes), use `ImageStorage`
   - If you created it without quotes, PostgreSQL converts it to lowercase: `imagestorage`
   - Check in pgAdmin to see the exact name

2. **DATABASE_USER**: Usually `postgres` for local installations
   - Or the username you configured in PostgreSQL

3. **DATABASE_PASSWORD**: Your PostgreSQL password
   - The password you set when installing PostgreSQL
   - Or the password for the `postgres` user

4. **DATABASE_PORT**: Default is `5432`
   - Check in pgAdmin if you're using a different port

### Step 3: Verify Database Connection

Test the connection:
```bash
npm run migrate
```

This will:
- Connect to your local database
- Run all migrations to create the schema
- Verify the connection works

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_HOST` | Database server hostname | `localhost` |
| `DATABASE_PORT` | Database server port | `5432` |
| `DATABASE_NAME` | Database name | `ImageStorage` |
| `DATABASE_USER` | Database username | `postgres` |
| `DATABASE_PASSWORD` | Database password | `your_password` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_SSL` | Enable SSL connection | `false` (for localhost) |
| `DATABASE_CONNECTION_TIMEOUT` | Connection timeout (ms) | `10000` |
| `DATABASE_STATEMENT_TIMEOUT` | Query timeout (ms) | `120000` |
| `NODE_ENV` | Environment mode | `development` |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | `http://localhost:3000` |

## Troubleshooting

### Connection Refused
- Check PostgreSQL is running: `pg_ctl status` or check Services (Windows)
- Verify port 5432 is correct
- Check firewall settings

### Authentication Failed
- Verify username and password are correct
- Check `pg_hba.conf` allows local connections
- Try connecting with pgAdmin first to verify credentials

### Database Not Found
- Verify database name matches exactly (case-sensitive if created with quotes)
- Create the database in pgAdmin if it doesn't exist
- Check you're connected to the right PostgreSQL server

### SSL Errors
- For localhost, set `DATABASE_SSL=false`
- For remote databases, set `DATABASE_SSL=true`

## Migration from Remote Database

If you're migrating from the remote database (34.46.166.6), you can temporarily use:

```env
# Old remote database (for migration)
DATABASE_HOST=34.46.166.6
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=your_remote_password
DATABASE_SSL=true
```

Then switch back to localhost after migration.
