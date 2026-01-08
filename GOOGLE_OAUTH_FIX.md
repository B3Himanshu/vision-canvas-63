# Fix: OAuth Client Deleted Error

## Issue
The error "The OAuth client was deleted" (Error 401: deleted_client) means your OAuth client ID was deleted in Google Cloud Console.

## Solution: Create a New OAuth Client

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/apis/credentials
2. Make sure you're in the correct project: `certain-acre-473611-q9`

### Step 2: Create New OAuth 2.0 Client ID
1. Click **"+ CREATE CREDENTIALS"** at the top
2. Select **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen first:
   - User Type: **External** (for testing) or **Internal** (if using Google Workspace)
   - App name: **PixelVault** (or your app name)
   - User support email: Your email
   - Developer contact: Your email
   - Click **"Save and Continue"**
   - Scopes: Click **"Save and Continue"** (default is fine)
   - Test users: Add your email, then **"Save and Continue"**
   - Summary: Click **"Back to Dashboard"**

4. Now create the OAuth client:
   - Application type: **Web application**
   - Name: **PixelVault Web Client** (or any name)
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/google/callback`
   - Click **"CREATE"**

### Step 3: Copy the Credentials
After creating, you'll see:
- **Client ID** (looks like: `123456789-abc...apps.googleusercontent.com`)
- **Client secret** (looks like: `GOCSPX-...`)

### Step 4: Update Environment Variables
Update your `.env.local` file with the new credentials:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_new_client_id_here
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_CLIENT_ID=your_new_client_id_here
GOOGLE_CLIENT_SECRET=your_new_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Step 5: Restart Dev Server
After updating `.env.local`:
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Quick Checklist
- [ ] OAuth consent screen configured
- [ ] OAuth client ID created (Web application type)
- [ ] Authorized JavaScript origin: `http://localhost:3000`
- [ ] Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
- [ ] `.env.local` updated with new credentials
- [ ] Dev server restarted

## Alternative: Use Existing Client (if available)
If you have another OAuth client in the same project that's not deleted:
1. Go to Credentials page
2. Find an existing OAuth 2.0 Client ID
3. Click to edit it
4. Make sure redirect URI is added: `http://localhost:3000/api/auth/google/callback`
5. Copy the Client ID and Client Secret
6. Update `.env.local`
