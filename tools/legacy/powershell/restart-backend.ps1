# Backend'i yeniden başlatma scripti
Write-Host "Backend yeniden başlatılıyor..." -ForegroundColor Yellow

# Port 5000'i kullanan process'leri durdur
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | 
    Where-Object { $_.State -eq "Listen" } | 
    ForEach-Object { 
        $processId = $_.OwningProcess
        if ($processId) {
            Write-Host "Process $processId durduruluyor..." -ForegroundColor Yellow
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
    }

Start-Sleep -Seconds 2

# Backend'i başlat
Write-Host "Backend başlatılıyor..." -ForegroundColor Green
Set-Location "$PSScriptRoot\backend"
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot\backend'; node server-modular.js"
) -WindowStyle Normal

Write-Host "Backend başlatıldı. Route'ların yüklenmesi için 5 saniye bekleniyor..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Backend hazır!" -ForegroundColor Green






