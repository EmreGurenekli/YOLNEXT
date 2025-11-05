@echo off
REM Production Startup Script for YolNext Backend (Windows)

echo 🚀 Starting YolNext Production Backend...

REM Check if .env.production exists
if not exist .env.production (
    echo ❌ Error: .env.production file not found!
    echo Please create .env.production with production configuration
    exit /b 1
)

REM Load production environment
for /f "tokens=1,* delims==" %%a in (.env.production) do (
    if not "%%a"=="" (
        if not "%%a"=="#" (
            set "%%a=%%b"
        )
    )
)

REM Validate required environment variables
if "%JWT_SECRET%"=="" (
    echo ❌ Error: JWT_SECRET must be set in production!
    exit /b 1
)

if "%JWT_SECRET%"=="CHANGE_ME_GENERATE_STRONG_SECRET_MIN_32_CHARS" (
    echo ❌ Error: JWT_SECRET must be changed from default value!
    exit /b 1
)

if "%DATABASE_URL%"=="" (
    echo ❌ Error: DATABASE_URL must be set in production!
    exit /b 1
)

if "%FRONTEND_ORIGIN%"=="" (
    echo ❌ Error: FRONTEND_ORIGIN must be set in production!
    exit /b 1
)

REM Create necessary directories
if not exist logs mkdir logs
if not exist uploads mkdir uploads

REM Run migrations if needed
if "%RUN_MIGRATIONS%"=="true" (
    echo 📦 Running database migrations...
    node scripts\migrate-production.js
)

REM Start the application
echo ✅ Starting application...
node postgres-backend.js

