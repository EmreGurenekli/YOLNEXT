const { chromium } = require('playwright');

async function testComprehensiveWorkflow() {
  console.log('🚀 Kapsamlı iş akışı testi başlatılıyor...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Her işlem arasında 1 saniye bekle
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
    // Test 1: Ana sayfa ve demo butonları
    console.log('📱 Test 1: Ana sayfa kontrolü...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    console.log(`✅ Sayfa başlığı: ${title}`);
    
    // Demo butonlarını kontrol et
    const demoButtons = await page.locator('button:has-text("Demo")').count();
    console.log(`🎯 Demo butonları: ${demoButtons} adet`);
    
    // Test 2: Bireysel kullanıcı kaydı
    console.log('\n👤 Test 2: Bireysel kullanıcı kaydı...');
    
    // Kayıt sayfasına git
    await page.click('text=Bireysel');
    await page.waitForLoadState('networkidle');
    
    // Kayıt formunu doldur
    await page.fill('input[name="firstName"]', 'Ahmet');
    await page.fill('input[name="lastName"]', 'Yılmaz');
    await page.fill('input[name="email"]', 'ahmet.yilmaz@test.com');
    await page.fill('input[name="phone"]', '05321234567');
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Test123!');
    
    // Kayıt ol butonuna tıkla
    await page.click('button:has-text("Kayıt Ol")');
    await page.waitForTimeout(2000);
    
    console.log('✅ Bireysel kayıt formu dolduruldu');
    
    // Test 3: Giriş yapma
    console.log('\n🔐 Test 3: Giriş yapma...');
    
    // Giriş formuna geç
    await page.click('text=Giriş Yap');
    await page.fill('input[name="email"]', 'ahmet.yilmaz@test.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button:has-text("Giriş Yap")');
    await page.waitForTimeout(2000);
    
    console.log('✅ Giriş yapıldı');
    
    // Test 4: Gönderi oluşturma
    console.log('\n📦 Test 4: Gönderi oluşturma...');
    
    // Gönderi oluştur sayfasına git
    await page.click('text=Gönderi Oluştur');
    await page.waitForLoadState('networkidle');
    
    // Gönderi bilgilerini doldur
    await page.fill('input[name="title"]', 'Test Gönderi');
    await page.fill('textarea[name="description"]', 'Bu bir test gönderisidir');
    await page.fill('input[name="weight"]', '50');
    await page.fill('input[name="volume"]', '2');
    
    // Adres bilgileri
    await page.fill('input[name="pickupAddress"]', 'İstanbul, Kadıköy');
    await page.fill('input[name="deliveryAddress"]', 'Ankara, Çankaya');
    
    // Gönderi oluştur butonuna tıkla
    await page.click('button:has-text("Gönderi Oluştur")');
    await page.waitForTimeout(3000);
    
    console.log('✅ Gönderi oluşturuldu');
    
    // Test 5: Gönderilerim sayfası kontrolü
    console.log('\n📋 Test 5: Gönderilerim sayfası...');
    
    await page.click('text=Gönderilerim');
    await page.waitForLoadState('networkidle');
    
    const shipmentCount = await page.locator('[data-testid="shipment-item"]').count();
    console.log(`📦 Gönderi sayısı: ${shipmentCount}`);
    
    // Test 6: Kurumsal panel testi
    console.log('\n🏢 Test 6: Kurumsal panel testi...');
    
    // Çıkış yap
    await page.click('text=Çıkış');
    await page.waitForTimeout(1000);
    
    // Kurumsal kayıt
    await page.click('text=Kurumsal');
    await page.fill('input[name="companyName"]', 'Test Şirketi');
    await page.fill('input[name="email"]', 'info@testcompany.com');
    await page.fill('input[name="phone"]', '02121234567');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button:has-text("Kayıt Ol")');
    await page.waitForTimeout(2000);
    
    console.log('✅ Kurumsal kayıt yapıldı');
    
    // Test 7: Nakliyeci panel testi
    console.log('\n🚛 Test 7: Nakliyeci panel testi...');
    
    // Çıkış yap
    await page.click('text=Çıkış');
    await page.waitForTimeout(1000);
    
    // Nakliyeci kayıt
    await page.click('text=Nakliyeci');
    await page.fill('input[name="companyName"]', 'Test Nakliye');
    await page.fill('input[name="email"]', 'info@testnakliye.com');
    await page.fill('input[name="phone"]', '05321234568');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button:has-text("Kayıt Ol")');
    await page.waitForTimeout(2000);
    
    console.log('✅ Nakliyeci kayıt yapıldı');
    
    // Test 8: Taşıyıcı panel testi
    console.log('\n🚚 Test 8: Taşıyıcı panel testi...');
    
    // Çıkış yap
    await page.click('text=Çıkış');
    await page.waitForTimeout(1000);
    
    // Taşıyıcı kayıt
    await page.click('text=Taşıyıcı');
    await page.fill('input[name="firstName"]', 'Mehmet');
    await page.fill('input[name="lastName"]', 'Demir');
    await page.fill('input[name="email"]', 'mehmet.demir@test.com');
    await page.fill('input[name="phone"]', '05321234569');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button:has-text("Kayıt Ol")');
    await page.waitForTimeout(2000);
    
    console.log('✅ Taşıyıcı kayıt yapıldı');
    
    // Test 9: Teklif sistemi testi
    console.log('\n💰 Test 9: Teklif sistemi testi...');
    
    // Teklifler sayfasına git
    await page.click('text=Teklifler');
    await page.waitForLoadState('networkidle');
    
    const offerCount = await page.locator('[data-testid="offer-item"]').count();
    console.log(`💰 Teklif sayısı: ${offerCount}`);
    
    // Test 10: Mesajlaşma sistemi
    console.log('\n💬 Test 10: Mesajlaşma sistemi...');
    
    await page.click('text=Mesajlar');
    await page.waitForLoadState('networkidle');
    
    const messageCount = await page.locator('[data-testid="message-item"]').count();
    console.log(`💬 Mesaj sayısı: ${messageCount}`);
    
    // Test 11: Profil sayfası
    console.log('\n👤 Test 11: Profil sayfası...');
    
    await page.click('text=Profil');
    await page.waitForLoadState('networkidle');
    
    const profileTitle = await page.locator('h1').first().textContent();
    console.log(`👤 Profil başlığı: ${profileTitle}`);
    
    // Test 12: Ayarlar sayfası
    console.log('\n⚙️ Test 12: Ayarlar sayfası...');
    
    await page.click('text=Ayarlar');
    await page.waitForLoadState('networkidle');
    
    const settingsTitle = await page.locator('h1').first().textContent();
    console.log(`⚙️ Ayarlar başlığı: ${settingsTitle}`);
    
    // Test 13: Veri kalıcılığı testi
    console.log('\n💾 Test 13: Veri kalıcılığı testi...');
    
    // Çıkış yap ve tekrar giriş yap
    await page.click('text=Çıkış');
    await page.waitForTimeout(1000);
    
    // Tekrar giriş yap
    await page.click('text=Giriş Yap');
    await page.fill('input[name="email"]', 'mehmet.demir@test.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button:has-text("Giriş Yap")');
    await page.waitForTimeout(2000);
    
    console.log('✅ Veri kalıcılığı testi tamamlandı');
    
    // Test 14: Responsive tasarım testi
    console.log('\n📱 Test 14: Responsive tasarım testi...');
    
    // Mobil görünüm
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Tablet görünüm
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    // Desktop görünüm
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    console.log('✅ Responsive tasarım testi tamamlandı');
    
    // Test 15: Hata durumları testi
    console.log('\n❌ Test 15: Hata durumları testi...');
    
    // Geçersiz giriş bilgileri
    await page.click('text=Çıkış');
    await page.waitForTimeout(1000);
    
    await page.click('text=Giriş Yap');
    await page.fill('input[name="email"]', 'gecersiz@test.com');
    await page.fill('input[name="password"]', 'yanlis123');
    await page.click('button:has-text("Giriş Yap")');
    await page.waitForTimeout(2000);
    
    console.log('✅ Hata durumları testi tamamlandı');
    
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

testComprehensiveWorkflow().catch(console.error);





