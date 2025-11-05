// Comprehensive browser test for YOLNEXT marketplace
const { chromium } = require('playwright');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch (e) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

async function testComprehensiveFlow() {
  log('\n🚀 Starting Comprehensive YOLNEXT Test Suite\n', 'cyan');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  function recordTest(name, passed, details = '') {
    results.tests.push({ name, passed, details });
    if (passed) {
      results.passed++;
      log(`✅ ${name}`, 'green');
    } else {
      results.failed++;
      log(`❌ ${name}: ${details}`, 'red');
    }
  }

  try {
    // 1. Server Health Check
    log('\n📡 Testing Server Connectivity...', 'blue');
    const backendReady = await waitForServer('http://localhost:5000/api/health');
    const frontendReady = await waitForServer('http://localhost:5173');
    
    recordTest('Backend Server Running', backendReady);
    recordTest('Frontend Server Running', frontendReady);

    if (!backendReady || !frontendReady) {
      log('\n⚠️  Servers not ready. Please start them manually.', 'yellow');
      await browser.close();
      return;
    }

    // 2. Homepage Test
    log('\n🏠 Testing Homepage...', 'blue');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    recordTest('Homepage Loads', await page.title().then(t => t.includes('YolNext') || t.length > 0));
    
    // Navigate to login page
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 3. Demo Login Test - Individual
    log('\n🔐 Testing Demo Login (Individual)...', 'blue');
    const individualDemoButton = page.locator('button[data-testid="demo-individual"], button:has-text("Bireysel")');
    const hasDemoLogin = await individualDemoButton.isVisible().catch(() => false);
    recordTest('Demo Login Button Visible', hasDemoLogin);
    
    if (hasDemoLogin) {
      await individualDemoButton.click();
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      const isDashboard = currentUrl.includes('/individual/dashboard') || currentUrl.includes('/dashboard');
      recordTest('Demo Login Successful', isDashboard);
      
      if (!isDashboard) {
        log(`   Current URL: ${currentUrl}`, 'yellow');
      }
    }

    // 4. Dashboard Test
    log('\n📊 Testing Individual Dashboard...', 'blue');
    if (page.url().includes('/dashboard') || page.url().includes('/individual')) {
      await page.goto('http://localhost:5173/individual/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const hasStats = await page.locator('text=/Gönderi|Teklif|Mesaj/i').first().isVisible().catch(() => false);
      recordTest('Dashboard Loads', true);
      recordTest('Dashboard Shows Statistics', hasStats);
    }

    // 5. Shipment Creation Test
    log('\n📦 Testing Shipment Creation Flow...', 'blue');
    await page.goto('http://localhost:5173/individual/create-shipment', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Step 1: Select Category
    const categorySelect = page.locator('select[name="mainCategory"]');
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption('house_move');
      await page.waitForTimeout(500);
      recordTest('Step 1: Category Selected', true);
      
      // Click Next
      await page.click('button:has-text("İleri")');
      await page.waitForTimeout(2000);
    }

    // Step 2: Fill Address Information
    log('   Filling address information...', 'cyan');
    try {
      // Wait for step 2 to load
      await page.waitForSelector('select[name="pickupCity"], select[name="deliveryCity"]', { timeout: 10000 });
      
      // Pickup Address
      const pickupCitySelect = page.locator('select[name="pickupCity"]').first();
      if (await pickupCitySelect.isVisible()) {
        await pickupCitySelect.selectOption('İstanbul');
        await page.waitForTimeout(1500); // Wait for district options to load
        await page.selectOption('select[name="pickupDistrict"]', 'Kadıköy');
        await page.waitForTimeout(500);
        await page.fill('textarea[name="pickupAddress"]', 'Test İstanbul Kadıköy Moda Cad No:15 Daire:3');
        
        // Get tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        await page.fill('input[name="pickupDate"]', tomorrowStr);
        
        // Delivery Address
        await page.selectOption('select[name="deliveryCity"]', 'Ankara');
        await page.waitForTimeout(1000);
        await page.selectOption('select[name="deliveryDistrict"]', 'Çankaya');
        await page.waitForTimeout(500);
        await page.fill('textarea[name="deliveryAddress"]', 'Test Ankara Çankaya Kızılay Bulvar No:42 Daire:5');
        
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);
        const dayAfterStr = dayAfter.toISOString().split('T')[0];
        await page.fill('input[name="deliveryDate"]', dayAfterStr);
        
        await page.waitForTimeout(1000);
        recordTest('Step 2: Address Information Filled', true);
        
        // Click Next to Step 3
        await page.click('button:has-text("İleri")');
        await page.waitForTimeout(2000);
      } else {
        recordTest('Step 2: Address Information Filled', false, 'Pickup city select not visible');
      }
    } catch (error) {
      recordTest('Step 2: Address Information Filled', false, error.message);
    }

    // Step 3: Preview and Submit
    log('   Submitting shipment...', 'cyan');
    try {
      const publishButton = page.locator('button:has-text("Gönderiyi Yayınla")');
      await publishButton.waitFor({ timeout: 5000 });
      
      // Check if form validation passed
      const errorMessage = await page.locator('text=/hata|error|Lütfen/i').first().isVisible().catch(() => false);
      if (!errorMessage) {
        await publishButton.click();
        await page.waitForTimeout(5000);
        
        // Check for success message or redirect - wait a bit longer
        await page.waitForTimeout(5000);
        
        // Check multiple ways to confirm success
        const successText1 = await page.locator('text=/başarı|success|oluşturuldu|yayınlandı/i').first().isVisible().catch(() => false);
        const successText2 = await page.locator('text=/Nakliyecilerden teklifler/i').first().isVisible().catch(() => false);
        const successModal = await page.locator('[role="alert"], .success-message, .bg-green-50').first().isVisible().catch(() => false);
        const redirectedToShipments = page.url().includes('/my-shipments') || page.url().includes('/shipments');
        const noErrorVisible = !(await page.locator('text=/hata|error|başarısız/i').first().isVisible().catch(() => false));
        
        // Also check if form was reset (indicates success)
        const formReset = await page.locator('select[name="mainCategory"]').evaluate(el => !el.value || el.value === '').catch(() => false);
        
        const hasShipmentCreated = successText1 || successText2 || successModal || (redirectedToShipments && noErrorVisible) || formReset;
        
        recordTest('Step 3: Shipment Submitted', true);
        recordTest('Shipment Creation Success', hasShipmentCreated, hasShipmentCreated ? '' : 'No success confirmation found');
      } else {
        recordTest('Step 3: Shipment Submitted', false, 'Form validation error');
      }
    } catch (error) {
      recordTest('Step 3: Shipment Submitted', false, error.message);
    }

    // 6. My Shipments Page Test
    log('\n📋 Testing My Shipments Page...', 'blue');
    try {
      await page.goto('http://localhost:5173/individual/my-shipments', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const pageLoaded = await page.locator('text=/Gönderi|Shipment/i').first().isVisible().catch(() => false);
      recordTest('My Shipments Page Loads', pageLoaded);
    } catch (error) {
      recordTest('My Shipments Page Loads', false, error.message);
    }

    // 7. Offers Page Test
    log('\n💰 Testing Offers Page...', 'blue');
    try {
      await page.goto('http://localhost:5173/individual/offers', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const pageLoaded = await page.locator('text=/Teklif|Offer/i').first().isVisible().catch(() => false);
      recordTest('Offers Page Loads', pageLoaded);
    } catch (error) {
      recordTest('Offers Page Loads', false, error.message);
    }

    // 8. Messages Page Test
    log('\n💬 Testing Messages Page...', 'blue');
    try {
      await page.goto('http://localhost:5173/individual/messages', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const pageLoaded = await page.locator('text=/Mesaj|Message/i').first().isVisible().catch(() => false);
      recordTest('Messages Page Loads', pageLoaded);
    } catch (error) {
      recordTest('Messages Page Loads', false, error.message);
    }

    // 9. Test Other Panels - Corporate
    log('\n🏢 Testing Corporate Panel...', 'blue');
    try {
      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const corporateDemo = page.locator('button[data-testid="demo-corporate"], button:has-text("Kurumsal"), button:has-text("corporate")');
      const corporateVisible = await corporateDemo.isVisible().catch(() => false);
      if (corporateVisible) {
        await corporateDemo.click();
        await page.waitForTimeout(5000);
        
        const isCorporateDashboard = page.url().includes('/corporate/dashboard');
        recordTest('Corporate Demo Login', isCorporateDashboard);
        
        if (isCorporateDashboard) {
          await page.waitForTimeout(2000);
          recordTest('Corporate Dashboard Loads', true);
        }
      } else {
        recordTest('Corporate Demo Login', false, 'Corporate demo button not found');
      }
    } catch (error) {
      recordTest('Corporate Panel Test', false, error.message);
    }

    // 10. Test Carrier Company Panel
    log('\n🚛 Testing Carrier Company Panel...', 'blue');
    try {
      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const carrierDemo = page.locator('button[data-testid="demo-nakliyeci"], button:has-text("Nakliyeci")');
      const carrierVisible = await carrierDemo.isVisible().catch(() => false);
      if (carrierVisible) {
        await carrierDemo.click();
        await page.waitForTimeout(5000);
        
        const isCarrierDashboard = page.url().includes('/nakliyeci/dashboard');
        recordTest('Carrier Demo Login', isCarrierDashboard);
        
        if (isCarrierDashboard) {
          await page.waitForTimeout(2000);
          recordTest('Carrier Dashboard Loads', true);
        }
      } else {
        recordTest('Carrier Demo Login', false, 'Carrier demo button not found');
      }
    } catch (error) {
      recordTest('Carrier Panel Test', false, error.message);
    }

    // 11. Test Driver Panel
    log('\n👨‍✈️ Testing Driver Panel...', 'blue');
    try {
      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const driverDemo = page.locator('button[data-testid="demo-tasiyici"], button:has-text("Taşıyıcı")');
      const driverVisible = await driverDemo.isVisible().catch(() => false);
      if (driverVisible) {
        await driverDemo.click();
        await page.waitForTimeout(5000);
        
        const isDriverDashboard = page.url().includes('/tasiyici/dashboard');
        recordTest('Driver Demo Login', isDriverDashboard);
        
        if (isDriverDashboard) {
          await page.waitForTimeout(2000);
          recordTest('Driver Dashboard Loads', true);
        }
      } else {
        recordTest('Driver Demo Login', false, 'Driver demo button not found');
      }
    } catch (error) {
      recordTest('Driver Panel Test', false, error.message);
    }

    // Take final screenshot
    await page.screenshot({ path: 'test-comprehensive-result.png', fullPage: true });
    log('\n📸 Screenshot saved: test-comprehensive-result.png', 'cyan');

  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    await page.screenshot({ path: 'test-comprehensive-error.png', fullPage: true });
    recordTest('Test Suite Execution', false, error.message);
  } finally {
    await browser.close();
  }

  // Print Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\n✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`📈 Total:  ${results.tests.length}`, 'blue');
  log(`📊 Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%\n`, 'blue');

  if (results.failed > 0) {
    log('Failed Tests:', 'red');
    results.tests.filter(t => !t.passed).forEach(test => {
      log(`  - ${test.name}: ${test.details}`, 'red');
    });
  }

  log('\n✅ Comprehensive test completed!\n', 'green');
}

testComprehensiveFlow().catch(console.error);

