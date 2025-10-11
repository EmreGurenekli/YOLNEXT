@echo off
echo.
echo ========================================
echo    YolNet Gerçek Pazaryeri Başlatılıyor
echo ========================================
echo.

echo [1/4] Bağımlılıklar kontrol ediliyor...
if not exist "node_modules" (
    echo Node modules bulunamadı, yükleniyor...
    npm install
    if errorlevel 1 (
        echo HATA: Bağımlılıklar yüklenemedi!
        pause
        exit /b 1
    )
) else (
    echo Bağımlılıklar mevcut.
)

echo.
echo [2/4] Gerçek veritabanı oluşturuluyor...
if not exist "backend\database\yolnet_real.db" (
    echo Yeni veritabanı oluşturuluyor...
    node backend\scripts\init-real-database.js
    if errorlevel 1 (
        echo HATA: Veritabanı oluşturulamadı!
        pause
        exit /b 1
    )
) else (
    echo Veritabanı mevcut.
)

echo.
echo [3/4] Upload klasörü oluşturuluyor...
if not exist "uploads" (
    mkdir uploads
    echo Upload klasörü oluşturuldu.
) else (
    echo Upload klasörü mevcut.
)

echo.
echo [4/4] Sunucular başlatılıyor...
echo.
echo ========================================
echo    YolNet Gerçek Pazaryeri Çalışıyor!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001
echo API Docs: http://localhost:3001/api/health
echo.
echo Çıkmak için Ctrl+C tuşlayın
echo.

start "YolNet Backend" cmd /k "cd /d %~dp0 && node backend\real-server.js"
timeout /t 3 /nobreak > nul
start "YolNet Frontend" cmd /k "cd /d %~dp0 && npm run dev:frontend"

echo.
echo Sunucular başlatıldı! Tarayıcınızda http://localhost:5173 adresini açın.
echo.
pause




