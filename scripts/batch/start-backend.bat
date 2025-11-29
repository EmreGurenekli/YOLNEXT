@echo off
REM YolNext Backend Starter (permanent)
echo ================================
echo  Starting Backend (Minimal Offers Server)
echo ================================
cd backend

SET NODE_ENV=development
SET PORT=5000

echo NODE_ENV=%NODE_ENV%
echo PORT=%PORT%

node minimal-offers-server.js

pause



















