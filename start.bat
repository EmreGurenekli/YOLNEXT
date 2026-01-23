@echo off
echo Starting YolNext (Frontend + Backend)...
start "YolNext Dev All" cmd /k "cd /d %~dp0 && npm run dev:all"
echo Servers are starting in a separate window.
