@echo off
setlocal

echo ========================================
echo YolNext - Start Database Server
echo ========================================

set "BACKEND=%~dp0..\..\backend"

start "YolNext DB Server" cmd /k "cd /d %BACKEND% && npm run db"

echo.
echo Database server started (see new window).

endlocal
