@echo off
setlocal

echo ========================================
echo YolNext - Start Realtime Server
echo ========================================

set "BACKEND=%~dp0..\..\backend"

start "YolNext Realtime" cmd /k "cd /d %BACKEND% && npm run realtime"

echo.
echo Realtime server started (see new window).

endlocal
