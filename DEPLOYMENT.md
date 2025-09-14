# LedgerLink Deployment Guide

Complete guide for deploying LedgerLink with Xero integration to production.

## Prerequisites

- **Node.js** 18+ 
- **MongoDB** 5.0+
- **Redis** 6.0+ (recommended for production)
- **Docker & Docker Compose** (for containerized deployment)
- **SSL Certificate** (required for Xero OAuth)

## Environment Setup

### Backend Environment Variables

Create `.env` file in the backend directory:

```bash
# Application
NODE_ENV=production
PORT=3002
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-backend-domain.com

# Database
MONGODB_URI=mongodb://username:password@host:27017/ledgerlink
MONGODB_SSL=true
MONGODB_MAX_POOL_SIZE=10

# Redis (for caching and rate limiting)
REDIS_URL=redis://username:password@host:6379

# Security
JWT_SECRET=your_super_secure_jwt_secret_here
ENCRYPTION_KEY=your_32_byte_hex_encryption_key_here
SESSION_SECRET=your_session_secret_here

# Xero OAuth 2.0
XERO_CLIENT_ID=your_xero_client_id
XERO_CLIENT_SECRET=your_xero_client_secret
XERO_REDIRECT_URI=https://your-backend-domain.com/api/xero/callback

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Features
ENABLE_XERO_SYNC_JOBS=true
ENABLE_API_LOGGING=true

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads/

# Logging
LOG_LEVEL=info

# SSL/TLS
FORCE_HTTPS=true

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn_here
NEW_RELIC_LICENSE_KEY=your_new_relic_key_here
```

### Frontend Environment Variables

Create `.env.production` file in the frontend directory:

```bash
# API Configuration
REACT_APP_API_URL=https://your-backend-domain.com/api

# Build Configuration
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false

# Optimization
REACT_APP_BUNDLE_ANALYZER=false
```

## Docker Deployment

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ledgerlink-backend-prod
    restart: unless-stopped
    env_file:
      - ./backend/.env
    ports:
      - "3002:3002"
    volumes:
      - backend_uploads:/app/uploads
      - backend_logs:/app/logs
    depends_on:
      - mongodb
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: ledgerlink-frontend-prod
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongodb:
    image: mongo:7.0
    container_name: ledgerlink-mongodb-prod
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ledgerlink
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
      - ./scripts/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    command: mongod --auth --bind_ip_all
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: ledgerlink-redis-prod
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--pass", "${REDIS_PASSWORD}", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  mongodb_data:
  mongodb_config:
  redis_data:
  backend_uploads:
  backend_logs:

networks:
  default:
    name: ledgerlink-prod-network
```

### Deploy with Docker

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Scale services if needed
docker-compose -f docker-compose.prod.yml up -d --scale backend=2
```

## Manual Deployment

### Backend Deployment

```bash
# Clone repository
git clone https://github.com/TomWall1/LedgerLink.git
cd LedgerLink/backend

# Install dependencies
npm ci --only=production

# Set up environment
cp .env.example .env
# Edit .env with your production values

# Create necessary directories
mkdir -p uploads logs

# Set up process manager (PM2)
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ledgerlink-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Frontend Deployment

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Serve with nginx or copy to your web server
sudo cp -r build/* /var/www/html/
```

## Nginx Configuration

Create `/etc/nginx/sites-available/ledgerlink`:

```nginx
# LedgerLink Production Nginx Configuration

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=xero:10m rate=5r/s;

# Upstream backend servers
upstream backend {
    least_conn;
    server 127.0.0.1:3002 max_fails=3 fail_timeout=30s;
    # Add more backend instances if scaling
    # server 127.0.0.1:3003 max_fails=3 fail_timeout=30s;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Frontend
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.pem;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.xero.com https://identity.xero.com https://your-api-domain.com;";
    
    # Root directory
    root /var/www/html;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml
        application/rss+xml
        application/atom+xml
        image/svg+xml;
    
    # Rate limiting
    limit_req zone=general burst=20 nodelay;
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
    
    # API proxy
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Xero callback with stricter rate limiting
    location /api/xero/ {
        limit_req zone=xero burst=10 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 'healthy\n';
        add_header Content-Type text/plain;
    }
    
    # Client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/ledgerlink /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Database Setup

### MongoDB Production Configuration

```javascript
// Connect to MongoDB and create production user
use ledgerlink;

db.createUser({
  user: "ledgerlink_prod",
  pwd: "your_secure_password",
  roles: [
    { role: "readWrite", db: "ledgerlink" },
    { role: "dbAdmin", db: "ledgerlink" }
  ]
});

// Create indexes for optimal performance
db.xeroconnections.createIndex({ "userId": 1, "companyId": 1 });
db.xeroconnections.createIndex({ "tenantId": 1 }, { unique: true });
db.xeroconnections.createIndex({ "status": 1, "expiresAt": 1 });
db.xeroconnections.createIndex({ "lastSyncAt": -1 });
db.users.createIndex({ "email": 1 }, { unique: true });
db.companies.createIndex({ "ownerId": 1 });
```

### Redis Configuration

Edit `/etc/redis/redis.conf`:
```
# Security
requirepass your_redis_password
bind 127.0.0.1

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log
```

## SSL Certificate Setup

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring Setup

### Health Checks

```bash
# Create monitoring script
cat > /opt/ledgerlink/health-check.sh << 'EOF'
#!/bin/bash

# Check backend health
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health)

if [ $BACKEND_STATUS -ne 200 ]; then
    echo "Backend unhealthy: HTTP $BACKEND_STATUS"
    # Restart backend if needed
    pm2 restart ledgerlink-api
fi

# Check MongoDB
MONGO_STATUS=$(mongosh --quiet --eval "db.runCommand('ping').ok" ledgerlink)

if [ "$MONGO_STATUS" != "1" ]; then
    echo "MongoDB connection failed"
fi

# Check Redis
REDIS_STATUS=$(redis-cli ping)

if [ "$REDIS_STATUS" != "PONG" ]; then
    echo "Redis connection failed"
fi
EOF

chmod +x /opt/ledgerlink/health-check.sh

# Add to cron
echo "*/5 * * * * /opt/ledgerlink/health-check.sh" | crontab -
```

### Log Rotation

```bash
# Create logrotate configuration
cat > /etc/logrotate.d/ledgerlink << 'EOF'
/opt/ledgerlink/backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nodejs nodejs
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

## Performance Optimization

### Database Optimization

```javascript
// MongoDB performance tuning
db.adminCommand({
  "setParameter": 1,
  "wiredTigerConcurrentReadTransactions": 256,
  "wiredTigerConcurrentWriteTransactions": 256
});

// Enable profiling for slow queries
db.setProfilingLevel(1, { slowms: 100 });
```

### Backend Optimization

```javascript
// PM2 configuration for cluster mode
module.exports = {
  apps: [{
    name: 'ledgerlink-api',
    script: 'server.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024',
    env: {
      NODE_ENV: 'production',
      UV_THREADPOOL_SIZE: 128
    }
  }]
};
```

## Security Checklist

- [ ] SSL/TLS certificate installed and configured
- [ ] Environment variables secured and not in version control
- [ ] Database authentication enabled
- [ ] Redis password protection enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] File upload limits set
- [ ] Regular security updates scheduled
- [ ] Firewall configured (only necessary ports open)
- [ ] SSH key-based authentication enabled
- [ ] Regular backups scheduled

## Backup Strategy

### Database Backup

```bash
#!/bin/bash
# Create backup script

BACKUP_DIR="/opt/backups/ledgerlink"
DATE=$(date +%Y%m%d_%H%M%S)

# MongoDB backup
mongodump --host localhost --port 27017 --db ledgerlink --out "$BACKUP_DIR/mongo_$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/mongo_$DATE.tar.gz" "$BACKUP_DIR/mongo_$DATE"
rm -rf "$BACKUP_DIR/mongo_$DATE"

# Upload to S3 or other cloud storage
# aws s3 cp "$BACKUP_DIR/mongo_$DATE.tar.gz" s3://your-backup-bucket/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "mongo_*.tar.gz" -mtime +7 -delete
```

### Application Files Backup

```bash
# Backup uploads and logs
tar -czf "/opt/backups/ledgerlink/files_$(date +%Y%m%d_%H%M%S).tar.gz" \
  /opt/ledgerlink/backend/uploads \
  /opt/ledgerlink/backend/logs
```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use nginx or cloud load balancer
2. **Multiple Backend Instances**: Scale with PM2 cluster mode or Docker
3. **Database Clustering**: MongoDB replica sets or sharding
4. **Redis Cluster**: For high availability caching
5. **CDN**: For static asset delivery

### Monitoring and Alerting

1. **Application Performance Monitoring**: New Relic, DataDog
2. **Error Tracking**: Sentry, Rollbar
3. **Infrastructure Monitoring**: Prometheus + Grafana
4. **Log Aggregation**: ELK Stack or cloud logging
5. **Uptime Monitoring**: UptimeRobot, Pingdom

## Troubleshooting

### Common Issues

1. **Xero OAuth Redirect Issues**
   - Verify HTTPS configuration
   - Check redirect URI matches Xero app settings
   - Ensure CORS headers are correct

2. **Database Connection Issues**
   - Check MongoDB authentication
   - Verify connection string
   - Monitor connection pool usage

3. **Performance Issues**
   - Monitor database indexes
   - Check memory usage
   - Review slow query logs

4. **Token Refresh Issues**
   - Verify encryption key consistency
   - Check token expiration handling
   - Monitor Xero API rate limits

---

**Deployment Checklist Complete** ✅

Your LedgerLink application with Xero integration is now ready for production deployment. Monitor the application closely during the first few days and adjust configurations as needed based on actual usage patterns.