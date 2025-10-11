@echo off
echo ========================================
echo    YolNet Mikroservis Mimarisi
echo ========================================
echo.

echo [1/4] Docker servislerini durduruyor...
docker-compose down

echo [2/4] Docker image'larını oluşturuyor...
docker-compose build

echo [3/4] Servisleri başlatıyor...
docker-compose up -d

echo [4/4] Servis durumunu kontrol ediyor...
timeout /t 10 /nobreak > nul
docker-compose ps

echo.
echo ========================================
echo    Servisler Başlatıldı!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔌 API Gateway: http://localhost:3000
echo 🔐 Auth Service: http://localhost:3001
echo 💾 Cache Service: http://localhost:3008
echo 🗄️  PostgreSQL: localhost:5432
echo 📦 Redis: localhost:6379
echo 🍃 MongoDB: localhost:27017
echo.
echo Servisleri durdurmak için: docker-compose down
echo.
pause





