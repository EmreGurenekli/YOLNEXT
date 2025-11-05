const { chromium } = require('playwright');

(async () => {
  console.log('🌐 Tarayıcıda Canlı Test Başlatılıyor...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });

  const results = {
    tested: [],
    errors: [],
    warnings: [],
  };

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Console errors'ları yakala
    page.on('console', msg => {
      if (msg.type() === 'error') {
        results.errors.push(`Console Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      results.errors.push(`Page Error: ${error.message}`);
    });

    const baseURL = 'http://localhost:5173';

    // Test 1: Ana Sayfa
    console.log('1️⃣ Ana Sayfa Testi...');
    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    results.tested.push('Ana Sayfa');
    console.log('   ✅ Ana sayfa yüklendi\n');

    // Test 2: Login Sayfası
    console.log('2️⃣ Login Sayfası Testi...');
    await page.goto(`${baseURL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    // Demo butonlarını kontrol et
    const demoIndividual = page.locator('[data-testid="demo-individual"]');
    const demoCorporate = page.locator('[data-testid="demo-corporate"]');
    const demoNakliyeci = page.locator('[data-testid="demo-nakliyeci"]');
    const demoTasiyici = page.locator('[data-testid="demo-tasiyici"]');

    if ((await demoIndividual.count()) > 0)
      console.log('   ✅ Demo Individual butonu mevcut');
    if ((await demoCorporate.count()) > 0)
      console.log('   ✅ Demo Corporate butonu mevcut');
    if ((await demoNakliyeci.count()) > 0)
      console.log('   ✅ Demo Nakliyeci butonu mevcut');
    if ((await demoTasiyici.count()) > 0)
      console.log('   ✅ Demo Tasiyici butonu mevcut');

    results.tested.push('Login Sayfası');
    console.log('   ✅ Login sayfası yüklendi\n');

    // Test 3: Individual Panel
    console.log('3️⃣ Individual Panel Testi...');
    if ((await demoIndividual.count()) > 0) {
      await demoIndividual.click();
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      if (currentUrl.includes('/individual')) {
        console.log('   ✅ Individual dashboard yüklendi');
        results.tested.push('Individual Dashboard');

        // Dashboard sayfasını kontrol et
        await page.waitForTimeout(2000);
        const dashboardTitle = await page
          .locator('h1, h2')
          .first()
          .textContent()
          .catch(() => '');
        console.log(`   📄 Başlık: ${dashboardTitle || 'Bulunamadı'}`);

        // Create Shipment sayfasına git
        console.log('   📦 Gönderi Oluştur sayfasına gidiliyor...');
        await page.goto(`${baseURL}/individual/create-shipment`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        await page.waitForTimeout(2000);
        results.tested.push('Individual Create Shipment');
        console.log('   ✅ Create Shipment sayfası yüklendi');

        // Jobs/Offers sayfasına git
        console.log('   💼 Teklifler sayfasına gidiliyor...');
        await page.goto(`${baseURL}/individual/offers`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        await page.waitForTimeout(2000);
        results.tested.push('Individual Offers');
        console.log('   ✅ Offers sayfası yüklendi\n');
      }
    }

    // Test 4: Corporate Panel
    console.log('4️⃣ Corporate Panel Testi...');
    await page.goto(`${baseURL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(1000);

    if ((await demoCorporate.count()) > 0) {
      await demoCorporate.click();
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      if (currentUrl.includes('/corporate')) {
        console.log('   ✅ Corporate dashboard yüklendi');
        results.tested.push('Corporate Dashboard');
        await page.waitForTimeout(2000);
      }
    }

    // Test 5: Nakliyeci Panel
    console.log('5️⃣ Nakliyeci Panel Testi...');
    await page.goto(`${baseURL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(1000);

    if ((await demoNakliyeci.count()) > 0) {
      await demoNakliyeci.click();
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      if (currentUrl.includes('/nakliyeci')) {
        console.log('   ✅ Nakliyeci dashboard yüklendi');
        results.tested.push('Nakliyeci Dashboard');
        await page.waitForTimeout(2000);

        // Jobs sayfası
        console.log('   💼 İş İlanları sayfasına gidiliyor...');
        await page.goto(`${baseURL}/nakliyeci/jobs`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        await page.waitForTimeout(2000);
        results.tested.push('Nakliyeci Jobs');
        console.log('   ✅ Jobs sayfası yüklendi');

        // Drivers sayfası
        console.log('   👥 Taşıyıcılar sayfasına gidiliyor...');
        await page.goto(`${baseURL}/nakliyeci/drivers`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        await page.waitForTimeout(2000);
        results.tested.push('Nakliyeci Drivers');
        console.log('   ✅ Drivers sayfası yüklendi');

        // Route Planner
        console.log('   🗺️ Route Planner sayfasına gidiliyor...');
        await page.goto(`${baseURL}/nakliyeci/route-planner`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        await page.waitForTimeout(2000);
        results.tested.push('Nakliyeci Route Planner');
        console.log('   ✅ Route Planner sayfası yüklendi');

        // Shipments
        console.log('   📦 Gönderiler sayfasına gidiliyor...');
        await page.goto(`${baseURL}/nakliyeci/shipments`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        await page.waitForTimeout(2000);
        results.tested.push('Nakliyeci Shipments');
        console.log('   ✅ Shipments sayfası yüklendi\n');
      }
    }

    // Test 6: Tasiyici Panel
    console.log('6️⃣ Tasiyici Panel Testi...');
    await page.goto(`${baseURL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(1000);

    if ((await demoTasiyici.count()) > 0) {
      await demoTasiyici.click();
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      if (currentUrl.includes('/tasiyici')) {
        console.log('   ✅ Tasiyici dashboard yüklendi');
        results.tested.push('Tasiyici Dashboard');
        await page.waitForTimeout(2000);

        // Jobs sayfası
        console.log('   💼 İşler sayfasına gidiliyor...');
        await page.goto(`${baseURL}/tasiyici/jobs`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        await page.waitForTimeout(2000);
        results.tested.push('Tasiyici Jobs');
        console.log('   ✅ Jobs sayfası yüklendi\n');
      }
    }

    // Özet
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST ÖZETİ');
    console.log('='.repeat(60));
    console.log(`✅ Test Edilen Sayfalar: ${results.tested.length}`);
    results.tested.forEach((page, i) => {
      console.log(`   ${i + 1}. ${page}`);
    });

    if (results.errors.length > 0) {
      console.log(`\n❌ Hatalar: ${results.errors.length}`);
      results.errors.slice(0, 5).forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
      if (results.errors.length > 5) {
        console.log(`   ... ve ${results.errors.length - 5} hata daha`);
      }
    } else {
      console.log('\n✅ Hiç hata yok!');
    }

    console.log(
      '\n🎉 Test tamamlandı! Tarayıcıyı kapatmak için bir tuşa basın...'
    );
    await page.waitForTimeout(5000); // 5 saniye bekle
  } catch (error) {
    console.error('\n❌ Kritik Hata:', error.message);
    results.errors.push(error.message);
  } finally {
    await browser.close();
  }
})();
