# Environment Configuration Guide

## Quick Setup for Live Database

### Step 1: Create `.env.local` file

Copy the example file:
```bash
cp env.example .env.local
```

Or create `.env.local` manually in the root directory with this content:

```env
# Database Configuration (LIVE DATABASE)
DATABASE_HOST=34.121.114.117
DATABASE_PORT=5432
DATABASE_NAME=images
DATABASE_USER=postgres
DATABASE_PASSWORD=your_database_password

# SSL Configuration (required for remote database)
DATABASE_SSL=true

# Optional Settings
DATABASE_CONNECTION_TIMEOUT=10000
DATABASE_STATEMENT_TIMEOUT=120000
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 2: Database Credentials

The project is configured to use the **live database** by default:
- **DATABASE_HOST**: `34.121.114.117` (live database server)
- **DATABASE_NAME**: `images` (live database name)
- **DATABASE_USER**: `postgres`
- **DATABASE_PASSWORD**: Set in `.env.local` (never commit to git)
- **DATABASE_SSL**: `true` (required for remote connections)

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
| `DATABASE_HOST` | Database server hostname | `34.121.114.117` |
| `DATABASE_PORT` | Database server port | `5432` |
| `DATABASE_NAME` | Database name | `images` |
| `DATABASE_USER` | Database username | `postgres` |
| `DATABASE_PASSWORD` | Database password | `your_password` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_SSL` | Enable SSL connection | `true` (required for live database) |
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
- For live database, ensure `DATABASE_SSL=true`
- SSL is required for remote database connections

## Important Notes

- ✅ The project uses the **live database** (`34.121.114.117/images`) by default
- ✅ No localhost database configuration needed
- ✅ All data is stored in the live database
- ⚠️ Never commit `.env.local` to git (contains sensitive credentials)
