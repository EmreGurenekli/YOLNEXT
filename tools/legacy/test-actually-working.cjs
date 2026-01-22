// BASİT VE ÇALIŞAN TEST - GERÇEK SORUNLARI TESPİT ET
const { chromium } = require('playwright');

const log = (msg) => console.log(msg);
const results = { passed: 0, failed: 0, issues: [] };

async function main() {
  log('\n🔍 GERÇEK DURUM KONTROLÜ\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 1. Backend Kontrolü
    log('1️⃣ Backend kontrol ediliyor...');
    try {
      const response = await page.goto('http://localhost:5000/api/health', { timeout: 5000, waitUntil: 'networkidle' });
      if (response?.ok()) {
        log('   ✅ Backend çalışıyor');
        results.passed++;
      } else {
        log(`   ❌ Backend yanıt vermiyor: ${response?.status()}`);
        results.failed++;
        results.issues.push('Backend çalışmıyor');
      }
    } catch (e) {
      log(`   ❌ Backend'e erişilemiyor: ${e.message}`);
      results.failed++;
      results.issues.push('Backend erişilemez');
      log('\n⚠️  BACKEND ÇALIŞMIYOR! Test devam edemez.');
      return;
    }
    
    // 2. Frontend Kontrolü
    log('\n2️⃣ Frontend kontrol ediliyor...');
    await page.goto('http://localhost:5173', { timeout: 10000, waitUntil: 'networkidle' });
    const title = await page.title();
    log(`   ✅ Frontend yüklendi: ${title}`);
    results.passed++;
    
    // 3. Login Sayfası
    log('\n3️⃣ Login sayfası kontrol ediliyor...');
    await page.goto('http://localhost:5173/login', { timeout: 10000, waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // React render için daha uzun bekle
    
    // Demo button var mı? - Farklı selector'lar dene
    let demoButtons = await page.locator('button[data-testid^="demo-"]').count();
    if (demoButtons === 0) {
      // Alternatif selector'lar
      demoButtons = await page.locator('button:has-text("Bireysel"), button:has-text("Kurumsal"), button:has-text("Nakliyeci")').count();
      if (demoButtons === 0) {
        const allButtons = await page.locator('button').count();
        log(`   ⚠️  Demo button bulunamadı. Toplam ${allButtons} button var.`);
        
        // Sayfa içeriğini kontrol et
        const pageText = await page.evaluate(() => document.body.textContent);
        if (pageText.includes('Demo')) {
          log('   ℹ️  Sayfada "Demo" metni var ama button selector çalışmıyor');
        }
      }
    }
    
    if (demoButtons > 0) {
      log(`   ✅ ${demoButtons} demo button bulundu`);
      results.passed++;
    } else {
      log(`   ❌ Demo button bulunamadı`);
      results.failed++;
    }
    
    // 4. Individual Login
    log('\n4️⃣ Individual login test ediliyor...');
    const selectors = [
      'button[data-testid="demo-individual"]',
      'button:has-text("Bireysel")',
      'button:has-text("Individual")',
    ];
    
    let clicked = false;
    for (const selector of selectors) {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        log(`   🔘 Button bulundu: ${selector}`);
        await btn.click();
        await page.waitForTimeout(7000); // Login işlemi için daha uzun bekle
        clicked = true;
        break;
      }
    }
    
    if (clicked) {
      const currentUrl = page.url();
      if (currentUrl.includes('/individual')) {
        log(`   ✅ Login başarılı: ${currentUrl}`);
        results.passed++;
      } else {
        log(`   ⚠️  Login sonrası bekleme: ${currentUrl}`);
        // Biraz daha bekle
        await page.waitForTimeout(3000);
        const finalUrl = page.url();
        if (finalUrl.includes('/individual')) {
          log(`   ✅ Login sonrası başarılı: ${finalUrl}`);
          results.passed++;
        } else {
          log(`   ❌ Login başarısız, şu an: ${finalUrl}`);
          results.failed++;
        }
      }
    } else {
      log('   ❌ Individual demo button bulunamadı');
      results.failed++;
    }
    
    // 5. Dashboard API Test
    log('\n5️⃣ Dashboard API test ediliyor...');
    
    // API listener'ı ÖNCE kur
    let apiCalled = false;
    let apiStatus = null;
    let apiUrl = null;
    const apiHandler = async (response) => {
      const url = response.url();
      if (url.includes('/api/dashboard/stats') || url.includes('/dashboard/stats') || url.includes('stats')) {
        apiCalled = true;
        apiStatus = response.status();
        apiUrl = url;
        log(`   📡 API çağrıldı: ${url} - Status: ${apiStatus}`);
      }
    };
    page.on('response', apiHandler);
    
    await page.goto('http://localhost:5173/individual/dashboard', { timeout: 15000, waitUntil: 'networkidle' });
    await page.waitForTimeout(8000); // API çağrısı için daha uzun bekle
    
    // Tüm API çağrılarını kontrol et
    const allResponses = [];
    page.on('response', (response) => {
      allResponses.push(response.url());
    });
    await page.waitForTimeout(2000);
    
    page.off('response', apiHandler);
    
    if (apiCalled) {
      log(`   ✅ Dashboard API çalışıyor: ${apiUrl} - Status: ${apiStatus}`);
      results.passed++;
    } else {
      log(`   ⚠️  Dashboard API çağrılmadı. Toplam ${allResponses.length} response var.`);
      const apiResponses = allResponses.filter(url => url.includes('/api/'));
      if (apiResponses.length > 0) {
        log(`   🔍 API çağrıları: ${apiResponses.slice(0, 5).join(', ')}`);
      }
      results.failed++;
      results.issues.push('Dashboard API çağrılmıyor');
    }
    
    // 6. Create Shipment Form Test
    log('\n6️⃣ Create Shipment form test ediliyor...');
    
    // Önce login olduğundan emin ol
    if (!page.url().includes('/individual')) {
      log('   ⚠️  Login olunmamış, tekrar login yapılıyor...');
      await page.goto('http://localhost:5173/login', { timeout: 10000, waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      const loginBtn = page.locator('button[data-testid="demo-individual"], button:has-text("Bireysel")').first();
      if (await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await loginBtn.click();
        await page.waitForTimeout(5000);
      }
    }
    
    await page.goto('http://localhost:5173/individual/create-shipment', { timeout: 15000, waitUntil: 'networkidle' });
    await page.waitForTimeout(7000); // React render için daha uzun bekle
    
    // Category select var mı?
    const categorySelect = page.locator('select[name="mainCategory"]');
    const selectExists = await categorySelect.count();
    
    if (selectExists > 0) {
      const isVisible = await categorySelect.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        log('   ✅ Category select bulundu ve görünür');
        results.passed++;
        
        // Seçimi test et
        await categorySelect.selectOption('house_move');
        await page.waitForTimeout(2000);
        const selectedValue = await categorySelect.inputValue();
        if (selectedValue === 'house_move') {
          log('   ✅ Category seçimi çalışıyor');
          results.passed++;
        } else {
          log(`   ❌ Category seçilemedi: ${selectedValue}`);
          results.failed++;
        }
      } else {
        log('   ⚠️  Category select DOM\'da var ama görünür değil');
        results.failed++;
        await page.screenshot({ path: 'form-not-visible.png', fullPage: true });
        log('   📸 Screenshot: form-not-visible.png');
      }
    } else {
      log('   ❌ Category select bulunamadı');
      results.failed++;
      results.issues.push('Create shipment form yüklenmiyor');
      await page.screenshot({ path: 'form-not-found.png', fullPage: true });
      log('   📸 Screenshot: form-not-found.png');
    }
    
  } catch (error) {
    log(`\n❌ TEST HATASI: ${error.message}`);
    results.failed++;
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
  
  // SONUÇ
  log('\n' + '='.repeat(50));
  log('📊 TEST SONUÇLARI');
  log('='.repeat(50));
  log(`✅ Başarılı: ${results.passed}`);
  log(`❌ Başarısız: ${results.failed}`);
  log(`📈 Başarı Oranı: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.issues.length > 0) {
    log('\n🔴 TESPİT EDİLEN SORUNLAR:');
    results.issues.forEach(issue => log(`   - ${issue}`));
  }
  
  if (results.failed === 0) {
    log('\n🎉 HER ŞEY ÇALIŞIYOR!');
  } else {
    log('\n⚠️  BAZI SORUNLAR VAR');
  }
}

main().catch(console.error);

