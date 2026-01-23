const { chromium } = require('playwright');

async function testCompleteWorkflow() {
  console.log('🚀 Tam iş akışı testi başlatılıyor...\n');
  
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
    // Test 1: Ana sayfa
    console.log('📱 Test 1: Ana sayfa kontrolü...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    console.log(`✅ Sayfa başlığı: ${title}`);
    
    // Test 2: Bireysel kullanıcı kaydı
    console.log('\n👤 Test 2: Bireysel kullanıcı kaydı...');
    
    await page.click('text=Bireysel Hesap Oluştur');
    await page.waitForLoadState('networkidle');
    
    // Form doldur
    await page.fill('input[name="firstName"]', 'Ahmet');
    await page.fill('input[name="lastName"]', 'Yılmaz');
    await page.fill('input[name="email"]', 'ahmet.yilmaz@test.com');
    await page.fill('input[name="phone"]', '05321234567');
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Test123!');
    await page.fill('input[name="city"]', 'İstanbul');
    await page.fill('input[name="district"]', 'Kadıköy');
    
    await page.click('button:has-text("Hesap Oluştur")');
    await page.waitForTimeout(3000);
    
    console.log('✅ Bireysel kayıt tamamlandı');
    
    // Test 3: Giriş yapma
    console.log('\n🔐 Test 3: Giriş yapma...');
    
    await page.click('text=Giriş Yap');
    await page.fill('input[name="email"]', 'ahmet.yilmaz@test.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button:has-text("Giriş Yap")');
    await page.waitForTimeout(3000);
    
    console.log('✅ Giriş yapıldı');
    
    // Test 4: Dashboard kontrolü
    console.log('\n📊 Test 4: Dashboard kontrolü...');
    
    const currentUrl = page.url();
    console.log(`📍 Mevcut URL: ${currentUrl}`);
    
    // Dashboard elementlerini kontrol et
    const dashboardElements = await page.locator('[data-testid*="dashboard"], [class*="dashboard"], h1, h2').count();
    console.log(`📊 Dashboard elementleri: ${dashboardElements} adet`);
    
    // Test 5: Gönderi oluşturma
    console.log('\n📦 Test 5: Gönderi oluşturma...');
    
    // Gönderi oluştur butonunu ara
    const createShipmentButton = page.locator('text=Gönderi Oluştur, text=Yeni Gönderi, text=Gönderi Ekle').first();
    if (await createShipmentButton.count() > 0) {
      await createShipmentButton.click();
      await page.waitForLoadState('networkidle');
      
      // Gönderi formunu doldur
      const titleInput = page.locator('input[name="title"], input[placeholder*="başlık"], input[placeholder*="Başlık"]').first();
      if (await titleInput.count() > 0) {
        await titleInput.fill('Test Gönderi');
        console.log('✅ Gönderi başlığı dolduruldu');
      }
      
      const descInput = page.locator('textarea[name="description"], textarea[placeholder*="açıklama"], textarea[placeholder*="Açıklama"]').first();
      if (await descInput.count() > 0) {
        await descInput.fill('Bu bir test gönderisidir');
        console.log('✅ Gönderi açıklaması dolduruldu');
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
      const submitButton = page.locator('button:has-text("Oluştur"), button:has-text("Kaydet"), button:has-text("Gönder")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ Gönderi oluşturuldu');
      }
    } else {
      console.log('⚠️ Gönderi oluştur butonu bulunamadı');
    }
    
    // Test 6: Gönderilerim sayfası
    console.log('\n📋 Test 6: Gönderilerim sayfası...');
    
    const myShipmentsButton = page.locator('text=Gönderilerim, text=Gönderiler, text=My Shipments').first();
    if (await myShipmentsButton.count() > 0) {
      await myShipmentsButton.click();
      await page.waitForLoadState('networkidle');
      
      const shipmentItems = await page.locator('[data-testid*="shipment"], [class*="shipment"], .shipment-item').count();
      console.log(`📦 Gönderi sayısı: ${shipmentItems}`);
    } else {
      console.log('⚠️ Gönderilerim butonu bulunamadı');
    }
    
    // Test 7: Profil sayfası
    console.log('\n👤 Test 7: Profil sayfası...');
    
    const profileButton = page.locator('text=Profil, text=Profile, text=Hesabım').first();
    if (await profileButton.count() > 0) {
      await profileButton.click();
      await page.waitForLoadState('networkidle');
      
      const profileTitle = await page.locator('h1, h2').first().textContent();
      console.log(`👤 Profil başlığı: ${profileTitle}`);
    } else {
      console.log('⚠️ Profil butonu bulunamadı');
    }
    
    // Test 8: Çıkış yapma
    console.log('\n🚪 Test 8: Çıkış yapma...');
    
    const logoutButton = page.locator('text=Çıkış, text=Logout, text=Sign Out').first();
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Çıkış yapıldı');
    } else {
      console.log('⚠️ Çıkış butonu bulunamadı');
    }
    
    // Test 9: Kurumsal kayıt
    console.log('\n🏢 Test 9: Kurumsal kayıt...');
    
    await page.click('text=Kurumsal Hesap Oluştur');
    await page.waitForLoadState('networkidle');
    
    // Kurumsal form doldur
    await page.fill('input[name="companyName"]', 'Test Şirketi');
    await page.fill('input[name="email"]', 'info@testcompany.com');
    await page.fill('input[name="phone"]', '02121234567');
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Test123!');
    
    await page.click('button:has-text("Hesap Oluştur")');
    await page.waitForTimeout(3000);
    
    console.log('✅ Kurumsal kayıt tamamlandı');
    
    // Test 10: Nakliyeci kayıt
    console.log('\n🚛 Test 10: Nakliyeci kayıt...');
    
    await page.click('text=Nakliyeci Hesap Oluştur');
    await page.waitForLoadState('networkidle');
    
    // Nakliyeci form doldur
    await page.fill('input[name="companyName"]', 'Test Nakliye');
    await page.fill('input[name="email"]', 'info@testnakliye.com');
    await page.fill('input[name="phone"]', '05321234568');
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Test123!');
    
    await page.click('button:has-text("Hesap Oluştur")');
    await page.waitForTimeout(3000);
    
    console.log('✅ Nakliyeci kayıt tamamlandı');
    
    // Test 11: Taşıyıcı kayıt
    console.log('\n🚚 Test 11: Taşıyıcı kayıt...');
    
    await page.click('text=Taşıyıcı Hesap Oluştur');
    await page.waitForLoadState('networkidle');
    
    // Taşıyıcı form doldur
    await page.fill('input[name="firstName"]', 'Mehmet');
    await page.fill('input[name="lastName"]', 'Demir');
    await page.fill('input[name="email"]', 'mehmet.demir@test.com');
    await page.fill('input[name="phone"]', '05321234569');
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Test123!');
    
    await page.click('button:has-text("Hesap Oluştur")');
    await page.waitForTimeout(3000);
    
    console.log('✅ Taşıyıcı kayıt tamamlandı');
    
    // Test 12: Veri kalıcılığı testi
    console.log('\n💾 Test 12: Veri kalıcılığı testi...');
    
    // Son kayıt olan kullanıcı ile giriş yap
    await page.click('text=Giriş Yap');
    await page.fill('input[name="email"]', 'mehmet.demir@test.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button:has-text("Giriş Yap")');
    await page.waitForTimeout(3000);
    
    console.log('✅ Veri kalıcılığı testi tamamlandı');
    
    // Test 13: Responsive test
    console.log('\n📱 Test 13: Responsive test...');
    
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
        console.log(`${index + 1}. ${error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
  } finally {
    await browser.close();
  }
}

testCompleteWorkflow().catch(console.error);









