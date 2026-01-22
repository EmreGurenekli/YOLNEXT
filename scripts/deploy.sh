#!/bin/bash

echo "🚀 YolNext Kargo Platform Deployment Başlıyor..."

# Environment variables
export NODE_ENV=production
export DB_HOST=localhost
export DB_NAME=YolNext_kargo
export DB_USER=postgres
export DB_PASSWORD=password
export JWT_SECRET=your-super-secret-jwt-key-change-this

# 1. Dependencies kurulumu
echo "📦 Dependencies kuruluyor..."
npm install
cd backend && npm install && cd ..

# 2. Frontend build
echo "🏗️ Frontend build ediliyor..."
npm run build

# 3. Backend database setup
echo "🗄️ Database kuruluyor..."
cd backend
node database/postgresql-setup.js
cd ..

# 4. Docker containers başlatma
echo "🐳 Docker containers başlatılıyor..."
docker-compose -f docker-compose.prod.yml up -d

# 5. Health check
echo "🔍 Health check yapılıyor..."
sleep 30

# Backend health check
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Backend server çalışıyor"
else
    echo "❌ Backend server çalışmıyor"
    exit 1
fi

# Frontend health check
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Frontend server çalışıyor"
else
    echo "❌ Frontend server çalışmıyor"
    exit 1
fi

echo "🎉 Deployment tamamlandı!"
echo "🌐 Frontend: http://localhost"
echo "🔧 Backend API: http://localhost:5000/api"
echo "📊 Database: PostgreSQL (localhost:5432)"
echo "🔌 Socket.IO: http://localhost:5000"

# Show running containers
echo "📋 Çalışan containers:"
docker ps


