@echo off
echo 🚀 YolNext Setup Script
echo ======================

echo.
echo 📦 Installing dependencies...
call npm install

echo.
echo 🔧 Setting up environment...
if not exist .env (
    copy env.local .env
    echo ✅ .env file created
) else (
    echo ⚠️ .env file already exists
)

echo.
echo 🗄️ Database setup options:
echo 1. Use Docker (Recommended)
echo 2. Use SQLite (Fallback)
echo 3. Manual PostgreSQL setup
echo.

set /p choice="Choose option (1-3): "

if "%choice%"=="1" (
    echo.
    echo 🐳 Starting Docker database...
    docker-compose -f docker-compose.database.yml up -d
    echo ✅ Database started with Docker
    echo.
    echo 🔄 Running migrations...
    call npm run db:migrate
) else if "%choice%"=="2" (
    echo.
    echo 📁 Using SQLite fallback...
    echo ✅ SQLite will be used automatically
) else if "%choice%"=="3" (
    echo.
    echo 📋 Manual PostgreSQL setup required:
    echo 1. Install PostgreSQL from: https://www.postgresql.org/download/windows/
    echo 2. Create database: createdb yolnext_dev
    echo 3. Update .env file with your database credentials
    echo 4. Run: npm run db:migrate
) else (
    echo ❌ Invalid choice
    exit /b 1
)

echo.
echo 🎉 Setup complete!
echo.
echo 🚀 To start the application:
echo    npm run start:dev
echo.
echo 🌐 Access points:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:5000
echo    API Docs: http://localhost:5000/api-docs
echo.
pause


