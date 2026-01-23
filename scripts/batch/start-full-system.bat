@echo off
setlocal

echo ========================================
echo YolNext - Start Full System
echo ========================================

REM Run from repo root
set "ROOT=%~dp0..\.."

start "YolNext Dev All" cmd /k "cd /d %ROOT% && npm run dev:all"

echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.
start http://localhost:5173

endlocal
