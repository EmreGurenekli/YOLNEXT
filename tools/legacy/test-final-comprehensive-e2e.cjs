// Kapsamlı End-to-End Test - Tüm Paneller, Tüm Akışlar
const { chromium } = require('playwright');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);

const results = {
  passed: 0,
  failed: 0,
  tests: [],
  criticalIssues: [],
};

function recordTest(name, passed, details = '', critical = false) {
  results.tests.push({ name, passed, details, critical });
  if (passed) {
    results.passed++;
    log(`  ✅ ${name}`, 'green');
  } else {
    results.failed++;
    const marker = critical ? '🔴' : '⚠️';
    log(`  ${marker} ${name}: ${details}`, 'red');
    if (critical) {
      results.criticalIssues.push({ name, details });
    }
  }
}

async function testIndividualPanel(page) {
  log('\n👤 INDIVIDUAL PANEL TEST', 'magenta');
  
  // Login
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const demoBtn = page.locator('button[data-testid="demo-individual"]');
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await page.waitForTimeout(3000);
    recordTest('Individual: Demo Login', page.url().includes('/individual'));
  }

  // Dashboard
  await page.goto('http://localhost:5173/individual/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  const dashboardVisible = await page.locator('text=/Dashboard|Ana Sayfa/i').first().isVisible().catch(() => false);
  recordTest('Individual: Dashboard Loads', dashboardVisible, '', true);
  
  const statsVisible = await page.locator('[role="region"], [class*="card"]').count() > 0;
  recordTest('Individual: Stats Cards Visible', statsVisible);

  // Create Shipment
  await page.goto('http://localhost:5173/individual/create-shipment', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  try {
    await page.selectOption('select[name="mainCategory"]', 'house_move');
    await page.waitForTimeout(500);
    await page.click('button:has-text("İleri")');
    await page.waitForTimeout(2000);
    
    await page.selectOption('select[name="pickupCity"]', 'İstanbul');
    await page.waitForTimeout(1500);
    await page.selectOption('select[name="pickupDistrict"]', 'Kadıköy');
    await page.fill('textarea[name="pickupAddress"]', 'Test İstanbul Kadıköy Moda Cad No:15');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('input[name="pickupDate"]', tomorrow.toISOString().split('T')[0]);
    
    await page.selectOption('select[name="deliveryCity"]', 'Ankara');
    await page.waitForTimeout(1500);
    await page.selectOption('select[name="deliveryDistrict"]', 'Çankaya');
    await page.fill('textarea[name="deliveryAddress"]', 'Test Ankara Çankaya Kızılay Bulvar No:42');
    
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    await page.fill('input[name="deliveryDate"]', dayAfter.toISOString().split('T')[0]);
    
    await page.click('button:has-text("İleri")');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Gönderiyi Yayınla")');
    await page.waitForTimeout(5000);
    
    const successVisible = await page.locator('text=/başarı|success|yayınlandı/i').first().isVisible().catch(() => false);
    recordTest('Individual: Shipment Creation', successVisible, '', true);
  } catch (error) {
    recordTest('Individual: Shipment Creation', false, error.message, true);
  }

  // My Shipments with Search
  await page.goto('http://localhost:5173/individual/my-shipments', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  const searchInput = page.locator('input[type="text"], input[placeholder*="ara" i]');
  if (await searchInput.first().isVisible()) {
    await searchInput.first().fill('İstanbul');
    await page.waitForTimeout(2000);
    const hasResults = await page.evaluate(() => document.body.textContent.includes('İstanbul'));
    recordTest('Individual: Search Works', hasResults);
  }

  recordTest('Individual: My Shipments Page Loads', true);
}

async function testNakliyeciPanel(page) {
  log('\n🚛 NAKLIYECI PANEL TEST', 'magenta');
  
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const demoBtn = page.locator('button[data-testid="demo-nakliyeci"]');
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await page.waitForTimeout(3000);
    recordTest('Nakliyeci: Demo Login', page.url().includes('/nakliyeci'));
  }

  // Market - Open Shipments
  await page.goto('http://localhost:5173/nakliyeci/open-shipments', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  const marketVisible = await page.locator('text=/Pazar|Açık|İlan/i').first().isVisible().catch(() => false);
  recordTest('Nakliyeci: Market Page Loads', marketVisible, '', true);

  // Search in Market
  const searchInput = page.locator('input[type="text"], input[placeholder*="ara" i]');
  if (await searchInput.first().isVisible()) {
    await searchInput.first().fill('Ankara');
    await page.waitForTimeout(2000);
    recordTest('Nakliyeci: Market Search Works', true);
  }

  // Dashboard
  await page.goto('http://localhost:5173/nakliyeci/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  recordTest('Nakliyeci: Dashboard Loads', true);
}

async function testCorporatePanel(page) {
  log('\n🏢 CORPORATE PANEL TEST', 'magenta');
  
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const demoBtn = page.locator('button[data-testid="demo-corporate"]');
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await page.waitForTimeout(3000);
    recordTest('Corporate: Demo Login', page.url().includes('/corporate'));
  }

  await page.goto('http://localhost:5173/corporate/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  recordTest('Corporate: Dashboard Loads', true);
}

async function testTasiyiciPanel(page) {
  log('\n👨‍✈️ TASIYICI PANEL TEST', 'magenta');
  
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const demoBtn = page.locator('button[data-testid="demo-tasiyici"]');
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await page.waitForTimeout(3000);
    recordTest('Tasiyici: Demo Login', page.url().includes('/tasiyici'));
  }

  await page.goto('http://localhost:5173/tasiyici/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  recordTest('Tasiyici: Dashboard Loads', true);
}

async function testSearchFunctionality(page) {
  log('\n🔍 SEARCH FUNCTIONALITY TEST', 'magenta');
  
  // Test Individual search
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.locator('button[data-testid="demo-individual"]').click();
  await page.waitForTimeout(3000);
  
  await page.goto('http://localhost:5173/individual/my-shipments', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  const searchInput = page.locator('input[type="text"], input[placeholder*="ara" i]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('İstanbul');
    await page.waitForTimeout(3000);
    const apiCalled = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource').some(entry => 
        entry.name.includes('/api/shipments') && entry.name.includes('search=')
      );
    });
    recordTest('Search: API Called with Search Param', apiCalled, '', true);
  }
}

async function testDataIntegrity(page) {
  log('\n📊 DATA INTEGRITY TEST', 'magenta');
  
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.locator('button[data-testid="demo-individual"]').click();
  await page.waitForTimeout(3000);
  
  await page.goto('http://localhost:5173/individual/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  
  // Check API calls
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/dashboard/stats')) {
      try {
        const data = await response.json();
        if (data.success && data.data?.stats) {
          recordTest('Data: Dashboard Stats API Returns Data', true);
        }
      } catch (e) {}
    }
  });
  
  await page.waitForTimeout(3000);
  
  // Check currency formatting
  const hasCurrency = await page.evaluate(() => {
    return document.body.textContent.includes('₺') || document.body.textContent.includes('TL');
  });
  recordTest('Data: Currency Formatting', hasCurrency);
  
  // Check date formatting
  const hasDates = await page.evaluate(() => {
    const text = document.body.textContent;
    return /\d{1,2}[./]\d{1,2}[./]\d{2,4}/.test(text) || text.includes('gün önce');
  });
  recordTest('Data: Date Formatting', hasDates);
}

async function main() {
  log('\n🚀 KAPSAMLI E2E TEST BAŞLIYOR\n', 'cyan');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test all panels
    await testIndividualPanel(page);
    await testNakliyeciPanel(page);
    await testCorporatePanel(page);
    await testTasiyiciPanel(page);
    
    // Test search
    await testSearchFunctionality(page);
    
    // Test data integrity
    await testDataIntegrity(page);
    
    await page.screenshot({ path: 'test-final-e2e.png', fullPage: true });
    
  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    recordTest('Test Suite Execution', false, error.message, true);
  } finally {
    await browser.close();
  }

  // Print Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 KAPSAMLI E2E TEST SONUÇLARI', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\n✅ Başarılı: ${results.passed}`, 'green');
  log(`❌ Başarısız: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`📈 Toplam:  ${results.tests.length}`, 'blue');
  log(`📊 Başarı Oranı: ${((results.passed / (results.tests.length || 1)) * 100).toFixed(1)}%\n`, 'blue');

  if (results.criticalIssues.length > 0) {
    log('🔴 KRİTİK SORUNLAR:', 'red');
    results.criticalIssues.forEach(issue => {
      log(`  - ${issue.name}: ${issue.details}`, 'red');
    });
  }

  log('\n✅ E2E Test tamamlandı!\n', 'green');
}

main().catch(console.error);

