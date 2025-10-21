# Render Deployment Setup Guide - URGENT FIX

## 🚨 Current Issue: 502 Bad Gateway Error

Your registration is failing because the backend server on Render is not starting properly. This is because **required environment variables are not set in your Render dashboard**.

## ✅ What Was Fixed in Code

1. **Server startup is now more resilient** - The server will start even if MongoDB connection temporarily fails
2. **CORS configuration fixed** - Removed typo in allowed origins
3. **Better error logging** - You'll see clearer errors in Render logs
4. **Graceful error handling** - Server won't crash on database connection issues

## 🔧 What YOU Need to Do in Render Dashboard

### Step 1: Log into Render
Go to https://render.com and log into your account.

### Step 2: Navigate to Your Backend Service
1. Click on your `ledgerlink-backend` service
2. Go to the **Environment** tab in the left sidebar

### Step 3: Add Required Environment Variables

You **MUST** add these environment variables for the backend to work:

#### **CRITICAL - Required for Server to Start:**

1. **MONGODB_URI** (Most Important!)
   - Click "Add Environment Variable"
   - Key: `MONGODB_URI`
   - Value: Your MongoDB connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/ledgerlink?retryWrites=true&w=majority`
   
   **Where to get this:**
   - If you're using MongoDB Atlas: Go to your MongoDB Atlas dashboard → Clusters → Connect → Connect your application → Copy the connection string
   - Replace `<username>` and `<password>` with your actual MongoDB credentials
   - Replace `<cluster>` with your cluster name
   - If you don't have a MongoDB database yet, create one at https://www.mongodb.com/cloud/atlas/register

2. **JWT_SECRET**
   - Key: `JWT_SECRET`
   - Value: A random secure string (e.g., `your-super-secret-jwt-key-change-this-in-production-12345`)
   - You can generate one here: https://randomkeygen.com/ (use "Fort Knox Passwords")

3. **SESSION_SECRET**
   - Key: `SESSION_SECRET`
   - Value: Another random secure string
   - Different from JWT_SECRET

#### **Optional but Recommended:**

4. **XERO_CLIENT_ID** (For Xero integration)
   - Key: `XERO_CLIENT_ID`
   - Value: Your Xero OAuth client ID from the Xero Developer Portal

5. **XERO_CLIENT_SECRET** (For Xero integration)
   - Key: `XERO_CLIENT_SECRET`
   - Value: Your Xero OAuth client secret

6. **XERO_REDIRECT_URI**
   - Key: `XERO_REDIRECT_URI`
   - Value: `https://ledgerlink.onrender.com/api/xero/callback`

### Step 4: Save and Redeploy

1. After adding all environment variables, click **"Save Changes"**
2. Render will automatically redeploy your backend
3. Wait 2-3 minutes for the deployment to complete

### Step 5: Verify It's Working

Once deployment completes, test these URLs in your browser:

1. Health Check: https://ledgerlink.onrender.com/health
2. API Test: https://ledgerlink.onrender.com/api/test

You should see JSON responses, not 502 errors.

## 📝 Quick MongoDB Setup (If You Don't Have One)

If you don't have a MongoDB database yet:

1. **Sign up for MongoDB Atlas** (Free): https://www.mongodb.com/cloud/atlas/register
2. **Create a free cluster** (takes 5-10 minutes)
3. **Create a database user:**
   - Go to Database Access → Add New Database User
   - Create username and password (SAVE THESE!)
   - Give it "Read and write to any database" permissions
4. **Whitelist all IPs** (for Render to connect):
   - Go to Network Access → Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"
5. **Get connection string:**
   - Go to Databases → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password
   - This is your `MONGODB_URI`

## 🎯 Expected Result

After completing these steps:

- ✅ Your backend server will start successfully on Render
- ✅ The 502 Bad Gateway error will be resolved
- ✅ Registration on https://ledgerlink.vercel.app will work
- ✅ Your Xero integration will continue to work (not affected by these changes)

## 🆘 Still Having Issues?

If you still see 502 errors after setting up environment variables:

1. Check Render Logs:
   - Go to your service → "Logs" tab
   - Look for error messages (they'll be clearer now)
   - Look for "MongoDB Connected Successfully" message

2. Verify Environment Variables:
   - Go to Environment tab
   - Make sure `MONGODB_URI`, `JWT_SECRET`, and `SESSION_SECRET` are all set
   - Check for typos in the MongoDB connection string

3. Common Issues:
   - **MongoDB IP not whitelisted**: Add 0.0.0.0/0 to Network Access in MongoDB Atlas
   - **Wrong MongoDB password**: Double-check the password in your connection string
   - **Database user doesn't exist**: Create a database user in MongoDB Atlas

## 📞 Need Help?

Reply with:
- Screenshot of your Render environment variables (hide the values!)
- Copy of the error from Render logs
- Confirmation that you completed Step 3 above

---

**Time to Complete:** 10-15 minutes if you have MongoDB ready, 20-25 minutes if setting up MongoDB from scratch.
