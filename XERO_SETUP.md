# Xero Integration Setup Guide

Complete step-by-step guide to set up Xero OAuth 2.0 integration with LedgerLink.

## 📋 Prerequisites

- Xero Developer Account
- LedgerLink backend deployed and accessible
- HTTPS-enabled domain (required for production)

## 🏗️ Step 1: Create Xero Developer App

### 1.1 Access Xero Developer Portal

1. Visit [Xero Developer Portal](https://developer.xero.com/app/manage)
2. Sign in with your Xero credentials
3. Click **"Create an app"**

### 1.2 Choose App Type

1. Select **"Custom connection"**
2. This allows your app to connect to any Xero organization

### 1.3 Configure App Settings

**App Details:**
- **App name**: `LedgerLink Integration` (or your preferred name)
- **Company or application URL**: Your company website
- **Privacy policy URL**: Your privacy policy URL
- **Terms of service URL**: Your terms of service URL

**Integration Details:**
- **Redirect URI**: `https://your-backend-domain.com/api/xero/callback`
  - For development: `http://localhost:3002/api/xero/callback`
  - For production: `https://ledgerlink.onrender.com/api/xero/callback`

**Scopes** (select the following):
- ✅ `accounting.transactions` - Read and write transactions
- ✅ `accounting.contacts` - Read and write contacts
- ✅ `accounting.settings` - Read organization settings
- ✅ `offline_access` - Refresh tokens

### 1.4 Save and Note Credentials

After creating the app:
1. Copy the **Client ID**
2. Copy the **Client Secret**
3. Save these for the next step

## ⚙️ Step 2: Configure Backend Environment

### 2.1 Update Environment Variables

Add the following to your `backend/.env` file:

```bash
# Xero OAuth 2.0 Configuration
XERO_CLIENT_ID=your_client_id_from_step_1
XERO_CLIENT_SECRET=your_client_secret_from_step_1
XERO_REDIRECT_URI=https://your-backend-domain.com/api/xero/callback

# Security (generate these securely)
ENCRYPTION_KEY=your_32_byte_hex_encryption_key_here
JWT_SECRET=your_super_secure_jwt_secret_here

# Enable Xero sync jobs (optional)
ENABLE_XERO_SYNC_JOBS=true
```

### 2.2 Generate Encryption Key

Generate a secure 32-byte encryption key:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 2.3 Generate JWT Secret

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🚀 Step 3: Deploy and Test

### 3.1 Deploy Backend

Ensure your backend is deployed with the new environment variables:

```bash
# If using Docker
docker-compose up -d --build

# If deploying to Render, Heroku, etc.
# Make sure environment variables are set in your deployment platform
```

### 3.2 Test OAuth Flow

1. **Access your LedgerLink frontend**
2. **Navigate to Connections page**
3. **Click "Connect to Xero"**
4. **You should be redirected to Xero login**
5. **Login and authorize the connection**
6. **You should be redirected back to LedgerLink**

### 3.3 Verify Connection

After successful OAuth flow:

1. **Check the Connections page** - should show active Xero connection
2. **View invoices** - click "View Invoices" to see Xero data
3. **Check backend logs** - should show successful API calls

## 🔧 Step 4: Production Configuration

### 4.1 SSL Certificate

Xero requires HTTPS for production redirect URIs:

```bash
# Using Let's Encrypt with Certbot
sudo certbot --nginx -d your-domain.com

# Or use your hosting provider's SSL certificate
```

### 4.2 Update Xero App for Production

1. **Return to Xero Developer Portal**
2. **Edit your app**
3. **Update Redirect URI** to production HTTPS URL:
   ```
   https://your-production-domain.com/api/xero/callback
   ```
4. **Save changes**

### 4.3 Environment Variables for Production

```bash
# Production backend .env
NODE_ENV=production
XERO_CLIENT_ID=your_production_client_id
XERO_CLIENT_SECRET=your_production_client_secret
XERO_REDIRECT_URI=https://your-production-domain.com/api/xero/callback
ENCRYPTION_KEY=your_secure_encryption_key
JWT_SECRET=your_secure_jwt_secret
ENABLE_XERO_SYNC_JOBS=true
FORCE_HTTPS=true
```

## 🔍 Step 5: Testing and Verification

### 5.1 Test OAuth Flow

```bash
# Test auth initiation
curl "https://your-domain.com/api/xero/auth?companyId=test-company"

# Should return:
{
  "success": true,
  "data": {
    "authUrl": "https://login.xero.com/identity/connect/authorize?...",
    "state": "generated-state-value"
  }
}
```

### 5.2 Test API Endpoints

```bash
# Test health check
curl "https://your-domain.com/health/xero" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test connections
curl "https://your-domain.com/api/xero/connections" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test invoice fetch
curl "https://your-domain.com/api/xero/invoices?connectionId=CONNECTION_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5.3 Monitor Logs

```bash
# Check backend logs for Xero API calls
docker-compose logs -f backend | grep -i xero

# Or if deployed elsewhere
tail -f /path/to/app/logs/app.log | grep -i xero
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Invalid Redirect URI" Error

**Problem**: Xero returns redirect URI mismatch error

**Solution**:
- Ensure redirect URI in Xero app matches exactly with backend configuration
- Check for trailing slashes
- Verify HTTPS in production

```bash
# Check your backend configuration
echo $XERO_REDIRECT_URI

# Should match exactly what's in Xero Developer Portal
```

#### 2. "Token Encryption Error"

**Problem**: Backend can't encrypt/decrypt tokens

**Solution**:
- Ensure `ENCRYPTION_KEY` is exactly 32 bytes (64 hex characters)
- Generate new key if unsure:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 3. "Connection Expired" Issues

**Problem**: Xero connection shows as expired

**Solution**:
- Check if Xero refresh token is working
- Verify system time is correct
- Check token refresh job logs:

```bash
# Manual token refresh test
curl -X POST "https://your-domain.com/api/xero/sync" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"connectionId": "YOUR_CONNECTION_ID"}'
```

#### 4. "Rate Limit Exceeded"

**Problem**: Too many API calls to Xero

**Solution**:
- Xero allows 60 requests per minute
- Check sync job frequency
- Implement exponential backoff:

```javascript
// Backend will automatically handle rate limiting
// But you can adjust sync frequency in jobs/xeroSyncJob.js
```

### Debug Mode

Enable detailed logging:

```bash
# Add to backend/.env
LOG_LEVEL=debug
ENABLE_API_LOGGING=true

# Restart backend
docker-compose restart backend
```

### Health Checks

```bash
# Comprehensive Xero health check
curl "https://your-domain.com/health/xero" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response should include:
{
  "status": "healthy",
  "connections": {
    "total": 1,
    "active": 1,
    "healthScore": "100.0"
  },
  "sync": {
    "isRunning": true,
    "lastRun": "2025-01-01T12:00:00.000Z"
  }
}
```

## 📊 Monitoring

### Key Metrics to Monitor

1. **Connection Health**
   - Active vs total connections
   - Token expiry dates
   - Failed refresh attempts

2. **API Usage**
   - Requests per minute
   - Rate limit hits
   - Error rates

3. **Sync Performance**
   - Sync job success rate
   - Data processing time
   - Queue lengths

### Monitoring Endpoints

```bash
# Overall health
GET /health/detailed

# Xero-specific health
GET /health/xero

# Application metrics
GET /health/metrics
```

## 🔐 Security Best Practices

### 1. Environment Security

- Never commit `.env` files to version control
- Use strong, unique encryption keys
- Rotate secrets regularly
- Use HTTPS in production

### 2. Token Management

- Tokens are encrypted at rest
- Automatic refresh before expiry
- Secure token transmission
- Audit logging of token usage

### 3. Network Security

- Rate limiting on all endpoints
- CORS protection
- Input validation and sanitization
- Error message sanitization

## ✅ Setup Checklist

- [ ] Created Xero Developer App
- [ ] Configured correct scopes
- [ ] Set proper redirect URI
- [ ] Generated secure encryption key
- [ ] Updated backend environment variables
- [ ] Deployed backend with new config
- [ ] Tested OAuth flow end-to-end
- [ ] Verified invoice data sync
- [ ] Set up monitoring and logging
- [ ] Configured production SSL
- [ ] Updated production redirect URI
- [ ] Tested in production environment

---

## 🆘 Need Help?

- **Xero Developer Documentation**: https://developer.xero.com/documentation
- **LedgerLink Issues**: https://github.com/TomWall1/LedgerLink/issues
- **Email Support**: support@ledgerlink.com

**Your Xero integration should now be fully functional! 🎉**