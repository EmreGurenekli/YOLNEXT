@echo off
echo ========================================
echo VITE CACHE TEMIZLEME
echo ========================================
echo.

echo [1/4] Tum Node process'lerini durdurma...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Vite cache temizleme...
if exist .vite rmdir /s /q .vite 2>nul
if exist dist rmdir /s /q dist 2>nul
if exist node_modules\.vite rmdir /s /q node_modules\.vite 2>nul
echo Vite cache temizlendi!

echo [3/4] Node modules cache temizleme...
if exist node_modules rmdir /s /q node_modules 2>nul
echo Node modules temizlendi!

echo [4/4] Yeni kurulum...
npm install
echo Kurulum tamamlandi!

echo.
echo ========================================
echo CACHE TEMIZLENDI!
echo ========================================
echo.
echo Simdi QUICK-START.bat calistirin
echo.
pause










