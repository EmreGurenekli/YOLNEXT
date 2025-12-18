@echo off
REM YolNext Backend Starter (permanent)
echo ================================
echo  Starting Backend (server-modular)
echo ================================
set "ROOT=%~dp0..\.."
cd /d %ROOT%\backend

SET NODE_ENV=development
SET PORT=5000

echo NODE_ENV=%NODE_ENV%
echo PORT=%PORT%

node server-modular.js

pause



















