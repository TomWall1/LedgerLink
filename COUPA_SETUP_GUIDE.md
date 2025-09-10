# 🔗 Coupa API Integration Setup Guide

This guide will walk you through setting up the Coupa API integration for LedgerLink step-by-step. No coding background needed!

## 📋 What You'll Need

1. **Coupa Administrator Access** - You'll need help from your Coupa admin to get credentials
2. **LedgerLink Application** - Your existing LedgerLink setup
3. **About 30 minutes** - For the complete setup process

## 🎯 What This Integration Does

Instead of manually uploading CSV files, LedgerLink will:
- ✅ Connect directly to your Coupa system
- ✅ Automatically fetch invoice and approval data
- ✅ Transform Coupa data to work with LedgerLink
- ✅ Keep your reconciliation data up-to-date

---

## Step 1: Get Your Coupa Credentials

### Option A: API Key (Simpler)

**What to ask your Coupa admin for:**
```
Hi [Admin Name],

I need to set up an API integration between Coupa and our reconciliation system (LedgerLink). 
Could you please provide:

1. Our Coupa instance URL (e.g., https://ourcompany.coupahost.com)
2. An API key with read access to:
   - Invoices
   - Invoice Approvals
   - Suppliers

The integration will only READ data, not modify anything in Coupa.

Thanks!
```

### Option B: OAuth 2.0 (More Secure)

**What to ask your Coupa admin for:**
```
Hi [Admin Name],

I need to set up an OAuth integration for our reconciliation system. Could you please:

1. Create an OAuth application in Coupa with these settings:
   - Application Name: "LedgerLink Integration"
   - Grant Type: "Client Credentials"
   - Scopes: core.invoice.read, core.supplier.read, core.approval.read

2. Provide me with:
   - Our Coupa instance URL
   - Client ID
   - Client Secret

Thanks!
```

---

## Step 2: Install Required Dependencies

### Backend Dependencies

Navigate to your LedgerLink backend folder and install the required packages:

```bash
cd backend
npm install axios
```

### What This Installs:
- **axios** - For making API calls to Coupa

---

## Step 3: Configure Environment Variables

### 3.1 Copy the Environment Template

In your `backend` folder, you should now have a file called `.env.example`. Copy this to create your actual environment file:

**On Windows:**
```cmd
copy .env.example .env
```

**On Mac/Linux:**
```bash
cp .env.example .env
```

### 3.2 Edit Your Environment File

Open the `.env` file in any text editor (like Notepad) and fill in your Coupa credentials:

#### For API Key Authentication:
```env
# Your Coupa instance URL
COUPA_API_BASE_URL=https://yourcompany.coupahost.com

# Your API key
COUPA_API_KEY=your_actual_api_key_here

# Leave OAuth settings commented out
# COUPA_CLIENT_ID=
# COUPA_CLIENT_SECRET=
```

#### For OAuth Authentication:
```env
# Your Coupa instance URL
COUPA_API_BASE_URL=https://yourcompany.coupahost.com

# Leave API key commented out
# COUPA_API_KEY=

# Your OAuth credentials
COUPA_CLIENT_ID=your_client_id_here
COUPA_CLIENT_SECRET=your_client_secret_here
```

### 3.3 Optional Settings (You Can Leave These As Default)

```env
# API rate limiting (requests per minute)
COUPA_RATE_LIMIT_PER_MINUTE=60

# Request timeout (30 seconds)
COUPA_TIMEOUT_MS=30000

# How far back to fetch data by default (30 days)
COUPA_DATE_RANGE_DAYS=30

# Enable detailed logging for troubleshooting
COUPA_LOG_API_CALLS=true
```

---

## Step 4: Update Your Backend Server

### 4.1 Find Your Main Server File

Look for a file called `server.js` or `app.js` in your backend folder. This is your main server file.

### 4.2 Add Coupa Routes

**Look for a section that looks like this:**
```javascript
// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/reconcile', reconcileRoutes);
// ... other routes
```

**Add these lines:**
```javascript
// Coupa Integration Routes
const coupaRoutes = require('./routes/coupaIntegration');
app.use('/api/coupa', coupaRoutes);
```

### 4.3 Complete Example

Here's what the routes section should look like after adding Coupa:

```javascript
// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/reconcile', reconcileRoutes);
app.use('/api/coupa', coupaRoutes); // ← Add this line

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
```

---

## Step 5: Update Your Frontend

### 5.1 Add Coupa Components to Your Dashboard

Find your main dashboard component (probably in `frontend/src/components/` or similar). 

**Add the import at the top:**
```javascript
import CoupaConnection from './CoupaConnection';
import CoupaDataPreview from './CoupaDataPreview';
```

**Add state management:**
```javascript
// Add this inside your dashboard component
const [coupaData, setCoupaData] = useState(null);
const [showCoupaPreview, setShowCoupaPreview] = useState(false);

const handleCoupaDataFetched = (data, dataType) => {
  setCoupaData({ data, dataType });
  setShowCoupaPreview(true);
};

const handleCoupaDataAccepted = (selectedData, dataType) => {
  // Process the data like a CSV upload
  // This is where you'd integrate with your existing reconciliation logic
  console.log('Accepted Coupa data:', selectedData);
  setShowCoupaPreview(false);
  
  // Add your reconciliation logic here
  // For example: processReconciliationData(selectedData);
};

const handleCoupaDataRejected = () => {
  setShowCoupaPreview(false);
  setCoupaData(null);
};
```

**Add the components to your JSX:**
```javascript
return (
  <div className="dashboard">
    {/* Your existing dashboard content */}
    
    {/* Add Coupa Connection */}
    <CoupaConnection 
      onDataFetched={handleCoupaDataFetched}
    />
    
    {/* Add Coupa Data Preview */}
    {showCoupaPreview && coupaData && (
      <CoupaDataPreview
        data={coupaData.data}
        dataType={coupaData.dataType}
        onDataAccept={handleCoupaDataAccepted}
        onDataReject={handleCoupaDataRejected}
      />
    )}
  </div>
);
```

---

## Step 6: Test Your Integration

### 6.1 Restart Your Servers

**Stop your current servers** (Press Ctrl+C in the terminal windows)

**Start the backend:**
```bash
cd backend
npm run dev
```

**Start the frontend** (in a new terminal):
```bash
cd frontend
npm start
```

### 6.2 Test the Connection

1. **Go to your LedgerLink application** in your web browser
2. **Find the Coupa Connection section** (should be visible on your dashboard)
3. **Enter your credentials:**
   - Coupa Instance URL
   - API Key OR Client ID/Secret
4. **Click "Test Connection"**
   - ✅ If successful: You'll see "Successfully connected to Coupa!"
   - ❌ If failed: Check the error message and verify your credentials

### 6.3 Test Data Fetching

1. **After successful connection**, the data fetching section will appear
2. **Choose what data to fetch** (Invoices, Approvals, or All)
3. **Set a date range** (optional - leave blank for recent data)
4. **Click "Fetch Data from Coupa"**
5. **Preview your data** in the data preview component
6. **Select the data you want** and click "Import Selected Data"

---

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### "Connection failed" Error

**Check these things:**
1. **URL Format**: Make sure your Coupa URL starts with `https://` and doesn't end with `/`
   - ✅ Correct: `https://acme.coupahost.com`
   - ❌ Wrong: `acme.coupahost.com` or `https://acme.coupahost.com/`

2. **Credentials**: Double-check your API key or OAuth credentials

3. **Network**: Make sure your server can reach the internet

#### "Invalid API Key" Error

**Solutions:**
1. **Verify the API key** with your Coupa admin
2. **Check permissions** - the key needs read access to invoices and suppliers
3. **Try regenerating** the API key in Coupa

#### "No data returned" Issue

**Possible causes:**
1. **Date range too narrow** - Try expanding the date range
2. **No data in Coupa** - Check if there are invoices in your date range
3. **Permissions** - Verify your API key can access the data types you're requesting

#### Server Errors

**If you see 500 errors:**
1. **Check the backend console** for detailed error messages
2. **Verify environment variables** are set correctly
3. **Restart the backend server**

---

## 🔐 Security Best Practices

### Keep Your Credentials Safe

1. **Never commit the `.env` file** to version control
2. **Use strong API keys** (if available)
3. **Regularly rotate credentials** (every 90 days)
4. **Limit API permissions** to only what's needed (read-only)

### Production Deployment

When deploying to production:

1. **Set environment variables** in your hosting platform (Render, Vercel, etc.)
2. **Don't use the `.env` file** in production
3. **Enable HTTPS** for all communications
4. **Monitor API usage** to detect unusual activity

---

## 📊 Using the Integration

### Daily Workflow

1. **Open LedgerLink**
2. **Go to the Coupa section**
3. **Click "Fetch Data"** (connection should already be established)
4. **Review the data preview**
5. **Select relevant records**
6. **Import into LedgerLink**
7. **Run your reconciliation** as normal

### Scheduled Syncing (Future Enhancement)

The current setup requires manual data fetching. In the future, you could:
- Set up automatic daily syncing
- Enable webhook notifications from Coupa
- Create email alerts for new data

---

## 🆘 Getting Help

### Before Asking for Help

1. **Check the browser console** (F12 → Console tab) for error messages
2. **Check the backend logs** in your terminal
3. **Verify your credentials** with your Coupa admin
4. **Try the test connection** first

### What to Include When Asking for Help

```
I'm having trouble with the Coupa integration. Here are the details:

**Issue**: [Describe what's not working]

**Steps I've tried**:
- [List what you've already tried]

**Error messages**:
- Browser console: [Copy any red error messages]
- Backend logs: [Copy any error messages from terminal]

**Configuration**:
- Coupa URL: [Your Coupa instance URL - don't include credentials]
- Authentication method: [API Key or OAuth]
- Data type trying to fetch: [Invoices/Approvals/Suppliers]
```

---

## 🎉 You're Done!

Congratulations! You now have a direct API integration between Coupa and LedgerLink. This will save you time and reduce errors compared to manual CSV uploads.

### Next Steps

1. **Train your team** on the new workflow
2. **Set up regular data fetching** (daily or weekly)
3. **Monitor the integration** for any issues
4. **Consider automating** the process further

### Benefits You'll See

- ⚡ **Faster data updates** - No more waiting for CSV exports
- 🎯 **More accurate data** - Direct from Coupa, no manual errors
- 🔄 **Real-time reconciliation** - Always working with the latest data
- 📈 **Better insights** - More frequent reconciliation cycles

Enjoy your new Coupa integration! 🚀