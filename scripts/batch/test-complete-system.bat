@echo off
echo Starting YolNext System Tests...
echo.

set "ROOT=%~dp0..\.."

echo Step 1: Starting Backend Server...
start /B cmd /c "cd /d %ROOT% && npm run dev:backend"
timeout /t 5 /nobreak >nul

echo Step 2: Starting Frontend Server...
start /B cmd /c "cd /d %ROOT% && npm run dev"
timeout /t 10 /nobreak >nul

echo.
echo Servers should be running now!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to continue with browser tests...
pause >nul

