@echo off
echo ========================================
echo    YolNet Kargo - Development Mode
echo ========================================
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && node simple-server.js"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo    Development servers started!
echo ========================================
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause > nul







