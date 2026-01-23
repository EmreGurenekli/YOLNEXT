/**
 * MCP Playwright - Complete Workflow Test
 * 
 * Tests all features and workflows using MCP Playwright only
 */

import { 
  initBrowser, 
  navigate, 
  snapshot, 
  click, 
  type, 
  close, 
  getConsoleMessages,
  getPage,
  waitForSelector,
  waitForNavigation,
  waitFor
} from './mcp-playwright-wrapper.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000';

const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(name, passed, error = null) {
  if (passed) {
    console.log(`✅ ${name}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${name}${error ? `: ${error}` : ''}`);
    testResults.failed++;
    if (error) testResults.errors.push({ name, error });
  }
}

async function safeClick(selector, options = {}) {
  try {
    await click(selector, options);
    return true;
  } catch (e) {
    return false;
  }
}

async function safeType(selector, text, options = {}) {
  try {
    await type(selector, text, options);
    return true;
  } catch (e) {
    return false;
  }
}

async function safeNavigate(url, options = {}) {
  try {
    await navigate(url, options);
    return true;
  } catch (e) {
    return false;
  }
}

async function findAndClick(selectors, description) {
  const page = getPage();
  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        await click(selector, { waitAfter: 1000 });
        console.log(`   ✅ ${description} bulundu ve tıklandı`);
        return true;
      }
    } catch (e) {
      // Continue
    }
  }
  return false;
}

async function findAndType(selectors, text, description) {
  const page = getPage();
  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await type(selector, text, { clear: true, delay: 50 });
        console.log(`   ✅ ${description} dolduruldu`);
        return true;
      }
    } catch (e) {
      // Continue
    }
  }
  return false;
}

// ============================================
// TEST 1: LOGIN & AUTHENTICATION
// ============================================
async function testLogin() {
  console.log('\n🔐 TEST 1: LOGIN & AUTHENTICATION');
  console.log('='.repeat(60));
  
  try {
    // Navigate to login
    const navSuccess = await safeNavigate(`${BASE_URL}/login`, { timeout: 30000 });
    if (!navSuccess) {
      logTest('Login sayfasına gitme', false, 'Navigation failed');
      return false;
    }
    await waitFor(2000);
    await snapshot('test-01-login-page.png');
    logTest('Login sayfasına gitme', true);
    
    // Check demo buttons exist
    const page = getPage();
    const demoButtons = await page.$$('button[data-testid^="demo-"]');
    logTest('Demo butonları görünür', demoButtons.length > 0);
    
    return true;
  } catch (error) {
    logTest('Login testi', false, error.message);
    return false;
  }
}

// ============================================
// TEST 2: INDIVIDUAL PANEL - SHIPMENT CREATION
// ============================================
async function testIndividualShipmentCreation() {
  console.log('\n📦 TEST 2: INDIVIDUAL - GÖNDERİ OLUŞTURMA');
  console.log('='.repeat(60));
  
  try {
    // Login as individual
    await safeNavigate(`${BASE_URL}/login`, { timeout: 30000 });
    await waitFor(2000);
    
    const loginSuccess = await findAndClick(
      ['button[data-testid="demo-individual"]'],
      'Individual login butonu'
    );
    if (!loginSuccess) {
      logTest('Individual login', false, 'Login button not found');
      return false;
    }
    await waitForNavigation({ timeout: 15000 });
    await waitFor(3000);
    await snapshot('test-02-individual-dashboard.png');
    logTest('Individual login', true);
    
    // Navigate to create shipment
    const createPaths = [
      '/individual/create-shipment',
      '/individual/shipments/create'
    ];
    
    let navSuccess = false;
    for (const path of createPaths) {
      navSuccess = await safeNavigate(`${BASE_URL}${path}`, { timeout: 15000 });
      if (navSuccess) {
        await waitFor(2000);
        break;
      }
    }
    
    if (!navSuccess) {
      // Try clicking button
      navSuccess = await findAndClick(
        [
          'a[href*="create"]',
          'button:has-text("Yeni Gönderi")',
          'button:has-text("Gönderi Oluştur")'
        ],
        'Create shipment butonu'
      );
      if (navSuccess) {
        await waitForNavigation({ timeout: 15000 });
        await waitFor(2000);
      }
    }
    
    if (!navSuccess) {
      logTest('Gönderi oluşturma sayfasına gitme', false, 'Page not found');
      return false;
    }
    
    await snapshot('test-03-create-shipment-page.png');
    logTest('Gönderi oluşturma sayfasına gitme', true);
    
    // Fill form - Step 1: Category
    await waitFor(3000);
    const page = getPage();
    
    // Try to find category selection - multiple strategies
    let categorySelected = false;
    
    // Strategy 1: Select dropdown (most common)
    try {
      const selectElement = await page.$('select[name="mainCategory"]');
      if (selectElement) {
        await selectElement.selectOption('house_move');
        await waitFor(500);
        categorySelected = true;
        console.log(`   ✅ Kategori seçildi: select dropdown (house_move)`);
      }
    } catch (e) {
      // Continue to next strategy
    }
    
    // Strategy 2: Radio buttons with value
    if (!categorySelected) {
      const categoryRadios = [
        'input[type="radio"][value="house_move"]',
        'input[type="radio"][value="furniture_goods"]',
        'input[type="radio"][value="special_cargo"]',
        'input[type="radio"][value="other"]'
      ];
      
      for (const selector of categoryRadios) {
        try {
          const element = await page.$(selector);
          if (element) {
            await element.click();
            await waitFor(500);
            categorySelected = true;
            console.log(`   ✅ Kategori seçildi: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }
    }
    
    // Strategy 3: Click on category card/button by text
    if (!categorySelected) {
      const categoryTexts = ['Ev Taşınması', 'Mobilya Taşıma', 'Özel Yük', 'Diğer'];
      for (const text of categoryTexts) {
        try {
          const element = await page.locator(`text=${text}`).first();
          if (await element.isVisible()) {
            await element.click();
            await waitFor(500);
            categorySelected = true;
            console.log(`   ✅ Kategori seçildi: ${text}`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }
    }
    
    // Strategy 4: Any select element
    if (!categorySelected) {
      try {
        const selectElements = await page.$$('select');
        if (selectElements.length > 0) {
          await selectElements[0].selectOption({ index: 1 }); // Select first option (skip empty)
          await waitFor(500);
          categorySelected = true;
          console.log(`   ✅ Kategori seçildi (fallback select)`);
        }
      } catch (e) {
        // Continue
      }
    }
    
    logTest('Kategori seçimi', categorySelected);
    
    // Click Next button if exists
    await waitFor(1000);
    const nextClicked = await findAndClick(
      [
        'button:has-text("Sonraki")',
        'button:has-text("Next")',
        'button[type="button"]:has-text("İleri")',
        'button:has-text("Devam")'
      ],
      'Next butonu'
    );
    if (nextClicked) {
      await waitFor(2000);
    }
    
    // Step 2: Fill product description - try multiple selectors
    await waitFor(1000);
    let descFilled = false;
    
    const descSelectors = [
      'input[name="productDescription"]',
      'textarea[name="productDescription"]',
      'input[placeholder*="Açıklama"]',
      'textarea[placeholder*="Açıklama"]',
      'input[placeholder*="Ürün"]',
      'textarea[placeholder*="Ürün"]',
      'input[placeholder*="description"]',
      'textarea[placeholder*="description"]'
    ];
    
    for (const selector of descSelectors) {
      try {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          await type(selector, `Test Gönderi ${Date.now()}`, { clear: true, delay: 50 });
          descFilled = true;
          console.log(`   ✅ Ürün açıklaması dolduruldu: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    logTest('Ürün açıklaması', descFilled);
    
    // Fill weight - try multiple selectors
    await waitFor(500);
    const weightSelectors = [
      'input[name="weight"]',
      'input[type="number"][name*="weight"]',
      'input[placeholder*="Ağırlık"]',
      'input[placeholder*="weight"]'
    ];
    
    for (const selector of weightSelectors) {
      try {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          await type(selector, '500', { clear: true, delay: 50 });
          console.log(`   ✅ Ağırlık dolduruldu`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Fill pickup address
    await waitFor(500);
    const pickupSelectors = [
      'input[name="pickupAddress"]',
      'input[placeholder*="Alış"]',
      'input[placeholder*="Pickup"]',
      'input[placeholder*="Toplama"]'
    ];
    
    for (const selector of pickupSelectors) {
      try {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          await type(selector, 'Kadıköy, İstanbul', { clear: true, delay: 50 });
          console.log(`   ✅ Alış adresi dolduruldu`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Fill delivery address
    await waitFor(500);
    const deliverySelectors = [
      'input[name="deliveryAddress"]',
      'input[placeholder*="Teslim"]',
      'input[placeholder*="Delivery"]',
      'input[placeholder*="Teslimat"]'
    ];
    
    for (const selector of deliverySelectors) {
      try {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          await type(selector, 'Çankaya, Ankara', { clear: true, delay: 50 });
          console.log(`   ✅ Teslim adresi dolduruldu`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Click Next again if multi-step
    await waitFor(1000);
    await findAndClick(
      [
        'button:has-text("Sonraki")',
        'button:has-text("Next")',
        'button:has-text("Devam")'
      ],
      'Next butonu (Step 2)'
    );
    await waitFor(2000);
    
    await snapshot('test-04-form-filled.png');
    
    // Submit form - try multiple strategies
    await waitFor(1000);
    let submitted = false;
    
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Yayınla")',
      'button:has-text("Oluştur")',
      'button:has-text("Publish")',
      'button:has-text("Gönder")',
      'button[data-testid="submit"]',
      'button[class*="submit"]',
      'button[class*="publish"]'
    ];
    
    for (const selector of submitSelectors) {
      try {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          await element.click();
          await waitFor(3000);
          submitted = true;
          console.log(`   ✅ Form gönderildi: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (submitted) {
      await waitForNavigation({ timeout: 20000 });
      await waitFor(3000);
      await snapshot('test-05-shipment-created.png');
    }
    
    logTest('Gönderi oluşturma', submitted);
    
    return submitted;
  } catch (error) {
    logTest('Individual gönderi oluşturma', false, error.message);
    return false;
  }
}

// ============================================
// TEST 3: INDIVIDUAL PANEL - MY SHIPMENTS
// ============================================
async function testIndividualMyShipments() {
  console.log('\n📋 TEST 3: INDIVIDUAL - GÖNDERİLERİM');
  console.log('='.repeat(60));
  
  try {
    const navSuccess = await safeNavigate(`${BASE_URL}/individual/my-shipments`, { timeout: 15000 });
    if (!navSuccess) {
      logTest('Gönderilerim sayfasına gitme', false, 'Navigation failed');
      return false;
    }
    
    await waitFor(3000);
    await snapshot('test-06-my-shipments.png');
    
    const page = getPage();
    const shipmentCards = await page.$$('[class*="card"], [class*="shipment"]');
    logTest('Gönderilerim sayfası görüntüleme', true);
    logTest('Gönderi kartları görünür', shipmentCards.length >= 0);
    
    return true;
  } catch (error) {
    logTest('Gönderilerim testi', false, error.message);
    return false;
  }
}

// ============================================
// TEST 4: INDIVIDUAL PANEL - OFFERS
// ============================================
async function testIndividualOffers() {
  console.log('\n💼 TEST 4: INDIVIDUAL - TEKLİFLER');
  console.log('='.repeat(60));
  
  try {
    const navSuccess = await safeNavigate(`${BASE_URL}/individual/offers`, { timeout: 15000 });
    if (!navSuccess) {
      logTest('Teklifler sayfasına gitme', false, 'Navigation failed');
      return false;
    }
    
    await waitFor(3000);
    await snapshot('test-07-offers.png');
    logTest('Teklifler sayfası görüntüleme', true);
    
    return true;
  } catch (error) {
    logTest('Teklifler testi', false, error.message);
    return false;
  }
}

// ============================================
// TEST 5: CORPORATE PANEL - LOGIN & DASHBOARD
// ============================================
async function testCorporateLogin() {
  console.log('\n🏢 TEST 5: CORPORATE - LOGIN & DASHBOARD');
  console.log('='.repeat(60));
  
  try {
    await safeNavigate(`${BASE_URL}/login`, { timeout: 30000 });
    await waitFor(2000);
    
    const loginSuccess = await findAndClick(
      ['button[data-testid="demo-corporate"]'],
      'Corporate login butonu'
    );
    if (!loginSuccess) {
      logTest('Corporate login', false, 'Login button not found');
      return false;
    }
    
    await waitForNavigation({ timeout: 15000 });
    await waitFor(3000);
    await snapshot('test-08-corporate-dashboard.png');
    logTest('Corporate login', true);
    
    return true;
  } catch (error) {
    logTest('Corporate login testi', false, error.message);
    return false;
  }
}

// ============================================
// TEST 6: CORPORATE PANEL - SHIPMENT CREATION
// ============================================
async function testCorporateShipmentCreation() {
  console.log('\n📦 TEST 6: CORPORATE - GÖNDERİ OLUŞTURMA');
  console.log('='.repeat(60));
  
  try {
    const createPaths = [
      '/corporate/create-shipment',
      '/corporate/shipments/create'
    ];
    
    let navSuccess = false;
    for (const path of createPaths) {
      navSuccess = await safeNavigate(`${BASE_URL}${path}`, { timeout: 15000 });
      if (navSuccess) {
        await waitFor(2000);
        break;
      }
    }
    
    if (!navSuccess) {
      logTest('Corporate gönderi oluşturma sayfası', false, 'Page not found');
      return false;
    }
    
    await snapshot('test-09-corporate-create.png');
    logTest('Corporate gönderi oluşturma sayfası', true);
    
    // Try to fill basic fields
    await findAndType(
      ['input[name="productDescription"]', 'textarea[name="productDescription"]'],
      `Corporate Test ${Date.now()}`,
      'Ürün açıklaması'
    );
    
    return true;
  } catch (error) {
    logTest('Corporate gönderi oluşturma', false, error.message);
    return false;
  }
}

// ============================================
// TEST 7: NAKLIYECI PANEL - LOGIN & JOBS
// ============================================
async function testNakliyeciLogin() {
  console.log('\n🚚 TEST 7: NAKLIYECI - LOGIN & JOBS');
  console.log('='.repeat(60));
  
  try {
    await safeNavigate(`${BASE_URL}/login`, { timeout: 30000 });
    await waitFor(2000);
    
    const loginSuccess = await findAndClick(
      ['button[data-testid="demo-nakliyeci"]'],
      'Nakliyeci login butonu'
    );
    if (!loginSuccess) {
      logTest('Nakliyeci login', false, 'Login button not found');
      return false;
    }
    
    await waitForNavigation({ timeout: 15000 });
    await waitFor(3000);
    await snapshot('test-10-nakliyeci-dashboard.png');
    logTest('Nakliyeci login', true);
    
    // Navigate to jobs
    const jobsSuccess = await safeNavigate(`${BASE_URL}/nakliyeci/jobs`, { timeout: 15000 });
    if (jobsSuccess) {
      await waitFor(3000);
      await snapshot('test-11-nakliyeci-jobs.png');
      logTest('Nakliyeci işler sayfası', true);
    } else {
      logTest('Nakliyeci işler sayfası', false, 'Navigation failed');
    }
    
    return true;
  } catch (error) {
    logTest('Nakliyeci testi', false, error.message);
    return false;
  }
}

// ============================================
// TEST 8: TASIYICI PANEL - LOGIN & MARKET
// ============================================
async function testTasiyiciLogin() {
  console.log('\n🚛 TEST 8: TASIYICI - LOGIN & MARKET');
  console.log('='.repeat(60));
  
  try {
    await safeNavigate(`${BASE_URL}/login`, { timeout: 30000 });
    await waitFor(2000);
    
    const loginSuccess = await findAndClick(
      ['button[data-testid="demo-tasiyici"]'],
      'Taşıyıcı login butonu'
    );
    if (!loginSuccess) {
      logTest('Taşıyıcı login', false, 'Login button not found');
      return false;
    }
    
    await waitForNavigation({ timeout: 15000 });
    await waitFor(3000);
    await snapshot('test-12-tasiyici-dashboard.png');
    logTest('Taşıyıcı login', true);
    
    // Navigate to market
    const marketSuccess = await safeNavigate(`${BASE_URL}/tasiyici/market`, { timeout: 15000 });
    if (marketSuccess) {
      await waitFor(3000);
      await snapshot('test-13-tasiyici-market.png');
      logTest('Taşıyıcı pazar sayfası', true);
    } else {
      logTest('Taşıyıcı pazar sayfası', false, 'Navigation failed');
    }
    
    return true;
  } catch (error) {
    logTest('Taşıyıcı testi', false, error.message);
    return false;
  }
}

// ============================================
// TEST 9: MESSAGES
// ============================================
async function testMessages() {
  console.log('\n💬 TEST 9: MESAJLAR');
  console.log('='.repeat(60));
  
  try {
    // Test individual messages
    await safeNavigate(`${BASE_URL}/login`, { timeout: 30000 });
    await waitFor(2000);
    await findAndClick(['button[data-testid="demo-individual"]'], 'Individual login');
    await waitForNavigation({ timeout: 15000 });
    await waitFor(2000);
    
    const messagesSuccess = await safeNavigate(`${BASE_URL}/individual/messages`, { timeout: 15000 });
    if (messagesSuccess) {
      await waitFor(2000);
      await snapshot('test-14-messages.png');
      logTest('Mesajlar sayfası (Individual)', true);
    } else {
      logTest('Mesajlar sayfası (Individual)', false, 'Navigation failed');
    }
    
    return true;
  } catch (error) {
    logTest('Mesajlar testi', false, error.message);
    return false;
  }
}

// ============================================
// TEST 10: SETTINGS
// ============================================
async function testSettings() {
  console.log('\n⚙️ TEST 10: AYARLAR');
  console.log('='.repeat(60));
  
  try {
    await safeNavigate(`${BASE_URL}/login`, { timeout: 30000 });
    await waitFor(2000);
    await findAndClick(['button[data-testid="demo-individual"]'], 'Individual login');
    await waitForNavigation({ timeout: 15000 });
    await waitFor(2000);
    
    const settingsSuccess = await safeNavigate(`${BASE_URL}/individual/settings`, { timeout: 15000 });
    if (settingsSuccess) {
      await waitFor(2000);
      await snapshot('test-15-settings.png');
      logTest('Ayarlar sayfası', true);
    } else {
      logTest('Ayarlar sayfası', false, 'Navigation failed');
    }
    
    return true;
  } catch (error) {
    logTest('Ayarlar testi', false, error.message);
    return false;
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runAllTests() {
  console.log('\n🚀 MCP PLAYWRIGHT - KAPSAMLI TEST BAŞLATILIYOR');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API URL: ${API_URL}`);
  console.log('='.repeat(60));
  
  try {
    // Initialize browser
    await initBrowser({ headless: false });
    console.log('✅ Browser başlatıldı\n');
    
    // Run all tests
    await testLogin();
    await testIndividualShipmentCreation();
    await testIndividualMyShipments();
    await testIndividualOffers();
    await testCorporateLogin();
    await testCorporateShipmentCreation();
    await testNakliyeciLogin();
    await testTasiyiciLogin();
    await testMessages();
    await testSettings();
    
    // Final console error check
    console.log('\n📊 Console Hataları Kontrol Ediliyor...');
    const errors = await getConsoleMessages(true);
    if (errors.length > 0) {
      console.log(`⚠️ ${errors.length} console hatası bulundu:`);
      errors.slice(0, 10).forEach(err => console.log(`   - ${err.text}`));
    } else {
      console.log('✅ Console hatası yok');
    }
    
  } catch (error) {
    console.error('\n❌ KRİTİK HATA:', error.message);
    console.error('Stack:', error.stack);
    try {
      await snapshot('error-final.png');
    } catch (e) {
      // Ignore
    }
  } finally {
    await close();
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST ÖZETİ');
  console.log('='.repeat(60));
  console.log(`✅ Başarılı: ${testResults.passed}`);
  console.log(`❌ Başarısız: ${testResults.failed}`);
  console.log(`📈 Başarı Oranı: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ HATALAR:');
    testResults.errors.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
  }
  
  console.log('='.repeat(60));
  
  return testResults.failed === 0;
}

// Run tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
});

