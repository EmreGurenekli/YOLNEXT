@echo off
echo ========================================
echo YolNext System Startup - FIXED VERSION
echo ========================================

set "ROOT=%~dp0..\.."

echo.
echo [1/6] Cleaning system...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im chrome.exe >nul 2>&1
taskkill /f /im msedge.exe >nul 2>&1

echo.
echo [2/6] Cleaning cache...
if exist "%ROOT%\node_modules\.cache" rmdir /s /q "%ROOT%\node_modules\.cache" >nul 2>&1
if exist "%ROOT%\.vite" rmdir /s /q "%ROOT%\.vite" >nul 2>&1
if exist "%ROOT%\dist" rmdir /s /q "%ROOT%\dist" >nul 2>&1

echo.
echo [3/6] Waiting for ports to be released...
timeout /t 3 /nobreak >nul

echo.
echo [4/6] Starting Backend...
start "YolNext Backend" cmd /k "cd /d %ROOT% && npm run dev:backend"
timeout /t 5 /nobreak >nul

echo.
echo [5/6] Testing Backend...
curl --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ curl not found. Skipping automatic backend health check.
) else (
    curl -s http://localhost:5000/api/health/live >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Backend failed to start
        echo Please check the backend window for errors
        pause
        exit /b 1
    )
    echo ✅ Backend is running
)

echo.
echo [6/6] Starting Frontend...
echo Starting frontend with optimized settings...

REM Try different startup methods
echo Method 1: Standard start
start "YolNext Frontend" cmd /k "cd /d %ROOT% && npm run dev"
timeout /t 15 /nobreak >nul

curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend started successfully on port 5173!
    echo.
    echo ========================================
    echo 🎉 YolNext System Started Successfully!
    echo ========================================
    echo.
    echo Backend:  http://localhost:5000
    echo Frontend: http://localhost:5173
    echo.
    echo Opening browser...
    start http://localhost:5173
    exit /b 0
)

echo Method 2: Force start
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
start "YolNext Frontend" cmd /k "cd /d %ROOT% && npm run dev -- --force"
timeout /t 15 /nobreak >nul

curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend started successfully on port 5173!
    echo.
    echo ========================================
    echo 🎉 YolNext System Started Successfully!
    echo ========================================
    echo.
    echo Backend:  http://localhost:5000
    echo Frontend: http://localhost:5173
    echo.
    echo Opening browser...
    start http://localhost:5173
    exit /b 0
)

echo Method 3: Alternative port
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
start "YolNext Frontend" cmd /k "cd /d %ROOT% && npm run dev -- --port 5174"
timeout /t 15 /nobreak >nul

curl -s http://localhost:5174 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend started successfully on port 5174!
    echo.
    echo ========================================
    echo 🎉 YolNext System Started Successfully!
    echo ========================================
    echo.
    echo Backend:  http://localhost:5000
    echo Frontend: http://localhost:5174
    echo.
    echo Opening browser...
    start http://localhost:5174
    exit /b 0
)

echo.
echo ❌ All startup methods failed
echo.
echo Please check the frontend window for detailed error messages
echo.
echo Common solutions:
echo 1. Make sure Node.js is installed: node --version
echo 2. Install dependencies: npm install
echo 3. Check if ports 5000 and 5173 are available
echo 4. Try running: npm run dev -- --port 5174
echo.
pause