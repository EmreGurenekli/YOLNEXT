const { chromium } = require('playwright');

async function testLoginFlow() {
  console.log('🔍 Giriş akışı detaylı test ediliyor...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Ana sayfa
    console.log('📱 Ana sayfa yükleniyor...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Bireysel kayıt
    console.log('👤 Bireysel kayıt yapılıyor...');
    await page.click('text=Bireysel Hesap Oluştur');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '05321234567');
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Test123!');
    await page.fill('input[name="city"]', 'İstanbul');
    await page.fill('input[name="district"]', 'Kadıköy');
    
    await page.click('button:has-text("Hesap Oluştur")');
    await page.waitForTimeout(5000);
    
    console.log('✅ Kayıt tamamlandı');
    
    // Giriş yapma
    console.log('🔐 Giriş yapılıyor...');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button:has-text("Giriş Yap")');
    await page.waitForTimeout(5000);
    
    // Sayfa durumunu kontrol et
    const currentUrl = page.url();
    console.log(`📍 Mevcut URL: ${currentUrl}`);
    
    const pageTitle = await page.title();
    console.log(`📄 Sayfa başlığı: ${pageTitle}`);
    
    // Sayfa içeriğini kontrol et
    const bodyText = await page.textContent('body');
    console.log(`📄 Sayfa içeriği uzunluğu: ${bodyText.length} karakter`);
    
    // Hata mesajlarını kontrol et
    const errorMessages = await page.locator('[class*="error"], [class*="alert"], .error, .alert').all();
    console.log(`❌ Hata mesajları: ${errorMessages.length} adet`);
    
    for (let i = 0; i < errorMessages.length; i++) {
      const text = await errorMessages[i].textContent();
      console.log(`  ${i + 1}. "${text}"`);
    }
    
    // Başarı mesajlarını kontrol et
    const successMessages = await page.locator('[class*="success"], [class*="success"], .success').all();
    console.log(`✅ Başarı mesajları: ${successMessages.length} adet`);
    
    // Butonları kontrol et
    const buttons = await page.locator('button').all();
    console.log(`🎯 Buton sayısı: ${buttons.length} adet`);
    
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const text = await buttons[i].textContent();
      console.log(`  ${i + 1}. "${text}"`);
    }
    
    // Linkleri kontrol et
    const links = await page.locator('a').all();
    console.log(`🔗 Link sayısı: ${links.length} adet`);
    
    for (let i = 0; i < Math.min(links.length, 5); i++) {
      const text = await links[i].textContent();
      const href = await links[i].getAttribute('href');
      console.log(`  ${i + 1}. "${text}" -> ${href}`);
    }
    
    // Form alanlarını kontrol et
    const inputs = await page.locator('input').all();
    console.log(`📝 Input sayısı: ${inputs.length} adet`);
    
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
    
    console.log('\n✅ Giriş akışı testi tamamlandı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await browser.close();
  }
}

testLoginFlow().catch(console.error);



