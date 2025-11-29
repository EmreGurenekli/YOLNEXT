#!/bin/bash

echo "🚀 YolNext Setup Script"
echo "======================"

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
    cp env.local .env
    echo "✅ .env file created"
else
    echo "⚠️ .env file already exists"
fi

echo ""
echo "🗄️ Database setup options:"
echo "1. Use Docker (Recommended)"
echo "2. Use SQLite (Fallback)"
echo "3. Manual PostgreSQL setup"
echo ""

read -p "Choose option (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🐳 Starting Docker database..."
        docker-compose -f docker-compose.database.yml up -d
        echo "✅ Database started with Docker"
        echo ""
        echo "🔄 Running migrations..."
        npm run db:migrate
        ;;
    2)
        echo ""
        echo "📁 Using SQLite fallback..."
        echo "✅ SQLite will be used automatically"
        ;;
    3)
        echo ""
        echo "📋 Manual PostgreSQL setup required:"
        echo "1. Install PostgreSQL: brew install postgresql@15 (macOS) or apt install postgresql (Ubuntu)"
        echo "2. Start service: brew services start postgresql@15 (macOS) or sudo systemctl start postgresql (Ubuntu)"
        echo "3. Create database: createdb yolnext_dev"
        echo "4. Update .env file with your database credentials"
        echo "5. Run: npm run db:migrate"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup complete!"
echo ""
echo "🚀 To start the application:"
echo "   npm run start:dev"
echo ""
echo "🌐 Access points:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo "   API Docs: http://localhost:5000/api-docs"
echo ""


