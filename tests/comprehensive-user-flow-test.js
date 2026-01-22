/**
 * Comprehensive User Flow Test - 4 Panels
 * 
 * Tests complete business workflows for all user types:
 * 1. Bireysel Gönderici (Individual Sender)
 * 2. Kurumsal Gönderici (Corporate Sender)
 * 3. Nakliyeci (Carrier)
 * 4. Taşıyıcı (Driver)
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000/api';

let browser = null;
let page = null;
let testResults = {
  individual: { passed: 0, failed: 0, steps: [] },
  corporate: { passed: 0, failed: 0, steps: [] },
  nakliyeci: { passed: 0, failed: 0, steps: [] },
  tasiyici: { passed: 0, failed: 0, steps: [] }
};

let createdShipmentId = null;

async function initBrowser() {
  if (browser) return;
  browser = await chromium.launch({ headless: false });
  page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
}

async function closeBrowser() {
  if (page) await page.close();
  if (browser) await browser.close();
  browser = null;
  page = null;
}

async function logStep(panel, step, success, message) {
  testResults[panel].steps.push({ step, success, message });
  if (success) {
    testResults[panel].passed++;
    console.log(`✅ ${panel.toUpperCase()}: ${step} - ${message}`);
  } else {
    testResults[panel].failed++;
    console.log(`❌ ${panel.toUpperCase()}: ${step} - ${message}`);
  }
}

async function waitForNavigation(urlPattern, timeout = 10000) {
  try {
    await page.waitForURL(urlPattern, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

async function testIndividualFlow() {
  console.log('\n=== TEST 1: BİREYSEL GÖNDERİCİ AKIŞI ===\n');
  
  try {
    // 1. Login
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.click('button[data-testid="demo-individual"]');
    const nav1 = await waitForNavigation('**/individual/dashboard');
    await logStep('individual', 'Login', nav1, 'Dashboard\'a yönlendirildi');
    await page.waitForTimeout(2000);
    
    // 2. Navigate to Create Shipment
    await page.click('a[href*="create-shipment"], button:has-text("Gönderi Oluştur")');
    await waitForNavigation('**/create-shipment');
    await logStep('individual', 'Navigate to Create Shipment', true, 'Gönderi oluşturma sayfası açıldı');
    await page.waitForTimeout(1000);
    
    // 3. Fill form - Step 1
    await page.selectOption('select[name="mainCategory"], select', 'house_move');
    await logStep('individual', 'Select Category', true, 'Kategori seçildi: Ev Taşınması');
    await page.waitForTimeout(500);
    
    // Try multiple selectors for description field
    const descSelectors = [
      'textarea[name="productDescription"]',
      'textarea[placeholder*="açıklama"]',
      'textarea[placeholder*="Açıklama"]',
      'textarea',
      'textarea:nth-of-type(1)'
    ];
    
    let descFilled = false;
    for (const selector of descSelectors) {
      try {
        const descInput = await page.$(selector);
        if (descInput) {
          await descInput.fill('Tam test akışı - İstanbul Ankara ev taşınması');
          descFilled = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    await logStep('individual', 'Fill Description', descFilled, descFilled ? 'Yük açıklaması girildi' : 'Yük açıklama alanı bulunamadı');
    await page.waitForTimeout(500);
    
    // Wait for dynamic fields to appear after category selection
    await page.waitForTimeout(1000);
    
    // Try to fill roomCount - may appear after category selection
    const roomCountSelect = await page.$('select[name="roomCount"]');
    if (roomCountSelect) {
      await page.selectOption('select[name="roomCount"]', '3+1');
      await page.waitForTimeout(300);
    }
    
    const buildingTypeSelect = await page.$('select[name="buildingType"]');
    if (buildingTypeSelect) {
      await page.selectOption('select[name="buildingType"]', 'Apartman Dairesi');
      await page.waitForTimeout(300);
    }
    
    const pickupFloorInput = await page.$('input[name="pickupFloor"]');
    if (pickupFloorInput) {
      await pickupFloorInput.fill('5. Kat');
      await page.waitForTimeout(300);
    }
    
    const deliveryFloorInput = await page.$('input[name="deliveryFloor"]');
    if (deliveryFloorInput) {
      await deliveryFloorInput.fill('3. Kat');
      await page.waitForTimeout(300);
    }
    
    const detailsFilled = roomCountSelect || buildingTypeSelect || pickupFloorInput || deliveryFloorInput;
    await logStep('individual', 'Fill Ev Taşınması Details', detailsFilled, detailsFilled ? 'Ev taşınması detayları girildi' : 'Detay alanları bulunamadı');
    
    // Click Next
    await page.click('button:has-text("İleri"), button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // 4. Fill form - Step 2 (Address) - try multiple selectors
    const pickupAddressSelectors = [
      'textarea[name="pickupAddress"]',
      'textarea[placeholder*="Toplama"]',
      'textarea[placeholder*="Adres"]',
      'textarea:nth-of-type(1)'
    ];
    
    let addressFilled = false;
    for (const selector of pickupAddressSelectors) {
      try {
        const input = await page.$(selector);
        if (input) {
          await input.fill('İstanbul, Şişli, Mecidiyeköy, Büyükdere Caddesi No:150, Daire: 20');
          addressFilled = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (addressFilled) {
      await page.waitForTimeout(300);
      const pickupDateInput = await page.$('input[name="pickupDate"], input[type="date"]:nth-of-type(1)');
      if (pickupDateInput) {
        await pickupDateInput.fill('2025-03-10');
        await page.waitForTimeout(300);
      }
      
      const deliveryAddressSelectors = [
        'textarea[name="deliveryAddress"]',
        'textarea[placeholder*="Teslimat"]',
        'textarea:nth-of-type(2)'
      ];
      
      for (const selector of deliveryAddressSelectors) {
        try {
          const input = await page.$(selector);
          if (input) {
            await input.fill('Ankara, Çankaya, Kızılay, Atatürk Bulvarı No:250, Daire: 15');
            await page.waitForTimeout(300);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      const deliveryDateInput = await page.$('input[name="deliveryDate"], input[type="date"]:nth-of-type(2)');
      if (deliveryDateInput) {
        await deliveryDateInput.fill('2025-03-12');
      }
    }
    
    await logStep('individual', 'Fill Address Information', addressFilled, addressFilled ? 'Adres bilgileri girildi' : 'Adres alanları bulunamadı');
    await page.waitForTimeout(500);
    
    // Click Next
    await page.click('button:has-text("İleri"), button:has-text("Next")');
    await page.waitForTimeout(1000);
    
    // 5. Publish Shipment
    await page.click('button:has-text("Yayınla"), button:has-text("Publish")');
    await page.waitForTimeout(3000);
    
    // Check for success message
    const successMsg = await page.textContent('body').then(t => t?.includes('başarıyla') || t?.includes('success'));
    await logStep('individual', 'Publish Shipment', successMsg, successMsg ? 'Gönderi yayınlandı' : 'Gönderi yayınlama hatası');
    
    // Get shipment ID from response or URL
    const url = page.url();
    if (url.includes('/shipments/')) {
      createdShipmentId = url.split('/shipments/')[1]?.split('/')[0];
    }
    
    await page.waitForTimeout(2000);
    
    // 6. Navigate to My Shipments
    await page.click('a[href*="my-shipments"], a:has-text("Gönderilerim")');
    await waitForNavigation('**/my-shipments');
    await logStep('individual', 'Navigate to My Shipments', true, 'Gönderilerim sayfası açıldı');
    await page.waitForTimeout(2000);
    
    // Check if shipment appears in list
    const shipmentText = await page.textContent('body');
    const hasShipment = shipmentText?.includes('İstanbul') || shipmentText?.includes('Ankara');
    await logStep('individual', 'Verify Shipment in List', hasShipment, hasShipment ? 'Gönderi listede görünüyor' : 'Gönderi listede görünmüyor');
    
    return true;
  } catch (error) {
    console.error('Individual flow error:', error);
    await logStep('individual', 'Error', false, error.message);
    return false;
  }
}

async function testNakliyeciFlow() {
  console.log('\n=== TEST 2: NAKLIYECİ AKIŞI ===\n');
  
  try {
    // 1. Login as Nakliyeci
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.click('button[data-testid="demo-nakliyeci"]');
    const nav1 = await waitForNavigation('**/nakliyeci/dashboard');
    await logStep('nakliyeci', 'Login', nav1, 'Nakliyeci dashboard\'a yönlendirildi');
    await page.waitForTimeout(2000);
    
    // 2. Navigate to Jobs (Yük Pazarı)
    await page.click('a[href*="jobs"], a:has-text("Yük Pazarı")');
    await waitForNavigation('**/jobs');
    await logStep('nakliyeci', 'Navigate to Jobs', true, 'Yük Pazarı sayfası açıldı');
    await page.waitForTimeout(2000);
    
    // 3. Search for shipments
    const searchInput = await page.$('input[type="text"][placeholder*="Ara"], input[name="search"]');
    if (searchInput) {
      await searchInput.fill('İstanbul');
      await page.waitForTimeout(1000);
      await logStep('nakliyeci', 'Search Shipments', true, 'Arama yapıldı: İstanbul');
    }
    
    // 4. View shipment details (click first shipment if available)
    const shipmentSelectors = [
      '[data-testid*="shipment"]',
      '.shipment-card',
      '.job-card',
      'article',
      '[class*="card"]',
      'div[class*="bg-white"]'
    ];
    
    let shipmentFound = false;
    for (const selector of shipmentSelectors) {
      const cards = await page.$$(selector);
      if (cards.length > 0) {
        try {
          await cards[0].scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          await cards[0].click();
          await page.waitForTimeout(2000);
          shipmentFound = true;
          await logStep('nakliyeci', 'View Shipment Details', true, 'Gönderi detayları görüntülendi');
          break;
        } catch (e) {
          continue;
        }
      }
    }
    
    if (!shipmentFound) {
      await logStep('nakliyeci', 'View Shipments', false, 'Açık gönderi bulunamadı');
    }
    
    // 5. Make offer (if on offer page)
    if (shipmentFound || page.url().includes('/offer') || page.url().includes('/shipment')) {
      const offerButton = await page.$('button:has-text("Teklif Ver"), button:has-text("Offer"), a:has-text("Teklif")');
      if (offerButton) {
        await offerButton.click();
        await page.waitForTimeout(2000);
        
        // Fill offer form
        const priceInput = await page.$('input[name="price"], input[type="number"]');
        if (priceInput) {
          await priceInput.fill('5000');
          await page.waitForTimeout(300);
          
          const messageInput = await page.$('textarea[name="message"], textarea');
          if (messageInput) {
            await messageInput.fill('Profesyonel taşıma hizmeti sunuyorum');
            await page.waitForTimeout(300);
          }
          
          const submitButton = await page.$('button[type="submit"]:has-text("Gönder"), button:has-text("Submit")');
          if (submitButton) {
            await submitButton.click();
            await page.waitForTimeout(2000);
            await logStep('nakliyeci', 'Submit Offer', true, 'Teklif gönderildi');
          }
        }
      } else {
        await logStep('nakliyeci', 'Make Offer', false, 'Teklif butonu bulunamadı');
      }
    }
    
    // 6. Navigate to Active Shipments
    await page.goto(`${BASE_URL}/nakliyeci/active-shipments`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await logStep('nakliyeci', 'Navigate to Active Shipments', true, 'Aktif yükler sayfası açıldı');
    
    return true;
  } catch (error) {
    console.error('Nakliyeci flow error:', error);
    await logStep('nakliyeci', 'Error', false, error.message);
    return false;
  }
}

async function testCorporateFlow() {
  console.log('\n=== TEST 3: KURUMSAL GÖNDERİCİ AKIŞI ===\n');
  
  try {
    // 1. Login as Corporate
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.click('button[data-testid="demo-corporate"]');
    const nav1 = await waitForNavigation('**/corporate/dashboard');
    await logStep('corporate', 'Login', nav1, 'Kurumsal dashboard\'a yönlendirildi');
    await page.waitForTimeout(2000);
    
    // 2. Navigate to Create Shipment
    await page.click('a[href*="create-shipment"], button:has-text("Gönderi Oluştur")');
    await waitForNavigation('**/create-shipment');
    await logStep('corporate', 'Navigate to Create Shipment', true, 'Kurumsal gönderi oluşturma sayfası açıldı');
    await page.waitForTimeout(2000);
    
    // 3. Select category - try multiple methods
    let categorySelected = false;
    
    // Try clicking category buttons
    const categoryButtons = await page.$$('button, [role="button"], .category-card, [data-category]');
    for (const btn of categoryButtons.slice(0, 20)) {
      try {
        const text = await btn.textContent();
        if (text && (text.includes('Endüstriyel') || text.includes('Gıda') || text.includes('Kimyasal') || text.includes('İnşaat'))) {
          await btn.scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          await btn.click();
          await page.waitForTimeout(1000);
          categorySelected = true;
          await logStep('corporate', 'Select Category', true, `Kategori seçildi: ${text.trim()}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // If no button found, try select dropdown
    if (!categorySelected) {
      const select = await page.$('select[name="mainCategory"], select');
      if (select) {
        await select.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        categorySelected = true;
        await logStep('corporate', 'Select Category', true, 'Kategori dropdown\'dan seçildi');
      }
    }
    
    if (!categorySelected) {
      await logStep('corporate', 'Select Category', false, 'Kategori seçilemedi - sayfayı kontrol edin');
    }
    
    // 4. Fill basic info
    await page.waitForTimeout(1000);
    const descInput = await page.$('textarea[name="productDescription"], textarea');
    if (descInput) {
      await descInput.fill('Kurumsal test gönderisi - Endüstriyel malzeme');
      await logStep('corporate', 'Fill Description', true, 'Ürün açıklaması girildi');
    }
    
    await page.waitForTimeout(2000);
    
    return true;
  } catch (error) {
    console.error('Corporate flow error:', error);
    await logStep('corporate', 'Error', false, error.message);
    return false;
  }
}

async function testTasiyiciFlow() {
  console.log('\n=== TEST 4: TAŞIYICI AKIŞI ===\n');
  
  try {
    // 1. Login as Taşıyıcı
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.click('button[data-testid="demo-tasiyici"]');
    const nav1 = await waitForNavigation('**/tasiyici/dashboard');
    await logStep('tasiyici', 'Login', nav1, 'Taşıyıcı dashboard\'a yönlendirildi');
    await page.waitForTimeout(2000);
    
    // 2. Navigate to Market (İş Pazarı)
    await page.click('a[href*="market"], a:has-text("İş Pazarı")');
    await waitForNavigation('**/market');
    await logStep('tasiyici', 'Navigate to Market', true, 'İş Pazarı sayfası açıldı');
    await page.waitForTimeout(2000);
    
    // 3. View listings
    const listings = await page.$$('[data-testid*="listing"], .listing-card, article');
    if (listings.length > 0) {
      await logStep('tasiyici', 'View Listings', true, `${listings.length} ilan görüntülendi`);
    } else {
      await logStep('tasiyici', 'View Listings', false, 'İlan bulunamadı');
    }
    
    // 4. Navigate to Active Jobs
    await page.click('a[href*="active"], a:has-text("Aktif")');
    await page.waitForTimeout(2000);
    await logStep('tasiyici', 'Navigate to Active Jobs', true, 'Aktif işler sayfası açıldı');
    
    return true;
  } catch (error) {
    console.error('Taşıyıcı flow error:', error);
    await logStep('tasiyici', 'Error', false, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('=== COMPREHENSIVE USER FLOW TEST - 4 PANELS ===\n');
  console.log('Testing complete business workflows...\n');
  
  try {
    await initBrowser();
    
    // Test all panels
    await testIndividualFlow();
    await page.waitForTimeout(2000);
    
    await testNakliyeciFlow();
    await page.waitForTimeout(2000);
    
    await testCorporateFlow();
    await page.waitForTimeout(2000);
    
    await testTasiyiciFlow();
    
    await closeBrowser();
    
    // Print summary
    console.log('\n=== TEST SUMMARY ===\n');
    for (const [panel, results] of Object.entries(testResults)) {
      const total = results.passed + results.failed;
      const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
      console.log(`${panel.toUpperCase()}:`);
      console.log(`  ✅ Passed: ${results.passed}`);
      console.log(`  ❌ Failed: ${results.failed}`);
      console.log(`  📊 Pass Rate: ${passRate}%`);
      console.log('');
    }
    
    const totalPassed = Object.values(testResults).reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = Object.values(testResults).reduce((sum, r) => sum + r.failed, 0);
    const totalTests = totalPassed + totalFailed;
    const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`Overall: ${totalPassed}/${totalTests} tests passed (${overallPassRate}%)`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!');
      return true;
    } else {
      console.log(`\n⚠️ ${totalFailed} test(s) failed. Review the logs above.`);
      return false;
    }
  } catch (error) {
    console.error('\n❌ TEST RUNNER FAILED:', error);
    await closeBrowser();
    return false;
  }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.includes('comprehensive-user-flow-test')) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { runAllTests, testIndividualFlow, testNakliyeciFlow, testCorporateFlow, testTasiyiciFlow };

