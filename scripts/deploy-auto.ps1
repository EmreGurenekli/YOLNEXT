# Otomatik Deployment Script
# Bu script GitHub push ve deployment adımlarını otomatikleştirir

Write-Host " YolNext Deployment Script" -ForegroundColor Cyan
Write-Host ""

# 1. GitHub Repository Kontrolü
Write-Host "1 GitHub Repository Kontrolü..." -ForegroundColor Yellow
$remoteUrl = git remote get-url origin 2>&1
if ($remoteUrl -like "*YOUR_USERNAME*") {
    Write-Host "     GitHub repository URL'i güncellenmeli!" -ForegroundColor Red
    Write-Host "   Komut: git remote set-url origin https://github.com/YOUR_USERNAME/YOLNEXT.git" -ForegroundColor Gray
    exit 1
} else {
    Write-Host "    Remote URL: $remoteUrl" -ForegroundColor Green
}

# 2. Git Push
Write-Host ""
Write-Host "2 GitHub'a Push..." -ForegroundColor Yellow
git push -u origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "    Push başarılı!" -ForegroundColor Green
} else {
    Write-Host "    Push başarısız!" -ForegroundColor Red
    exit 1
}

# 3. Build Test
Write-Host ""
Write-Host "3 Build Test..." -ForegroundColor Yellow
npm run build:frontend
if ($LASTEXITCODE -eq 0) {
    Write-Host "    Frontend build başarılı!" -ForegroundColor Green
} else {
    Write-Host "    Frontend build başarısız!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host " Hazır! Şimdi Netlify ve Render.com'da deployment yapabilirsiniz." -ForegroundColor Green
