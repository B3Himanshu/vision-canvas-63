# 🚀 Quick Start Guide - PixelVault

## Step-by-Step Instructions to Run the Application

### Prerequisites Check
- ✅ Node.js 18+ installed
- ✅ PostgreSQL database accessible (34.46.166.6:5432)
- ✅ Database credentials available

---

## Step 1: Install Dependencies

Open terminal in the project root and run:

```bash
npm run setup
```

This installs dependencies for:
- Root project
- Frontend (Next.js)
- Backend (database utilities)

**Or install manually:**
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

---

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the **root directory** of the project:

**Windows (PowerShell):**
```powershell
cd "c:\Users\Gaurav Kumar\OneDrive\Desktop\company\imageProject"
New-Item -Path .env.local -ItemType File -Force
```

**Then edit `.env.local` and add:**
```env
# Database Configuration (Required)
DATABASE_HOST=34.46.166.6
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=your_actual_password_here

# Optional: Database timeouts
DATABASE_CONNECTION_TIMEOUT=60000
DATABASE_STATEMENT_TIMEOUT=120000
DATABASE_SSL=true

# Optional: Connection pool settings
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

**⚠️ Important:** Replace `your_actual_password_here` with your actual database password!

---

## Step 3: Verify Database Connection (Optional)

Test if you can connect to the database:

```bash
cd backend
npm run migrate
```

This will:
- Test database connection
- Run any pending migrations
- Set up database schema if needed

**Expected output:**
```
✓ Migration 001_initial_schema already applied, skipping
✓ Migration 002_add_analytics already applied, skipping
...
All migrations completed successfully
```

---

## Step 4: Start Development Server

From the **root directory**, run:

```bash
npm run dev
```

**Or from frontend directory:**
```bash
cd frontend
npm run dev
```

**Expected output:**
```
> pixelvault-frontend@0.1.0 dev
> next dev --turbo

  ▲ Next.js 14.2.35
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Starting...
 ✓ Ready in 2.5s
```

---

## Step 5: Open in Browser

Open your browser and navigate to:

**http://localhost:3000**

You should see the PixelVault homepage!

---

## 📋 Available Commands

### Development
```bash
npm run dev              # Start development server (recommended)
npm run dev:nodemon      # Start with auto-restart
```

### Database
```bash
npm run migrate          # Run database migrations
npm run backup:db        # Backup database
npm run export:excel     # Export data to Excel
```

### Production
```bash
npm run build            # Build for production
npm run start            # Start production server (requires build first)
```

---

## 🔍 Troubleshooting

### Issue: "Missing required database environment variables"

**Solution:**
1. Check `.env.local` file exists in root directory
2. Verify all database variables are set correctly
3. Make sure there are no extra spaces in `.env.local`

### Issue: "Database connection error"

**Solution:**
1. Verify database credentials in `.env.local`
2. Check if database host (34.46.166.6) is accessible
3. Verify firewall/network settings allow connection
4. Check if PostgreSQL is running

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Or use a different port
PORT=3001 npm run dev
```

### Issue: "Module not found" or "Dependencies error"

**Solution:**
```bash
# Clean install
rm -rf node_modules frontend/node_modules backend/node_modules
rm package-lock.json
npm run setup
```

### Issue: Images not loading

**Solution:**
1. Verify database has images (should have 239 images)
2. Check browser console for errors
3. Verify API endpoints work:
   - http://localhost:3000/api/images
   - http://localhost:3000/api/images/1/thumbnail
4. Check database has `image_data` and `thumbnail_data` columns

---

## ✅ Quick Test Checklist

After starting the server, verify:

- [ ] Server starts without errors
- [ ] Can access http://localhost:3000
- [ ] Homepage loads
- [ ] Can navigate to `/gallery`
- [ ] Gallery shows images (or loading state)
- [ ] API endpoint works: http://localhost:3000/api/images
- [ ] Browser console has no critical errors

---

## 🎯 Next Steps

Once the app is running:

1. **Explore the Gallery** - Visit `/gallery` to see images
2. **Test API Endpoints**:
   - http://localhost:3000/api/images (list)
   - http://localhost:3000/api/images/1 (single image metadata)
   - http://localhost:3000/api/images/1/thumbnail (thumbnail image)
   - http://localhost:3000/api/images/1/file (full image)

3. **Check Database** - Verify images exist in `generated_images` table

---

## 📝 Notes

- **Development mode** (`npm run dev`) is recommended for development
- **No build required** for development - it compiles on-the-fly
- **Hot reload** is enabled - changes auto-refresh in browser
- **Database** should already have 239 images stored as binary (BYTEA)

---

**Need help?** Check the main [README.md](./README.md) for detailed documentation.
