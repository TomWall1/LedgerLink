#!/bin/bash

# Test Environment Setup Script

set -e

echo "🧪 Setting up test environment..."

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Create test database URL
TEST_DATABASE_URL=$(echo $DATABASE_URL | sed 's/ledgerlink_dev/ledgerlink_test/g')
export DATABASE_URL=$TEST_DATABASE_URL

echo "📄 Test database: $TEST_DATABASE_URL"

# Create test database
echo "🗄️  Creating test database..."
psql $(echo $DATABASE_URL | sed 's|/[^/]*$|/postgres|') -c "DROP DATABASE IF EXISTS ledgerlink_test;" 2>/dev/null || true
psql $(echo $DATABASE_URL | sed 's|/[^/]*$|/postgres|') -c "CREATE DATABASE ledgerlink_test;" 2>/dev/null || true

# Run migrations on test database
echo "🚀 Running test database migrations..."
npx prisma db push --force-reset

echo "✅ Test environment ready"
echo "🧪 Running tests..."

# Run tests
npm test

echo "🎉 Tests completed!"