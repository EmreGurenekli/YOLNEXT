#!/bin/bash
# Production Startup Script for YolNext Backend

set -e

echo "🚀 Starting YolNext Production Backend..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create .env.production with production configuration"
    exit 1
fi

# Load production environment
export $(cat .env.production | grep -v '^#' | xargs)

# Validate required environment variables
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "CHANGE_ME_GENERATE_STRONG_SECRET_MIN_32_CHARS" ]; then
    echo "❌ Error: JWT_SECRET must be set in production!"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL must be set in production!"
    exit 1
fi

if [ -z "$FRONTEND_ORIGIN" ]; then
    echo "❌ Error: FRONTEND_ORIGIN must be set in production!"
    exit 1
fi

# Check database connection
echo "🔍 Checking database connection..."
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()')
    .then(() => { console.log('✅ Database connection successful'); process.exit(0); })
    .catch((err) => { console.error('❌ Database connection failed:', err.message); process.exit(1); });
"

if [ $? -ne 0 ]; then
    echo "❌ Database connection failed. Please check your DATABASE_URL"
    exit 1
fi

# Run migrations if needed
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "📦 Running database migrations..."
    node scripts/migrate-production.js
fi

# Create necessary directories
mkdir -p logs
mkdir -p uploads

# Start the application
echo "✅ Starting application..."
exec node server-modular.js
