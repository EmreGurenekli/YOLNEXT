# Backend Güvenli Başlatma Scripti
# Port çakışmalarını önler ve temiz başlatma yapar

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  YolNext Backend Güvenli Başlatma" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$PORT = 5000

# 1. Eski Node.js process'lerini temizle
Write-Host "[1/4] Eski process'ler temizleniyor..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*YOLNEXT*" -or 
    $_.CommandLine -like "*server-modular*" -or
    $_.CommandLine -like "*backend*"
}

if ($nodeProcesses) {
    Write-Host "  ⚠️  $($nodeProcesses.Count) Node.js process bulundu, kapatılıyor..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "  ✅ Eski process'ler temizlendi" -ForegroundColor Green
} else {
    Write-Host "  ✅ Eski process bulunamadı" -ForegroundColor Green
}

# 2. Port kontrolü ve temizleme
Write-Host "[2/4] Port $PORT kontrol ediliyor..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }

if ($portInUse) {
    Write-Host "  ⚠️  Port $PORT kullanımda!" -ForegroundColor Red
    $processId = $portInUse.OwningProcess
    if ($processId) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "  ⚠️  Process ID: $processId ($($process.ProcessName)) kapatılıyor..." -ForegroundColor Yellow
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            Write-Host "  ✅ Port $PORT temizlendi" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  ✅ Port $PORT boş" -ForegroundColor Green
}

# 3. Backend dizinine git
Write-Host "[3/4] Backend dizinine geçiliyor..." -ForegroundColor Yellow
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
Write-Host "  ✅ Dizin: $scriptPath" -ForegroundColor Green

# 4. .env dosyası kontrolü
Write-Host "[4/4] Environment kontrolü..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "  ⚠️  .env dosyası bulunamadı, oluşturuluyor..." -ForegroundColor Yellow
    $envContent = @"
PORT=5000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:2563@localhost:5432/yolnext
JWT_SECRET=dev-secret-key-change-in-production
DB_CONNECTION_TIMEOUT=10000
"@
    [System.IO.File]::WriteAllText((Join-Path $scriptPath ".env"), $envContent, [System.Text.Encoding]::UTF8)
    Write-Host "  ✅ .env dosyası oluşturuldu" -ForegroundColor Green
} else {
    Write-Host "  ✅ .env dosyası mevcut" -ForegroundColor Green
}

# 5. Backend'i başlat
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Backend Başlatılıyor..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
node server-modular.js













