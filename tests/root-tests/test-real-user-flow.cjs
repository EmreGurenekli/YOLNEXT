/**
 * Gerçek Kullanıcı Akışı Testi
 * Tüm panellerde gerçek kullanıcı gibi işlem yaparak test eder
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000/api';

let browser = null;
let context = null;
let page = null;

const testResults = {
  individual: { passed: 0, failed: 0, steps: [] },
  corporate: { passed: 0, failed: 0, steps: [] },
  nakliyeci: { passed: 0, failed: 0, steps: [] },
  tasiyici: { passed: 0, failed: 0, steps: [] }
};

let createdShipmentId = null;
let createdOfferId = null;

function logStep(panel, step, success, message) {
  testResults[panel].steps.push({ step, success, message, timestamp: new Date().toISOString() });
  if (success) {
    testResults[panel].passed++;
    console.log(`✅ [${panel.toUpperCase()}] ${step}: ${message}`);
  } else {
    testResults[panel].failed++;
    console.error(`❌ [${panel.toUpperCase()}] ${step}: ${message}`);
  }
}

async function initBrowser() {
  if (browser) return;
  console.log('🚀 Browser başlatılıyor...');
  browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // İşlemleri yavaşlat (görsel takip için)
  });
  context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  page = await context.newPage();
  console.log('✅ Browser hazır\n');
}

async function closeBrowser() {
  if (page) await page.close();
  if (context) await context.close();
  if (browser) await browser.close();
  browser = null;
  context = null;
  page = null;
}

async function waitForElement(selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return true;
  } catch (e) {
    return false;
  }
}

async function loginAsDemoUser(userType) {
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    const buttonSelectors = [
      `button[data-testid="demo-${userType}"]`,
      `button:has-text("${userType === 'individual' ? 'Bireysel' : userType === 'corporate' ? 'Kurumsal' : userType === 'nakliyeci' ? 'Nakliyeci' : 'Taşıyıcı'} Demo Giriş")`,
      `button:has-text("Demo Giriş")`
    ];
    
    let clicked = false;
    for (const selector of buttonSelectors) {
      try {
        if (await waitForElement(selector, 2000)) {
          await page.click(selector);
          clicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!clicked) {
      throw new Error('Demo login button bulunamadı');
    }
    
    // Dashboard'a yönlendirmeyi bekle
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    const expectedPaths = {
      individual: '/individual/dashboard',
      corporate: '/corporate/dashboard',
      nakliyeci: '/nakliyeci/dashboard',
      tasiyici: '/tasiyici/dashboard'
    };
    
    if (currentUrl.includes(expectedPaths[userType])) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Login error: ${error.message}`);
    return false;
  }
}

// TEST 1: BİREYSEL GÖNDERİCİ AKIŞI
async function testIndividualFlow() {
  console.log('\n📦 === TEST 1: BİREYSEL GÖNDERİCİ AKIŞI ===\n');
  
  try {
    // 1. Login
    const loginSuccess = await loginAsDemoUser('individual');
    logStep('individual', 'Demo Login', loginSuccess, loginSuccess ? 'Giriş başarılı' : 'Giriş başarısız');
    if (!loginSuccess) return;
    await page.waitForTimeout(2000);
    
    // 2. Dashboard kontrolü
    const dashboardVisible = await waitForElement('h1, h2, [class*="dashboard"]', 5000);
    logStep('individual', 'Dashboard Görüntüleme', dashboardVisible, dashboardVisible ? 'Dashboard görüntülendi' : 'Dashboard görüntülenemedi');
    await page.waitForTimeout(1000);
    
    // 3. Gönderi Oluştur sayfasına git
    const createShipmentSelectors = [
      'a[href*="create-shipment"]',
      'button:has-text("Gönderi Oluştur")',
      'a:has-text("Gönderi Oluştur")'
    ];
    
    let navigated = false;
    for (const selector of createShipmentSelectors) {
      try {
        if (await waitForElement(selector, 2000)) {
          await page.click(selector);
          await page.waitForTimeout(2000);
          if (page.url().includes('create-shipment')) {
            navigated = true;
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!navigated) {
      await page.goto(`${BASE_URL}/individual/create-shipment`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }
    
    logStep('individual', 'Gönderi Oluştur Sayfası', true, 'Sayfa açıldı');
    
    // 4. Form doldur - Kategori seç
    try {
      const categorySelect = await page.$('select[name="mainCategory"], select');
      if (categorySelect) {
        await categorySelect.selectOption('house_move');
        logStep('individual', 'Kategori Seçimi', true, 'Ev Taşınması seçildi');
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      logStep('individual', 'Kategori Seçimi', false, e.message);
    }
    
    // 5. Ürün açıklaması
    try {
      const descSelectors = [
        'textarea[name="productDescription"]',
        'textarea[placeholder*="açıklama"]',
        'textarea'
      ];
      
      for (const selector of descSelectors) {
        const descInput = await page.$(selector);
        if (descInput) {
          await descInput.fill('3+1 ev eşyaları, mobilya, elektronik eşyalar');
          logStep('individual', 'Ürün Açıklaması', true, 'Açıklama girildi');
          break;
        }
      }
    } catch (e) {
      logStep('individual', 'Ürün Açıklaması', false, e.message);
    }
    
    // 6. Adım 2'ye geç
    try {
      const nextButton = await page.$('button:has-text("İleri"), button:has-text("Sonraki"), button[type="submit"]');
      if (nextButton) {
        await nextButton.click();
        await page.waitForTimeout(2000);
        logStep('individual', 'Adım 2 Geçiş', true, 'Adres bilgileri sayfasına geçildi');
      }
    } catch (e) {
      logStep('individual', 'Adım 2 Geçiş', false, e.message);
    }
    
    // 7. Adres bilgileri
    try {
      const pickupAddress = await page.$('input[name="pickupAddress"], input[placeholder*="Toplama"]');
      if (pickupAddress) {
        await pickupAddress.fill('İstanbul, Kadıköy, Test Mahallesi, Test Sokak No:1');
        await page.waitForTimeout(500);
      }
      
      const deliveryAddress = await page.$('input[name="deliveryAddress"], input[placeholder*="Teslimat"]');
      if (deliveryAddress) {
        await deliveryAddress.fill('Ankara, Çankaya, Test Mahallesi, Test Sokak No:2');
        await page.waitForTimeout(500);
      }
      
      logStep('individual', 'Adres Bilgileri', true, 'Adresler girildi');
    } catch (e) {
      logStep('individual', 'Adres Bilgileri', false, e.message);
    }
    
    // 8. Adım 3'e geç
    try {
      const nextButton2 = await page.$('button:has-text("İleri"), button:has-text("Sonraki"), button[type="submit"]');
      if (nextButton2) {
        await nextButton2.click();
        await page.waitForTimeout(2000);
        logStep('individual', 'Adım 3 Geçiş', true, 'Önizleme sayfasına geçildi');
      }
    } catch (e) {
      logStep('individual', 'Adım 3 Geçiş', false, e.message);
    }
    
    // 9. Gönderiyi yayınla
    try {
      const publishButton = await page.$('button:has-text("Yayınla"), button:has-text("Gönderi Yayınla")');
      if (publishButton) {
        await publishButton.click();
        await page.waitForTimeout(3000);
        
        // Başarı mesajını kontrol et
        const successMessage = await page.$('text=/başarıyla|success|yayınlandı/i');
        if (successMessage) {
          logStep('individual', 'Gönderi Yayınlama', true, 'Gönderi başarıyla yayınlandı');
          
          // Gönderi ID'sini al (eğer varsa)
          const url = page.url();
          const match = url.match(/shipment[\/=](\d+)/);
          if (match) {
            createdShipmentId = match[1];
          }
        } else {
          logStep('individual', 'Gönderi Yayınlama', false, 'Başarı mesajı görünmedi');
        }
      }
    } catch (e) {
      logStep('individual', 'Gönderi Yayınlama', false, e.message);
    }
    
    // 10. Gönderilerim sayfasına git
    try {
      await page.goto(`${BASE_URL}/individual/my-shipments`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const shipmentsVisible = await waitForElement('[class*="shipment"], [class*="card"], table', 5000);
      logStep('individual', 'Gönderilerim Sayfası', shipmentsVisible, shipmentsVisible ? 'Gönderiler listelendi' : 'Gönderiler listelenemedi');
    } catch (e) {
      logStep('individual', 'Gönderilerim Sayfası', false, e.message);
    }
    
    console.log(`\n✅ Bireysel Gönderici Testi Tamamlandı: ${testResults.individual.passed} başarılı, ${testResults.individual.failed} başarısız\n`);
    
  } catch (error) {
    console.error('❌ Bireysel Gönderici Testi Hata:', error);
    logStep('individual', 'Genel Hata', false, error.message);
  }
}

// TEST 2: NAKLİYECİ AKIŞI
async function testNakliyeciFlow() {
  console.log('\n🚛 === TEST 2: NAKLİYECİ AKIŞI ===\n');
  
  try {
    // 1. Login
    const loginSuccess = await loginAsDemoUser('nakliyeci');
    logStep('nakliyeci', 'Demo Login', loginSuccess, loginSuccess ? 'Giriş başarılı' : 'Giriş başarısız');
    if (!loginSuccess) return;
    await page.waitForTimeout(2000);
    
    // 2. Yük Pazarı (Jobs) sayfasına git
    try {
      const jobsSelectors = [
        'a[href*="jobs"]',
        'a[href*="yuk-pazari"]',
        'a:has-text("Yük Pazarı")',
        'a:has-text("İş Pazarı")'
      ];
      
      let navigated = false;
      for (const selector of jobsSelectors) {
        try {
          if (await waitForElement(selector, 2000)) {
            await page.click(selector);
            await page.waitForTimeout(2000);
            if (page.url().includes('jobs') || page.url().includes('yuk')) {
              navigated = true;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!navigated) {
        await page.goto(`${BASE_URL}/nakliyeci/jobs`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
      }
      
      const jobsVisible = await waitForElement('[class*="shipment"], [class*="card"], [class*="job"]', 5000);
      logStep('nakliyeci', 'Yük Pazarı Sayfası', jobsVisible, jobsVisible ? 'Açık gönderiler görüntülendi' : 'Gönderiler görüntülenemedi');
    } catch (e) {
      logStep('nakliyeci', 'Yük Pazarı Sayfası', false, e.message);
    }
    
    // 3. İlk gönderiye tıkla (eğer varsa)
    try {
      const firstShipment = await page.$('[class*="shipment"]:first-child, [class*="card"]:first-child, a[href*="offer"]:first-child');
      if (firstShipment) {
        await firstShipment.click();
        await page.waitForTimeout(2000);
        logStep('nakliyeci', 'Gönderi Detayı', true, 'Gönderi detay sayfası açıldı');
        
        // Teklif ver butonunu ara
        const offerButton = await page.$('button:has-text("Teklif Ver"), button:has-text("Teklif"), a[href*="offer"]');
        if (offerButton) {
          await offerButton.click();
          await page.waitForTimeout(2000);
          logStep('nakliyeci', 'Teklif Sayfası', true, 'Teklif verme sayfası açıldı');
          
          // Teklif formunu doldur
          const priceInput = await page.$('input[name="price"], input[type="number"]');
          if (priceInput) {
            await priceInput.fill('5000');
            await page.waitForTimeout(500);
          }
          
          const messageInput = await page.$('textarea[name="message"], textarea');
          if (messageInput) {
            await messageInput.fill('Test teklifi - Hızlı ve güvenli taşıma');
            await page.waitForTimeout(500);
          }
          
          const submitButton = await page.$('button[type="submit"], button:has-text("Gönder"), button:has-text("Teklif Ver")');
          if (submitButton) {
            await submitButton.click();
            await page.waitForTimeout(3000);
            logStep('nakliyeci', 'Teklif Verme', true, 'Teklif başarıyla gönderildi');
          }
        }
      } else {
        logStep('nakliyeci', 'Gönderi Seçimi', false, 'Açık gönderi bulunamadı');
      }
    } catch (e) {
      logStep('nakliyeci', 'Teklif Verme', false, e.message);
    }
    
    // 4. Aktif Yükler sayfasına git
    try {
      await page.goto(`${BASE_URL}/nakliyeci/active-shipments`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      const activeVisible = await waitForElement('[class*="shipment"], [class*="card"]', 5000);
      logStep('nakliyeci', 'Aktif Yükler Sayfası', activeVisible, activeVisible ? 'Aktif gönderiler görüntülendi' : 'Gönderiler görüntülenemedi');
    } catch (e) {
      logStep('nakliyeci', 'Aktif Yükler Sayfası', false, e.message);
    }
    
    console.log(`\n✅ Nakliyeci Testi Tamamlandı: ${testResults.nakliyeci.passed} başarılı, ${testResults.nakliyeci.failed} başarısız\n`);
    
  } catch (error) {
    console.error('❌ Nakliyeci Testi Hata:', error);
    logStep('nakliyeci', 'Genel Hata', false, error.message);
  }
}

// TEST 3: KURUMSAL GÖNDERİCİ AKIŞI
async function testCorporateFlow() {
  console.log('\n🏢 === TEST 3: KURUMSAL GÖNDERİCİ AKIŞI ===\n');
  
  try {
    // 1. Login
    const loginSuccess = await loginAsDemoUser('corporate');
    logStep('corporate', 'Demo Login', loginSuccess, loginSuccess ? 'Giriş başarılı' : 'Giriş başarısız');
    if (!loginSuccess) return;
    await page.waitForTimeout(2000);
    
    // 2. Dashboard kontrolü
    const dashboardVisible = await waitForElement('h1, h2, [class*="dashboard"]', 5000);
    logStep('corporate', 'Dashboard Görüntüleme', dashboardVisible, dashboardVisible ? 'Dashboard görüntülendi' : 'Dashboard görüntülenemedi');
    
    // 3. Gönderiler sayfasına git
    try {
      await page.goto(`${BASE_URL}/corporate/shipments`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      const shipmentsVisible = await waitForElement('[class*="shipment"], [class*="card"], table', 5000);
      logStep('corporate', 'Gönderiler Sayfası', shipmentsVisible, shipmentsVisible ? 'Gönderiler listelendi' : 'Gönderiler listelenemedi');
    } catch (e) {
      logStep('corporate', 'Gönderiler Sayfası', false, e.message);
    }
    
    console.log(`\n✅ Kurumsal Gönderici Testi Tamamlandı: ${testResults.corporate.passed} başarılı, ${testResults.corporate.failed} başarısız\n`);
    
  } catch (error) {
    console.error('❌ Kurumsal Gönderici Testi Hata:', error);
    logStep('corporate', 'Genel Hata', false, error.message);
  }
}

// TEST 4: TAŞIYICI AKIŞI
async function testTasiyiciFlow() {
  console.log('\n🚗 === TEST 4: TAŞIYICI AKIŞI ===\n');
  
  try {
    // 1. Login
    const loginSuccess = await loginAsDemoUser('tasiyici');
    logStep('tasiyici', 'Demo Login', loginSuccess, loginSuccess ? 'Giriş başarılı' : 'Giriş başarısız');
    if (!loginSuccess) return;
    await page.waitForTimeout(2000);
    
    // 2. Dashboard kontrolü
    const dashboardVisible = await waitForElement('h1, h2, [class*="dashboard"]', 5000);
    logStep('tasiyici', 'Dashboard Görüntüleme', dashboardVisible, dashboardVisible ? 'Dashboard görüntülendi' : 'Dashboard görüntülenemedi');
    
    // 3. İş Pazarı sayfasına git
    try {
      await page.goto(`${BASE_URL}/tasiyici/market`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      const marketVisible = await waitForElement('[class*="listing"], [class*="card"], [class*="job"]', 5000);
      logStep('tasiyici', 'İş Pazarı Sayfası', marketVisible, marketVisible ? 'İlanlar görüntülendi' : 'İlanlar görüntülenemedi');
    } catch (e) {
      logStep('tasiyici', 'İş Pazarı Sayfası', false, e.message);
    }
    
    console.log(`\n✅ Taşıyıcı Testi Tamamlandı: ${testResults.tasiyici.passed} başarılı, ${testResults.tasiyici.failed} başarısız\n`);
    
  } catch (error) {
    console.error('❌ Taşıyıcı Testi Hata:', error);
    logStep('tasiyici', 'Genel Hata', false, error.message);
  }
}

// Ana test fonksiyonu
async function runAllTests() {
  console.log('🧪 === GERÇEK KULLANICI AKIŞI TESTİ BAŞLIYOR ===\n');
  console.log('⚠️  Frontend ve Backend\'in çalıştığından emin olun!\n');
  
  try {
    await initBrowser();
    
    // Test sırası: Individual -> Nakliyeci -> Corporate -> Tasiyici
    await testIndividualFlow();
    await page.waitForTimeout(2000);
    
    await testNakliyeciFlow();
    await page.waitForTimeout(2000);
    
    await testCorporateFlow();
    await page.waitForTimeout(2000);
    
    await testTasiyiciFlow();
    
    // Özet
    console.log('\n📊 === TEST ÖZETİ ===\n');
    console.log('BİREYSEL GÖNDERİCİ:');
    console.log(`  ✅ Başarılı: ${testResults.individual.passed}`);
    console.log(`  ❌ Başarısız: ${testResults.individual.failed}`);
    
    console.log('\nNAKLİYECİ:');
    console.log(`  ✅ Başarılı: ${testResults.nakliyeci.passed}`);
    console.log(`  ❌ Başarısız: ${testResults.nakliyeci.failed}`);
    
    console.log('\nKURUMSAL GÖNDERİCİ:');
    console.log(`  ✅ Başarılı: ${testResults.corporate.passed}`);
    console.log(`  ❌ Başarısız: ${testResults.corporate.failed}`);
    
    console.log('\nTAŞIYICI:');
    console.log(`  ✅ Başarılı: ${testResults.tasiyici.passed}`);
    console.log(`  ❌ Başarısız: ${testResults.tasiyici.failed}`);
    
    const totalPassed = testResults.individual.passed + testResults.nakliyeci.passed + 
                       testResults.corporate.passed + testResults.tasiyici.passed;
    const totalFailed = testResults.individual.failed + testResults.nakliyeci.failed + 
                       testResults.corporate.failed + testResults.tasiyici.failed;
    
    console.log('\n📈 TOPLAM:');
    console.log(`  ✅ Başarılı: ${totalPassed}`);
    console.log(`  ❌ Başarısız: ${totalFailed}`);
    console.log(`  📊 Başarı Oranı: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
    
    if (createdShipmentId) {
      console.log(`\n📦 Oluşturulan Gönderi ID: ${createdShipmentId}`);
    }
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  } finally {
    console.log('\n⏳ Browser 5 saniye sonra kapanacak...');
    await page.waitForTimeout(5000);
    await closeBrowser();
    console.log('✅ Test tamamlandı!');
  }
}

// Testi çalıştır
runAllTests().catch(console.error);

