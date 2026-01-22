#!/bin/bash

set -e

echo "🚀 YOLNEXT Production Deployment"
echo "================================"

# Security: Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then 
   echo "⚠️  Warning: Running as root is not recommended for security reasons"
   read -p "Continue anyway? (y/N) " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       exit 1
   fi
fi

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found. Creating from example..."
    if [ -f env.production ]; then
        echo "✅ Found env.production - using it"
        cp env.production .env.production
    elif [ -f .env.production.example ]; then
        cp .env.production.example .env.production
        echo "✅ Created .env.production - PLEASE EDIT IT WITH YOUR VALUES!"
        exit 1
    else
        echo "❌ .env.production or env.production not found!"
        exit 1
    fi
fi

# Validate production environment
echo "🔍 Validating production environment..."
if command -v node &> /dev/null; then
    node scripts/validate-production.js
    if [ $? -ne 0 ]; then
        echo "❌ Environment validation failed. Please fix the errors above."
        exit 1
    fi
else
    echo "⚠️  Node.js not found. Skipping validation (not recommended)"
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "📦 Installing dependencies..."
npm install
cd backend && npm install && cd ..

echo "🏗️  Building frontend..."
npm run build:frontend

echo "🗄️  Checking database connection..."
cd backend
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()')
  .then(() => { console.log('✅ Database connected'); process.exit(0); })
  .catch((err) => { console.error('❌ Database error:', err.message); process.exit(1); });
"
cd ..

echo "🐳 Starting Docker containers..."
docker-compose -f docker-compose.yml up -d --build

echo "⏳ Waiting for services to start..."
sleep 15

echo "🔍 Health checks..."
# Backend health check
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Frontend health check
if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "⚠️  Frontend health check failed (might need more time)"
fi

echo ""
echo "🎉 Deployment complete!"
echo "🌐 Frontend: http://localhost"
echo "🔧 Backend: http://localhost:5000"
echo ""
echo "📋 Running containers:"
docker ps --filter "name=yolnext"















