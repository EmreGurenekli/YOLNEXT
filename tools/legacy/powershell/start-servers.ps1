# YolNext Servisleri Baslatma Scripti - Optimize Edilmis
# Terminal takilmasini onler ve servisleri stabil sekilde baslatir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "YolNext Servisleri Baslatiliyor..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Eski process'leri temizle
Write-Host "[1/5] Eski process'ler temizleniyor..." -ForegroundColor Yellow
$frontendProcesses = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*nodejs*" -or $_.Path -like "*node.exe*"
} | Where-Object {
    try {
        $cmdLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
        $cmdLine -like "*vite*" -or $cmdLine -like "*server-modular*"
    } catch {
        $false
    }
}

if ($frontendProcesses) {
    $frontendProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "  Eski process'ler durduruldu" -ForegroundColor Gray
    Start-Sleep -Seconds 2
} else {
    Write-Host "  Temizlenecek process yok" -ForegroundColor Gray
}

# 2. Port kontrolü
Write-Host "[2/5] Port kontrol ediliyor..." -ForegroundColor Yellow
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }

if ($port5000) {
    Write-Host "  Port 5000 kullanimda (PID: $($port5000.OwningProcess))" -ForegroundColor Gray
} else {
    Write-Host "  Port 5000 bos" -ForegroundColor Gray
}

if ($port5173) {
    Write-Host "  Port 5173 kullanimda (PID: $($port5173.OwningProcess))" -ForegroundColor Gray
} else {
    Write-Host "  Port 5173 bos" -ForegroundColor Gray
}

# 3. Backend baslatma
Write-Host "[3/5] Backend baslatiliyor..." -ForegroundColor Yellow
if (-not $port5000) {
    $backendPath = Join-Path $PSScriptRoot "backend"
    $backendLog = Join-Path $PSScriptRoot "backend.log"
    
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd '$backendPath'; node server-modular.js 2>&1 | Tee-Object -FilePath '$backendLog'"
    ) -WindowStyle Minimized
    
    # Backend'in baslamasini bekle (max 10 saniye)
    $backendReady = $false
    for ($i = 0; $i -lt 10; $i++) {
        Start-Sleep -Seconds 1
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 1 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $backendReady = $true
                break
            }
        } catch {
            # Devam et
        }
    }
    
    if ($backendReady) {
        Write-Host "  Backend basariyla baslatildi!" -ForegroundColor Green
    } else {
        Write-Host "  Backend baslatiliyor (biraz zaman alabilir)..." -ForegroundColor Yellow
    }
} else {
    Write-Host "  Backend zaten calisiyor" -ForegroundColor Green
}

# 4. Frontend baslatma
Write-Host "[4/5] Frontend baslatiliyor..." -ForegroundColor Yellow
if (-not $port5173) {
    $frontendLog = Join-Path $PSScriptRoot "frontend.log"
    
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd '$PSScriptRoot'; `$env:NODE_OPTIONS='--max-old-space-size=2048'; npm run dev 2>&1 | Tee-Object -FilePath '$frontendLog'"
    ) -WindowStyle Minimized
    
    # Frontend'in baslamasini bekle (max 15 saniye)
    $frontendReady = $false
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 1
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 1 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $frontendReady = $true
                break
            }
        } catch {
            # Devam et
        }
    }
    
    if ($frontendReady) {
        Write-Host "  Frontend basariyla baslatildi!" -ForegroundColor Green
    } else {
        Write-Host "  Frontend baslatiliyor (biraz zaman alabilir)..." -ForegroundColor Yellow
    }
} else {
    Write-Host "  Frontend zaten calisiyor" -ForegroundColor Green
}

# 5. Sonuc
Write-Host "[5/5] Kontrol ediliyor..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Servisler Baslatildi!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Log dosyalari:" -ForegroundColor Gray
Write-Host "  - backend.log" -ForegroundColor Gray
Write-Host "  - frontend.log" -ForegroundColor Gray
Write-Host ""
Write-Host "Servisleri durdurmak icin:" -ForegroundColor Yellow
Write-Host "  Get-Process -Name node | Stop-Process -Force" -ForegroundColor Gray
Write-Host ""













































