const { chromium } = require('playwright');

async function openBrowserPreview() {
    console.log('🌐 Tarayıcı açılıyor...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000 // Yavaş hareket için
    });
    
    const page = await browser.newPage();
    
    // Ekran boyutunu ayarla
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('📱 YOLNEXT Platform yükleniyor...');
    await page.goto('http://localhost:5173');
    
    // Sayfanın tam yüklenmesini bekle
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Site yüklendi! Tarayıcı açık kalacak...');
    console.log('🔍 Manuel olarak test edebilirsiniz');
    console.log('❌ Kapatmak için tarayıcı penceresini kapatın');
    
    // Tarayıcı kapanana kadar bekle
    await page.waitForEvent('close');
    await browser.close();
    console.log('👋 Tarayıcı kapatıldı');
}

openBrowserPreview().catch(console.error);
