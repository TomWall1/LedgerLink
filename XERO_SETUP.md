# Xero Integration Setup Guide

This guide will help you set up the Xero OAuth 2.0 integration for LedgerLink.

## Prerequisites

1. **Xero Developer Account**: You need a Xero developer account at https://developer.xero.com/
2. **Xero App**: Create a custom connection app in your Xero developer console
3. **HTTPS Endpoint**: For production, you need HTTPS endpoints for OAuth callbacks

## Step 1: Create Xero App

1. Go to https://developer.xero.com/app/manage
2. Click "Create app"
3. Choose "Custom connection"
4. Fill in your app details:
   - **App name**: LedgerLink Integration
   - **Company or application URL**: Your company website
   - **OAuth 2.0 redirect URI**: 
     - Development: `http://localhost:3002/api/xero/callback`
     - Production: `https://yourbackend.com/api/xero/callback`

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env` if you haven't already
2. Add your Xero credentials from the developer console:

```bash
# Xero OAuth 2.0 Configuration
XERO_CLIENT_ID=your_client_id_from_xero_console
XERO_CLIENT_SECRET=your_client_secret_from_xero_console
XERO_REDIRECT_URI=http://localhost:3002/api/xero/callback

# Generate a 32-byte encryption key for token storage
ENCRYPTION_KEY=run_node_-e_"console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Install Dependencies

Install the required npm packages:

```bash
cd backend
npm install axios node-cron uuid
```

## Step 4: Update Server Configuration

Add the Xero integration to your main server file (server.js or app.js):

```javascript
// Import Xero components
const xeroRoutes = require('./routes/xero');
const xeroSyncJob = require('./jobs/xeroSyncJob');
const { handleXeroErrors } = require('./middleware/xeroAuth');

// Add Xero routes
app.use('/api/xero', xeroRoutes);

// Add Xero error handler
app.use(handleXeroErrors);

// Start sync jobs (optional, for background data syncing)
if (process.env.ENABLE_XERO_SYNC_JOBS === 'true') {
  xeroSyncJob.start();
}
```

## Step 5: Database Setup

The Xero integration uses MongoDB to store connection details. Make sure your MongoDB connection is working, and the XeroConnection model will automatically create the necessary collections.

## Step 6: Test the Integration

1. Start your backend server:
   ```bash
   npm run dev
   ```

2. Test the auth endpoint:
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        "http://localhost:3002/api/xero/auth?companyId=YOUR_COMPANY_ID"
   ```

3. You should receive a JSON response with an authorization URL.

## Step 7: Frontend Integration

To connect the frontend, you'll need to:

1. Add a "Connect to Xero" button in your Connections tab
2. When clicked, fetch the auth URL from `/api/xero/auth`
3. Redirect user to the Xero authorization page
4. Handle the callback and show connection status

### Example Frontend Code:

```javascript
// Connect to Xero
const connectXero = async (companyId) => {
  try {
    const response = await fetch(`/api/xero/auth?companyId=${companyId}`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Redirect to Xero for authorization
      window.location.href = data.data.authUrl;
    }
  } catch (error) {
    console.error('Failed to initiate Xero connection:', error);
  }
};

// Check connection status
const getXeroConnections = async () => {
  try {
    const response = await fetch('/api/xero/connections', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    const data = await response.json();
    return data.data; // Array of connections
  } catch (error) {
    console.error('Failed to fetch Xero connections:', error);
  }
};
```

## API Endpoints

The integration provides these endpoints:

### Authentication
- `GET /api/xero/auth?companyId=ID` - Start OAuth flow
- `GET /api/xero/callback` - OAuth callback (handled automatically)

### Connection Management
- `GET /api/xero/connections` - List user's connections
- `DELETE /api/xero/connections/:id` - Disconnect Xero
- `GET /api/xero/health/:id` - Check connection health

### Data Access
- `GET /api/xero/invoices?connectionId=ID` - Fetch invoices
- `GET /api/xero/contacts?connectionId=ID` - Fetch contacts
- `POST /api/xero/sync` - Manual sync trigger

## Security Considerations

1. **Token Encryption**: All OAuth tokens are encrypted before storage
2. **HTTPS Required**: Use HTTPS in production for OAuth callbacks
3. **State Parameter**: OAuth state includes CSRF protection
4. **Token Refresh**: Automatic token refresh before expiry
5. **Rate Limiting**: Built-in Xero API rate limit compliance

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**
   - Check that the redirect URI in your Xero app matches exactly
   - Ensure no trailing slashes

2. **"Token refresh failed"**
   - User may need to reconnect to Xero
   - Check that refresh tokens are being stored correctly

3. **"Rate limit exceeded"**
   - Xero allows 60 requests per minute per tenant
   - The integration includes automatic rate limiting

4. **"Organization not found"**
   - User may have disconnected the app from Xero
   - Check connection status and prompt for reconnection

### Debug Mode:

Enable detailed logging:

```bash
LOG_LEVEL=debug
ENABLE_API_LOGGING=true
```

## Production Deployment

1. **Update redirect URI** in Xero app to production URL
2. **Use HTTPS** for all endpoints
3. **Set secure environment variables**
4. **Enable sync jobs** with `ENABLE_XERO_SYNC_JOBS=true`
5. **Monitor rate limits** and API usage

## Support

- **Xero API Documentation**: https://developer.xero.com/documentation/
- **OAuth 2.0 Guide**: https://developer.xero.com/documentation/guides/oauth2/overview/
- **Xero Developer Community**: https://developer.xero.com/community/

---

**Note**: This integration maintains all existing LedgerLink functionality while adding Xero connectivity. No existing features or UI components are modified.