@echo off
echo Cleaning system...

echo Killing all processes...
taskkill /F /IM node.exe /T 2>nul

echo Cleaning cache...
rmdir /s /q .vite 2>nul
rmdir /s /q dist 2>nul

echo Starting fresh...
start "Backend" /min cmd /c "node backend/simple-stable-server.js"

timeout /t 3 /nobreak >nul

start "Frontend" /min cmd /c "npm run dev"

timeout /t 8 /nobreak >nul

echo Opening browser...
start http://localhost:5173

echo System ready!
pause










