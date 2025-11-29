@echo off
echo ========================================
echo YolNext Kargo Platform - Development Start
echo ========================================

echo Starting development servers...

REM Start Backend
echo Starting Backend Server...
start "YolNext Backend" cmd /k "cd backend && node app.js"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend
echo Starting Frontend Server...
start "YolNext Frontend" cmd /k "npm run dev"

echo ========================================
echo Development servers started!
echo ========================================
echo Frontend: http://localhost:5173
echo Backend: http://localhost:5000
echo API: http://localhost:5000/api
echo ========================================

echo.
echo Demo Accounts:
echo Individual: individual@demo.com / demo123
echo Corporate: corporate@demo.com / demo123
echo Nakliyeci: nakliyeci@demo.com / demo123
echo Tasiyici: tasiyici@demo.com / demo123
echo.

pause



