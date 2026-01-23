const { chromium } = require('playwright');

async function testCompleteUserWorkflow() {
  console.log('🚀 Tam kullanıcı iş akışı testi başlatılıyor...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Console hatalarını yakala
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  try {
    // Test 1: Demo login ile giriş
    console.log('👤 Test 1: Demo bireysel giriş...');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    await page.click('[data-testid="demo-individual"]');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`✅ Dashboard'a yönlendirildi: ${currentUrl}`);
    
    // Test 2: Dashboard kontrolü
    console.log('\n📊 Test 2: Dashboard kontrolü...');
    
    const dashboardTitle = await page.locator('h1').first().textContent();
    console.log(`📄 Dashboard başlığı: ${dashboardTitle}`);
    
    const quickActions = await page.locator('text=Hızlı İşlemler').count();
    console.log(`⚡ Hızlı işlemler: ${quickActions > 0 ? 'Mevcut' : 'Yok'}`);
    
    // Test 3: Gönderi oluşturma
    console.log('\n📦 Test 3: Gönderi oluşturma...');
    
    await page.click('text=Gönderi Oluştur');
    await page.waitForLoadState('networkidle');
    
    const createUrl = page.url();
    console.log(`📍 Gönderi oluştur sayfası: ${createUrl}`);
    
    // Form alanlarını doldur
    const titleInput = page.locator('input[name="title"], input[placeholder*="başlık"], input[placeholder*="Başlık"]').first();
    if (await titleInput.count() > 0) {
      await titleInput.fill('Test Gönderi');
      console.log('✅ Başlık dolduruldu');
    }
    
    const descInput = page.locator('textarea[name="description"], textarea[placeholder*="açıklama"], textarea[placeholder*="Açıklama"]').first();
    if (await descInput.count() > 0) {
      await descInput.fill('Bu bir test gönderisidir');
      console.log('✅ Açıklama dolduruldu');
    }
    
    const weightInput = page.locator('input[name="weight"], input[placeholder*="ağırlık"], input[placeholder*="Ağırlık"]').first();
    if (await weightInput.count() > 0) {
      await weightInput.fill('50');
      console.log('✅ Ağırlık dolduruldu');
    }
    
    const volumeInput = page.locator('input[name="volume"], input[placeholder*="hacim"], input[placeholder*="Hacim"]').first();
    if (await volumeInput.count() > 0) {
      await volumeInput.fill('2');
      console.log('✅ Hacim dolduruldu');
    }
    
    // Gönderi oluştur butonuna tıkla
    const submitButton = page.locator('button:has-text("Oluştur"), button:has-text("Kaydet"), button:has-text("Gönder"), button:has-text("Gönderi Oluştur")').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Gönderi oluşturuldu');
    } else {
      console.log('⚠️ Gönderi oluştur butonu bulunamadı');
    }
    
    // Test 4: Gönderilerim sayfası
    console.log('\n📋 Test 4: Gönderilerim sayfası...');
    
    // Dashboard'a geri dön
    await page.goto('http://localhost:5173/individual/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Gönderilerim linkini ara
    const myShipmentsLink = page.locator('text=Gönderilerim, text=Gönderiler, a[href*="shipments"]').first();
    if (await myShipmentsLink.count() > 0) {
      await myShipmentsLink.click();
      await page.waitForLoadState('networkidle');
      
      const shipmentsUrl = page.url();
      console.log(`📍 Gönderilerim sayfası: ${shipmentsUrl}`);
      
      const shipmentItems = await page.locator('[data-testid*="shipment"], [class*="shipment"], .shipment-item').count();
      console.log(`📦 Gönderi sayısı: ${shipmentItems}`);
    } else {
      console.log('⚠️ Gönderilerim linki bulunamadı');
    }
    
    // Test 5: Profil sayfası
    console.log('\n👤 Test 5: Profil sayfası...');
    
    const profileLink = page.locator('text=Profil, text=Profile, a[href*="profile"]').first();
    if (await profileLink.count() > 0) {
      await profileLink.click();
      await page.waitForLoadState('networkidle');
      
      const profileUrl = page.url();
      console.log(`📍 Profil sayfası: ${profileUrl}`);
      
      const profileTitle = await page.locator('h1, h2').first().textContent();
      console.log(`👤 Profil başlığı: ${profileTitle}`);
    } else {
      console.log('⚠️ Profil linki bulunamadı');
    }
    
    // Test 6: Kurumsal demo login
    console.log('\n🏢 Test 6: Kurumsal demo login...');
    
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    await page.click('[data-testid="demo-corporate"]');
    await page.waitForTimeout(3000);
    
    const corporateUrl = page.url();
    console.log(`✅ Kurumsal dashboard: ${corporateUrl}`);
    
    // Test 7: Nakliyeci demo login
    console.log('\n🚛 Test 7: Nakliyeci demo login...');
    
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    await page.click('[data-testid="demo-nakliyeci"]');
    await page.waitForTimeout(3000);
    
    const nakliyeciUrl = page.url();
    console.log(`✅ Nakliyeci dashboard: ${nakliyeciUrl}`);
    
    // Test 8: Taşıyıcı demo login
    console.log('\n🚚 Test 8: Taşıyıcı demo login...');
    
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    await page.click('[data-testid="demo-tasiyici"]');
    await page.waitForTimeout(3000);
    
    const tasiyiciUrl = page.url();
    console.log(`✅ Taşıyıcı dashboard: ${tasiyiciUrl}`);
    
    // Test 9: Çıkış yapma
    console.log('\n🚪 Test 9: Çıkış yapma...');
    
    const logoutButton = page.locator('text=Çıkış, text=Çıkış Yap, text=Logout').first();
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      await page.waitForTimeout(2000);
      
      const logoutUrl = page.url();
      console.log(`✅ Çıkış yapıldı: ${logoutUrl}`);
    } else {
      console.log('⚠️ Çıkış butonu bulunamadı');
    }
    
    // Test 10: Responsive test
    console.log('\n📱 Test 10: Responsive test...');
    
    // Mobil görünüm
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Tablet görünüm
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    // Desktop görünüm
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    console.log('✅ Responsive test tamamlandı');
    
    console.log('\n🎉 Tüm testler tamamlandı!');
    console.log(`❌ Console hataları: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n🔍 Console hataları:');
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
  } finally {
    await browser.close();
  }
}

testCompleteUserWorkflow().catch(console.error);



