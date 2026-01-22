# Backend Baslatma Scripti - Kalici Cozum
# Bu script backend'i guvenli bir sekilde baslatir ve port cakismalarini onler

Write-Host "Backend Baslatiliyor..." -ForegroundColor Green

# 1. Eski Node.js process'lerini temizle
Write-Host "Eski process'ler temizleniyor..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*YOLNEXT*" -or $_.CommandLine -like "*server-modular*"
} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Port 5000'i kontrol et ve temizle
Write-Host "Port 5000 kontrol ediliyor..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
if ($portInUse) {
    Write-Host "Port 5000 kullanimda, temizleniyor..." -ForegroundColor Red
    $processId = $portInUse.OwningProcess
    if ($processId) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

# 3. Backend dizinine git
$backendPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $backendPath

# 4. Environment variables kontrolü
if (-not (Test-Path ".env")) {
    Write-Host ".env dosyasi bulunamadi, olusturuluyor..." -ForegroundColor Yellow
    $envContent = @"
PORT=5000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:2563@localhost:5432/yolnext
JWT_SECRET=dev-secret-key-change-in-production
"@
    [System.IO.File]::WriteAllText((Join-Path $backendPath ".env"), $envContent, [System.Text.Encoding]::UTF8)
}

# 5. Backend'i baslat
Write-Host "Backend baslatiliyor..." -ForegroundColor Green
$ErrorActionPreference = "Continue"

# Backend'i arka planda baslat ve loglari dosyaya yaz
$logFile = Join-Path (Split-Path $backendPath -Parent) "backend-output.log"
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$backendPath'; `$ErrorActionPreference='Continue'; node server-modular.js 2>&1 | Tee-Object -FilePath '$logFile'"
) -WindowStyle Minimized

# 6. Backend'in baslamasini bekle
Write-Host "Backend'in baslamasi bekleniyor..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$backendReady = $false

while ($attempt -lt $maxAttempts -and -not $backendReady) {
    Start-Sleep -Seconds 1
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            Write-Host ""
            Write-Host "Backend basariyla baslatildi! (Port 5000)" -ForegroundColor Green
            Write-Host "Health Check: http://localhost:5000/api/health" -ForegroundColor Cyan
            Write-Host "Log dosyasi: $logFile" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

if (-not $backendReady) {
    Write-Host ""
    Write-Host "Backend baslatilamadi! Log dosyasini kontrol edin: $logFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Backend hazir!" -ForegroundColor Green

