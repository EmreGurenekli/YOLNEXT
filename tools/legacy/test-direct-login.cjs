const { chromium } = require('playwright');

async function testDirectLogin() {
  console.log('🔍 Direkt login test ediliyor...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Direkt login sayfasına git
    console.log('🔐 Login sayfasına gidiliyor...');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    // Sayfa durumunu kontrol et
    const currentUrl = page.url();
    console.log(`📍 Mevcut URL: ${currentUrl}`);
    
    const pageTitle = await page.title();
    console.log(`📄 Sayfa başlığı: ${pageTitle}`);
    
    // Demo login butonuna tıkla
    console.log('👤 Demo bireysel giriş yapılıyor...');
    await page.click('[data-testid="demo-individual"]');
    await page.waitForTimeout(5000);
    
    // Sayfa durumunu kontrol et
    const newUrl = page.url();
    console.log(`📍 Yeni URL: ${newUrl}`);
    
    const newTitle = await page.title();
    console.log(`📄 Yeni sayfa başlığı: ${newTitle}`);
    
    // Dashboard elementlerini kontrol et
    const dashboardElements = await page.locator('[class*="dashboard"], h1, h2').all();
    console.log(`📊 Dashboard elementleri: ${dashboardElements.length} adet`);
    
    for (let i = 0; i < Math.min(dashboardElements.length, 5); i++) {
      const text = await dashboardElements[i].textContent();
      console.log(`  ${i + 1}. "${text}"`);
    }
    
    // Butonları kontrol et
    const buttons = await page.locator('button').all();
    console.log(`🎯 Buton sayısı: ${buttons.length} adet`);
    
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const text = await buttons[i].textContent();
      console.log(`  ${i + 1}. "${text}"`);
    }
    
    // Console hatalarını kontrol et
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    console.log(`❌ Console hataları: ${consoleErrors.length} adet`);
    consoleErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    
    console.log('\n✅ Direkt login testi tamamlandı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await browser.close();
  }
}

testDirectLogin().catch(console.error);



