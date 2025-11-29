@echo off
echo ========================================
echo YolNext Frontend Startup Fix
echo ========================================

echo.
echo [1/5] Killing all Node processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo [2/5] Waiting for ports to be released...
timeout /t 2 /nobreak >nul

echo.
echo [3/5] Starting Backend...
start "Backend" cmd /k "node backend/simple-stable-server.js"
timeout /t 3 /nobreak >nul

echo.
echo [4/5] Testing Backend...
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running
) else (
    echo ❌ Backend failed
    pause
    exit /b 1
)

echo.
echo [5/5] Starting Frontend with multiple attempts...

echo Attempt 1: Standard start
start "Frontend" cmd /k "npm run dev"
timeout /t 10 /nobreak >nul

curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend started successfully!
    start http://localhost:5173
    exit /b 0
)

echo Attempt 2: Force start
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "npm run dev -- --force"
timeout /t 10 /nobreak >nul

curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend started successfully!
    start http://localhost:5173
    exit /b 0
)

echo Attempt 3: Different port
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "npm run dev -- --port 5174"
timeout /t 10 /nobreak >nul

curl -s http://localhost:5174 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend started on port 5174!
    start http://localhost:5174
    exit /b 0
)

echo ❌ All attempts failed. Check the frontend window for errors.
pause




