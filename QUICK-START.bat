@echo off
echo ========================================
echo YOLNEXT HIZLI BAŞLATMA
echo ========================================
echo.

echo [1/5] Tum Node process'lerini durdurma...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo [2/5] Cache temizleme...
if exist .vite rmdir /s /q .vite 2>nul
if exist dist rmdir /s /q dist 2>nul
echo Cache temizlendi!

echo [3/5] Backend baslatiliyor...
start "YOLNEXT-BACKEND" cmd /c "echo Backend baslatiliyor... && node backend/simple-stable-server.js"
timeout /t 3 /nobreak >nul

echo [4/5] Frontend baslatiliyor...
start "YOLNEXT-FRONTEND" cmd /c "echo Frontend baslatiliyor... && npm run dev"
timeout /t 8 /nobreak >nul

echo [5/5] Tarayici aciliyor...
start http://localhost:5173

echo.
echo ========================================
echo SISTEM HAZIR!
echo ========================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo ========================================
echo.
echo Tum panelleri test etmek icin test-all-panels.bat calistirin
echo.
pause











