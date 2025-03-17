# Deployment Instructions

## After Recent Xero Authentication Changes

The authentication flow with Xero has been completely restructured to fix several issues. Here's what you need to know:

### Backend Deployment (Render)

1. **Environment Variables**: Ensure the following environment variables are set in Render:
   - `XERO_CLIENT_ID`: Your Xero API Client ID
   - `XERO_CLIENT_SECRET`: Your Xero API Client Secret
   - `XERO_REDIRECT_URI`: Set to `https://ledgerlink.onrender.com/auth/xero/callback`
   - `FRONTEND_URL`: Set to `https://lledgerlink.vercel.app` (note the double 'l')

2. **Rebuild & Deploy**: Trigger a new deployment on Render to apply the changes

### Frontend Deployment (Vercel)

1. **Rebuild & Deploy**: Trigger a new deployment on Vercel to apply the changes

### Testing the Connection

1. Go to `https://lledgerlink.vercel.app`
2. Click on "Connect to Xero"
3. Complete the Xero authentication flow
4. You'll be redirected back to the app
5. Use the "Check Token Status" button to verify authentication

### Troubleshooting

If you encounter issues:

1. **Check Logs**: Review the Render logs for any errors
2. **Debug Token State**: Use the "Check Token Status" button to see token information
3. **Clear Browser Storage**: Try clearing localStorage in your browser
4. **Verify Environment Variables**: Ensure all environment variables are set correctly

### Key Improvements

1. **File-based Token Storage**: Tokens now persist between server restarts
2. **Improved Error Handling**: Better error messages and feedback
3. **Debug Capabilities**: Added token debugging tools
4. **Frontend/Backend Sync**: Improved synchronization of auth state

---

If you continue to experience issues, review the code changes in:
- `backend/src/routes/xeroAuth.js`
- `backend/src/utils/tokenStore.js`
- `frontend/src/context/XeroContext.js`
- `frontend/src/components/XeroConnection.jsx`
- `frontend/src/components/XeroCallback.jsx`
