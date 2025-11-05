@echo off
echo Starting Yolnext Test...

echo Starting Backend...
start "Backend" /min cmd /c "node backend/simple-stable-server.js"

timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "Frontend" /min cmd /c "npm run dev"

timeout /t 8 /nobreak >nul

echo Testing all panels...
start http://localhost:5173/individual/create-shipment
timeout /t 2 /nobreak >nul
start http://localhost:5173/corporate/create-shipment
timeout /t 2 /nobreak >nul
start http://localhost:5173/nakliyeci/shipments
timeout /t 2 /nobreak >nul
start http://localhost:5173/tasiyici/shipments

echo All panels opened for testing!
pause










