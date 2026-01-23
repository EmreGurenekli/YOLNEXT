# YOLNEXT Sistem Test Scripti

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "YOLNEXT SİSTEM TESTİ" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"
$testResults = @()

# Test 1: Health Check
Write-Host "1. Health Check Testi..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        $content = $response.Content | ConvertFrom-Json
        Write-Host "   ✅ Başarılı: $($content.message)" -ForegroundColor Green
        $testResults += @{Test="Health Check"; Status="✅ Başarılı"; Message=$content.message}
    }
} catch {
    Write-Host "   ❌ Hata: $_" -ForegroundColor Red
    $testResults += @{Test="Health Check"; Status="❌ Hata"; Message=$_.Exception.Message}
}

# Test 2: Register
Write-Host "`n2. Kayıt (Register) Testi..." -ForegroundColor Yellow
$testEmail = "test_$(Get-Date -Format 'yyyyMMddHHmmss')@test.com"
$registerData = @{
    email = $testEmail
    password = "test123456"
    firstName = "Test"
    lastName = "User"
    userType = "individual"
    phone = "5551234567"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -Body $registerData -ContentType "application/json" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        $content = $response.Content | ConvertFrom-Json
        if ($content.success) {
            Write-Host "   ✅ Başarılı: Kullanıcı kaydedildi" -ForegroundColor Green
            $token = $content.data.token
            $testResults += @{Test="Register"; Status="✅ Başarılı"; Message="Kullanıcı kaydedildi"}
        } else {
            Write-Host "   ⚠️  Uyarı: $($content.message)" -ForegroundColor Yellow
            $testResults += @{Test="Register"; Status="⚠️  Uyarı"; Message=$content.message}
        }
    }
} catch {
    $errorContent = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($errorContent) {
        Write-Host "   ⚠️  Uyarı: $($errorContent.message)" -ForegroundColor Yellow
        $testResults += @{Test="Register"; Status="⚠️  Uyarı"; Message=$errorContent.message}
    } else {
        Write-Host "   ❌ Hata: $_" -ForegroundColor Red
        $testResults += @{Test="Register"; Status="❌ Hata"; Message=$_.Exception.Message}
    }
}

# Test 3: Login
Write-Host "`n3. Giriş (Login) Testi..." -ForegroundColor Yellow
$loginData = @{
    email = $testEmail
    password = "test123456"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        $content = $response.Content | ConvertFrom-Json
        if ($content.success) {
            Write-Host "   ✅ Başarılı: Giriş yapıldı" -ForegroundColor Green
            $token = $content.data.token
            $testResults += @{Test="Login"; Status="✅ Başarılı"; Message="Giriş yapıldı"}
            
            # Test 4: Shipments List (with token)
            Write-Host "`n4. Gönderiler (Shipments) Testi..." -ForegroundColor Yellow
            try {
                $headers = @{
                    "Authorization" = "Bearer $token"
                    "Content-Type" = "application/json"
                }
                $response = Invoke-WebRequest -Uri "$baseUrl/api/shipments" -Method GET -Headers $headers -UseBasicParsing
                if ($response.StatusCode -eq 200) {
                    $content = $response.Content | ConvertFrom-Json
                    Write-Host "   ✅ Başarılı: Gönderiler listelendi ($($content.data.shipments.Count) adet)" -ForegroundColor Green
                    $testResults += @{Test="Shipments"; Status="✅ Başarılı"; Message="$($content.data.shipments.Count) gönderi"}
                }
            } catch {
                Write-Host "   ⚠️  Uyarı: $_" -ForegroundColor Yellow
                $testResults += @{Test="Shipments"; Status="⚠️  Uyarı"; Message=$_.Exception.Message}
            }
        } else {
            Write-Host "   ❌ Hata: $($content.message)" -ForegroundColor Red
            $testResults += @{Test="Login"; Status="❌ Hata"; Message=$content.message}
        }
    }
} catch {
    $errorContent = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($errorContent) {
        Write-Host "   ❌ Hata: $($errorContent.message)" -ForegroundColor Red
        $testResults += @{Test="Login"; Status="❌ Hata"; Message=$errorContent.message}
    } else {
        Write-Host "   ❌ Hata: $_" -ForegroundColor Red
        $testResults += @{Test="Login"; Status="❌ Hata"; Message=$_.Exception.Message}
    }
}

# Test 5: Offers
Write-Host "`n5. Teklifler (Offers) Testi..." -ForegroundColor Yellow
if ($token) {
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        $response = Invoke-WebRequest -Uri "$baseUrl/api/offers" -Method GET -Headers $headers -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $content = $response.Content | ConvertFrom-Json
            Write-Host "   ✅ Başarılı: Teklifler listelendi ($($content.data.offers.Count) adet)" -ForegroundColor Green
            $testResults += @{Test="Offers"; Status="✅ Başarılı"; Message="$($content.data.offers.Count) teklif"}
        }
    } catch {
        Write-Host "   ⚠️  Uyarı: $_" -ForegroundColor Yellow
        $testResults += @{Test="Offers"; Status="⚠️  Uyarı"; Message=$_.Exception.Message}
    }
} else {
    Write-Host "   ⏭️  Atlandı: Token yok" -ForegroundColor Gray
    $testResults += @{Test="Offers"; Status="⏭️  Atlandı"; Message="Token yok"}
}

# Test 6: Messages
Write-Host "`n6. Mesajlar (Messages) Testi..." -ForegroundColor Yellow
if ($token) {
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        $response = Invoke-WebRequest -Uri "$baseUrl/api/messages" -Method GET -Headers $headers -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $content = $response.Content | ConvertFrom-Json
            Write-Host "   ✅ Başarılı: Mesajlar listelendi ($($content.data.Count) konuşma)" -ForegroundColor Green
            $testResults += @{Test="Messages"; Status="✅ Başarılı"; Message="$($content.data.Count) konuşma"}
        }
    } catch {
        Write-Host "   ⚠️  Uyarı: $_" -ForegroundColor Yellow
        $testResults += @{Test="Messages"; Status="⚠️  Uyarı"; Message=$_.Exception.Message}
    }
} else {
    Write-Host "   ⏭️  Atlandı: Token yok" -ForegroundColor Gray
    $testResults += @{Test="Messages"; Status="⏭️  Atlandı"; Message="Token yok"}
}

# Özet
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST ÖZETİ" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($result in $testResults) {
    Write-Host "$($result.Status) - $($result.Test): $($result.Message)" -ForegroundColor $(if ($result.Status -like "*✅*") { "Green" } elseif ($result.Status -like "*⚠️*") { "Yellow" } else { "Red" })
}

$successCount = ($testResults | Where-Object { $_.Status -like "*✅*" }).Count
$totalCount = $testResults.Count

Write-Host "`nToplam: $successCount/$totalCount test başarılı" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })
































































