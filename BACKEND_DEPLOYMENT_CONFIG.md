# Backend Deployment Configuration - Updated

## Summary of Changes

All package.json files and deployment configurations have been updated to ensure Render runs the backend correctly.

## Configuration Files Updated

### 1. Root `package.json`
**Updated:** `"main": "backend/src/server.js"`
**Start Command:** `cd backend && npm install && node src/server.js`

This ensures when you run `npm start` from the root, it:
1. Navigates to the backend directory
2. Installs dependencies
3. Runs the server from the correct path

### 2. Backend `backend/package.json`
**Main Entry:** `"main": "src/server.js"`
**Start Command:** `"start": "node src/server.js"`
**Additional Scripts:**
- `start:prod` - Production mode with NODE_ENV=production
- `postinstall` - Confirmation message after install

### 3. Render Configuration `render.yaml`
**Explicit Settings:**
```yaml
rootDir: backend
buildCommand: npm install
startCommand: node src/server.js  # ← EXPLICIT PATH
```

This tells Render:
- Work in the `backend/` directory
- Run `npm install` to get dependencies
- Start the server by running `node src/server.js` directly

## How Render Will Execute

When Render deploys, it will:

1. **Clone Repository** → Get latest code from main branch
2. **Navigate to Backend** → `cd backend/`
3. **Install Dependencies** → `npm install`
4. **Start Server** → `node src/server.js`
5. **Health Check** → Verify `/health` endpoint returns 200 OK

## Server Path

```
LedgerLink/
└── backend/
    ├── package.json (has "start": "node src/server.js")
    └── src/
        └── server.js  ← THIS FILE RUNS
```

## Environment Variables Required on Render

Make sure these are set in your Render dashboard:

- ✅ `NODE_ENV` = production
- ✅ `PORT` = 3002
- ✅ `MONGODB_URI` = (your MongoDB connection string)
- ✅ `JWT_SECRET` = (auto-generated or manual)
- ✅ `XERO_CLIENT_ID` = (from Xero developer portal)
- ✅ `XERO_CLIENT_SECRET` = (from Xero developer portal)
- ✅ `XERO_REDIRECT_URI` = https://ledgerlink.onrender.com/api/xero/callback
- ✅ `CORS_ORIGIN` = https://ledgerlink.vercel.app
- ✅ `FRONTEND_URL` = https://ledgerlink.vercel.app

## API Endpoints

Once deployed, your backend will be available at:

**Base URL:** `https://ledgerlink.onrender.com`

**Available Endpoints:**
- `GET /` - API info
- `GET /health` - Health check (used by Render)
- `GET /api/test` - Test endpoint
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login (connects to MongoDB)
- `GET /api/users/profile` - Get user profile (protected)
- `GET /api/xero/*` - Xero OAuth routes
- `POST /api/transactions/*` - Transaction matching routes

## Troubleshooting

If Render still has issues:

1. **Check Render Logs**
   - Go to your Render dashboard
   - Click on "ledgerlink-backend"
   - View the "Logs" tab
   - Look for the startup message: "Server running on port 3002"

2. **Verify Build Command**
   - Build should show: `npm install`
   - Start should show: `node src/server.js`

3. **Test Health Endpoint**
   - Visit: `https://ledgerlink.onrender.com/health`
   - Should return: `{"status":"ok",...}`

4. **Manual Redeploy**
   - In Render dashboard, click "Manual Deploy"
   - Select "Clear build cache & deploy"

## Testing Authentication

After deployment, test the full authentication flow:

1. Visit `https://ledgerlink.vercel.app`
2. Click "Login"
3. Enter credentials
4. Should authenticate against MongoDB on Render
5. Should redirect to dashboard on success

## Files Modified

- ✅ `package.json` (root)
- ✅ `backend/package.json`
- ✅ `render.yaml`

## Next Steps

1. **Push these changes** (already done via GitHub API)
2. **Render will auto-deploy** (if auto-deploy is enabled)
3. **Monitor the deployment** in Render dashboard
4. **Test the endpoints** once deployed

## Success Criteria

✅ Render build completes without errors
✅ Server starts successfully
✅ Health check endpoint returns 200 OK
✅ Login from frontend connects to MongoDB
✅ User authentication works end-to-end

---

**Last Updated:** October 4, 2025
**Configuration Version:** 2.0
**Status:** Ready for Deployment
