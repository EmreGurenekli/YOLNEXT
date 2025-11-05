@echo off
echo ========================================
echo TUM PANELLERI TEST ET
echo ========================================
echo.

echo Bireysel Panel aciliyor...
start http://localhost:5173/individual/create-shipment
timeout /t 2 /nobreak >nul

echo Kurumsal Panel aciliyor...
start http://localhost:5173/corporate/create-shipment
timeout /t 2 /nobreak >nul

echo Nakliyeci Panel aciliyor...
start http://localhost:5173/nakliyeci/shipments
timeout /t 2 /nobreak >nul

echo Tasiyici Panel aciliyor...
start http://localhost:5173/tasiyici/shipments

echo.
echo ========================================
echo TUM PANELLER ACILDI!
echo ========================================
echo.
echo Her panelde demo giris yaparak test edin:
echo 1. Demo butonuna tiklayin
echo 2. Gonderi olusturun
echo 3. Gonderi gorunurlugunu kontrol edin
echo.
pause











