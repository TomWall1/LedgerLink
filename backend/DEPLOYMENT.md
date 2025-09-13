# LedgerLink Backend Deployment Guide

This guide covers deploying the LedgerLink backend to various platforms.

## 🎯 **Quick Deploy Options**

### **Option 1: Render (Current Production)**

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
   CORS_ORIGIN=https://your-frontend-domain.com
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

### **Option 3: Vercel (Serverless)**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TomWall1/LedgerLink/tree/main/backend)

1. **Configure `vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/server.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/src/server.ts"
       }
     ]
   }
   ```

2. **Add environment variables** in Vercel dashboard
3. **Connect external PostgreSQL** (Supabase, PlanetScale, etc.)

## 🐳 **Docker Deployment**

### **Local Docker**

```bash
# Build image
docker build -t ledgerlink-backend .

# Run container
docker run -p 3001:3001 \
  -e DATABASE_URL="your-db-url" \
  -e REDIS_URL="your-redis-url" \
  -e JWT_SECRET="your-secret" \
  ledgerlink-backend
```

### **Docker Compose Production**

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://user:pass@postgres:5432/ledgerlink
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-production-secret
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ledgerlink
      POSTGRES_USER: user
      POSTGRES_PASSWORD: secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## ☁️ **Cloud Platform Deployment**

### **AWS ECS with Fargate**

1. **Build and push to ECR:**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [account-id].dkr.ecr.us-east-1.amazonaws.com
   docker build -t ledgerlink-backend .
   docker tag ledgerlink-backend:latest [account-id].dkr.ecr.us-east-1.amazonaws.com/ledgerlink-backend:latest
   docker push [account-id].dkr.ecr.us-east-1.amazonaws.com/ledgerlink-backend:latest
   ```

2. **Create ECS Task Definition:**
   ```json
   {
     "family": "ledgerlink-backend",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "executionRoleArn": "arn:aws:iam::[account]:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "backend",
         "image": "[account-id].dkr.ecr.us-east-1.amazonaws.com/ledgerlink-backend:latest",
         "portMappings": [
           {
             "containerPort": 3001,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "NODE_ENV",
             "value": "production"
           }
         ],
         "secrets": [
           {
             "name": "DATABASE_URL",
             "valueFrom": "arn:aws:secretsmanager:region:account:secret:name"
           }
         ]
       }
     ]
   }
   ```

3. **Create ECS Service with Load Balancer**

### **Google Cloud Run**

1. **Build and deploy:**
   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT-ID]/ledgerlink-backend
   gcloud run deploy ledgerlink-backend \
     --image gcr.io/[PROJECT-ID]/ledgerlink-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

2. **Set environment variables:**
   ```bash
   gcloud run services update ledgerlink-backend \
     --set-env-vars="NODE_ENV=production,JWT_SECRET=your-secret" \
     --region us-central1
   ```

### **Azure Container Instances**

```bash
az container create \
  --resource-group myResourceGroup \
  --name ledgerlink-backend \
  --image ledgerlink/backend:latest \
  --dns-name-label ledgerlink-api \
  --ports 3001 \
  --environment-variables NODE_ENV=production \
  --secure-environment-variables DATABASE_URL="your-db-url"
```

## 🗄️ **Database Setup**

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

# CORS
CORS_ORIGIN="https://your-frontend.com,https://another-domain.com"

# Email (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="app-password"

# ERP Integrations (Optional)
XERO_CLIENT_ID="your-xero-id"
XERO_CLIENT_SECRET="your-xero-secret"
XERO_REDIRECT_URI="https://your-api.com/api/v1/integrations/xero/callback"

QUICKBOOKS_CLIENT_ID="your-qb-id"
QUICKBOOKS_CLIENT_SECRET="your-qb-secret"
QUICKBOOKS_REDIRECT_URI="https://your-api.com/api/v1/integrations/quickbooks/callback"

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

## 🚀 **CI/CD Setup**

### **GitHub Actions (Included)**

The repository includes a GitHub Actions workflow that:
- Runs tests on every PR
- Builds Docker image
- Deploys to staging on main branch

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

## 🔒 **Security Considerations**

### **Production Security Checklist**

- [ ] **Secrets Management**: Use environment variables, never commit secrets
- [ ] **HTTPS Only**: Use SSL certificates (Let's Encrypt, Cloudflare)
- [ ] **Database Security**: Use connection pooling, encrypt connections
- [ ] **Rate Limiting**: Configure appropriate limits for production
- [ ] **CORS**: Restrict origins to your frontend domains only
- [ ] **Headers**: Ensure Helmet.js security headers are enabled
- [ ] **Updates**: Keep dependencies updated regularly
- [ ] **Monitoring**: Set up error tracking and alerting
- [ ] **Backups**: Configure automated database backups
- [ ] **Firewall**: Restrict database/Redis access to application only

### **SSL Certificate Setup**

**Let's Encrypt (Free):**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-api-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

**Cloudflare (Recommended):**
1. Point your domain to Cloudflare
2. Enable "Full (strict)" SSL mode
3. Configure origin certificates for your server

## 🐛 **Troubleshooting**

### **Common Issues**

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

**"Migration failed":**
```bash
# Reset database (development only)
npx prisma migrate reset

# Deploy migrations
npx prisma migrate deploy
```

### **Performance Optimization**

**Database:**
- Enable connection pooling
- Add appropriate indexes
- Use read replicas for heavy queries

**Redis:**
- Configure memory limits
- Use appropriate eviction policies
- Monitor memory usage

**Application:**
- Enable compression middleware
- Use appropriate caching strategies
- Monitor memory leaks

## 📞 **Support**

If you need help with deployment:

1. **Check the logs**: Most issues are visible in application logs
2. **Review environment variables**: Ensure all required variables are set
3. **Test locally first**: Reproduce issues in development
4. **Open an issue**: [GitHub Issues](https://github.com/TomWall1/LedgerLink/issues)

---

**Happy Deploying! 🚀**