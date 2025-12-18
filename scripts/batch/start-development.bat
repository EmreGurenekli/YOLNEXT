@echo off
echo ========================================
echo YolNext Kargo Platform - Development Start
echo ========================================

echo Starting development servers...

REM Canonical dev start: backend/server-modular.js + Vite frontend
set "ROOT=%~dp0..\.."
start "YolNext Dev All" cmd /k "cd /d %ROOT% && npm run dev:all"

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



