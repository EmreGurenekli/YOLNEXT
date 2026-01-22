# YolNext Servisleri Yeniden Baslatma Scripti
# Terminal takilmasini onler

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "YolNext Servisleri Yeniden Baslatiliyor..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Servisleri durdur
Write-Host "[1/3] Servisler durduruluyor..." -ForegroundColor Yellow
$processes = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    try {
        $cmdLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
        $cmdLine -like "*vite*" -or $cmdLine -like "*server-modular*"
    } catch {
        $false
    }
}

if ($processes) {
    $processes | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "  Servisler durduruldu" -ForegroundColor Gray
    Start-Sleep -Seconds 3
} else {
    Write-Host "  Durdurulacak servis yok" -ForegroundColor Gray
}

# 2. Port kontrolü
Write-Host "[2/3] Portlar temizleniyor..." -ForegroundColor Yellow
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }

if ($port5000) {
    Stop-Process -Id $port5000.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "  Port 5000 temizlendi" -ForegroundColor Gray
    Start-Sleep -Seconds 1
}

if ($port5173) {
    Stop-Process -Id $port5173.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "  Port 5173 temizlendi" -ForegroundColor Gray
    Start-Sleep -Seconds 1
}

# 3. Servisleri baslat
Write-Host "[3/3] Servisler baslatiliyor..." -ForegroundColor Yellow
& "$PSScriptRoot\start-servers.ps1"













































