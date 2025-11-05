@echo off
echo ========================================
echo YolNext Advanced Clean Start Script
echo ========================================

echo.
echo [1/6] Killing all Node.js processes...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% neq 0 (
    echo No Node.js processes found to kill
) else (
    echo Node.js processes killed successfully
)

echo.
echo [2/6] Waiting for ports to be released...
timeout /t 3 /nobreak >nul

echo.
echo [3/6] Checking port availability...
netstat -ano | findstr :5000 >nul
if %errorlevel% equ 0 (
    echo WARNING: Port 5000 is still in use
    echo Attempting to find and kill process using port 5000...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

netstat -ano | findstr :5173 >nul
if %errorlevel% equ 0 (
    echo WARNING: Port 5173 is still in use
    echo Attempting to find and kill process using port 5173...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

echo.
echo [4/6] Cleaning cache directories...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache" >nul 2>&1
if exist ".vite" rmdir /s /q ".vite" >nul 2>&1
if exist "dist" rmdir /s /q "dist" >nul 2>&1
echo Cache directories cleaned

echo.
echo [5/6] Starting Backend Server...
start "YolNext Backend" cmd /k "cd /d %~dp0 && node backend/simple-stable-server.js"
echo Backend server starting...

echo.
echo [6/6] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo Testing backend connection...
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running successfully
) else (
    echo ❌ Backend failed to start
    echo Please check the backend window for errors
    pause
    exit /b 1
)

echo.
echo Starting Frontend Server...
start "YolNext Frontend" cmd /k "cd /d %~dp0 && npm run dev"
echo Frontend server starting...

echo.
echo Waiting for frontend to initialize...
timeout /t 10 /nobreak >nul

echo.
echo Testing frontend connection...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is running successfully
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
) else (
    echo ❌ Frontend failed to start
    echo Please check the frontend window for errors
    echo.
    echo Trying alternative startup method...
    echo.
    echo Starting frontend with verbose logging...
    start "YolNext Frontend Debug" cmd /k "cd /d %~dp0 && npm run dev -- --debug"
)

echo.
echo Press any key to exit...
pause >nul




