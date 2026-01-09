# 🚀 How to Run PixelVault

## Quick Start (3 Steps)

### Step 1: Install Dependencies

Open PowerShell/Terminal in the project root and run:

```bash
npm run setup
```

This installs all dependencies for frontend, backend, and root project.

---

### Step 2: Set Up Environment Variables

Create `.env.local` file in the **root directory** with your database credentials:

**Option A: Create file manually**
1. Create a file named `.env.local` in the root directory
2. Add this content (replace password with your actual database password):

```env
DATABASE_HOST=your_database_host
DATABASE_PORT=5432
DATABASE_NAME=your_database_name
DATABASE_USER=postgres
DATABASE_PASSWORD=your_actual_password_here
DATABASE_SSL=true
```

**Option B: Use PowerShell**
```powershell
cd "c:\Users\Gaurav Kumar\OneDrive\Desktop\company\imageProject"
@"
DATABASE_HOST=your_database_host
DATABASE_PORT=5432
DATABASE_NAME=your_database_name
DATABASE_USER=postgres
DATABASE_PASSWORD=your_actual_password_here
DATABASE_SSL=true
"@ | Out-File -FilePath .env.local -Encoding utf8
```

⚠️ **Important:** Replace `your_actual_password_here` with your real database password!

---

### Step 3: Start the Development Server

From the root directory, run:

```bash
npm run dev
```

**Expected output:**
```
  ▲ Next.js 14.2.35
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.5s
```

---

### Step 4: Open in Browser

Open your browser and go to:

**👉 http://localhost:3000**

You should see the PixelVault homepage!

---

## 📋 Common Commands

### Development
```bash
npm run dev              # Start development server (recommended)
npm run dev:nodemon      # Start with auto-restart
```

### Database
```bash
npm run migrate          # Run database migrations (optional)
```

### Production
```bash
npm run build            # Build for production
npm run start            # Start production server (after build)
```

---

## 🔧 Troubleshooting

### "Missing database environment variables"
- Check `.env.local` exists in root directory
- Verify all variables are set correctly
- Make sure password is correct

### "Port 3000 already in use"
```powershell
# Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Or use different port
$env:PORT=3001; npm run dev
```

### "Module not found"
```bash
# Clean install
npm run setup
```

### Images not loading
1. Check database connection in `.env.local`
2. Verify API endpoint: http://localhost:3000/api/images
3. Check browser console for errors

---

## ✅ Verify It's Working

After starting, check:
- [ ] Server starts without errors
- [ ] Can access http://localhost:3000
- [ ] Homepage loads
- [ ] Can navigate to `/gallery`
- [ ] API works: http://localhost:3000/api/images

---

**For detailed documentation, see [README.md](./README.md) or [QUICK_START.md](./QUICK_START.md)**
