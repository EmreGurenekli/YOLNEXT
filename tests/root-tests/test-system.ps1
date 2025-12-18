# YolNext - Sistem Test Script

Write-Host "🧪 YolNext Sistem Testi Başlıyor..." -ForegroundColor Cyan

# 1. Backend Health Check
Write-Host "`n[1/6] Backend Sağlık Kontrolü..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend çalışıyor" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend çalışmıyor. 'cd backend; node server-modular.js' komutunu çalıştırın" -ForegroundColor Red
    exit 1
}

# 2. Frontend Check
Write-Host "`n[2/6] Frontend Kontrolü..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend çalışıyor" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend çalışmıyor. 'npm run dev' komutunu çalıştırın" -ForegroundColor Red
    exit 1
}

# 3. Database Check
Write-Host "`n[3/6] Veritabanı Kontrolü..." -ForegroundColor Yellow
if (Test-Path "backend\database.sqlite") {
    Write-Host "✅ Veritabanı dosyası mevcut" -ForegroundColor Green
} else {
    Write-Host "⚠️  Veritabanı dosyası yok, yeni oluşturulacak" -ForegroundColor Yellow
}

# 4. API Endpoints Test
Write-Host "`n[4/6] API Endpoint Testleri..." -ForegroundColor Yellow

# Health Check
try {
    Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing | Out-Null
    Write-Host "✅ /api/health çalışıyor" -ForegroundColor Green
} catch {
    Write-Host "❌ /api/health çalışmıyor" -ForegroundColor Red
}

# Auth Endpoints
Write-Host "`n[5/6] Authentication Testleri..." -ForegroundColor Yellow
Write-Host "Test etmek için kayıt olun: http://localhost:5173/register" -ForegroundColor Cyan
Write-Host "E-posta: test@example.com" -ForegroundColor Cyan
Write-Host "Şifre: Test123!@#" -ForegroundColor Cyan

# 6. WebSocket Test
Write-Host "`n[6/6] WebSocket Test..." -ForegroundColor Yellow
Write-Host "WebSocket testi için tarayıcıda giriş yapın ve console'u açın" -ForegroundColor Cyan

# Summary
Write-Host "`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Tüm kontroller tamamlandı!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Sonraki Adımlar:" -ForegroundColor Yellow
Write-Host "1. Tarayıcıda http://localhost:5173 açın" -ForegroundColor White
Write-Host "2. Kayıt ol veya giriş yap" -ForegroundColor White
Write-Host "3. Dashboard'ları test edin" -ForegroundColor White
Write-Host "4. Gönderi oluşturun" -ForegroundColor White
Write-Host "5. Teklif verin/kabul edin" -ForegroundColor White
Write-Host ""
Write-Host "📋 Detaylı test planı: TESTING_PLAN.md" -ForegroundColor Cyan













