# 🚀 One-Click Deploy Buttons

## Current Setup

✅ **Frontend**: https://ledgerlink.vercel.app (Already deployed on Vercel)  
✅ **Backend**: https://ledgerlink.onrender.com (Already deployed on Render)

---

## Additional Backend Deployment Options

Deploy additional backend instances to other platforms:

### **🟢 Render (Current Production)**

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/TomWall1/LedgerLink)

**What gets deployed:**
- ✅ Backend API server
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ Automatic SSL certificate
- ✅ Environment variables configured
- ✅ Database migrations run automatically
- ✅ Demo data seeded

**After deployment:**
- Your API will be live at: `https://your-app-name.onrender.com`
- Health check: `https://your-app-name.onrender.com/api/health`
- Demo accounts ready to use!

---

### **🚄 Railway (Fast & Simple)**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/Led9er?referralCode=bonus)

**What gets deployed:**
- ✅ Backend API with auto-scaling
- ✅ PostgreSQL database with backups
- ✅ Redis for caching
- ✅ Custom domain support
- ✅ Environment auto-configuration

---

### **🟣 Heroku (Classic Platform)**

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/TomWall1/LedgerLink)

**What gets deployed:**
- ✅ Backend API on Heroku Dynos
- ✅ Heroku Postgres add-on
- ✅ Heroku Redis add-on
- ✅ Automatic builds from GitHub

---

### **☁️ DigitalOcean App Platform**

[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/TomWall1/LedgerLink/tree/main)

---

## 🔧 Manual Cloud Setup

If you prefer manual setup on cloud platforms:

### **AWS (Advanced)**
```bash
# Using AWS CLI and ECS
git clone https://github.com/TomWall1/LedgerLink.git
# Follow DEPLOYMENT.md for AWS setup
```

### **Google Cloud (Advanced)**  
```bash
# Using Cloud Run
gcloud run deploy ledgerlink-backend \
  --source https://github.com/TomWall1/LedgerLink \
  --platform managed \
  --allow-unauthenticated
```

### **Azure (Advanced)**
```bash
# Using Container Instances
az container create \
  --resource-group myResourceGroup \
  --name ledgerlink-backend \
  --image ghcr.io/tomwall1/ledgerlink-backend:latest
```

---

## 🎯 Instant Access After Deployment

Once deployed, you can immediately:

1. **Test the API:**
   ```bash
   curl https://your-app.onrender.com/api/health
   ```

2. **Try the CSV Demo (no auth required):**
   ```bash
   curl -X POST https://your-app.onrender.com/api/v1/matching/csv-demo \
     -F "file1=@invoices1.csv" \
     -F "file2=@invoices2.csv"
   ```

3. **Login with demo accounts:**
   - **Admin:** `admin@ledgerlink.com` / `admin123`
   - **User:** `user@ledgerlink.com` / `user123`

4. **View API documentation:**
   `https://your-app.onrender.com/api/docs`

5. **Connect to existing frontend:**
   - Frontend at: https://ledgerlink.vercel.app
   - Update frontend API URL to point to your new backend instance

---

## 📊 What's Included in Every Deployment

✅ **Full Backend API** - All endpoints working  
✅ **Database Setup** - PostgreSQL with migrations  
✅ **Cache Layer** - Redis for performance  
✅ **Demo Data** - Sample invoices and users  
✅ **Security** - JWT auth, rate limiting, validation  
✅ **ERP Framework** - Ready for Xero, QuickBooks integration  
✅ **File Processing** - CSV upload and matching  
✅ **Report Generation** - PDF and CSV reports  
✅ **Webhook Support** - Real-time ERP updates  
✅ **Health Monitoring** - Comprehensive health checks  
✅ **CORS Configuration** - Pre-configured for https://ledgerlink.vercel.app

---

## 🔑 Environment Variables (Auto-configured)

All platforms automatically configure:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection  
- `JWT_SECRET` - Authentication secret
- `CORS_ORIGIN` - Set to https://ledgerlink.vercel.app
- All other required variables

---

## 🆘 Need Help?

- **Documentation:** [README.md](README.md)
- **Deployment Guide:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Issues:** [GitHub Issues](https://github.com/TomWall1/LedgerLink/issues)

---

**Choose your platform and click deploy! 🚀**