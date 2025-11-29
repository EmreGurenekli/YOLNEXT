@echo off
echo ========================================
echo YolNext Frontend Startup Script
echo ========================================

echo.
echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js is installed

echo.
echo [2/4] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed or not in PATH
    pause
    exit /b 1
)
echo ✅ npm is installed

echo.
echo [3/4] Installing dependencies...
npm install --silent
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

echo.
echo [4/4] Starting frontend server...
echo Starting Vite development server...
echo.
echo If the server doesn't start, try:
echo 1. Check if port 5173 is available
echo 2. Run: netstat -ano | findstr :5173
echo 3. Kill any process using port 5173
echo.

npm run dev