const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log('🚀 Taşıyıcı Pazarı Canlı Test Başlatılıyor...\n');

    // 1. Individual - Gönderi Oluştur Sayfası Kontrol
    console.log('1️⃣ Individual - Gönderi Oluştur Sayfası');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="demo-individual"]');
    await page.waitForURL('**/individual/dashboard', {
      waitUntil: 'networkidle',
    });
    await page.goto('http://localhost:5173/individual/create-shipment');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log(
      '   ✅ Create Shipment sayfası yüklendi (form testi manuel yapılabilir)\n'
    );

    // 2. Nakliyeci - İş İlanları ve Teklif
    console.log('2️⃣ Nakliyeci - İş İlanları ve Teklif Verme');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="demo-nakliyeci"]');
    await page.waitForURL('**/nakliyeci/dashboard', {
      waitUntil: 'networkidle',
    });
    await page.goto('http://localhost:5173/nakliyeci/jobs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('   ✅ Jobs sayfası yüklendi\n');

    // 3. Nakliyeci - Gönderiler ve Taşıyıcılara Aç
    console.log('3️⃣ Nakliyeci - Gönderiler ve Taşıyıcılara Aç');
    await page.goto('http://localhost:5173/nakliyeci/shipments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const openToCarriersBtn = page
      .locator(
        'button:has-text("Taşıyıcılara Aç"), button:has-text("taşıyıcılara")'
      )
      .first();
    if ((await openToCarriersBtn.count()) > 0) {
      await openToCarriersBtn.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ "Taşıyıcılara Aç" butonuna tıklandı\n');
    } else {
      console.log(
        '   ⚠️ "Taşıyıcılara Aç" butonu bulunamadı (belki accepted gönderi yok)\n'
      );
    }

    // 4. Nakliyeci - İlanlarım
    console.log('4️⃣ Nakliyeci - İlanlarım Sayfası');
    await page.goto('http://localhost:5173/nakliyeci/listings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('   ✅ Listings sayfası yüklendi\n');

    // 5. Taşıyıcı - Pazar
    console.log('5️⃣ Taşıyıcı - Pazar Sayfası');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="demo-tasiyici"]');
    await page.waitForURL('**/tasiyici/dashboard', {
      waitUntil: 'networkidle',
    });
    await page.goto('http://localhost:5173/tasiyici/market');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('   ✅ Market sayfası yüklendi\n');

    // 6. Taşıyıcı - Aktif İşler
    console.log('6️⃣ Taşıyıcı - Aktif İşler');
    await page.goto('http://localhost:5173/tasiyici/active-jobs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('   ✅ Active Jobs sayfası yüklendi\n');

    // 7. Taşıyıcı - Tamamlanan İşler
    console.log('7️⃣ Taşıyıcı - Tamamlanan İşler');
    await page.goto('http://localhost:5173/tasiyici/completed-jobs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('   ✅ Completed Jobs sayfası yüklendi\n');

    // 8. Taşıyıcı - Tekliflerim
    console.log('8️⃣ Taşıyıcı - Tekliflerim');
    await page.goto('http://localhost:5173/tasiyici/my-offers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('   ✅ My Offers sayfası yüklendi\n');

    // 9. Corporate - Offers
    console.log('9️⃣ Corporate - Teklifler');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="demo-corporate"]');
    await page.waitForURL('**/corporate/dashboard', {
      waitUntil: 'networkidle',
    });
    await page.goto('http://localhost:5173/corporate/offers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('   ✅ Corporate Offers sayfası yüklendi\n');

    // 10. Corporate - Shipments
    console.log('🔟 Corporate - Gönderiler');
    await page.goto('http://localhost:5173/corporate/shipments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('   ✅ Corporate Shipments sayfası yüklendi\n');

    console.log(
      '\n============================================================'
    );
    console.log('📊 TEST ÖZETİ');
    console.log('============================================================');
    console.log('✅ Test Edilen Sayfalar: 10');
    console.log('   1. Individual Create Shipment');
    console.log('   2. Nakliyeci Jobs');
    console.log('   3. Nakliyeci Shipments (Taşıyıcılara Aç)');
    console.log('   4. Nakliyeci Listings');
    console.log('   5. Taşıyıcı Market');
    console.log('   6. Taşıyıcı Active Jobs');
    console.log('   7. Taşıyıcı Completed Jobs');
    console.log('   8. Taşıyıcı My Offers');
    console.log('   9. Corporate Offers');
    console.log('   10. Corporate Shipments');

    if (consoleErrors.length > 0) {
      console.log(`\n❌ Console Hataları: ${consoleErrors.length}`);
      consoleErrors.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      if (consoleErrors.length > 10) {
        console.log(`   ... ve ${consoleErrors.length - 10} hata daha`);
      }
    } else {
      console.log('\n✅ Hiç console hatası bulunamadı.');
    }

    console.log(
      '\n🎉 Test tamamlandı! Tarayıcıyı incelemek için açık bırakılıyor...'
    );
    console.log('📝 Not: Tarayıcıyı kapatmak için bir tuşa basın...');
    await page.pause();
    await browser.close();
  } catch (error) {
    console.error('❌ Test sırasında hata oluştu:', error);
    await browser.close();
    process.exit(1);
  }
})();
