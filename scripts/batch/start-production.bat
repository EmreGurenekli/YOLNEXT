@echo off
setlocal

echo ========================================
echo YolNext - Start Production (local)
echo ========================================

set "ROOT=%~dp0..\.."

echo Running production start script...
cd /d %ROOT%
npm run start:prod

endlocal
