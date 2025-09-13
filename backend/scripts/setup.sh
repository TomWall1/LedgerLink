#!/bin/bash

# LedgerLink Backend Setup Script
# This script sets up the development environment

set -e  # Exit on error

echo "🚀 Setting up LedgerLink Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env file with your configuration before starting the server"
else
    echo "✅ .env file already exists"
fi

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads/reports
echo "✅ Uploads directory created"

# Check if PostgreSQL is available (optional check)
echo "🔍 Checking database connectivity..."
if command -v pg_isready &> /dev/null; then
    echo "✅ PostgreSQL client tools detected"
else
    echo "⚠️  PostgreSQL client tools not found. You'll need PostgreSQL for the database."
    echo "   Install PostgreSQL or use Docker: docker-compose up -d postgres"
fi

# Check if Redis is available (optional check)
if command -v redis-cli &> /dev/null; then
    echo "✅ Redis client tools detected"
else
    echo "⚠️  Redis client tools not found. You'll need Redis for caching."
    echo "   Install Redis or use Docker: docker-compose up -d redis"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your database and Redis URLs"
echo "2. Start PostgreSQL and Redis (or use: docker-compose up -d postgres redis)"
echo "3. Run database setup: npm run setup:db"
echo "4. Start development server: npm run dev"
echo ""
echo "For Docker users: docker-compose up -d"
echo ""
echo "📖 Read backend/README.md for detailed instructions"
echo "🌐 API will be available at: http://localhost:3001"
