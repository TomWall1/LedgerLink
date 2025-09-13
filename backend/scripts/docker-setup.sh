#!/bin/bash

# Docker Setup Script
# Quick setup using Docker for everything

set -e

echo "🐳 LedgerLink Docker Setup"
echo "========================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose detected"

# Copy environment file
if [ ! -f ".env" ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    
    # Update .env with Docker-friendly defaults
    echo "📝 Configuring .env for Docker..."
    cat > .env << EOF
# Docker Configuration
NODE_ENV=development
PORT=3001

# Database (Docker)
DATABASE_URL="postgresql://ledgerlink:password123@postgres:5432/ledgerlink_dev"

# Redis (Docker)
REDIS_URL="redis://redis:6379"

# JWT Secrets (change in production)
JWT_SECRET="development-secret-key-change-in-production"
JWT_REFRESH_SECRET="development-refresh-secret-key-change-in-production"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS Settings
CORS_ORIGIN="http://localhost:3000,https://lledgerlink.vercel.app"

# Email (optional for development)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM_NAME="LedgerLink"
EMAIL_FROM_EMAIL=noreply@ledgerlink.com

# File Upload
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ERP Integrations (optional)
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=
XERO_REDIRECT_URI=http://localhost:3001/api/v1/integrations/xero/callback

QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
QUICKBOOKS_REDIRECT_URI=http://localhost:3001/api/v1/integrations/quickbooks/callback
QUICKBOOKS_SANDBOX=true
EOF
    
    echo "✅ .env file configured for Docker"
else
    echo "✅ .env file already exists"
fi

# Build and start all services
echo "🚀 Building and starting all services..."
docker-compose up -d --build

echo "⏳ Waiting for services to be ready..."
sleep 15

# Check if services are healthy
echo "🔍 Checking service health..."

# Check PostgreSQL
echo "Checking PostgreSQL..."
if docker-compose exec postgres pg_isready -U ledgerlink -d ledgerlink_dev > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
    echo "Checking logs..."
    docker-compose logs postgres
fi

# Check Redis
echo "Checking Redis..."
if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis is not ready"
    echo "Checking logs..."
    docker-compose logs redis
fi

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec backend npm run db:generate
docker-compose exec backend npm run migrate

echo ""
echo "🎉 Docker setup completed successfully!"
echo ""
echo "📍 Services running:"
echo "   - Backend API: http://localhost:3001"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo ""
echo "🔗 Quick links:"
echo "   - API Health: http://localhost:3001/api/health"
echo "   - API Docs: http://localhost:3001/api/docs"
echo "   - CSV Demo: http://localhost:3001/api/v1/matching/csv-demo"
echo ""
echo "📊 Optional tools:"
echo "   - Start pgAdmin: docker-compose --profile tools up -d pgadmin"
echo "   - View logs: docker-compose logs -f backend"
echo "   - Stop services: docker-compose down"
echo ""
echo "✨ Your LedgerLink backend is ready for development!"