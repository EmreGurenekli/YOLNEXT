# Tum Servisleri Baslatma Scripti
# Frontend ve Backend'i birlikte baslatir

Write-Host "YolNext Servisleri Baslatiliyor..." -ForegroundColor Green
Write-Host ""

# 1. Backend'i baslat
Write-Host "Backend baslatiliyor..." -ForegroundColor Yellow
$backendResult = & "$PSScriptRoot\backend\start-backend.ps1" 2>&1

# Backend script'i basarili olup olmadigini kontrol et
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
    Write-Host "Backend baslatilamadi! (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
    Write-Host "Backend loglarini kontrol edin: $PSScriptRoot\backend-output.log" -ForegroundColor Yellow
    # Devam et, belki backend zaten calisiyordur
}

Start-Sleep -Seconds 2

# 2. Frontend'i baslat
Write-Host ""
Write-Host "Frontend baslatiliyor..." -ForegroundColor Yellow

# Eski frontend process'lerini temizle
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*vite*" -or $_.Path -like "*YOLNEXT*"
} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Frontend'i başlat
$frontendLog = Join-Path $PSScriptRoot "frontend-output.log"
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot'; npm run dev 2>&1 | Tee-Object -FilePath '$frontendLog'"
) -WindowStyle Minimized

# Frontend'in baslamasini bekle
Write-Host "Frontend'in baslamasi bekleniyor..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$frontendReady = $false

while ($attempt -lt $maxAttempts -and -not $frontendReady) {
    Start-Sleep -Seconds 1
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $frontendReady = $true
            Write-Host ""
            Write-Host "Frontend basariyla baslatildi! (Port 5173)" -ForegroundColor Green
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

if (-not $frontendReady) {
    Write-Host ""
    Write-Host "Frontend baslatilamadi, manuel kontrol gerekebilir" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Tum servisler hazir!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
    Write-Host "Health:   http://localhost:5000/api/health" -ForegroundColor Cyan
    Write-Host ""
}

