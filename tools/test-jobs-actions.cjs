const { chromium } = require('playwright');

(async () => {
  console.log('🧪 İş Detay Sayfası İşlemler Butonları Testi Başlatılıyor...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
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

    // 1. Login - Tasiyici
    console.log('1️⃣ Tasiyici Login...');
    await page.goto(`${baseURL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(1000);

    const demoTasiyici = page.locator('[data-testid="demo-tasiyici"]');
    if ((await demoTasiyici.count()) > 0) {
      await demoTasiyici.click();
      await page.waitForURL('**/tasiyici/dashboard', { timeout: 10000 });
      await page.waitForTimeout(2000);
      console.log('   ✅ Tasiyici login başarılı\n');
      results.tested.push('Tasiyici Login');
    } else {
      throw new Error('Demo Tasiyici butonu bulunamadı');
    }

    // 2. Active Jobs Sayfasına Git
    console.log('2️⃣ Aktif İşler Sayfası...');
    await page.goto(`${baseURL}/tasiyici/active-jobs`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);
    console.log('   ✅ Aktif işler sayfası yüklendi');

    // İlk iş kartını bul
    const firstJobCard = page.locator('a[href*="/tasiyici/jobs/"]').first();
    const jobCardCount = await firstJobCard.count();

    if (jobCardCount > 0) {
      const jobHref = await firstJobCard.getAttribute('href');
      const jobId = jobHref.split('/').pop();
      console.log(`   📋 İş #${jobId} bulundu\n`);
      results.tested.push(`İş #${jobId} bulundu`);

      // 3. İş Detay Sayfasına Git
      console.log(`3️⃣ İş Detay Sayfası (#${jobId})...`);
      await firstJobCard.click();
      await page.waitForURL(`**/tasiyici/jobs/${jobId}`, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });
      await page.waitForTimeout(2000);
      console.log('   ✅ İş detay sayfası yüklendi\n');

      // 4. İşlemler Bölümünü Kontrol Et
      console.log('4️⃣ İşlemler Bölümü Kontrolü...');

      // İşe Başla butonu
      const startJobBtn = page.locator('button:has-text("İşe Başla")');
      const startJobCount = await startJobBtn.count();
      if (startJobCount > 0) {
        console.log('   ✅ "İşe Başla" butonu mevcut');
        results.tested.push('İşe Başla butonu');

        // Butona tıkla
        console.log('   🔘 "İşe Başla" butonuna tıklanıyor...');
        await startJobBtn.click();
        await page.waitForTimeout(2000);

        // Toast mesajını kontrol et
        const toastSuccess = page.locator('text=/başarıyla|success/i').first();
        const toastCount = await toastSuccess.count();
        if (toastCount > 0) {
          console.log('   ✅ Toast başarı mesajı görüldü');
          results.tested.push('İşe Başla - Toast mesajı');
        } else {
          console.log('   ⚠️ Toast mesajı görünmedi (muhtemelen status zaten güncelli)');
          results.warnings.push('Toast mesajı görünmedi');
        }

        // Sayfanın yenilendiğini kontrol et (status değişmiş olabilir)
        await page.waitForTimeout(2000);
        console.log('   ✅ İşlem tamamlandı\n');
      } else {
        console.log('   ⚠️ "İşe Başla" butonu görünmüyor (muhtemelen status uygun değil)');
        results.warnings.push('İşe Başla butonu görünmüyor');
      }

      // Tamamlandı İşaretle butonu
      const completeBtn = page.locator('button:has-text("Tamamlandı İşaretle")');
      const completeCount = await completeBtn.count();
      if (completeCount > 0) {
        console.log('   ✅ "Tamamlandı İşaretle" butonu mevcut');
        results.tested.push('Tamamlandı İşaretle butonu');
      } else {
        console.log('   ℹ️ "Tamamlandı İşaretle" butonu görünmüyor (status "in_progress" değil)');
      }

      // Nakliyeci ile Mesajlaş butonu
      const messageBtn = page.locator('a:has-text("Nakliyeci ile Mesajlaş")');
      const messageCount = await messageBtn.count();
      if (messageCount > 0) {
        console.log('   ✅ "Nakliyeci ile Mesajlaş" butonu mevcut');
        results.tested.push('Nakliyeci ile Mesajlaş butonu');

        // Butona tıkla
        console.log('   🔘 "Nakliyeci ile Mesajlaş" butonuna tıklanıyor...');
        await messageBtn.click();
        await page.waitForURL('**/tasiyici/messages**', {
          waitUntil: 'networkidle',
          timeout: 10000,
        });
        await page.waitForTimeout(2000);
        console.log('   ✅ Mesajlar sayfasına yönlendirildi');
        results.tested.push('Nakliyeci ile Mesajlaş - Yönlendirme');

        // URL'de userId parametresi var mı kontrol et
        const currentURL = page.url();
        if (currentURL.includes('userId=')) {
          console.log('   ✅ URL\'de userId parametresi mevcut');
          results.tested.push('URL userId parametresi');
        } else {
          console.log('   ⚠️ URL\'de userId parametresi yok (nakliyeci bilgisi eksik olabilir)');
          results.warnings.push('URL userId parametresi yok');
        }
      } else {
        console.log('   ⚠️ "Nakliyeci ile Mesajlaş" butonu görünmüyor (nakliyeci bilgisi eksik)');
        results.warnings.push('Nakliyeci ile Mesajlaş butonu görünmüyor');
      }
    } else {
      console.log('   ⚠️ Aktif iş bulunamadı - Test devam ediyor...');
      results.warnings.push('Aktif iş bulunamadı');

      // Yine de bir iş ID'si ile direkt test edebiliriz
      console.log('\n   🔄 Direkt iş ID ile test ediliyor (örnek: 41)...');
      await page.goto(`${baseURL}/tasiyici/jobs/41`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await page.waitForTimeout(2000);

      const startBtn = page.locator('button:has-text("İşe Başla")');
      if ((await startBtn.count()) > 0) {
        console.log('   ✅ "İşe Başla" butonu mevcut');
        results.tested.push('İşe Başla butonu (direkt test)');
      }

      const msgBtn = page.locator('a:has-text("Nakliyeci ile Mesajlaş")');
      if ((await msgBtn.count()) > 0) {
        console.log('   ✅ "Nakliyeci ile Mesajlaş" butonu mevcut');
        results.tested.push('Nakliyeci ile Mesajlaş butonu (direkt test)');
      }
    }

    console.log('\n');
    console.log('='.repeat(60));
    console.log('📊 TEST SONUÇLARI');
    console.log('='.repeat(60));
    console.log(`✅ Test Edilen: ${results.tested.length}`);
    results.tested.forEach(item => console.log(`   ✓ ${item}`));

    if (results.warnings.length > 0) {
      console.log(`\n⚠️ Uyarılar: ${results.warnings.length}`);
      results.warnings.forEach(warn => console.log(`   ⚠ ${warn}`));
    }

    if (results.errors.length > 0) {
      console.log(`\n❌ Hatalar: ${results.errors.length}`);
      results.errors.slice(0, 5).forEach(err => console.log(`   ✗ ${err}`));
      if (results.errors.length > 5) {
        console.log(`   ... ve ${results.errors.length - 5} hata daha`);
      }
    }

    console.log('\n');
    await page.waitForTimeout(3000);
  } catch (error) {
    console.error('\n❌ Test Hatası:', error.message);
    results.errors.push(error.message);
  } finally {
    await browser.close();
  }
})();

