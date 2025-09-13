# LedgerLink Deployment Guide

This guide covers deploying additional LedgerLink backend instances to various platforms.

## 🌐 **Current Production Setup**

✅ **Frontend**: https://ledgerlink.vercel.app (Vercel)  
✅ **Backend**: https://ledgerlink.onrender.com (Render)

---

## 🎯 **Quick Deploy Options for Additional Backend Instances**

### **Option 1: Render (Current Production Platform)**

**One-click deploy:**

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/TomWall1/LedgerLink)

**Manual Render Setup:**

1. **Create new Web Service**
   - Connect your GitHub repository
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

2. **Add Environment Variables**
   ```
   NODE_ENV=production
   DATABASE_URL=[Render PostgreSQL URL]
   REDIS_URL=[Render Redis URL]
   JWT_SECRET=[Generate secure secret]
   JWT_REFRESH_SECRET=[Generate secure secret]
   CORS_ORIGIN=https://ledgerlink.vercel.app
   ```

3. **Add Render Services**
   - **PostgreSQL**: Add from Render dashboard
   - **Redis**: Add from Render dashboard

### **Option 2: Railway**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/-NvLj8?referralCode=bonus)

1. **Fork this repository**
2. **Connect to Railway**
3. **Add environment variables** (same as above)
4. **Deploy automatically**

### **Option 3: Heroku**

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/TomWall1/LedgerLink)

1. **Click deploy button**
2. **Environment variables auto-configured**
3. **PostgreSQL and Redis add-ons included**

---

## 🐳 **Docker Deployment**

### **Local Docker**

```bash
# Build image
cd backend
docker build -t ledgerlink-backend .

# Run container
docker run -p 3001:3001 \
  -e DATABASE_URL="your-db-url" \
  -e REDIS_URL="your-redis-url" \
  -e JWT_SECRET="your-secret" \
  -e CORS_ORIGIN="https://ledgerlink.vercel.app" \
  ledgerlink-backend
```

### **Docker Compose Production**

```bash
# Use cloud-ready compose file
docker-compose -f docker-compose.cloud.yml up -d
```

---

## ☁️ **Cloud Platform Deployment**

### **AWS ECS with Fargate**

1. **Build and push to ECR:**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [account-id].dkr.ecr.us-east-1.amazonaws.com
   cd backend
   docker build -t ledgerlink-backend .
   docker tag ledgerlink-backend:latest [account-id].dkr.ecr.us-east-1.amazonaws.com/ledgerlink-backend:latest
   docker push [account-id].dkr.ecr.us-east-1.amazonaws.com/ledgerlink-backend:latest
   ```

2. **Create ECS Task Definition with environment variables:**
   - `CORS_ORIGIN=https://ledgerlink.vercel.app`
   - All other required variables

### **Google Cloud Run**

```bash
cd backend
gcloud builds submit --tag gcr.io/[PROJECT-ID]/ledgerlink-backend
gcloud run deploy ledgerlink-backend \
  --image gcr.io/[PROJECT-ID]/ledgerlink-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars="CORS_ORIGIN=https://ledgerlink.vercel.app" \
  --allow-unauthenticated
```

### **Azure Container Instances**

```bash
az container create \
  --resource-group myResourceGroup \
  --name ledgerlink-backend \
  --image ledgerlink/backend:latest \
  --dns-name-label ledgerlink-api \
  --ports 3001 \
  --environment-variables NODE_ENV=production CORS_ORIGIN=https://ledgerlink.vercel.app \
  --secure-environment-variables DATABASE_URL="your-db-url"
```

---

## 🗃️ **Database Setup**

### **Managed Database Options**

**PostgreSQL:**
- **Render**: Built-in PostgreSQL
- **Railway**: Built-in PostgreSQL
- **Supabase**: Free PostgreSQL with dashboard
- **PlanetScale**: Serverless MySQL (modify schema)
- **AWS RDS**: Managed PostgreSQL
- **Google Cloud SQL**: Managed PostgreSQL
- **Azure Database**: Managed PostgreSQL

**Redis:**
- **Render**: Built-in Redis
- **Railway**: Built-in Redis
- **Upstash**: Serverless Redis
- **AWS ElastiCache**: Managed Redis
- **Google Cloud Memorystore**: Managed Redis
- **Azure Cache**: Managed Redis

### **Database Migration**

After deployment, run migrations:

```bash
# For most platforms
npx prisma migrate deploy

# For Docker
docker exec -it container-name npx prisma migrate deploy

# For Kubernetes
kubectl exec -it pod-name -- npx prisma migrate deploy
```

---

## 🔧 **Environment Configuration**

### **Required Environment Variables**

```bash
# Core
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"
REDIS_URL="redis://host:6379"

# Security
JWT_SECRET="32-char-random-string"
JWT_REFRESH_SECRET="32-char-random-string"
ENCRYPTION_KEY="32-char-random-string"

# CORS (IMPORTANT: Use correct frontend URL)
CORS_ORIGIN="https://ledgerlink.vercel.app"

# Email (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="app-password"

# ERP Integrations (Optional)
XERO_CLIENT_ID="your-xero-id"
XERO_CLIENT_SECRET="your-xero-secret"
XERO_REDIRECT_URI="https://your-backend.onrender.com/api/v1/integrations/xero/callback"

QUICKBOOKS_CLIENT_ID="your-qb-id"
QUICKBOOKS_CLIENT_SECRET="your-qb-secret"
QUICKBOOKS_REDIRECT_URI="https://your-backend.onrender.com/api/v1/integrations/quickbooks/callback"

# Monitoring (Optional)
SENTRY_DSN="your-sentry-dsn"
LOGTAIL_SOURCE_TOKEN="your-logtail-token"
```

### **Secret Generation**

```bash
# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

---

## 🚀 **CI/CD Setup**

### **GitHub Actions (Included)**

The repository includes GitHub Actions workflows that:
- Run tests on every PR
- Build Docker image
- Deploy to staging/production
- Monitor health every 30 minutes

### **Custom Deploy Script**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Render
      run: |
        curl -X POST "https://api.render.com/deploy/srv-${{ secrets.RENDER_SERVICE_ID }}" \
        -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}"
```

---

## 📊 **Monitoring & Health Checks**

### **Health Check Endpoints**

- **Basic**: `GET /api/health`
- **Detailed**: `GET /api/health/detailed`
- **Ready**: `GET /api/health/ready` (Kubernetes)
- **Live**: `GET /api/health/live` (Kubernetes)

### **Monitoring Setup**

**Uptime Monitoring:**
- **Uptime Robot**: Free uptime monitoring
- **Better Uptime**: Advanced monitoring with alerts
- **Pingdom**: Professional monitoring service

**Error Tracking:**
- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: Session replay and error tracking
- **Rollbar**: Error tracking and deployment tracking

**Logging:**
- **Logtail**: Structured logging with search
- **Papertrail**: Simple log aggregation
- **Datadog**: Comprehensive monitoring platform

---

## 🔒 **Security Considerations**

### **Production Security Checklist**

- [ ] **Secrets Management**: Use environment variables, never commit secrets
- [ ] **HTTPS Only**: Use SSL certificates (Let's Encrypt, Cloudflare)
- [ ] **Database Security**: Use connection pooling, encrypt connections
- [ ] **Rate Limiting**: Configure appropriate limits for production
- [ ] **CORS**: Set to `https://ledgerlink.vercel.app` only
- [ ] **Headers**: Ensure Helmet.js security headers are enabled
- [ ] **Updates**: Keep dependencies updated regularly
- [ ] **Monitoring**: Set up error tracking and alerting
- [ ] **Backups**: Configure automated database backups
- [ ] **Firewall**: Restrict database/Redis access to application only

---

## 🐛 **Troubleshooting**

### **Common Issues**

**"CORS Error":**
```bash
# Check CORS_ORIGIN is set correctly
echo $CORS_ORIGIN
# Should be: https://ledgerlink.vercel.app
```

**"Database connection failed":**
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
npx prisma db execute --command "SELECT 1"
```

**"Redis connection failed":**
```bash
# Check Redis URL
echo $REDIS_URL

# Test connection
redis-cli -u $REDIS_URL ping
```

**"Port already in use":**
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 [PID]
```

### **Frontend Connection Issues**

If the frontend at https://ledgerlink.vercel.app can't connect:

1. **Check CORS settings** in backend
2. **Verify backend URL** in frontend configuration
3. **Test API directly**:
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```

---

## 📞 **Support**

If you need help with deployment:

1. **Check the logs**: Most issues are visible in application logs
2. **Review environment variables**: Ensure all required variables are set
3. **Test locally first**: Reproduce issues in development
4. **Open an issue**: [GitHub Issues](https://github.com/TomWall1/LedgerLink/issues)

---

**Happy Deploying! 🚀**

*Remember: Frontend stays on Vercel, backend deployments are for additional instances or backups.*