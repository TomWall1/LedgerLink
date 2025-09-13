#!/bin/bash

# Complete Development Setup Script
# This script runs the full setup process for development

set -e

echo "🏗️  LedgerLink Development Setup"
echo "================================="
echo ""

# Make scripts executable
chmod +x scripts/*.sh

# Run initial setup
echo "Step 1: Initial setup"
./scripts/setup.sh

echo ""
echo "Step 2: Database setup"

# Check if user wants to use Docker or manual setup
echo "Choose your setup method:"
echo "1) Docker (recommended - includes PostgreSQL and Redis)"
echo "2) Manual (you manage PostgreSQL and Redis)"
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo "🐳 Using Docker setup..."
        
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
        
        echo "✅ Docker detected"
        
        # Start PostgreSQL and Redis with Docker
        echo "🚀 Starting PostgreSQL and Redis with Docker..."
        docker-compose up -d postgres redis
        
        # Wait for services to be ready
        echo "⏳ Waiting for services to start..."
        sleep 10
        
        # Update .env with Docker URLs
        echo "📝 Updating .env with Docker configuration..."
        sed -i.bak 's|DATABASE_URL=.*|DATABASE_URL="postgresql://ledgerlink:password123@localhost:5432/ledgerlink_dev"|' .env
        sed -i.bak 's|REDIS_URL=.*|REDIS_URL="redis://localhost:6379"|' .env
        
        echo "✅ Docker services started"
        ;;
    2)
        echo "🔧 Using manual setup..."
        echo "⚠️  Make sure PostgreSQL and Redis are running and configured in .env"
        read -p "Press Enter when ready to continue..."
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

# Setup database
echo ""
echo "Step 3: Database configuration"
./scripts/setup-db.sh

echo ""
echo "🎉 Development setup completed successfully!"
echo ""
echo "🚀 Starting development server..."
echo "   The server will start at: http://localhost:3001"
echo "   API documentation: http://localhost:3001/api/docs"
echo "   Health check: http://localhost:3001/api/health"
echo ""
echo "📊 Optional services:"
echo "   - Prisma Studio: npm run db:studio"
echo "   - pgAdmin: docker-compose --profile tools up -d pgadmin (http://localhost:5050)"
echo ""
echo "Press Ctrl+C to stop the server"
echo "================================="
echo ""

# Start development server
npm run dev