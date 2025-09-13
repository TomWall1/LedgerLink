#!/bin/bash

# Database Setup Script
# This script sets up the PostgreSQL database and runs migrations

set -e

echo "🗄️  Setting up LedgerLink Database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    if [ -f ".env" ]; then
        echo "📄 Loading environment variables from .env..."
        export $(grep -v '^#' .env | xargs)
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL not found in environment or .env file"
        echo "   Please set DATABASE_URL in your .env file"
        echo "   Example: DATABASE_URL=\"postgresql://username:password@localhost:5432/ledgerlink_dev\""
        exit 1
    fi
fi

echo "✅ Database URL configured"

# Test database connection
echo "🔍 Testing database connection..."
npx prisma db execute --command "SELECT 1" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Cannot connect to database. Please check:"
    echo "   1. PostgreSQL is running"
    echo "   2. Database URL is correct in .env file"
    echo "   3. Database exists and user has permissions"
    echo ""
    echo "   To start PostgreSQL with Docker: docker-compose up -d postgres"
    exit 1
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated"
else
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

# Run database migrations
echo "🚀 Running database migrations..."
npx prisma migrate dev --name init

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed"
else
    echo "❌ Database migration failed"
    echo "   Try running: npx prisma migrate reset"
    exit 1
fi

# Seed database (optional)
if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
    echo "🌱 Seeding database with initial data..."
    npx prisma db seed
    
    if [ $? -eq 0 ]; then
        echo "✅ Database seeded successfully"
    else
        echo "⚠️  Database seeding failed (non-critical)"
    fi
else
    echo "ℹ️  No seed file found, skipping database seeding"
fi

echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "You can now:"
echo "- Start the development server: npm run dev"
echo "- View the database: npx prisma studio"
echo "- Run migrations: npm run migrate"
echo ""