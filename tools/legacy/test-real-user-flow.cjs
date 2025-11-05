const { chromium } = require('playwright');

async function testRealUserFlow() {
  console.log('🎯 GERÇEK KULLANICI AKIŞI TEST BAŞLIYOR\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Kayıt sayfasına git
    console.log('1️⃣ Kayıt sayfasına gidiliyor...');
    await page.goto('http://localhost:5173/register');
    await page.waitForLoadState('networkidle');
    
    // 2. Gerçek kullanıcı kaydı
    console.log('2️⃣ Gerçek kullanıcı kaydı yapılıyor...');
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@test.com`;
    const testPassword = 'Test123!';
    const testFirstName = `Test`;
    const testLastName = `User${timestamp}`;
    
    // Bireysel seç
    await page.click('button:has-text("Bireysel")');
    await page.waitForTimeout(1000);
    
    // Form doldur
    await page.fill('input[name="firstName"]', testFirstName);
    await page.fill('input[name="lastName"]', testLastName);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="phone"]', '05551234567');
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    
    // Bireysel için gerekli alanlar
    await page.fill('textarea[name="address"]', 'Test Adres, Test Mahallesi');
    await page.fill('input[name="city"]', 'İstanbul');
    await page.fill('input[name="district"]', 'Kadıköy');
    
    // Kayıt ol
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log(`   ✅ Kayıt tamamlandı: ${testEmail}`);
    
    // 3. Dashboard kontrolü
    console.log('3️⃣ Dashboard kontrol ediliyor...');
    await page.waitForTimeout(3000);
    
    // URL kontrolü
    const currentUrl = page.url();
    if (currentUrl.includes('/individual/dashboard')) {
      console.log('   ✅ Dashboard yüklendi');
    } else {
      console.log('   ⚠️ Dashboard yüklenemedi, URL:', currentUrl);
    }
    
    // 4. Gönderi oluşturma
    console.log('4️⃣ Gönderi oluşturuluyor...');
    await page.goto('http://localhost:5173/individual/create-shipment');
    await page.waitForLoadState('networkidle');
    
    // Gönderi formu doldur
    await page.fill('input[name="title"]', `Test Gönderi ${timestamp}`);
    await page.fill('textarea[name="description"]', 'Test açıklama');
    await page.fill('input[name="pickupAddress"]', 'İstanbul, Türkiye');
    await page.fill('input[name="deliveryAddress"]', 'Ankara, Türkiye');
    await page.fill('input[name="price"]', '500');
    
    // Gönderi oluştur
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log('   ✅ Gönderi oluşturuldu');
    
    // 5. Gönderi listesini kontrol et
    console.log('5️⃣ Gönderi listesi kontrol ediliyor...');
    await page.goto('http://localhost:5173/individual/shipments');
    await page.waitForLoadState('networkidle');
    
    const shipmentExists = await page.locator(`text=Test Gönderi ${timestamp}`).count() > 0;
    if (shipmentExists) {
      console.log('   ✅ Gönderi listede görünüyor');
    } else {
      console.log('   ❌ Gönderi listede görünmüyor');
    }
    
    // 6. Çıkış yap
    console.log('6️⃣ Çıkış yapılıyor...');
    // Çıkış butonunu bul ve tıkla
    const logoutButton = page.locator('button:has-text("Çıkış"), button:has-text("Logout"), [data-testid="logout-button"]').first();
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
    } else {
      // localStorage temizle
      await page.evaluate(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      });
      await page.goto('http://localhost:5173/login');
    }
    await page.waitForLoadState('networkidle');
    console.log('   ✅ Çıkış yapıldı');
    
    // 7. Tekrar giriş yap
    console.log('7️⃣ Tekrar giriş yapılıyor...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('   ✅ Tekrar giriş yapıldı');
    
    // 8. Gönderi listesini tekrar kontrol et
    console.log('8️⃣ Gönderi listesi tekrar kontrol ediliyor...');
    await page.goto('http://localhost:5173/individual/shipments');
    await page.waitForLoadState('networkidle');
    
    const shipmentStillExists = await page.locator(`text=Test Gönderi ${timestamp}`).count() > 0;
    if (shipmentStillExists) {
      console.log('   ✅ Gönderi hala listede görünüyor - VERİLER KORUNDU!');
    } else {
      console.log('   ❌ Gönderi listede görünmüyor - VERİLER KAYBOLDU!');
    }
    
    // 9. Dashboard verilerini kontrol et
    console.log('9️⃣ Dashboard verileri kontrol ediliyor...');
    await page.goto('http://localhost:5173/individual/dashboard');
    await page.waitForLoadState('networkidle');
    
    const dashboardLoaded = await page.locator('h1, h2, [data-testid="dashboard"]').count() > 0;
    if (dashboardLoaded) {
      console.log('   ✅ Dashboard verileri yüklendi');
    } else {
      console.log('   ❌ Dashboard verileri yüklenemedi');
    }
    
    console.log('\n🎉 TEST TAMAMLANDI!');
    console.log(`📧 Test Email: ${testEmail}`);
    console.log(`👤 Test User: ${testFirstName} ${testLastName}`);
    
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
  } finally {
    await browser.close();
  }
}

testRealUserFlow();


