# PixelVault - Free High-Quality Image Gallery

A modern, responsive image gallery application built with Next.js 14, React, and TypeScript. PixelVault provides a beautiful interface for browsing, searching, and downloading free high-quality images optimized for both mobile and desktop use.

![PixelVault](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18.3-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)

## 🎯 What is PixelVault?

PixelVault is a **free image gallery platform** that allows users to:

- **Browse** thousands of high-quality images across multiple categories
- **Search** for specific images using keywords and tags
- **Filter** images by category, orientation, colors, and more
- **Authenticate** with Google OAuth for secure access
- **Download** images in multiple formats (16:9, 9:16, Original) - requires authentication
- **Save** images to favorites and create custom collections
- **View** images in beautiful masonry or grid layouts
- **Seamless OAuth Flow** - Redirects back to the image you were viewing after login

---

## 🏗️ How the Project Works

### Architecture Overview

PixelVault follows a **full-stack architecture** with clear separation between frontend and backend:

```
┌─────────────────┐
│   Frontend      │  Next.js 14 (React + TypeScript)
│   (User UI)     │  └─ App Router, API Routes, Components
└────────┬────────┘
         │ HTTP Requests
┌────────▼────────┐
│   Backend       │  PostgreSQL Database
│   (API Layer)   │  └─ Image data, Users, Favorites, Collections
└─────────────────┘
```

### Key Components

1. **Frontend (Next.js App Router)**
   - `app/` - Next.js pages and API routes
   - `src/components/` - React components (UI, Gallery, Home)
   - Uses React Query for data fetching and caching
   - Server-side rendering with client-side interactivity

2. **Backend (Database Layer)**
   - `backend/lib/` - Database utilities and business logic
   - PostgreSQL database storing all image metadata
   - Database migrations for schema management

3. **API Routes**
   - Located in `app/api/` directory
   - RESTful endpoints for images, users, favorites, collections
   - Handles authentication, rate limiting, and error handling

### Data Flow

**For Image List (Metadata):**
```
User visits gallery page
    ↓
Frontend Component (React)
    ↓
API Route: GET /api/images
    ↓
Backend Library: Query metadata only
    ↓
PostgreSQL Database (returns JSON metadata)
    ↓
API returns JSON → Frontend → Renders image cards with thumbnail URLs
```

**For Image Display (Binary):**
```
Browser sees <img src="/api/images/238/thumbnail">
    ↓
API Route: GET /api/images/238/thumbnail
    ↓
Backend Library: Query thumbnail_data (BYTEA)
    ↓
PostgreSQL Database (returns binary data)
    ↓
API streams binary → Browser → Displays image
```

---

## 💾 Database Structure

The application uses **PostgreSQL** to store all data. Here's what's stored:

### Main Tables

1. **`generated_images`** - Main images table
   - `id` - Unique image ID (bigint)
   - `image_data` - Full image binary data (BYTEA, ~100KB - 1MB)
   - `thumbnail_data` - Small preview image binary (BYTEA, ~7KB)
   - `image_mime_type` - MIME type (e.g., "image/jpeg")
   - `image_size` - File size in bytes
   - `image_width` - Width in pixels
   - `image_height` - Height in pixels
   - `description` - Image description (text)
   - `tag1`, `tag2`, `tag3` - Tags for categorization (varchar)
   - `status` - Image status ("pending", "approved", "rejected")
   - `is_deleted` - Soft delete flag (boolean)
   - `created_at`, `updated_at` - Timestamps
   - `view_count` - Number of views
   - `downloads` - Download count

2. **`users`** - User accounts
   - `id` - User ID
   - `email` - User email (unique)
   - `password_hash` - Encrypted password
   - `name` - User name
   - `created_at`, `last_login` - Timestamps

3. **`favorites`** - User favorites
   - `id` - Favorite ID
   - `user_id` - User who favorited
   - `image_id` - Image that was favorited
   - `created_at` - When favorited

4. **`collections`** - User image collections
   - `id` - Collection ID
   - `user_id` - Collection owner
   - `name` - Collection name
   - `description` - Collection description
   - `image_ids` - Array of image IDs in collection
   - `created_at`, `updated_at` - Timestamps

### Running Migrations

To set up the database schema:

```bash
cd backend
npm run migrate
# Or from root:
npm run migrate
```

This runs all migration files in `backend/scripts/migrations/` to create the necessary tables.

---

## 📁 Image Storage

Images are stored as **binary data (BYTEA) directly in PostgreSQL database**:

### Binary Storage Architecture

- **Full Images** - Stored in `image_data` column (BYTEA, ~100KB - 500KB)
- **Thumbnails** - Stored in `thumbnail_data` column (BYTEA, ~7KB)
- **Metadata** - Stored alongside binary data (dimensions, MIME type, tags, etc.)
- **Database Host** - Configured via environment variables

### Why Binary Storage?

✅ **Advantages:**
- All data in one place (no file system management)
- Database transactions ensure consistency
- Easy backup and replication
- No file path issues
- Atomic operations

### Image Flow

```
PostgreSQL Database (Google Cloud)
    ├── image_data (BYTEA) ────► Full Resolution Image (~250KB)
    └── thumbnail_data (BYTEA) ──► Thumbnail Preview (~7KB)
            │
            │ API Endpoints
            ▼
    GET /api/images/[id]/thumbnail  → Returns thumbnail binary
    GET /api/images/[id]/file       → Returns full image binary
```

**Current Status:**
- 239 images stored in database
- Each image has both thumbnail and full resolution stored as binary
- Images served directly from database via API endpoints

---

## 🔌 API Endpoints

The application provides RESTful API endpoints:

### Images
- `GET /api/images` - List/filter images (returns JSON metadata only, ~5-10 KB)
- `GET /api/images/[id]` - Get single image metadata (JSON, ~500 bytes)
- `GET /api/images/[id]/thumbnail` - Get thumbnail image (Binary, ~7 KB)
- `GET /api/images/[id]/file` - Get full resolution image (Binary, ~100-500 KB)
- `GET /api/images/search` - Search images
- `POST /api/images/upload` - Upload new image
- `GET /api/images/[id]/related` - Get related images

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - Handle Google OAuth callback
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

### Favorites
- `GET /api/favorites` - Get user's favorites
- `POST /api/favorites` - Add image to favorites
- `DELETE /api/favorites?imageId=X` - Remove from favorites

### Collections
- `GET /api/collections` - Get user's collections
- `POST /api/collections` - Create new collection
- `GET /api/collections/[id]` - Get collection by ID
- `DELETE /api/collections/[id]` - Delete collection

---

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Shadcn UI** - High-quality component library
- **Radix UI** - Accessible component primitives

### Backend
- **PostgreSQL (Google Cloud)** - Relational database with BYTEA binary storage
  - Host: Configured via DATABASE_HOST in .env.local
  - Images stored as binary data (BYTEA columns)
  - Connection pooling for performance
- **node-postgres (pg)** - PostgreSQL client for Node.js
- **TypeScript** - Type-safe database queries

### Key Libraries
- **next-themes** - Dark/light theme management
- **react-masonry-css** - Masonry grid layout
- **@tanstack/react-query** - Data fetching and caching (v5 with gcTime)
- **lucide-react** - Beautiful icon library
- **sonner** - Toast notifications
- **Google OAuth 2.0** - Authentication via Google Sign-In

---

## 📁 Project Structure

```
imageProject/
├── app/                      # Next.js App Router (Main Application)
│   ├── api/                  # API Routes (Backend endpoints)
│   │   ├── auth/            # Authentication endpoints
│   │   │   ├── google/
│   │   │   │   ├── route.ts              # GET /api/auth/google (initiate OAuth)
│   │   │   │   └── callback/
│   │   │   │       └── route.ts          # GET /api/auth/google/callback (OAuth callback)
│   │   ├── images/          # Image endpoints
│   │   │   ├── route.ts              # GET /api/images (list metadata)
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts          # GET /api/images/[id] (metadata)
│   │   │   │   ├── thumbnail/
│   │   │   │   │   └── route.ts      # GET /api/images/[id]/thumbnail (binary)
│   │   │   │   └── file/
│   │   │   │       └── route.ts      # GET /api/images/[id]/file (binary)
│   │   ├── favorites/       # Favorites endpoints
│   │   └── collections/     # Collections endpoints
│   ├── gallery/             # Gallery page
│   ├── tag/                 # Tag pages
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── providers.tsx        # Client providers (React Query, Theme)
│   └── globals.css          # Global styles
│
├── src/                      # React Components (Shared)
│   ├── components/
│   │   ├── gallery/         # Gallery components
│   │   ├── home/            # Home page components
│   │   ├── layout/          # Layout components (Header, Footer)
│   │   └── ui/              # Shadcn UI components
│   ├── hooks/               # Custom React hooks
│   └── lib/                 # Utility functions
│
├── backend/                  # Backend Utilities
│   ├── lib/                 # Database libraries
│   │   ├── db.ts           # Database connection
│   │   ├── images.ts       # Image queries
│   │   ├── users.ts        # User queries
│   │   ├── favorites.ts    # Favorites queries
│   │   ├── collections.ts  # Collections queries
│   │   └── validation.ts   # Input validation
│   └── scripts/
│       ├── migrations/      # Database migrations
│       └── run-migrations.ts
│
├── public/                   # Static files
│   ├── uploads/            # Uploaded images (created on upload)
│   ├── favicon.ico
│   └── robots.txt
│
├── config/
│   └── env.ts              # Environment configuration
│
├── lib/                     # Shared utilities
│   ├── auth.ts             # Authentication helpers
│   └── monitoring.ts       # Logging utilities
│
├── package.json             # Root workspace scripts
└── .env.local              # Environment variables (create this)
```

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js 18+** (Download from [nodejs.org](https://nodejs.org/))
- **PostgreSQL Database** (Remote database or local installation)
- **npm** (comes with Node.js)

### Step 1: Install Dependencies

```bash
# Install all dependencies (root, frontend, and backend)
npm run setup

# Or install manually:
npm install
cd frontend && npm install
cd ../backend && npm install
```

### Step 2: Set Up Environment Variables

Create a `.env.local` file in the **root directory**:

```env
# Database Configuration (Required)
DATABASE_HOST=your_database_host
DATABASE_PORT=5432
DATABASE_NAME=your_database_name
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

# Optional: Database timeouts
DATABASE_CONNECTION_TIMEOUT=60000
DATABASE_STATEMENT_TIMEOUT=120000
DATABASE_SSL=true

# Optional: Connection pool settings
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Google OAuth Configuration (Required for authentication)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Session Secret (Required for authentication)
SESSION_SECRET=your_random_session_secret_here
```

**Database Details:**
- **Host**: Configured via DATABASE_HOST in .env.local
- **Total Images**: 239 (stored as binary BYTEA)
- **Storage**: Images stored directly in database (`image_data`, `thumbnail_data` columns)

**Important:** Never commit `.env.local` to git (it's in `.gitignore`).

### Step 3: Run Database Migrations

Set up the database schema:

```bash
# From root directory
npm run migrate

# Or from backend directory
cd backend
npm run migrate
```

This creates all necessary tables in your PostgreSQL database.

### Step 4: Start Development Server

```bash
# From root directory (recommended)
npm run dev

# Or from frontend directory
cd frontend
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## 📜 Available Scripts

### From Root Directory

```bash
npm run dev              # Start development server (recommended)
npm run build            # Build for production
npm run start            # Start production server (requires build first)
npm run setup            # Install all dependencies
npm run migrate          # Run database migrations
npm run backup:db        # Backup database
npm run export:excel     # Export data to Excel
npm run lint             # Run ESLint
```

### From Frontend Directory

```bash
cd frontend
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### From Backend Directory

```bash
cd backend
npm run migrate          # Run database migrations
npm run backup           # Backup database
npm run export:all       # Export all data
```

---

## 🎨 Features in Detail

### Authentication & User Management
- **Google OAuth Sign-In** - One-click authentication with Google account
- **Session Management** - Secure session tokens stored in HTTP-only cookies
- **Protected Downloads** - Image downloads require authentication
- **Seamless Redirect** - After login, users are redirected back to the image they were viewing
- **OAuth State Management** - CSRF protection for OAuth flows

### Home Page (`/`)
- **Hero Section** - Eye-catching hero with search bar and category pills
- **Featured Collections** - Carousel showcasing curated image collections
- **Stats Section** - Display of platform statistics
- **Category Grid** - Visual grid of all available categories
- **CTA Section** - Call-to-action for exploring the gallery

### Gallery Page (`/gallery`)
- **Search Bar** - Real-time image search
- **Sticky Toolbar** - Sort options (Recent, Popular, Trending)
- **Filter Sidebar** - Advanced filtering by category, orientation, colors
- **Masonry/Grid View** - Toggle between layout styles
- **Infinite Scroll** - Automatic loading of more images
- **Image Cards** - Hover effects with image metadata
- **OAuth Return Optimization** - Smooth loading overlay when returning from authentication
- **Smart Image Fetching** - Automatically fetches specific images even if they don't match current filters

### Image Modal
- **Full-screen Preview** - Large image view with zoom controls
- **Download Options** - Multiple format downloads (16:9, 9:16, Original)
- **Authentication Required** - Prompts for login when attempting to download without authentication
- **Manual Download** - Users must click download button (no auto-download after login)
- **Image Metadata** - Author, downloads, category, tags
- **Navigation** - Previous/Next image navigation
- **Related Images** - Suggestions for similar images
- **URL Management** - Clean URL parameters after download and modal close

### Tag Pages (`/tag/[tagName]`)
- **Dynamic Routes** - Individual pages for each tag
- **Related Tags** - Suggestions for similar tags
- **Tag-specific Images** - Curated images for each tag

---

## 🔧 How It Works: Complete Binary Image Flow

### 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Google Cloud PostgreSQL    Next.js Backend      Browser      │
│   ┌─────────────────────┐   ┌──────────────┐   ┌──────────┐  │
│   │                     │   │              │   │          │  │
│   │  generated_images   │──►│  API Routes  │──►│  Gallery │  │
│   │  table              │   │              │   │  Page    │  │
│   │                     │   │              │   │          │  │
│   │  - image_data       │   │/api/images   │   │  <img>   │  │
│   │  - thumbnail_data   │   │              │   │  tags    │  │
│   │  - metadata         │   │              │   │          │  │
│   │                     │   │              │   │          │  │
│   └─────────────────────┘   └──────────────┘   └──────────┘  │
│                                                                 │
│   IP: 34.46.166.6         Your Application      User Browser   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1. Complete Image Loading Flow (Step by Step)

#### PHASE 1: Database Connection
```
Application Starts
    ↓
Create Connection Pool (5-10 connections)
    ↓
Pool connects to database configured via environment variables
    ↓
Connection Established ✅
```

#### PHASE 2: Gallery Page Load
```
User visits /gallery
    ↓
Browser requests Gallery Page
    ↓
Next.js Server Component executes
    ↓
Server makes API call: GET /api/images
```

#### PHASE 3: Fetch Image List (Metadata Only)
```
API Route: GET /api/images
    ↓
Database Query (metadata only - NO binary data):
    SELECT id, description, tag1, tag2, image_width, 
           image_height, created_at, status
    FROM generated_images
    WHERE is_deleted = false
    ORDER BY created_at DESC
    LIMIT 20
    ↓
PostgreSQL returns ~20 rows of text data (~5-10 KB)
    ↓
API formats as JSON:
    {
      "images": [
        { "id": 238, "description": "...", "tag1": "Funding" },
        { "id": 174, "description": "...", "tag1": "Marathon" },
        ...
      ],
      "total": 239
    }
    ↓
JSON sent to frontend
```

#### PHASE 4: Frontend Renders Gallery
```
Frontend receives JSON with image list
    ↓
Frontend creates HTML structure
    ↓
For each image, creates <img> tag:
    <img src="/api/images/238/thumbnail" />
    <img src="/api/images/174/thumbnail" />
    ...
    ↓
HTML sent to browser
    ↓
Browser sees 20 <img> tags needing thumbnail images
```

#### PHASE 5: Browser Fetches Thumbnails
```
Browser makes 20 parallel HTTP requests:
    GET /api/images/238/thumbnail
    GET /api/images/174/thumbnail
    GET /api/images/159/thumbnail
    ... (20 total)
    ↓
Each request hits API Route: /api/images/[id]/thumbnail
    ↓
Database Query:
    SELECT thumbnail_data, image_mime_type
    FROM generated_images
    WHERE id = 238
    ↓
PostgreSQL returns binary data:
    thumbnail_data: 6,880 bytes (BYTEA)
    image_mime_type: "image/jpeg"
    ↓
API sets response headers:
    Content-Type: image/jpeg
    Content-Length: 6880
    Cache-Control: public, max-age=3600
    ↓
API sends raw binary bytes to browser (NOT base64, NOT JSON)
    ↓
Browser receives bytes and displays image in <img> tag ✅
    ↓
Browser caches thumbnail (1 hour cache)
```

#### PHASE 6: User Clicks Image (Full Resolution)
```
User clicks thumbnail
    ↓
Modal/Lightbox opens
    ↓
Modal contains: <img src="/api/images/238/file" />
    ↓
Browser requests full image
    ↓
API Route: GET /api/images/238/file
    ↓
Database Query:
    SELECT image_data, image_mime_type
    FROM generated_images
    WHERE id = 238
    ↓
PostgreSQL returns full binary data:
    image_data: 248,111 bytes (~248 KB)
    image_mime_type: "image/jpeg"
    ↓
API streams binary to browser
    ↓
Full resolution image displays in modal ✅
```

### 2. API Endpoints Summary

| Endpoint | Purpose | Returns | Size |
|----------|---------|---------|------|
| `GET /api/images` | List all images | JSON metadata | ~5-10 KB |
| `GET /api/images/[id]` | Single image details | JSON metadata | ~500 bytes |
| `GET /api/images/[id]/thumbnail` | Small preview | Binary image | ~7 KB |
| `GET /api/images/[id]/file` | Full resolution | Binary image | ~100-500 KB |

### 3. Performance Timeline

```
0ms      User types URL and hits Enter
50ms     Browser requests Gallery page
100ms    Server queries DB for image list (metadata only)
150ms    Server sends HTML with 20 <img> tags
200ms    Browser starts rendering page structure
250ms    Browser fires 20 parallel requests for thumbnails
500ms    First thumbnails start appearing
750ms    All thumbnails loaded ✅ Gallery fully visible!

User clicks image:
0ms      Click detected
50ms     Modal opens with loading spinner
100ms    Browser requests /api/images/238/file
400ms    Full image loads in modal ✅
```

### 4. Why This Approach Works

| Principle | Benefit |
|-----------|---------|
| Thumbnails in gallery | Fast loading (7KB vs 250KB) |
| Full image on demand | Only loads when user wants it |
| Separate API routes | Browser handles each image independently |
| HTTP caching | Repeat visits are instant |
| No base64 in JSON | Keeps API responses small (~5KB) |
| Connection pooling | Fast database access |
| Binary storage in DB | All data in one place, atomic operations |

### 5. Search Functionality

- User types in search bar
- Frontend sends request to `/api/images/search?q=keyword`
- Backend performs full-text search on `description`, `tag1`, `tag2`
- Returns JSON metadata (no binary data)
- Frontend renders results with thumbnail URLs

### 6. Favorites System

- User clicks favorite button
- Frontend calls `POST /api/favorites` with `image_id`
- Backend saves to `favorites` table (user_id + image_id)
- Favorite status displayed in UI
- Thumbnails still loaded from `/api/images/[id]/thumbnail`

### 7. OAuth Authentication Flow

```
User clicks "Download" without being logged in
    ↓
Sign-in modal appears with "Continue with Google" button
    ↓
User clicks Google Sign-In
    ↓
Frontend redirects to: GET /api/auth/google
    ↓
Backend generates OAuth state token and redirects to Google
    ↓
User authenticates with Google
    ↓
Google redirects to: GET /api/auth/google/callback?code=...
    ↓
Backend exchanges code for access token
    ↓
Backend retrieves user info from Google
    ↓
Backend creates/updates user in database
    ↓
Backend generates session token
    ↓
Backend redirects to: /gallery?image=84&auth=success
    ↓
Gallery page detects OAuth return
    ↓
Shows loading overlay: "Opening image..."
    ↓
Fetches specific image directly from API
    ↓
Opens image modal with the image
    ↓
User manually clicks download button
    ↓
Download starts ✅
```

### 8. Download Flow with Authentication

```
User clicks download button
    ↓
Check if user is authenticated
    ↓
If NOT authenticated:
    - Store pending download format
    - Show sign-in modal
    - Construct return URL: /gallery?image=84
    ↓
User completes OAuth login
    ↓
Redirected back to: /gallery?image=84&auth=success
    ↓
Modal opens with image
    ↓
User clicks download button again
    ↓
Download starts (user is now authenticated) ✅
```

---

## 🎯 Use Cases

- **Designers** - Find high-quality images for projects
- **Developers** - Source images for applications and websites
- **Content Creators** - Discover images for social media and blogs
- **Marketers** - Browse images for campaigns and presentations
- **Students** - Access free images for projects and assignments

---

## 🔒 Security Features

- **Input Validation** - All user inputs are validated and sanitized
- **Rate Limiting** - API routes protected with rate limiting
- **SQL Injection Protection** - Parameterized queries prevent SQL injection
- **Password Hashing** - User passwords are hashed (SHA-256)
- **OAuth Security** - CSRF protection with state tokens for Google OAuth
- **Session Tokens** - Secure HTTP-only cookies for session management
- **Environment Variables** - Sensitive data stored in `.env.local`

---

## 📱 Responsive Design

- **Mobile**: < 640px - Optimized mobile layout
- **Tablet**: 640px - 1024px - Adaptive tablet layout
- **Desktop**: > 1024px - Full desktop experience
- **Large Desktop**: > 1280px - Enhanced large screen layout

---

## 🔄 Recent Improvements & Updates

### OAuth Authentication Flow
- **Google Sign-In Integration** - Users can sign in with their Google account
- **Smart Redirect Handling** - After OAuth login, users are redirected to the specific image they were viewing
- **Loading State Optimization** - Shows loading overlay during OAuth return instead of flashing gallery
- **URL Parameter Management** - Automatically cleans up OAuth-related URL parameters to prevent redirect loops

### Download Flow Enhancements
- **Manual Download** - After OAuth login, users must manually click download (no auto-download)
- **Authentication Prompts** - Clear sign-in modal when attempting to download without authentication
- **URL Cleanup** - Automatically removes download-related URL parameters after successful download

### Performance Optimizations
- **React Query v5** - Updated to use `gcTime` instead of deprecated `cacheTime`
- **Direct Image Fetching** - Fetches specific images directly from API when not found in filtered results
- **Optimized Re-renders** - Fixed infinite loop issues with URL parameter handling
- **Memoized Return URLs** - Prevents unnecessary recalculations during OAuth flows

### User Experience Improvements
- **Smooth OAuth Return** - Loading overlay prevents gallery flash when returning from authentication
- **Better Error Handling** - Improved error messages and handling for authentication failures
- **Clean URL Management** - URL parameters are properly cleaned up after actions complete

## 🚀 Deployment

### Development vs Production

**Development Mode** (`npm run dev`):
- Hot reload enabled
- Detailed error messages
- No build step required
- Faster startup

**Production Mode** (`npm run build` + `npm run start`):
- Optimized bundle
- Static page generation
- Better performance
- Requires build step first

### Deployment Platforms

The app can be deployed to:
- **Vercel** (Recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Railway**
- **DigitalOcean App Platform**

---

## 🐛 Troubleshooting

### Database Connection Issues

If you get database connection errors:
1. Check `.env.local` file exists and has correct credentials
2. Verify PostgreSQL is running and accessible
3. Check firewall/network settings
4. Verify database host, port, and credentials

### Build Errors

If build fails:
- Run `npm run dev` instead (development mode doesn't require build)
- Check for TypeScript errors: `npm run lint`
- Ensure all dependencies are installed: `npm run setup`

### Images Not Loading

- Check database has image records (should have 239 images)
- Verify binary data exists in `image_data` and `thumbnail_data` columns
- Check API endpoints are accessible: `/api/images/[id]/thumbnail`
- Check browser console for CORS or network errors
- Verify database connection is working (check DATABASE_HOST in .env.local)
- Check that API routes return proper `Content-Type` headers for binary data

### OAuth Authentication Issues

If Google Sign-In is not working:
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env.local`
2. Check `GOOGLE_REDIRECT_URI` matches your Google Cloud Console configuration
3. Ensure redirect URI in Google Console includes: `http://localhost:3000/api/auth/google/callback`
4. Check browser console for OAuth errors
5. Verify `SESSION_SECRET` is set in environment variables
6. Clear browser cookies if experiencing session issues

### Download Issues

If downloads are not working:
1. Ensure user is authenticated (check for session token in cookies)
2. Verify download endpoint `/api/images/[id]/file` is accessible
3. Check browser console for authentication errors (401 status)
4. Ensure OAuth callback is properly redirecting after login
5. Check that URL parameters are being cleaned up properly

### Binary Image Issues

- **Thumbnails not displaying**: Check `/api/images/[id]/thumbnail` endpoint returns binary data
- **Full images not loading**: Verify `/api/images/[id]/file` endpoint is working
- **Slow image loading**: Check database connection pool settings
- **Large response sizes**: Ensure thumbnails are properly sized (~7KB)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- Images provided by [Picsum Photos](https://picsum.photos/)
- Icons by [Lucide](https://lucide.dev/)
- UI Components by [Shadcn UI](https://ui.shadcn.com/)

---

## 📞 Support

For support, email support@pixelvault.com or open an issue in the repository.

---

**Made with ❤️ for creators worldwide**
