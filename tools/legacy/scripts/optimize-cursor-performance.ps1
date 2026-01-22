# Cursor Performance Optimization Script
# This script helps optimize Cursor IDE performance on Windows

Write-Host "🚀 Cursor Performans Optimizasyonu Başlatılıyor..." -ForegroundColor Green
Write-Host ""

# 1. Clear Cursor cache
Write-Host "1️⃣ Cursor cache temizleniyor..." -ForegroundColor Yellow
$cursorCachePath = "$env:APPDATA\Cursor\Cache"
if (Test-Path $cursorCachePath) {
    Remove-Item -Path "$cursorCachePath\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cache temizlendi: $cursorCachePath" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Cache klasörü bulunamadı" -ForegroundColor Yellow
}

# 2. Clear Cursor logs (keep last 3 days)
Write-Host "2️⃣ Eski log dosyaları temizleniyor..." -ForegroundColor Yellow
$cursorLogsPath = "$env:APPDATA\Cursor\logs"
if (Test-Path $cursorLogsPath) {
    $cutoffDate = (Get-Date).AddDays(-3)
    Get-ChildItem -Path $cursorLogsPath -File | Where-Object { $_.LastWriteTime -lt $cutoffDate } | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ 3 günden eski loglar temizlendi" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Log klasörü bulunamadı" -ForegroundColor Yellow
}

# 3. Clear node_modules cache
Write-Host "3️⃣ Node modules cache temizleniyor..." -ForegroundColor Yellow
$npmCachePath = "$env:APPDATA\npm-cache"
if (Test-Path $npmCachePath) {
    Remove-Item -Path "$npmCachePath\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ NPM cache temizlendi" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ NPM cache klasörü bulunamadı" -ForegroundColor Yellow
}

# 4. Clear Vite cache
Write-Host "4️⃣ Vite cache temizleniyor..." -ForegroundColor Yellow
$viteCachePath = "node_modules\.vite"
if (Test-Path $viteCachePath) {
    Remove-Item -Path "$viteCachePath\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Vite cache temizlendi" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Vite cache klasörü bulunamadı" -ForegroundColor Yellow
}

# 5. Check system resources
Write-Host "5️⃣ Sistem kaynakları kontrol ediliyor..." -ForegroundColor Yellow
$cpuUsage = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue
$memInfo = Get-CimInstance Win32_OperatingSystem
$totalMem = [math]::Round($memInfo.TotalVisibleMemorySize / 1MB, 2)
$freeMem = [math]::Round($memInfo.FreePhysicalMemory / 1MB, 2)
$usedMem = [math]::Round($totalMem - $freeMem, 2)
$memPercent = [math]::Round(($usedMem / $totalMem) * 100, 2)

Write-Host "   CPU Kullanımı: $([math]::Round($cpuUsage, 2))%" -ForegroundColor $(if ($cpuUsage -gt 80) { "Red" } elseif ($cpuUsage -gt 50) { "Yellow" } else { "Green" })
Write-Host "   RAM Kullanımı: $usedMem GB / $totalMem GB ($memPercent%)" -ForegroundColor $(if ($memPercent -gt 80) { "Red" } elseif ($memPercent -gt 50) { "Yellow" } else { "Green" })

if ($memPercent -gt 80) {
    Write-Host "   ⚠️ RAM kullanımı yüksek! Gereksiz programları kapatın." -ForegroundColor Red
}

if ($cpuUsage -gt 80) {
    Write-Host "   ⚠️ CPU kullanımı yüksek! Arka plan işlemlerini kontrol edin." -ForegroundColor Red
}

# 6. Check for high CPU processes
Write-Host "6️⃣ Yüksek CPU kullanan süreçler kontrol ediliyor..." -ForegroundColor Yellow
$highCpuProcesses = Get-Process | Where-Object { $_.CPU -gt 10 } | Sort-Object CPU -Descending | Select-Object -First 5 Name, CPU, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet64 / 1MB, 2)}}
if ($highCpuProcesses) {
    Write-Host "   Yüksek CPU kullanan süreçler:" -ForegroundColor Yellow
    $highCpuProcesses | Format-Table -AutoSize
} else {
    Write-Host "   ✅ Yüksek CPU kullanan süreç yok" -ForegroundColor Green
}

# 7. Check disk space
Write-Host "7️⃣ Disk alanı kontrol ediliyor..." -ForegroundColor Yellow
$disk = Get-PSDrive C
$freeSpaceGB = [math]::Round($disk.Free / 1GB, 2)
$usedSpaceGB = [math]::Round(($disk.Used / 1GB), 2)
$totalSpaceGB = [math]::Round(($disk.Used + $disk.Free) / 1GB, 2)
$freeSpacePercent = [math]::Round(($freeSpaceGB / $totalSpaceGB) * 100, 2)

Write-Host "   Boş Alan: $freeSpaceGB GB / $totalSpaceGB GB ($freeSpacePercent%)" -ForegroundColor $(if ($freeSpacePercent -lt 20) { "Red" } elseif ($freeSpacePercent -lt 30) { "Yellow" } else { "Green" })

if ($freeSpacePercent -lt 20) {
    Write-Host "   ⚠️ Disk alanı az! Disk temizliği yapın." -ForegroundColor Red
}

# 8. Recommendations
Write-Host ""
Write-Host "📋 ÖNERİLER:" -ForegroundColor Cyan
Write-Host "   1. Cursor'ı yeniden başlatın" -ForegroundColor White
Write-Host "   2. Kullanmadığınız extension'ları kapatın" -ForegroundColor White
Write-Host "   3. Büyük dosyaları açmak yerine arama yapın" -ForegroundColor White
Write-Host "   4. OneDrive senkronizasyonunu duraklatın (proje klasörü için)" -ForegroundColor White
Write-Host "   5. Windows Search indekslemesinden proje klasörünü hariç tutun" -ForegroundColor White
Write-Host "   6. Antivirus taramasından proje klasörünü hariç tutun" -ForegroundColor White

Write-Host ""
Write-Host "✅ Optimizasyon tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "Detaylı bilgi için CURSOR_PERFORMANCE_GUIDE.md dosyasını okuyun." -ForegroundColor Cyan



















